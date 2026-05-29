import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useRoom } from '../context/room-context.jsx'
import { useRoomRedirect } from '../hooks/use-room-redirect.js'
import PageTransition from '../components/page-transition.jsx'

// Salle d'attente : liste des joueurs, code à partager, lancement (hôte).
export default function LobbyPage() {
  useRoomRedirect()
  const { code: codeParam } = useParams()
  const { code, theme, players, isHost, startGame, leaveRoom, gameError } = useRoom()
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  if (!code) return null

  async function handleStart() {
    setError(null)
    const res = await startGame()
    if (!res.ok) setError(res.error)
  }

  function copyCode() {
    navigator.clipboard?.writeText(codeParam).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      },
      () => {},
    )
  }

  return (
    <PageTransition className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center gap-8 p-4">
      <div className="text-center">
        <p className="text-sm uppercase tracking-widest text-violet-300">Salle d'attente</p>
        <button
          type="button"
          onClick={copyCode}
          title="Copier le code"
          className="font-mono text-6xl font-black tracking-[0.2em] text-neon transition hover:scale-105"
        >
          {codeParam}
        </button>
        <p className="mt-1 text-xs text-slate-500">
          {copied ? '✅ Copié !' : 'Clique pour copier le code'}
        </p>
        {theme && <p className="mt-2 text-sm text-fuchsia-300">🎵 {theme}</p>}
      </div>

      <div className="w-full rounded-3xl border border-violet-500/20 bg-slate-900/70 p-6 backdrop-blur">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-300">
          Joueurs ({players.length})
        </h2>
        <ul className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {players.map((player) => (
              <motion.li
                key={player.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="flex items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-2"
              >
                {player.isHost && <span title="Hôte">👑</span>}
                <span>{player.pseudo}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      {isHost ? (
        <button
          type="button"
          onClick={handleStart}
          className="w-full max-w-xs rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 py-3.5 font-bold tracking-wide transition hover:shadow-neon-strong"
        >
          Lancer la partie
        </button>
      ) : (
        <p className="text-sm text-slate-400">En attente du lancement par l'hôte…</p>
      )}

      {(error || gameError) && <p className="text-sm text-rose-400">{error || gameError}</p>}

      <button type="button" onClick={leaveRoom} className="text-sm text-slate-500 hover:underline">
        Quitter la salle
      </button>
    </PageTransition>
  )
}
