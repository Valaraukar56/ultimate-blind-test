import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { socket } from '../lib/socket.js'
import { useSocket } from '../hooks/use-socket.js'

const RoomContext = createContext(null)

const ACK_TIMEOUT_MS = 5000

// Émet un événement avec accusé de réception et renvoie une promesse.
function emitWithAck(event, payload) {
  return new Promise((resolve) => {
    let settled = false
    const timer = setTimeout(() => {
      if (!settled) resolve({ ok: false, error: 'Le serveur ne répond pas' })
    }, ACK_TIMEOUT_MS)

    socket.emit(event, payload, (res) => {
      settled = true
      clearTimeout(timer)
      resolve(res ?? { ok: false, error: 'Réponse invalide du serveur' })
    })
  })
}

// phase : lobby | loading | playing | reveal | over
export function RoomProvider({ children }) {
  const { connected } = useSocket()

  // --- Salle / lobby ---
  const [code, setCode] = useState(null)
  const [theme, setTheme] = useState(null)
  const [players, setPlayers] = useState([])

  // --- Partie ---
  const [phase, setPhase] = useState('lobby')
  const [round, setRound] = useState(null) // { roundNumber, totalRounds, previewUrl, duration }
  const [remaining, setRemaining] = useState(0)
  const [scores, setScores] = useState([]) // classement temps réel
  const [answerResult, setAnswerResult] = useState(null) // { correct, points }
  const [hasAnswered, setHasAnswered] = useState(false)
  const [reveal, setReveal] = useState(null) // { correctAnswer, ... }
  const [history, setHistory] = useState([]) // morceaux déjà passés
  const [gameOver, setGameOver] = useState(null) // { finalScores, winner }
  const [gameError, setGameError] = useState(null)

  // L'hôte est dérivé du roster : la réattribution serveur se propage seule.
  const isHost = useMemo(
    () => players.find((player) => player.id === socket.id)?.isHost ?? false,
    [players],
  )

  // Écoute des événements diffusés par le serveur.
  useEffect(() => {
    function onPlayerJoined({ players: roster }) {
      setPlayers(roster ?? [])
    }
    function onPlayerLeft({ players: roster }) {
      setPlayers(roster ?? [])
    }
    function onGameStarted() {
      setPhase('loading')
      setGameOver(null)
      setReveal(null)
      setGameError(null)
      setScores([])
      setHistory([])
    }
    function onRoundStart(payload) {
      setRound(payload)
      setRemaining(payload.duration)
      setPhase('playing')
      setAnswerResult(null)
      setHasAnswered(false)
      setReveal(null)
    }
    function onTimerTick({ remaining: value }) {
      setRemaining(value)
    }
    function onAnswerResult(payload) {
      setAnswerResult(payload)
      // Seule une bonne réponse verrouille la saisie ; sinon on peut retenter.
      if (payload.correct) setHasAnswered(true)
    }
    function onRoundEnd({ roundNumber, correctAnswer, scores: board }) {
      setReveal({ correctAnswer })
      setScores(board ?? [])
      setPhase('reveal')
      if (correctAnswer) {
        setHistory((prev) => [...prev, { roundNumber, ...correctAnswer }])
      }
    }
    function onScoresUpdate({ scores: board }) {
      setScores(board ?? [])
    }
    function onGameOver({ finalScores, winner }) {
      setGameOver({ finalScores: finalScores ?? [], winner: winner ?? null })
      setScores(finalScores ?? [])
      setPhase('over')
    }
    function onGameError({ message }) {
      setGameError(message ?? 'Erreur de partie')
      setPhase('lobby')
    }

    socket.on('player_joined', onPlayerJoined)
    socket.on('player_left', onPlayerLeft)
    socket.on('game_started', onGameStarted)
    socket.on('round_start', onRoundStart)
    socket.on('timer_tick', onTimerTick)
    socket.on('answer_result', onAnswerResult)
    socket.on('round_end', onRoundEnd)
    socket.on('scores_update', onScoresUpdate)
    socket.on('game_over', onGameOver)
    socket.on('game_error', onGameError)

    return () => {
      socket.off('player_joined', onPlayerJoined)
      socket.off('player_left', onPlayerLeft)
      socket.off('game_started', onGameStarted)
      socket.off('round_start', onRoundStart)
      socket.off('timer_tick', onTimerTick)
      socket.off('answer_result', onAnswerResult)
      socket.off('round_end', onRoundEnd)
      socket.off('scores_update', onScoresUpdate)
      socket.off('game_over', onGameOver)
      socket.off('game_error', onGameError)
    }
  }, [])

  const applyRoom = useCallback((res, fallbackTheme = null) => {
    setCode(res.code)
    setTheme(res.theme ?? fallbackTheme)
    setPlayers(res.players ?? [])
    setPhase('lobby')
  }, [])

  const createRoom = useCallback(
    async (pseudo, selectedTheme) => {
      const res = await emitWithAck('create_room', { pseudo, theme: selectedTheme })
      if (res.ok) applyRoom(res, selectedTheme)
      return res
    },
    [applyRoom],
  )

  const joinRoom = useCallback(
    async (roomCode, pseudo) => {
      const res = await emitWithAck('join_room', { code: roomCode, pseudo })
      if (res.ok) applyRoom(res)
      return res
    },
    [applyRoom],
  )

  const startGame = useCallback(async () => {
    if (!code) return { ok: false, error: 'Aucune salle active' }
    return emitWithAck('start_game', { roomCode: code })
  }, [code])

  const submitAnswer = useCallback(
    async (answer) => {
      if (!code) return { ok: false, error: 'Aucune salle active' }
      const res = await emitWithAck('submit_answer', { roomCode: code, answer })
      if (res.ok) {
        setAnswerResult({ correct: res.correct, points: res.points })
        if (res.correct) setHasAnswered(true) // verrouille seulement si trouvé
      }
      return res
    },
    [code],
  )

  const leaveRoom = useCallback(() => {
    setCode(null)
    setTheme(null)
    setPlayers([])
    setPhase('lobby')
    setRound(null)
    setRemaining(0)
    setScores([])
    setAnswerResult(null)
    setHasAnswered(false)
    setReveal(null)
    setHistory([])
    setGameOver(null)
    setGameError(null)
    // Reconnexion : le serveur retire l'ancien socket (disconnect),
    // on repart avec une identité fraîche, hors de toute salle.
    socket.disconnect()
    socket.connect()
  }, [])

  const value = useMemo(
    () => ({
      connected,
      code,
      theme,
      players,
      isHost,
      phase,
      round,
      remaining,
      scores,
      answerResult,
      hasAnswered,
      reveal,
      history,
      gameOver,
      gameError,
      createRoom,
      joinRoom,
      startGame,
      submitAnswer,
      leaveRoom,
    }),
    [
      connected,
      code,
      theme,
      players,
      isHost,
      phase,
      round,
      remaining,
      scores,
      answerResult,
      hasAnswered,
      reveal,
      history,
      gameOver,
      gameError,
      createRoom,
      joinRoom,
      startGame,
      submitAnswer,
      leaveRoom,
    ],
  )

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>
}

export function useRoom() {
  const ctx = useContext(RoomContext)
  if (!ctx) throw new Error('useRoom doit être utilisé dans <RoomProvider>')
  return ctx
}
