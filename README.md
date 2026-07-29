# WIHG Internship & Dissertation Management System

A full-stack web application for the Wadia Institute of Himalayan Geology (WIHG) Training Cell to manage student internships and dissertations end-to-end: discovery & pre-contact, application & approval, fee payment & verification (with EWS waiver support), physical joining, and completion with QR-verified PDF certificates.

## Structure

```
/client                 React (Vite) SPA — Tailwind CSS
/server                 Node.js/Express REST API — Prisma ORM
/server/prisma          Database schema & seed script
docker-compose.yml      Postgres + API container setup
ecosystem.config.js     PM2 process manager config (bare-metal deploy)
nginx.conf              Reverse proxy config
DEPLOYMENT_LINUX.md     Full Linux server setup guide
SCIENTIST_MANUAL.md     Guide for WIHG scientists
ACCOUNTS_MANUAL.md      Guide for the Accounts/Finance team
```

## Quick start (local development)

```bash
# 1. Backend
cd server
cp .env.example .env        # edit JWT_SECRET, SMTP settings, etc.
npm install
npx prisma migrate dev --name init
npm run seed                 # creates initial Admin/Accounts/Scientist accounts
npm run dev                  # runs on http://localhost:4000

# 2. Frontend (separate terminal)
cd client
npm install
npm run dev                  # runs on http://localhost:5173
```

Default seeded logins (change immediately — see prisma/seed.js and .env):
- Admin: value of `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
- Accounts: `accounts@wihg.res.in` / `ChangeMe123!`
- Sample scientists: `a.sharma@wihg.res.in`, `r.bhattacharya@wihg.res.in`, `s.rawat@wihg.res.in` / `ChangeMe123!`
- Students self-register via the "Student Sign Up" link.

## Core workflows implemented

1. **Public landing page** with programme info and a "Connect with a Scientist" pre-contact email widget (grouped by research discipline).
2. **Application Form**: direct (named scientist) or auto-allocation request.
3. **Scientist approval** (direct path) or **Admin approval + auto-allocation** (unassigned path), locking the mentor once set.
4. **Fee payment upload** (UTR + receipt) → **Accounts verification**, or an **Admin-granted EWS fee waiver** that skips payment.
5. **Physical Joining Form** submission on Day 1, verified by Accounts/Admin.
6. **Certificate Request**: student uploads final report + feedback → **Scientist sign-off** → **Admin one-click PDF generation** with a unique certificate number and an embedded QR code linking to a public `/verify/:certNo` page.
7. **Admin dashboard**: live analytics, application processing queue, CSV export, and staff account creation.

## Production deployment

See `DEPLOYMENT_LINUX.md` for the full Ubuntu/Debian + Nginx + PM2 + Certbot walkthrough, or use `docker-compose.yml` to run PostgreSQL (and optionally the API) in containers.

**Deploying on Render (or any setup where frontend and backend are on different domains):** see `DEPLOYMENT_LINUX.md` §12. The short version — the frontend needs a `VITE_API_URL` environment variable pointing at the backend's URL (set at build time), and the backend needs `CLIENT_ORIGIN` pointing back at the frontend's URL for CORS. Missing either one is the #1 cause of a blank/white home page in production.

## Security notes

- Passwords are hashed with bcrypt; sessions use JWT.
- Role-based access control is enforced server-side on every route, not just hidden in the UI.
- File uploads are restricted by MIME type and size (8MB) and stored outside the web root's direct reach, served only through the API.
- Staff accounts (Scientist/Accounts/Admin) can only be created by an existing Admin — public registration is student-only.
- Rate limiting is applied globally and more strictly on login/registration.
- Change every seeded password before going live, and use a long random `JWT_SECRET`.
