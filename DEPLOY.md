# 🚀 Déploiement VPS — à côté de `combo` (Caddy existant, sans Docker)

Contexte réel du VPS (`51.68.129.168`) :

- **Caddy** tourne déjà sur l'hôte (80/443) → on le réutilise, on n'en lance pas un second.
- **`combo`** écoute sur le **port 3001** → le blind test prend le **port 3002**.
- **Docker absent**, Node v24 présent → on lance le serveur en **service systemd** (comme combo).

```
Caddy (hôte, 80/443)
 ├── 51.68.129.168.sslip.io           → combo (localhost:3001)   [inchangé]
 └── blindtest.51.68.129.168.sslip.io → /srv/blindtest (statique) + proxy /api,/socket.io → localhost:3002
```

## A. Sur ton PC (une seule fois) — pousser le code sur GitHub

```powershell
# Dépôt déjà init + commité par Claude. Crée un dépôt VIDE sur github.com, puis :
git remote add origin https://github.com/TON_USER/ultimate-blind-test.git
git branch -M main
git push -u origin main
```

## B. Sur le VPS

### 1. Cloner

```bash
cd ~
git clone https://github.com/TON_USER/ultimate-blind-test.git blindtest
cd blindtest
```

### 2. Serveur (systemd, port 3002)

```bash
# dépendances de prod (sans Prisma generate, DB branchée plus tard)
cd ~/blindtest/server && npm install --omit=dev --ignore-scripts && cd ~/blindtest

# vérifier que 3002 est libre (ne doit rien afficher)
ss -tlnp | grep :3002

# installer + démarrer le service
sudo cp deploy/blindtest.service /etc/systemd/system/blindtest.service
sudo systemctl daemon-reload
sudo systemctl enable --now blindtest

# test : doit répondre {"status":"ok",...}
curl http://127.0.0.1:3002/api/health
```

### 3. Client (build statique servi par Caddy)

```bash
cd ~/blindtest/client && npm install && npm run build && cd ~/blindtest
sudo mkdir -p /srv/blindtest
sudo cp -r client/dist/* /srv/blindtest/
```

### 4. Caddy (ajoute le bloc blind test, combo inchangé)

Le fichier `deploy/blindtest.caddy` contient **le Caddyfile complet** (bloc combo + bloc blind test). Il reprend ta conf actuelle telle quelle.

```bash
# sauvegarde puis remplacement
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak
sudo cp deploy/blindtest.caddy /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

➡️ **`https://blindtest.51.68.129.168.sslip.io`** — HTTPS auto au premier accès. `combo` reste sur `https://51.68.129.168.sslip.io`.

## Mettre à jour plus tard

```bash
cd ~/blindtest && git pull
# serveur
cd server && npm install --omit=dev --ignore-scripts && cd ..
sudo systemctl restart blindtest
# client
cd client && npm run build && cd ..
sudo cp -r client/dist/* /srv/blindtest/
```

## Dépannage

| Symptôme | Commande / piste |
|---|---|
| serveur down | `sudo systemctl status blindtest` · `journalctl -u blindtest -f` |
| `/api/health` muet | port 3002 occupé ? `ss -tlnp \| grep :3002` |
| page blanche | `/srv/blindtest/index.html` présent + lisible par Caddy |
| « Connexion… » jamais verte | bloc `@backend` (`/socket.io/*`) bien présent ; `journalctl -u caddy -f` |
| `caddy validate` refuse | revenir à la sauvegarde : `sudo cp /etc/caddy/Caddyfile.bak /etc/caddy/Caddyfile && sudo systemctl reload caddy` |
| combo cassé | idem : restaurer `.bak` ci-dessus |

## Postgres plus tard

État en mémoire pour l'instant (redémarrage `blindtest` = parties en cours perdues). Pour persister : installer Postgres, passer `DATABASE_URL` au service (dans le `.service`), `npx prisma migrate deploy`, puis coder la persistance.
