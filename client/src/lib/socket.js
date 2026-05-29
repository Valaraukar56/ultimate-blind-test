import { io } from 'socket.io-client'

// En dev : serveur séparé sur :3001. En prod : même origine (Caddy proxifie
// /socket.io vers le serveur), donc URL undefined → connexion same-origin.
const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || (import.meta.env.DEV ? 'http://localhost:3001' : undefined)

// Instance Socket.io partagée. Connexion déclenchée manuellement via socket.connect().
export const socket = io(SERVER_URL, { autoConnect: false })
