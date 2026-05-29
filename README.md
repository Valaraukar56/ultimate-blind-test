# 🎵 Blind Test Multijoueur

Un jeu de blind test en temps réel jouable à plusieurs dans un navigateur. Rejoins une salle, écoute des previews de 30 secondes et sois le plus rapide à trouver le titre et l'artiste.

## ✨ Fonctionnalités

- 🎮 Salles multijoueur avec code d'invitation
- 🎵 Previews audio via l'API Deezer (millions de titres)
- ⚡ Temps réel avec Socket.io
- 🏆 Système de points avec bonus de vitesse
- 🎨 Thèmes variés : Pop FR, Rock, Rap, Années 80/90, Anime...
- 📱 Interface responsive

## 🛠️ Stack

| Couche | Techno |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express + Socket.io |
| Base de données | PostgreSQL + Prisma |
| Audio | Deezer API (previews 30s) |

## 🚀 Installation

### Prérequis
- Node.js 18+
- PostgreSQL

### Démarrage

```bash
# Cloner le repo
git clone https://github.com/TON_PSEUDO/blind-test.git
cd blind-test

# Backend
cd server
cp .env.example .env
# → Remplir DATABASE_URL dans .env
npm install
npx prisma migrate dev
npm run dev

# Frontend (nouveau terminal)
cd client
npm install
npm run dev
```

Le client tourne sur `http://localhost:5173`, le serveur sur `http://localhost:3001`.

## 📁 Structure

```
blind-test/
├── client/                 # React + Vite
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Home, Lobby, Game, Results
│   │   ├── hooks/          # useSocket, useGame...
│   │   └── context/        # RoomContext, GameContext
├── server/                 # Node.js + Express
│   ├── src/
│   │   ├── routes/         # REST API endpoints
│   │   ├── services/       # deezerService, gameService
│   │   ├── socket/         # Handlers socket.io
│   │   └── prisma/         # Schema + migrations
├── CLAUDE.md               # Contexte pour Claude Code
└── README.md
```

## 🎮 Comment jouer

1. **Créer une salle** — choisis un pseudo et un thème musical
2. **Partager le code** — envoie le code à 6 caractères à tes amis
3. **Lancer la partie** — l'hôte démarre quand tout le monde est prêt
4. **Deviner** — tape le titre ou l'artiste avant le timer de 30s
5. **Scorer** — plus tu réponds vite, plus tu gagnes de points !

## 🏗️ Roadmap

- [ ] Phase 1 — Scaffolding & structure du projet
- [ ] Phase 2 — Système de salles & WebSockets
- [ ] Phase 3 — Intégration Deezer API
- [ ] Phase 4 — Mécanique de jeu & scoring
- [ ] Phase 5 — Interface & polish

## 📝 Licence

MIT