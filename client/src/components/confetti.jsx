import { useEffect, useRef } from 'react'

// Confettis plein écran (canvas, sans dépendance). Tombe pendant `duration` ms.
export default function Confetti({ duration = 6000, count = 180 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const onResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    const colors = ['#a855f7', '#ec4899', '#22d3ee', '#fde047', '#34d399']
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * -height,
      size: 4 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: 2 + Math.random() * 4,
      vx: -2 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: -0.2 + Math.random() * 0.4,
    }))

    let raf
    const start = performance.now()

    function frame(now) {
      ctx.clearRect(0, 0, width, height)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        if (p.y > height + 20) {
          p.y = -20
          p.x = Math.random() * width
        }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      }
      if (now - start < duration) raf = requestAnimationFrame(frame)
      else ctx.clearRect(0, 0, width, height)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [duration, count])

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50" />
}
