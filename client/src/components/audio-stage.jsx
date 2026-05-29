import { useEffect, useRef, useState } from 'react'
import AudioWave from './audio-wave.jsx'

const VOLUME_KEY = 'bt_volume'

function initialVolume() {
  const stored = Number(localStorage.getItem(VOLUME_KEY))
  return Number.isFinite(stored) && stored >= 0 && stored <= 1 ? stored : 0.8
}

// Scène audio : élément <audio> + onde animée + bouton lecture + volume.
// L'autoplay sonore peut être bloqué tant qu'il n'y a pas eu d'interaction.
export default function AudioStage({ src, autoPlay = true }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [volume, setVolume] = useState(initialVolume)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !src) return
    setBlocked(false)
    if (autoPlay) {
      audio.play().catch(() => setBlocked(true))
    }
  }, [src, autoPlay])

  // Applique et mémorise le volume.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
    localStorage.setItem(VOLUME_KEY, String(volume))
  }, [volume])

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
        onLoadedMetadata={(event) => {
          event.currentTarget.volume = volume
        }}
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

      {/* Réglage du volume */}
      <div className="flex w-48 items-center gap-2 text-violet-300">
        <span className="text-sm" aria-hidden>
          {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          aria-label="Volume"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-violet-500"
        />
      </div>

      {blocked && <p className="text-xs text-violet-300">🔊 Clique pour lancer le son</p>}
    </div>
  )
}
