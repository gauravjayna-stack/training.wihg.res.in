# DEPLOYMENT_LINUX.md
## WIHG Internship & Dissertation Management System — Linux Server Setup

This guide walks through deploying the system on a fresh Ubuntu 22.04/24.04 (or Debian 12) server, using Nginx as a reverse proxy, PM2 to run the Node.js API, and either SQLite (simplest) or PostgreSQL (recommended for production) as the database.

---

## 1. Prerequisites

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx
```

Install Node.js 20 LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # should print v20.x
```

Install PM2 globally:

```bash
sudo npm install -g pm2
```

(Optional, for Postgres) Install Docker + Compose, or a native PostgreSQL server:

```bash
sudo apt install -y postgresql postgresql-contrib
```

---

## 2. Get the code onto the server

```bash
sudo mkdir -p /var/www/wihg
sudo chown $USER:$USER /var/www/wihg
cd /var/www/wihg
git clone <your-repo-url> .
```

---

## 3. Configure the server (API)

```bash
cd /var/www/wihg/server
cp .env.example .env
nano .env   # fill in JWT_SECRET, SMTP credentials, DATABASE_URL, etc.
npm install
```

### Database — Option A: SQLite (fastest to get running)
No extra setup needed. `DATABASE_URL="file:./dev.db"` in `.env` is enough.

### Database — Option B: PostgreSQL (recommended for production)
1. In `prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "postgresql"   // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
2. Create the database and user:
   ```bash
   sudo -u postgres psql -c "CREATE USER wihg_user WITH PASSWORD 'CHANGE_ME';"
   sudo -u postgres psql -c "CREATE DATABASE wihg_db OWNER wihg_user;"
   ```
3. Set `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="postgresql://wihg_user:CHANGE_ME@localhost:5432/wihg_db?schema=public"
   ```

Or use the provided `docker-compose.yml` to run Postgres (and optionally the API) in containers:
```bash
cd /var/www/wihg
docker compose up -d postgres
```

### Run migrations and seed initial accounts

```bash
cd /var/www/wihg/server
npx prisma migrate deploy   # or `npx prisma migrate dev --name init` on first setup
npm run seed                # creates the initial Admin, Accounts, and sample Scientist accounts
```

**Immediately log in and change the seeded passwords** (`SEED_ADMIN_PASSWORD` in `.env`, and `ChangeMe123!` for other seeded accounts).

---

## 4. Build the frontend

```bash
cd /var/www/wihg/client
npm install
npm run build
```

This produces static files in `client/dist`. Copy them to the path Nginx serves:

```bash
sudo mkdir -p /var/www/wihg/client-dist
sudo cp -r /var/www/wihg/client/dist/* /var/www/wihg/client-dist/
```

Re-run this copy step after every frontend update.

---

## 5. Start the API with PM2

```bash
cd /var/www/wihg
mkdir -p logs
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # follow the printed instructions to enable PM2 on boot
```

Check it's running:

```bash
pm2 status
pm2 logs wihg-server
curl http://localhost:4000/api/health
```

---

## 6. Configure Nginx

```bash
sudo cp /var/www/wihg/nginx.conf /etc/nginx/sites-available/wihg.conf
sudo nano /etc/nginx/sites-available/wihg.conf   # replace wihg.example.org with your real domain
sudo ln -s /etc/nginx/sites-available/wihg.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. Enable HTTPS with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d wihg.example.org
```

Certbot will edit the Nginx config to add a `443 ssl` server block and redirect HTTP → HTTPS automatically. Certificates auto-renew via a systemd timer (`sudo certbot renew --dry-run` to verify).

---

## 8. Environment variables reference (`server/.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite file path or Postgres connection string |
| `JWT_SECRET` | Long random string signing session tokens — treat as a secret |
| `JWT_EXPIRES_IN` | Session lifetime, e.g. `8h` |
| `PORT` | Port the Node API listens on internally (default 4000) |
| `CLIENT_ORIGIN` | Frontend origin, for CORS |
| `PUBLIC_BASE_URL` | Public URL used to build QR-code verification links |
| `SMTP_*` | Outbound email credentials for status notifications |

---

## 9. File uploads

Uploaded receipts, reports, and generated certificate PDFs are stored under `server/uploads/`. Back this directory up regularly (or mount it as a Docker volume, as `docker-compose.yml` does). Ensure it is **not** publicly listable — the Express static route only serves exact known paths, but you should still restrict directory listing at the Nginx layer if you ever serve `/uploads` directly from Nginx instead of proxying to Node.

---

## 10. Updating the app

```bash
cd /var/www/wihg
git pull
cd server && npm install && npx prisma migrate deploy && pm2 restart wihg-server
cd ../client && npm install && npm run build && sudo cp -r dist/* /var/www/wihg/client-dist/
```

---

## 11. Basic hardening checklist

- [ ] Change every seeded password immediately after first deploy.
- [ ] Use a strong, unique `JWT_SECRET` (32+ random characters).
- [ ] Restrict Postgres/SQLite file permissions to the app user only.
- [ ] Keep `ufw` enabled, allowing only 22 (SSH), 80, and 443.
- [ ] Set up automatic OS security updates (`unattended-upgrades`).
- [ ] Take regular backups of the database and the `uploads/` directory.
