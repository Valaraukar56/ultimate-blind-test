// Onde audio animée (barres d'égaliseur). S'anime uniquement quand `active`.
export default function AudioWave({ active = false, bars = 32 }) {
  return (
    <div className="flex h-24 items-end justify-center gap-1">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-fuchsia-500 to-violet-300"
          style={{
            height: '100%',
            transformOrigin: 'bottom',
            transform: active ? undefined : 'scaleY(0.18)',
            opacity: active ? 1 : 0.35,
            animation: active
              ? `equalize ${0.7 + (i % 5) * 0.12}s ease-in-out ${(i % 7) * 0.06}s infinite`
              : 'none',
          }}
        />
      ))}
    </div>
  )
}
