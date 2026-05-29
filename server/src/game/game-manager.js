import { ServerEvents } from '../socket/events.js'
import { env } from '../config/env.js'
import * as roomStore from '../rooms/room-store.js'
import { getRandomTracksForRound } from '../services/deezer.service.js'
import { computePoints, isAnswerCorrect } from './scoring.js'

const ROUND_DURATION_SEC = env.roundDurationSec
const BETWEEN_ROUNDS_MS = 5000 // pause d'affichage de la réponse entre deux rounds

// Thèmes où le nom du jeu / de l'anime est accepté comme bonne réponse.
const FRANCHISE_THEMES = new Set(['Gaming OST', 'Anime OST'])

// Runtime de jeu par salle (timers, round courant, réponses).
// Distinct du roomStore : les scores cumulés vivent sur room.players.
const games = new Map() // code -> runtime

// Classement décroissant à partir des scores cumulés du roomStore.
function leaderboard(room) {
  return roomStore.serializePlayers(room).sort((a, b) => b.score - a.score)
}

function clearTimers(runtime) {
  if (!runtime) return
  if (runtime.tickTimer) clearInterval(runtime.tickTimer)
  if (runtime.betweenTimer) clearTimeout(runtime.betweenTimer)
  runtime.tickTimer = null
  runtime.betweenTimer = null
}

// Démarre la partie : récupère les morceaux puis lance le premier round.
export async function startGame(io, code) {
  const room = roomStore.getRoom(code)
  if (!room) return

  const tracks = await getRandomTracksForRound(room.theme, env.roundsPerGame)

  const runtime = {
    tracks,
    currentIndex: -1,
    answers: new Map(), // socketId -> { points, elapsedMs } (joueurs ayant trouvé)
    roundStartedAt: 0,
    accepting: false,
    tickTimer: null,
    betweenTimer: null,
  }
  games.set(code, runtime)

  io.to(code).emit(ServerEvents.GAME_STARTED, { totalRounds: tracks.length })
  startRound(io, code)
}

function startRound(io, code) {
  const room = roomStore.getRoom(code)
  const runtime = games.get(code)
  if (!room || !runtime) return stopGame(code)

  runtime.currentIndex += 1
  if (runtime.currentIndex >= runtime.tracks.length) {
    return endGame(io, code)
  }

  const track = runtime.tracks[runtime.currentIndex]
  runtime.answers = new Map()
  runtime.roundStartedAt = Date.now()
  runtime.accepting = true

  const roundNumber = runtime.currentIndex + 1
  const totalRounds = runtime.tracks.length

  // L'audio est envoyé (lecture) mais jamais le titre/artiste (la réponse).
  io.to(code).emit(ServerEvents.ROUND_START, {
    roundNumber,
    totalRounds,
    previewUrl: track.preview_url,
    duration: ROUND_DURATION_SEC,
  })

  // Timer autoritatif : un tick par seconde, décompté côté serveur.
  let remaining = ROUND_DURATION_SEC
  io.to(code).emit(ServerEvents.TIMER_TICK, { roundNumber, remaining, total: ROUND_DURATION_SEC })

  runtime.tickTimer = setInterval(() => {
    remaining -= 1
    io.to(code).emit(ServerEvents.TIMER_TICK, {
      roundNumber,
      remaining: Math.max(remaining, 0),
      total: ROUND_DURATION_SEC,
    })
    if (remaining <= 0) endRound(io, code)
  }, 1000)
}

export function submitAnswer(io, code, socketId, answer) {
  const room = roomStore.getRoom(code)
  const runtime = games.get(code)

  if (!room || !runtime || !runtime.accepting) {
    return { ok: false, error: 'Aucun round en cours' }
  }
  // runtime.answers ne contient que les joueurs ayant DÉJÀ trouvé.
  if (runtime.answers.has(socketId)) {
    return { ok: false, error: 'Tu as déjà trouvé !' }
  }
  const player = room.players.get(socketId)
  if (!player) return { ok: false, error: 'Joueur introuvable' }

  const track = runtime.tracks[runtime.currentIndex]
  const correct = isAnswerCorrect(answer, track, {
    matchFranchise: FRANCHISE_THEMES.has(room.theme),
  })

  // Mauvaise réponse : feedback privé, mais le joueur peut retenter.
  if (!correct) {
    io.to(socketId).emit(ServerEvents.ANSWER_RESULT, { correct: false, points: 0 })
    return { ok: true, correct: false, points: 0 }
  }

  const rank = runtime.answers.size + 1 // ordre de bonne réponse (1 = premier)
  const points = computePoints(rank)
  player.score += points
  runtime.answers.set(socketId, { points, rank })

  // Feedback privé (rang + points) — sans révéler la bonne réponse aux autres.
  io.to(socketId).emit(ServerEvents.ANSWER_RESULT, { correct: true, points, rank })
  // Annonce à toute la salle QUI a trouvé et son rang (sans révéler la réponse).
  io.to(code).emit(ServerEvents.PLAYER_FOUND, { playerId: socketId, pseudo: player.pseudo, rank })
  // Scores en temps réel pour toute la salle.
  io.to(code).emit(ServerEvents.SCORES_UPDATE, { scores: leaderboard(room) })

  // Pas de fin anticipée : le chrono va au bout pour que tout le monde tente.
  return { ok: true, correct: true, points, rank }
}

function endRound(io, code) {
  const runtime = games.get(code)
  if (!runtime || !runtime.accepting) return // évite la double clôture (timer + tout répondu)
  runtime.accepting = false
  clearTimers(runtime)

  const room = roomStore.getRoom(code)
  if (!room) return stopGame(code)

  const track = runtime.tracks[runtime.currentIndex]
  io.to(code).emit(ServerEvents.ROUND_END, {
    roundNumber: runtime.currentIndex + 1,
    correctAnswer: {
      title: track.title,
      artist: track.artist,
      album: track.album,
      cover_url: track.cover_url,
    },
    scores: leaderboard(room),
  })

  runtime.betweenTimer = setTimeout(() => startRound(io, code), BETWEEN_ROUNDS_MS)
}

function endGame(io, code) {
  const runtime = games.get(code)
  clearTimers(runtime)

  const room = roomStore.getRoom(code)
  if (room) {
    room.status = 'FINISHED'
    const board = leaderboard(room)
    io.to(code).emit(ServerEvents.GAME_OVER, {
      finalScores: board,
      winner: board[0] ?? null,
    })
  }
  games.delete(code)
}

// Arrêt propre (salle fermée). Coupe tous les timers.
export function stopGame(code) {
  clearTimers(games.get(code))
  games.delete(code)
}

export function isGameRunning(code) {
  return games.has(code)
}
