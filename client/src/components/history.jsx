import { AnimatePresence, motion } from 'framer-motion'

// Historique des morceaux déjà passés (colonne de gauche, sans spoiler :
// un titre n'apparaît qu'une fois le round terminé).
export default function History({ items }) {
  return (
    <aside className="w-full rounded-2xl border border-violet-500/20 bg-slate-900/70 p-4 backdrop-blur lg:w-64">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-300">
        Déjà passées
      </h2>

      {items.length === 0 ? (
        <p className="text-xs text-slate-500">Les morceaux joués s'afficheront ici.</p>
      ) : (
        <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li
                key={item.roundNumber}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 rounded-lg bg-slate-800/60 p-2"
              >
                <span className="w-5 shrink-0 text-center text-xs text-slate-500">
                  {item.roundNumber}
                </span>
                {item.cover_url && (
                  <img src={item.cover_url} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="truncate text-xs text-fuchsia-300">{item.artist}</p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </aside>
  )
}
