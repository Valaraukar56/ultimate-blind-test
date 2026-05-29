import { AnimatePresence, motion } from 'framer-motion'
import { socket } from '../lib/socket.js'

const MEDALS = ['🥇', '🥈', '🥉']
const rankLabel = (rank) => MEDALS[rank - 1] ?? `${rank}e`

// Qui a trouvé le morceau en cours, dans l'ordre d'arrivée.
// Chaque joueur « pop » à l'apparition puis reste affiché jusqu'au round suivant.
export default function FoundList({ found }) {
  return (
    <aside className="w-full rounded-2xl border border-emerald-500/20 bg-slate-900/70 p-4 backdrop-blur">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-300">
        Ont trouvé
      </h2>

      {found.length === 0 ? (
        <p className="text-xs text-slate-500">Personne n'a encore trouvé…</p>
      ) : (
        <ul className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {found.map((player) => (
              <motion.li
                key={player.playerId}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 16 }}
                className="flex items-center gap-2 rounded-lg bg-emerald-600/15 px-3 py-2 ring-1 ring-emerald-500/30"
              >
                <span className="text-xl">{rankLabel(player.rank)}</span>
                <span className="truncate font-medium">{player.pseudo}</span>
                {player.playerId === socket.id && (
                  <span className="text-xs text-slate-400">(toi)</span>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </aside>
  )
}
