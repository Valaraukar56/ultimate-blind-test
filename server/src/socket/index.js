import { ClientEvents, ServerEvents } from './events.js'
import * as roomStore from '../rooms/room-store.js'
import * as gameManager from '../game/game-manager.js'

const MAX_PSEUDO_LENGTH = 20

// Appelle l'accusé de réception du client s'il en a fourni un.
function respond(ack, payload) {
  if (typeof ack === 'function') ack(payload)
}

function cleanPseudo(value) {
  return String(value ?? '')
    .trim()
    .slice(0, MAX_PSEUDO_LENGTH)
}

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[socket] connecté : ${socket.id}`)

    // --- Création d'une salle ---
    socket.on(ClientEvents.CREATE_ROOM, ({ pseudo, theme } = {}, ack) => {
      const name = cleanPseudo(pseudo)
      if (!name) return respond(ack, { ok: false, error: 'Pseudo requis' })

      const room = roomStore.createRoom({ hostSocketId: socket.id, pseudo: name, theme })
      socket.join(room.code)

      respond(ack, {
        ok: true,
        code: room.code,
        theme: room.theme,
        status: room.status,
        you: { id: socket.id, isHost: true },
        players: roomStore.serializePlayers(room),
      })

      socket.emit(ServerEvents.ROOM_CREATED, { code: room.code, roomId: room.code })
      io.to(room.code).emit(ServerEvents.PLAYER_JOINED, {
        players: roomStore.serializePlayers(room),
      })
      console.log(`[room] ${room.code} créée par ${name}`)
    })

    // --- Rejoindre une salle ---
    socket.on(ClientEvents.JOIN_ROOM, ({ code, pseudo } = {}, ack) => {
      const name = cleanPseudo(pseudo)
      if (!name) return respond(ack, { ok: false, error: 'Pseudo requis' })

      const result = roomStore.joinRoom({ code, socketId: socket.id, pseudo: name })
      if (result.error) return respond(ack, { ok: false, error: result.error })

      const { room } = result
      socket.join(room.code)

      respond(ack, {
        ok: true,
        code: room.code,
        theme: room.theme,
        status: room.status,
        you: { id: socket.id, isHost: false },
        players: roomStore.serializePlayers(room),
      })

      // Diffuse le nouveau roster à toute la salle (le joueur entrant inclus).
      io.to(room.code).emit(ServerEvents.PLAYER_JOINED, {
        players: roomStore.serializePlayers(room),
      })
      console.log(`[room] ${name} a rejoint ${room.code}`)
    })

    // --- Lancer la partie (hôte uniquement) ---
    socket.on(ClientEvents.START_GAME, ({ roomCode } = {}, ack) => {
      const result = roomStore.startGame({ code: roomCode, socketId: socket.id })
      if (result.error) return respond(ack, { ok: false, error: result.error })

      respond(ack, { ok: true })
      const { code } = result.room
      console.log(`[room] ${code} : partie lancée`)

      // Chargement des morceaux + orchestration des rounds (asynchrone).
      gameManager.startGame(io, code).catch((err) => {
        console.error(`[game] démarrage KO pour ${code} : ${err.message}`)
        result.room.status = 'WAITING'
        io.to(code).emit(ServerEvents.GAME_ERROR, {
          message: 'Impossible de charger les morceaux, réessaie.',
        })
      })
    })

    // --- Soumission d'une réponse ---
    socket.on(ClientEvents.SUBMIT_ANSWER, ({ roomCode, answer } = {}, ack) => {
      const res = gameManager.submitAnswer(io, roomCode, socket.id, answer)
      respond(ack, res)
    })

    // --- Déconnexion gracieuse ---
    // socket.io quitte automatiquement les rooms ; on met juste à jour l'état
    // et on prévient les joueurs restants. La partie continue.
    socket.on('disconnect', (reason) => {
      console.log(`[socket] déconnecté : ${socket.id} (${reason})`)

      const result = roomStore.removePlayer(socket.id)
      if (!result || result.roomClosed) {
        if (result?.roomClosed) {
          gameManager.stopGame(result.code) // coupe les timers en cours
          console.log(`[room] ${result.code} fermée (vide)`)
        }
        return
      }

      io.to(result.code).emit(ServerEvents.PLAYER_LEFT, {
        players: roomStore.serializePlayers(result.room),
        leftPlayerId: socket.id,
        newHostId: result.newHostId,
      })
    })
  })
}
