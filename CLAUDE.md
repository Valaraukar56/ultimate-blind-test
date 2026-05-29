# Blind Test Multijoueur — Contexte projet

## Description
Site de blind test multijoueur en temps réel. Les joueurs rejoignent une salle via un code, écoutent des previews audio de 30s et doivent deviner le titre/artiste le plus vite possible.

## Stack technique
- **Backend** : Node.js + Express + Socket.io
- **Frontend** : React + Vite + Tailwind CSS + Framer Motion
- **BDD** : PostgreSQL via Prisma ORM
- **Audio** : Deezer API (previews 30s, pas de clé requise)
- **Temps réel** : Socket.io rooms

## Structure du monorepo
```
blind-test/
├── client/          # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── context/
├── server/          # Node.js + Express
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── socket/
│   │   └── prisma/
└── CLAUDE.md
```

## Conventions de code
- **Langage** : JavaScript (pas TypeScript pour l'instant)
- **Nommage** : camelCase pour les variables/fonctions, PascalCase pour les composants React
- **Fichiers** : kebab-case pour les noms de fichiers
- **Langue du code** : anglais (variables, fonctions, commentaires en français)
- **Imports** : ES modules (import/export)

## Modèles Prisma
```
Room      { id, code, hostId, status, theme, createdAt }
Player    { id, pseudo, roomId, socketId, score }
Round     { id, roomId, trackId, trackTitle, artist, order }
Score     { id, playerId, roundId, points, answeredAt }
```

## Événements Socket.io
### Client → Serveur
- `create_room` { pseudo, theme }
- `join_room` { code, pseudo }
- `start_game` { roomCode }
- `submit_answer` { roomCode, answer }

### Serveur → Client
- `room_created` { code, roomId }
- `player_joined` { players[] }
- `game_started` { totalRounds }
- `round_start` { roundNumber, previewUrl, duration }
- `answer_result` { correct, points, correctAnswer }
- `round_end` { correctAnswer, scores[] }
- `game_over` { finalScores[], winner }

## Règles de scoring
- Bonne réponse : 1000 pts de base
- Bonus vitesse : +500 si < 5s | +300 si < 10s | +100 si < 20s
- Tolérance fautes : distance de Levenshtein ≤ 2 acceptée
- Timer serveur (authoritative) : 30s par round, tick toutes les secondes

## Thèmes disponibles (Deezer API)
- Pop française, Rock, Rap FR, Années 80, Années 90, Anime OST, Gaming OST, Charts actuels

## Variables d'environnement (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/blindtest
PORT=3001
CLIENT_URL=http://localhost:5173
DEEZER_API_BASE=https://api.deezer.com
```

## À ne pas faire
- Ne pas mettre la logique de timer côté client
- Ne pas exposer la bonne réponse dans l'événement `round_start`
- Ne pas stocker les previews Deezer, les streamer directement depuis l'URL