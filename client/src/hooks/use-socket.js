import { useEffect, useState } from 'react'
import { socket } from '../lib/socket.js'

// Établit et suit la connexion Socket.io. La connexion est partagée
// (instance unique dans lib/socket.js) ; ce hook se contente de la piloter.
export function useSocket() {
  const [connected, setConnected] = useState(socket.connected)

  useEffect(() => {
    function onConnect() {
      setConnected(true)
    }
    function onDisconnect() {
      setConnected(false)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    if (!socket.connected) socket.connect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  return { socket, connected }
}
