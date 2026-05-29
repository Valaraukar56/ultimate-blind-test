import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { useRoom } from '../context/room-context.jsx'
import { useRoomRedirect } from '../hooks/use-room-redirect.js'
import PageTransition from '../components/page-transition.jsx'
import AudioStage from '../components/audio-stage.jsx'
import CircularTimer from '../components/circular-timer.jsx'
import Scoreboard from '../components/scoreboard.jsx'
import History from '../components/history.jsx'
import FoundList from '../components/found-list.jsx'

export default function GamePage() {
  useRoomRedirect()
  const {
    round,
    remaining,
    phase,
    scores,
    players,
    answerResult,
    hasAnswered,
    reveal,
    history,
    found,
    submitAnswer,
  } = useRoom()

  const [answer, setAnswer] = useState('')
  const inputRef = useRef(null)
  const controls = useAnimationControls()

  // Reset + focus à chaque nouveau round.
  useEffect(() => {
    setAnswer('')
    if (phase === 'playing') inputRef.current?.focus()
  }, [round?.roundNumber, phase])

  // Buzzer : pulse sur bonne réponse, shake sur mauvaise.
  useEffect(() => {
    if (!answerResult) return
    if (answerResult.correct) {
      controls.start({ scale: [1, 1.04, 1], transition: { duration: 0.4 } })
    } else {
      controls.start({ x: [0, -12, 12, -10, 10, -6, 6, 0], transition: { duration: 0.45 } })
    }
  }, [answerResult, controls])

  const board = scores.length ? scores : players
  const locked = hasAnswered || phase === 'reveal'

  async function handleSubmit(event) {
    event.preventDefault()
    const value = answer.trim()
    if (!value || locked) return
    await submitAnswer(value)
    setAnswer('')
  }

  if (!round) {
    return (
      <PageTransition className="flex min-h-screen items-center justify-center text-lg text-violet-200">
        🎧 Chargement des morceaux…
      </PageTransition>
    )
  }

  const ringClass = answerResult
    ? answerResult.correct
      ? 'ring-2 ring-emerald-500'
      : 'ring-2 ring-rose-500'
    : 'ring-1 ring-violet-500/40 focus:ring-2 focus:ring-violet-500'

  return (
    <PageTransition className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-4">
      <header className="flex items-center justify-between">
        <span className="rounded-full bg-violet-600/20 px-4 py-1.5 text-sm font-semibold tracking-wide text-violet-200 ring-1 ring-violet-500/40">
          Round {round.roundNumber}/{round.totalRounds}
        </span>
        <span className="text-xs uppercase tracking-widest text-slate-500">Devine vite !</span>
      </header>

      <div className="flex flex-1 flex-col gap-6 lg:flex-row">
        {/* Colonne gauche : qui a trouvé (ce round) + historique */}
        <div className="flex w-full flex-col gap-4 lg:w-64 lg:shrink-0">
          <FoundList found={found} />
          <History items={history} />
        </div>

        {/* Zone centrale */}
        <section className="flex flex-1 flex-col items-center justify-center gap-8 rounded-3xl border border-violet-500/20 bg-slate-900/50 p-6 backdrop-blur">
          <CircularTimer remaining={remaining} total={round.duration} />

          <AudioStage src={round.previewUrl} autoPlay />

          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {phase === 'reveal' ? (
                <RevealCard key="reveal" reveal={reveal} />
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  animate={controls}
                  className="flex flex-col gap-3"
                >
                  <input
                    ref={inputRef}
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    disabled={locked}
                    placeholder="Titre ou artiste…"
                    className={`rounded-xl bg-slate-800 px-5 py-4 text-center text-lg outline-none transition ${ringClass} ${
                      answerResult?.correct ? 'animate-pulse-glow' : ''
                    } disabled:opacity-70`}
                  />
                  <AnimatePresence>
                    {answerResult && (
                      <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`text-center font-semibold ${
                          answerResult.correct ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {answerResult.correct
                          ? `✅ ${answerResult.rank ? ordinalFr(answerResult.rank) + ' !' : 'Trouvé !'} +${answerResult.points} pts`
                          : '❌ Raté ! Réécoute et retente…'}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </section>

        <Scoreboard players={board} />
      </div>
    </PageTransition>
  )
}

function ordinalFr(n) {
  return n === 1 ? '1er' : `${n}e`
}

function RevealCard({ reveal }) {
  const answer = reveal?.correctAnswer
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-4 rounded-xl border border-violet-500/30 bg-slate-800/80 p-4 shadow-neon"
    >
      {answer?.cover_url && (
        <img src={answer.cover_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
      )}
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-widest text-violet-300">Réponse</p>
        <p className="truncate text-lg font-bold">{answer?.title}</p>
        <p className="truncate text-sm text-fuchsia-300">{answer?.artist}</p>
        {answer?.album && answer.album !== answer.title && (
          <p className="truncate text-xs text-slate-400">{answer.album}</p>
        )}
      </div>
    </motion.div>
  )
}
