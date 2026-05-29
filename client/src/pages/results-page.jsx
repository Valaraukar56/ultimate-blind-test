import { motion } from 'framer-motion'
import { socket } from '../lib/socket.js'
import { useRoom } from '../context/room-context.jsx'
import { useRoomRedirect } from '../hooks/use-room-redirect.js'
import PageTransition from '../components/page-transition.jsx'
import Confetti from '../components/confetti.jsx'

// Hauteur relative des marches du podium.
const PODIUM = { 0: 'h-40', 1: 'h-28', 2: 'h-20' }
const ORDER = [1, 0, 2] // 2e, 1er, 3e (1er au centre)

export default function ResultsPage() {
  useRoomRedirect()
  const { gameOver, scores, leaveRoom } = useRoom()

  const finalScores = gameOver?.finalScores ?? scores
  if (!finalScores.length) return null

  const top3 = finalScores.slice(0, 3)
  const rest = finalScores.slice(3)

  return (
    <PageTransition className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-10 p-4">
      <Confetti />

      <h1 className="text-4xl font-black text-neon">🏆 Podium</h1>

      {/* Podium top 3 */}
      <div className="flex items-end justify-center gap-3">
        {ORDER.map((rank) => {
          const player = top3[rank]
          if (!player) return null
          const isWinner = rank === 0
          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * rank }}
              className="flex w-24 flex-col items-center"
            >
              <span className="mb-1 text-2xl">{['🥇', '🥈', '🥉'][rank]}</span>
              <span className="mb-2 max-w-full truncate text-sm font-semibold">
                {player.pseudo}
                {player.id === socket.id && <span className="text-slate-500"> (toi)</span>}
              </span>
              <div
                className={`flex w-full ${PODIUM[rank]} items-start justify-center rounded-t-xl pt-2 ${
                  isWinner
                    ? 'bg-gradient-to-t from-amber-500/40 to-amber-300/80 shadow-neon-strong'
                    : 'bg-gradient-to-t from-violet-700/40 to-violet-500/70'
                }`}
              >
                <span className="font-mono font-bold text-white">{player.score}</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Reste du classement */}
      {rest.length > 0 && (
        <ul className="w-full max-w-xs space-y-2">
          {rest.map((player, index) => (
            <li
              key={player.id}
              className="flex items-center justify-between rounded-lg bg-slate-900/70 px-4 py-2 text-sm"
            >
              <span>
                {index + 4}. {player.pseudo}
              </span>
              <span className="font-mono text-violet-200">{player.score}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={leaveRoom}
        className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-8 py-3 font-bold tracking-wide transition hover:shadow-neon-strong"
      >
        Nouvelle partie
      </button>
    </PageTransition>
  )
}
