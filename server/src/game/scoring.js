// Logique pure du jeu : normalisation, distance de Levenshtein, scoring.
// Sans effet de bord ni dépendance → testable isolément.

export const BASE_POINTS = 1000

// Petits mots ignorés dans le matching « un mot du nom » (évite « the », « les »…).
const STOPWORDS = new Set([
  'the', 'les', 'des', 'los', 'las', 'and', 'feat', 'ft', 'dj', 'mc', 'le', 'la', 'un', 'une',
])

// Normalise pour comparer : minuscules, sans accents, sans apostrophes,
// sans ponctuation ni mentions entre parenthèses (feat..., remix...).
export function normalizeAnswer(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .replace(/['’`]/g, '') // apostrophes supprimées (assassin's -> assassins)
    .replace(/\(.*?\)|\[.*?\]/g, ' ') // (feat...), [remix]
    .replace(/[^a-z0-9\s]/g, ' ') // ponctuation -> espace
    .replace(/\s+/g, ' ')
    .trim()
}

export function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i += 1) {
    const curr = [i]
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return prev[b.length]
}

// Tolérance aux fautes proportionnelle à la longueur (plus souple sur les mots longs).
function tolerance(len) {
  if (len <= 4) return 1
  if (len <= 9) return 2
  return 3
}

function fuzzyEquals(guess, target) {
  if (!target) return false
  if (guess === target) return true
  return levenshtein(guess, target) <= tolerance(guess.length)
}

// Artiste : nom complet OU un seul mot du nom (prénom/nom), avec tolérance.
function matchesArtist(guess, artist) {
  if (fuzzyEquals(guess, artist)) return true
  const words = artist.split(' ').filter((w) => w.length >= 3 && !STOPWORDS.has(w))
  return words.some((word) => fuzzyEquals(guess, word))
}

// Bonne réponse acceptée sur le titre OU l'artiste (souple).
// matchFranchise (thèmes OST) : accepte aussi le nom du jeu / de l'anime,
// trouvé par inclusion dans l'album ou le titre (ex. « zelda », « assassins creed »).
export function isAnswerCorrect(answer, track, { matchFranchise = false } = {}) {
  const guess = normalizeAnswer(answer)
  if (guess.length < 2) return false

  const title = normalizeAnswer(track.title)
  const artist = normalizeAnswer(track.artist)

  if (fuzzyEquals(guess, title) || matchesArtist(guess, artist)) return true

  if (matchFranchise && guess.length >= 3) {
    const album = normalizeAnswer(track.album)
    if ((album.length > 0 && album.includes(guess)) || title.includes(guess)) {
      return true
    }
  }

  return false
}

// 1000 pts de base + bonus de vitesse selon le temps écoulé.
export function computePoints(elapsedMs) {
  const seconds = elapsedMs / 1000
  let bonus = 0
  if (seconds < 5) bonus = 500
  else if (seconds < 10) bonus = 300
  else if (seconds < 20) bonus = 100
  return BASE_POINTS + bonus
}
