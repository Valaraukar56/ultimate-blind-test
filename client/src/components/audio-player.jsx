import { useEffect, useRef, useState } from 'react'

// Lecteur de preview 30s basé sur l'élément HTML5 <audio>.
// Props :
//   - src       : URL de la preview (preview_url Deezer)
//   - autoPlay  : tente de démarrer dès le changement de source
//   - onEnded   : callback en fin de lecture
export default function AudioPlayer({ src, autoPlay = false, onEnded }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState(null)

  // Réinitialise et tente l'autoplay quand la source change.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    setError(null)
    setCurrentTime(0)

    if (autoPlay && src) {
      // L'autoplay sonore peut être bloqué tant qu'il n'y a pas d'interaction.
      audio.play().catch(() => setIsPlaying(false))
    }
  }, [src, autoPlay])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      audio.play().catch(() => setError('Lecture impossible'))
    } else {
      audio.pause()
    }
  }

  function handleSeek(event) {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    audio.currentTime = Math.min(Math.max(ratio, 0), 1) * duration
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex w-full max-w-md items-center gap-3 rounded-xl bg-slate-800 p-3 text-slate-100">
      <audio
        ref={audioRef}
        src={src ?? undefined}
        preload="auto"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false)
          onEnded?.()
        }}
        onError={() => src && setError('Erreur de chargement')}
      />

      <button
        type="button"
        onClick={togglePlay}
        disabled={!src}
        aria-label={isPlaying ? 'Pause' : 'Lecture'}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg transition hover:bg-indigo-500 disabled:opacity-40"
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div className="flex flex-1 flex-col gap-1">
        <div
          onClick={handleSeek}
          className="h-2 cursor-pointer overflow-hidden rounded-full bg-slate-600"
        >
          <div
            className="h-full rounded-full bg-indigo-500 transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between font-mono text-xs text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}
