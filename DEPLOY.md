# 🚀 Déploiement sur VPS — à côté d'un site existant (Caddy déjà présent)

Ton VPS fait déjà tourner **Caddy** (sur 80/443) devant ton site `combo`. On **réutilise ce Caddy** : on n'en lance pas un second. Le blind test s'ajoute comme un site supplémentaire (un « autre onglet »).

```
Caddy (hôte, 80/443)
 ├── ton site combo                         (inchangé)
 └── blindtest.<IP>.sslip.io   ──►  build React (statique) + proxy /api,/socket.io  ──►  conteneur Node 127.0.0.1:3001
```

- **Serveur** du jeu : conteneur Docker, écoute seulement sur `127.0.0.1:3001` (non public).
- **Client** : build React servi directement par ton Caddy.
- **HTTPS gratuit sans domaine** : `sslip.io` fournit un sous-domaine lié à ton IP.

## 0. Récupérer ton IP publique

```bash
curl -4 icanhazip.com
```

Note-la et remplace les points par des tirets pour sslip. Ex. `203.0.113.10` → `blindtest.203-0-113-10.sslip.io`.

## 1. Récupérer le code

```bash
git clone <ton-repo> blindtest && cd blindtest
cp .env.example .env        # valeurs par défaut OK
```

## 2. Lancer le serveur (Docker)

```bash
docker compose up -d --build
# vérif : doit répondre {"status":"ok",...}
curl http://127.0.0.1:3001/api/health
```

## 3. Builder le client et le déposer là où Caddy le servira

Node est déjà présent sur le VPS (ton site combo l'utilise).

```bash
cd client
npm install
npm run build
sudo mkdir -p /srv/blindtest
sudo cp -r dist/* /srv/blindtest/
cd ..
```

> Pas envie d'installer les deps du client sur l'hôte ? On peut builder dans Docker et extraire le `dist/` — demande-moi.

## 4. Ajouter le bloc dans TON Caddyfile

Le bloc prêt à coller est dans [deploy/blindtest.caddy](deploy/blindtest.caddy). Ouvre `/etc/caddy/Caddyfile`, **ajoute ce bloc à la fin** (ne touche pas à tes blocs combo), en remplaçant l'adresse par ton `blindtest.<IP-tirets>.sslip.io`.

```bash
sudo nano /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Accès : `https://blindtest.<IP-tirets>.sslip.io` 🎉 (Caddy génère le certificat tout seul au premier accès).

## 5. Mettre à jour plus tard

```bash
git pull
docker compose up -d --build          # serveur
cd client && npm run build && sudo cp -r dist/* /srv/blindtest/ && cd ..   # client
```

## Dépannage

| Symptôme | Piste |
|---|---|
| `curl 127.0.0.1:3001/api/health` ne répond pas | `docker compose logs server` |
| Page blanche | `/srv/blindtest/index.html` existe ? droits de lecture pour Caddy ? |
| « Connexion… » jamais verte | le proxy WebSocket : vérifier le bloc `@backend` (chemins `/socket.io/*`) |
| Pas de HTTPS | l'adresse du bloc est bien un domaine sslip (pas `:80`) ; ports 80/443 ouverts |
| `caddy validate` refuse | conflit avec un bloc existant → colle-moi ton Caddyfile, je l'adapte |

## Alternative sans sslip (HTTP sur un port)

Si tu préfères éviter sslip : mets `:8090` comme adresse dans le bloc Caddy → accès `http://TON_IP:8090` (ouvre le port 8090 au firewall). Sur HTTP, le bouton « copier le code » du lobby est inactif (API navigateur réservée au HTTPS), sans gravité.

## Brancher Postgres plus tard

État actuellement en mémoire (redémarrage = parties perdues). Pour persister : ajouter un service `postgres`, passer `DATABASE_URL` au serveur, retirer `--ignore-scripts` du `server/Dockerfile` (pour `prisma generate`), puis coder la persistance.
