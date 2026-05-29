import { env } from '../config/env.js'

// Service Deezer — alimente les rounds en pistes jouables (preview 30s).
// API publique, aucune clé requise. Base : https://api.deezer.com
//
// Renvoie des pistes normalisées : { id, title, artist, preview_url, cover_url }

const BASE = env.deezerApiBase
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 h

// Cache mémoire simple (clé = URL) pour ne pas respammer l'API.
const cache = new Map() // url -> { data, expires }

// Correspondance thème → requêtes Deezer. Thème inconnu : on utilise son libellé.
const THEME_CONFIG = {
  'Pop française': { query: 'pop française', playlistQuery: 'pop française' },
  Rock: { query: 'rock classics', playlistQuery: 'rock' },
  'Rap FR': { query: 'rap français', playlistQuery: 'rap fr' },
  'Années 80': { query: 'tubes années 80', playlistQuery: '80s hits' },
  'Années 90': { query: 'tubes années 90', playlistQuery: '90s hits' },
  'Anime OST': { query: 'anime opening', playlistQuery: 'anime openings' },
  'Gaming OST': { query: 'video game soundtrack', playlistQuery: 'gaming soundtrack' },
  'Charts actuels': { query: 'top hits', playlistQuery: 'top france' },
}

function resolveTheme(theme) {
  return THEME_CONFIG[theme] ?? { query: theme, playlistQuery: theme }
}

async function cachedFetch(url) {
  const hit = cache.get(url)
  if (hit && hit.expires > Date.now()) return hit.data

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Deezer a répondu ${res.status} (${url})`)

  const data = await res.json()
  // Deezer renvoie parfois une erreur applicative avec un statut 200.
  if (data?.error) {
    throw new Error(`Deezer : ${data.error.message ?? 'erreur inconnue'}`)
  }

  cache.set(url, { data, expires: Date.now() + CACHE_TTL_MS })
  return data
}

function normalizeTrack(track) {
  return {
    id: track.id,
    title: track.title_short ?? track.title,
    artist: track.artist?.name ?? 'Inconnu',
    preview_url: track.preview || null,
    cover_url: track.album?.cover_medium ?? track.album?.cover_big ?? null,
  }
}

const hasPreview = (track) => Boolean(track.preview_url)

// Fisher-Yates.
function shuffle(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function dedupe(tracks) {
  const seen = new Set()
  return tracks.filter((track) => {
    const key = `${track.title}::${track.artist}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// 1) Recherche de pistes par genre / thème.
export async function searchTracksByGenre(theme, limit = 100) {
  const { query } = resolveTheme(theme)
  const url = `${BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`
  const data = await cachedFetch(url)
  return (data.data ?? []).map(normalizeTrack).filter(hasPreview)
}

// 2) Sélection d'une playlist thématique aléatoire (assez fournie).
export async function getRandomPlaylist(theme, minTracks = 10) {
  const { playlistQuery } = resolveTheme(theme)
  const url = `${BASE}/search/playlist?q=${encodeURIComponent(playlistQuery)}&limit=25`
  const data = await cachedFetch(url)

  const candidates = (data.data ?? []).filter((playlist) => playlist.nb_tracks >= minTracks)
  if (candidates.length === 0) return null

  return candidates[Math.floor(Math.random() * candidates.length)]
}

async function getPlaylistTracks(playlistId, limit = 100) {
  const url = `${BASE}/playlist/${playlistId}/tracks?limit=${limit}`
  const data = await cachedFetch(url)
  return (data.data ?? []).map(normalizeTrack).filter(hasPreview)
}

// 3) Pistes prêtes pour un round : playlist d'abord, recherche en repli.
export async function getRandomTracksForRound(theme, count = 1) {
  let pool = []

  try {
    const playlist = await getRandomPlaylist(theme)
    if (playlist) pool = await getPlaylistTracks(playlist.id)
  } catch (err) {
    console.warn(`[deezer] playlist KO pour "${theme}" : ${err.message}`)
  }

  // Repli (ou complément) via la recherche par genre.
  if (pool.length < count) {
    try {
      pool = pool.concat(await searchTracksByGenre(theme))
    } catch (err) {
      console.warn(`[deezer] recherche KO pour "${theme}" : ${err.message}`)
    }
  }

  const unique = dedupe(pool)
  if (unique.length === 0) {
    throw new Error(`Aucune piste jouable trouvée pour le thème « ${theme} »`)
  }

  return shuffle(unique).slice(0, count)
}

// Utilitaire (tests / reset manuel).
export function clearCache() {
  cache.clear()
}
