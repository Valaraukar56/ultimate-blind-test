import { randomInt } from 'node:crypto'

// État des salles en mémoire (mono-process, pas de Redis pour l'instant).
// Une salle disparaît automatiquement quand son dernier joueur se déconnecte.

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sans I, O, 0, 1 (ambigus)
const CODE_LENGTH = 6

const rooms = new Map() // code -> room
const socketToRoom = new Map() // socketId -> code

function generateCode() {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  }
  return code
}

function generateUniqueCode() {
  let code = generateCode()
  while (rooms.has(code)) code = generateCode()
  return code
}

function makePlayer({ socketId, pseudo, isHost }) {
  return { id: socketId, pseudo, score: 0, isHost, joinedAt: Date.now() }
}

export function getRoom(code) {
  if (!code) return null
  return rooms.get(String(code).toUpperCase()) ?? null
}

export function createRoom({ hostSocketId, pseudo, theme }) {
  const code = generateUniqueCode()
  const host = makePlayer({ socketId: hostSocketId, pseudo, isHost: true })
  const room = {
    code,
    theme: theme ?? null,
    status: 'WAITING', // WAITING | PLAYING | FINISHED
    hostId: hostSocketId,
    players: new Map([[hostSocketId, host]]),
    createdAt: new Date(),
  }
  rooms.set(code, room)
  socketToRoom.set(hostSocketId, code)
  return room
}

export function joinRoom({ code, socketId, pseudo }) {
  const room = getRoom(code)
  if (!room) return { error: 'Salle introuvable' }
  if (room.status !== 'WAITING') return { error: 'La partie a déjà commencé' }

  const player = makePlayer({ socketId, pseudo, isHost: false })
  room.players.set(socketId, player)
  socketToRoom.set(socketId, room.code)
  return { room, player }
}

export function startGame({ code, socketId }) {
  const room = getRoom(code)
  if (!room) return { error: 'Salle introuvable' }
  if (room.hostId !== socketId) return { error: "Seul l'hôte peut lancer la partie" }
  if (room.status !== 'WAITING') return { error: 'La partie est déjà lancée' }

  room.status = 'PLAYING'
  return { room }
}

// Retire un joueur (déconnexion). Réattribue l'hôte et ferme la salle si vide.
export function removePlayer(socketId) {
  const code = socketToRoom.get(socketId)
  if (!code) return null
  socketToRoom.delete(socketId)

  const room = rooms.get(code)
  if (!room) return null

  const removedPlayer = room.players.get(socketId) ?? null
  room.players.delete(socketId)

  if (room.players.size === 0) {
    rooms.delete(code)
    return { code, room: null, removedPlayer, newHostId: null, roomClosed: true }
  }

  let newHostId = null
  if (room.hostId === socketId) {
    // L'hôte est parti : on promeut le plus ancien joueur restant.
    const next = [...room.players.values()].sort((a, b) => a.joinedAt - b.joinedAt)[0]
    next.isHost = true
    room.hostId = next.id
    newHostId = next.id
  }

  return { code, room, removedPlayer, newHostId, roomClosed: false }
}

export function serializePlayers(room) {
  if (!room) return []
  return [...room.players.values()]
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map(({ id, pseudo, score, isHost }) => ({ id, pseudo, score, isHost }))
}

export function serializeRoom(room) {
  if (!room) return null
  return {
    code: room.code,
    theme: room.theme,
    status: room.status,
    hostId: room.hostId,
    players: serializePlayers(room),
  }
}
