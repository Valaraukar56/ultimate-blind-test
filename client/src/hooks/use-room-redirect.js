import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useRoom } from '../context/room-context.jsx'

// Route cible selon la phase de jeu.
function targetPath(phase, code) {
  if (!code) return '/'
  if (phase === 'over') return `/results/${code}`
  if (phase === 'loading' || phase === 'playing' || phase === 'reveal') return `/game/${code}`
  return `/lobby/${code}`
}

// Garde de navigation : maintient l'URL alignée sur l'état de la salle.
// Un accès direct sans salle renvoie à l'accueil ; les changements de phase
// font naviguer lobby → game → results automatiquement.
export function useRoomRedirect() {
  const { phase, code } = useRoom()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    const target = targetPath(phase, code)
    if (pathname !== target) navigate(target, { replace: true })
  }, [phase, code, pathname, navigate])
}
