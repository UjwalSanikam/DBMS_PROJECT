# ScoutIQ

Football scouting and recruitment intelligence platform.

This repository contains a Phase 1 implementation: a Next.js app (App Router)
with role-based authentication, a pooled MySQL connection, DB migrations and
seed scripts, basic player APIs, and several frontend pages for admin and
scout workflows.

Status: Ready for local development — migrations, seed scripts, auth, and
core pages are implemented. Additional data models and advanced features are
planned (see "Future work").

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- MySQL via `mysql2`
- Auth: `bcryptjs` for password hashing and `jose` for JWT handling
- Validation: `zod`

See [package.json](package.json) for exact dependency versions and scripts.

## Quick start

1. Install dependencies

```bash
npm install
```

2. Create a copy of environment file and edit values

```bash
cp .env.example .env
# set DB connection, AUTH_SECRET, and optional SEED_ADMIN_* variables
```

3. Create the database if needed

```sql
CREATE DATABASE scoutiq CHARACTER SET utf8mb4;
```

4. Run migrations and seeds

```bash
npm run db:migrate
npm run db:seed-admin   # creates/updates the ADMIN user
npm run db:seed-football   # seed football-related sample data
```

5. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000 and sign in via `/login`.

## Important scripts

- `npm run db:migrate` — runs `src/scripts/migrate.ts` to apply SQL files in
  `src/db/migrations/`.
- `npm run db:seed-admin` — seeds or updates an ADMIN user (uses
  `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars when present).
- `npm run db:seed-football` — seeds sample football data for development.

## Key files and locations

- DB migrations: `src/db/migrations/001_create_users.sql`,
  `src/db/migrations/002_create_core_football_entities.sql`
- Migration runner: `src/scripts/migrate.ts`
- DB helpers: `src/lib/db.ts`
- Auth/session helpers: `src/lib/auth.ts`, `src/lib/session.ts`
- API routes: `src/app/api/auth/*`, `src/app/api/players/route.ts`,
  `src/app/api/admin/users/route.ts`
- Frontend app shell & pages: `src/app/(app)/` (dashboard, players, compare,
  shortlist, reports) and `src/app/login/` (login form/page)

Inspect these first when picking up work locally. The most relevant starting
files are `src/lib/db.ts`, `src/lib/auth.ts`, `src/scripts/migrate.ts`, and
`src/app/api/auth/login/route.ts`.

## Auth & security notes

- Passwords: hashed with `bcryptjs` before storage.
- Sessions: JWTs signed via `jose` and stored in an `httpOnly` cookie.
- `middleware.ts` provides edge-level route protection by role; API routes
  perform server-side role checks as well.

## What has been implemented

- Project scaffolding using Next.js App Router and TypeScript.
- Pooled MySQL connection and basic query helpers.
- DB migrations and seed scripts for users and football entities.
- Admin user seed script and UI for creating users.
- Auth endpoints: login, logout, current user (`/api/auth/*`).
- Players API and players table UI.

## Next steps / TODOs

- Expand the data model: `PLAYER_STATISTICS`, `INJURY`, `CONTRACT`, etc.
- Add player detail pages and comparison views.
- Implement Qdrant vector indexing for similarity search.
- Add tests and CI (linting and migration checks).

## Contributing / pushing changes

This repo is configured for local Git. To push changes to your remote
repository, set the `origin` remote and push the current branch:

```bash
git remote add origin https://github.com/UjwalSanikam/DBMS_PROJECT.git
git push -u origin $(git rev-parse --abbrev-ref HEAD)
```

If `origin` already exists and points elsewhere, update it first with
`git remote set-url origin <url>`.

---

If you want, I can run the migrations and push this README change to the
GitHub repo you provided. Reply to confirm and (if needed) provide any SSH
or token instructions if the push requires authentication beyond HTTPS.
