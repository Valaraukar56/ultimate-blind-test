import 'dotenv/config'

// Configuration centralisée lue depuis les variables d'environnement.
export const env = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  deezerApiBase: process.env.DEEZER_API_BASE ?? 'https://api.deezer.com',
  roundsPerGame: Number(process.env.ROUNDS_PER_GAME ?? 10),
  roundDurationSec: Number(process.env.ROUND_DURATION_SEC ?? 30),
}

// Origine autorisée pour CORS / Socket.io. CLIENT_URL="*" → reflète l'origine
// (utile en prod same-origin derrière un reverse proxy).
export const corsOrigin = env.clientUrl === '*' ? true : env.clientUrl
