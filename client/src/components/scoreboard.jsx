import { AnimatePresence, motion } from 'framer-motion'
import { socket } from '../lib/socket.js'

const MEDALS = ['🥇', '🥈', '🥉']

// Classement live des joueurs (sidebar).
export default function Scoreboard({ players }) {
  return (
    <aside className="w-full rounded-2xl border border-violet-500/20 bg-slate-900/70 p-4 backdrop-blur md:w-72">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-300">
        Classement
      </h2>
      <ol className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {players.map((player, index) => (
            <motion.li
              key={player.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                player.id === socket.id
                  ? 'bg-violet-600/25 ring-1 ring-violet-500'
                  : 'bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <span className="w-5 text-center">{MEDALS[index] ?? index + 1}</span>
                {player.isHost && <span title="Hôte">👑</span>}
                <span className="truncate">{player.pseudo}</span>
              </span>
              <span className="font-mono font-semibold text-violet-200">{player.score}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </aside>
  )
}
