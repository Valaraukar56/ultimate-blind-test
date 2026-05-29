import { env } from '../config/env.js'

// Service Deezer — alimente les rounds en pistes jouables (preview 30s).
// API publique, aucune clé requise. Base : https://api.deezer.com
//
// Renvoie des pistes normalisées : { id, title, artist, preview_url, cover_url }

const BASE = env.deezerApiBase
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 h

// Cache mémoire simple (clé = URL) pour ne pas respammer l'API.
const cache = new Map() // url -> { data, expires }

// Correspondance thème → recherche Deezer + playlists épinglées.
// playlistIds : playlists Deezer (surtout éditoriales) remplies de tubes ULTRA connus,
// tirées au sort à chaque partie. query/playlistQuery servent de repli.
const THEME_CONFIG = {
  // Goldman, Stromae, Angèle, Aya Nakamura, Mylène Farmer, Indila, France Gall...
  'Pop française': {
    query: 'variété française',
    playlistQuery: 'variété française',
    playlistIds: [1420459465, 2484938464, 7752025662],
  },
  // Queen, AC/DC, Nirvana, Guns N' Roses, Muse, Foo Fighters, Rolling Stones...
  Rock: {
    query: 'rock classics',
    playlistQuery: 'rock',
    playlistIds: [1306931615, 752286631, 3126664682],
  },
  // Jul, Booba, PNL, Ninho, Niska, Damso, Orelsan, NTM, IAM...
  'Rap FR': {
    query: 'rap français',
    playlistQuery: 'rap fr',
    playlistIds: [5175061384, 6568026624, 1404470955],
  },
  // MJ, Madonna, Queen, a-ha, Police + variété FR (Indochine, Goldman...)
  'Années 80': {
    query: 'tubes années 80',
    playlistQuery: '80s hits',
    playlistIds: [867825522, 1268089951, 1163842311],
  },
  // Nirvana, Spice Girls, Oasis, Britney + dance/FR (IAM, Manau, Céline Dion...)
  'Années 90': {
    query: 'tubes années 90',
    playlistQuery: '90s hits',
    playlistIds: [878989033, 1251125011, 1682663671],
  },
  // Openings cultes : Naruto, AoT, Demon Slayer, Tokyo Ghoul, Death Note...
  // (Top 100 d'abord : beaucoup de titres mentionnent l'anime + mapping en repli)
  'Anime OST': {
    query: 'anime opening',
    playlistQuery: 'anime openings',
    playlistIds: [13319386703, 9016993522],
  },
  // Thèmes ultra-reconnaissables (le titre EST le nom du jeu) : Mario, Zelda,
  // Pokémon, Tetris, Final Fantasy, Skyrim, Chrono Trigger, God of War...
  // (reprises iconiques + médleys Nintendo — choisis pour être devinables)
  'Gaming OST': {
    query: 'video game soundtrack',
    playlistQuery: 'gaming soundtrack',
    playlistIds: [7747193762, 2221238426],
  },
  // Guetta, Tiësto, Garrix, Calvin Harris, Afrojack, Alok, Kygo...
  'EDM / Électro': {
    query: 'edm',
    playlistQuery: 'edm hits',
    playlistIds: [687945565, 706093725, 11233152384],
  },
  // Top du moment France + monde (Weeknd, Dua Lipa, Aya Nakamura, GIMS...)
  'Charts actuels': {
    query: 'top hits',
    playlistQuery: 'top france',
    playlistIds: [3155776842, 1109890291, 14344427541],
  },
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
    album: track.album?.title ?? null, // contient souvent le nom du jeu / de l'anime
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
  const { playlistIds } = resolveTheme(theme)
  let pool = []

  // 1) Playlists épinglées (qualité garantie) si le thème en définit.
  if (playlistIds?.length) {
    const id = playlistIds[Math.floor(Math.random() * playlistIds.length)]
    try {
      pool = await getPlaylistTracks(id)
    } catch (err) {
      console.warn(`[deezer] playlist épinglée ${id} KO : ${err.message}`)
    }
  }

  // 2) Sinon : une playlist thématique aléatoire trouvée par recherche.
  if (pool.length < count) {
    try {
      const playlist = await getRandomPlaylist(theme)
      if (playlist) pool = pool.concat(await getPlaylistTracks(playlist.id))
    } catch (err) {
      console.warn(`[deezer] playlist KO pour "${theme}" : ${err.message}`)
    }
  }

  // 3) Repli via la recherche par genre.
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
