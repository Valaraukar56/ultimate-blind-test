// Logique pure du jeu : normalisation, distance de Levenshtein, scoring.
// Sans effet de bord ni dépendance → testable isolément.

export const BASE_POINTS = 1000
export const LEVENSHTEIN_TOLERANCE = 2

// Normalise pour comparer : minuscules, sans accents, sans ponctuation
// ni mentions entre parenthèses (feat..., remix...).
export function normalizeAnswer(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)|\[.*?\]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
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

// Bonne réponse acceptée sur le titre OU l'artiste (tolérance fautes ≤ 2).
export function isAnswerCorrect(answer, track) {
  const guess = normalizeAnswer(answer)
  if (guess.length < 2) return false

  const title = normalizeAnswer(track.title)
  const artist = normalizeAnswer(track.artist)

  return (
    (title.length > 0 && levenshtein(guess, title) <= LEVENSHTEIN_TOLERANCE) ||
    (artist.length > 0 && levenshtein(guess, artist) <= LEVENSHTEIN_TOLERANCE)
  )
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
