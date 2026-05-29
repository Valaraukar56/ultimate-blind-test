import express from 'express'
import cors from 'cors'
import { corsOrigin } from './config/env.js'
import { router } from './routes/index.js'

// Construit et configure l'application Express (sans démarrer le serveur).
export function createApp() {
  const app = express()

  app.use(cors({ origin: corsOrigin, credentials: true }))
  app.use(express.json())

  app.use('/api', router)

  return app
}
