import { useEffect, useRef, useState } from 'react'
import AudioWave from './audio-wave.jsx'

// Scène audio : élément <audio> + onde animée + bouton de lecture.
// L'autoplay sonore peut être bloqué tant qu'il n'y a pas eu d'interaction.
export default function AudioStage({ src, autoPlay = true }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !src) return
    setBlocked(false)
    if (autoPlay) {
      audio.play().catch(() => setBlocked(true))
    }
  }, [src, autoPlay])

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().catch(() => setBlocked(true))
    else audio.pause()
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <audio
        ref={audioRef}
        src={src ?? undefined}
        preload="auto"
        onPlay={() => {
          setPlaying(true)
          setBlocked(false)
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      <AudioWave active={playing} />

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Lecture'}
        className={`flex h-16 w-16 items-center justify-center rounded-full bg-violet-600 text-2xl transition hover:bg-violet-500 ${
          playing ? 'shadow-neon-strong' : 'shadow-neon'
        }`}
      >
        {playing ? '⏸' : '▶'}
      </button>

      {blocked && <p className="text-xs text-violet-300">🔊 Clique pour lancer le son</p>}
    </div>
  )
}
