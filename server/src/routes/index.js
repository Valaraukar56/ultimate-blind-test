import { Router } from 'express'

export const router = Router()

// Vérification de l'état du serveur.
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// TODO: routes REST additionnelles (thèmes, etc.)
