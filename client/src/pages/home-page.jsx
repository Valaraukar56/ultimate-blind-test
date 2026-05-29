import { useState } from 'react'
import { useRoom } from '../context/room-context.jsx'
import { useRoomRedirect } from '../hooks/use-room-redirect.js'
import PageTransition from '../components/page-transition.jsx'
import { THEMES } from '../lib/constants.js'

// Accueil : créer ou rejoindre une salle. La navigation est gérée par
// useRoomRedirect dès que la salle est rejointe.
export default function HomePage() {
  useRoomRedirect()
  const { createRoom, joinRoom, connected } = useRoom()

  const [mode, setMode] = useState('create') // 'create' | 'join'
  const [pseudo, setPseudo] = useState('')
  const [theme, setTheme] = useState(THEMES[0])
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (!pseudo.trim()) return setError('Choisis un pseudo')
    if (mode === 'join' && code.trim().length < 6) return setError('Code de salle invalide')

    setLoading(true)
    const res =
      mode === 'create'
        ? await createRoom(pseudo.trim(), theme)
        : await joinRoom(code.trim().toUpperCase(), pseudo.trim())
    setLoading(false)
    if (!res.ok) setError(res.error)
  }

  return (
    <PageTransition className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <div className="text-center">
        <h1 className="text-5xl font-black tracking-tight text-neon">ULTIMATE</h1>
        <h2 className="text-3xl font-light tracking-[0.3em] text-violet-300">BLIND TEST</h2>
      </div>

      <div className="w-full max-w-sm rounded-3xl border border-violet-500/20 bg-slate-900/70 p-6 shadow-neon backdrop-blur">
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-800/80 p-1">
          {['create', 'join'].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                mode === value ? 'bg-violet-600 text-white shadow-neon' : 'text-slate-300'
              }`}
            >
              {value === 'create' ? 'Créer' : 'Rejoindre'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-violet-200">
            Pseudo
            <input
              value={pseudo}
              onChange={(event) => setPseudo(event.target.value)}
              maxLength={20}
              placeholder="Ton pseudo"
              className="rounded-lg bg-slate-800 px-3 py-2.5 text-slate-100 outline-none ring-violet-500 transition focus:ring-2"
            />
          </label>

          {mode === 'create' ? (
            <label className="flex flex-col gap-1 text-sm text-violet-200">
              Thème
              <select
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
                className="rounded-lg bg-slate-800 px-3 py-2.5 text-slate-100 outline-none ring-violet-500 transition focus:ring-2"
              >
                {THEMES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="flex flex-col gap-1 text-sm text-violet-200">
              Code de la salle
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ABC123"
                className="rounded-lg bg-slate-800 px-3 py-2.5 font-mono uppercase tracking-[0.4em] text-slate-100 outline-none ring-violet-500 transition focus:ring-2"
              />
            </label>
          )}

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 py-3 font-bold tracking-wide transition hover:shadow-neon-strong disabled:opacity-50"
          >
            {loading ? '…' : mode === 'create' ? 'Créer la salle' : 'Rejoindre'}
          </button>
        </form>
      </div>

      <p className="text-xs text-slate-500">
        {connected ? '🟢 Connecté' : '🔴 Connexion…'}
      </p>
    </PageTransition>
  )
}
