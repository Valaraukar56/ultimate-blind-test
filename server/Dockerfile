# Serveur Node (Express + Socket.io). État en mémoire, pas de DB pour l'instant.
FROM node:20-alpine

WORKDIR /app

# Dépendances de production uniquement.
# --ignore-scripts : on saute le postinstall de Prisma (DB branchée plus tard).
COPY server/package.json ./
RUN npm install --omit=dev --ignore-scripts

# Code source.
COPY server/src ./src
COPY server/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "src/index.js"]
