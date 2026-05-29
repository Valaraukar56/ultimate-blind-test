import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { env, corsOrigin } from './config/env.js'
import { createApp } from './app.js'
import { registerSocketHandlers } from './socket/index.js'

const app = createApp()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
})

registerSocketHandlers(io)

httpServer.listen(env.port, () => {
  console.log(`🎵 Serveur Blind Test en écoute sur http://localhost:${env.port}`)
})
