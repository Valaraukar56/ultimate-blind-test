// Timer circulaire qui se vide. La valeur est pilotée par le serveur (ticks).
export default function CircularTimer({ remaining = 0, total = 30, size = 132 }) {
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0
  const offset = circumference * (1 - ratio)
  const danger = remaining <= 5

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#241b3a"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={danger ? '#f43f5e' : '#a855f7'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease',
            filter: `drop-shadow(0 0 6px ${danger ? 'rgba(244,63,94,.7)' : 'rgba(168,85,247,.7)'})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-mono text-4xl font-bold ${danger ? 'text-rose-400' : 'text-violet-200'}`}
        >
          {remaining}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-slate-500">sec</span>
      </div>
    </div>
  )
}
