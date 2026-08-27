# ScoutIQ

ScoutIQ is a scouting and recruitment intelligence platform for football
teams and scouts. It provides tools to manage player records, perform
comparisons, track contracts/injuries, and run similarity searches over
player data (vector indexing). This repository contains an initial Phase 1
implementation built with Next.js (App Router) and MySQL-backed data stores.

Contents: a role-based auth system, DB migrations and seeders, REST-like API
endpoints for players and admin, and a frontend with core scout/admin views.

## Table of contents

- Project overview
- Architecture & key technologies
- Getting started (local development)
- Environment variables
- Database: migrations & seeds
- Important scripts
- API & frontend summary
- Development notes and troubleshooting
- Contributing and pushing
- License

## Project overview

The app implements the core pieces required to bootstrap a scouting tool:

- User accounts with roles (admin, scout) and JWT-based session cookies.
- Player entities, basic stats, contracts, injury records, and scout reports.
- Admin pages for user management and basic data seeding utilities.
- A similarity/vector index integration (Qdrant client hooks) and scripts to
  rebuild vectors from DB data.

This is intended as a developer-focused repo for rapid iteration and local
testing; production hardening and deployment automation are not included.

## Architecture & key technologies

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 for styling
- MySQL (via `mysql2`) for primary relational storage
- Auth: `bcryptjs` for password hashing and `jose` for signing JWTs
- Validation: `zod`
- Vector index: Qdrant (client present; vector rebuild script included)

See [package.json](package.json) for exact dependency versions.

## Getting started (local development)

Prerequisites:

- Node.js 20+ and npm
- A MySQL server accessible locally or remotely

1. Install dependencies

```bash
npm install
```

2. Copy environment template and edit values

```bash
cp .env.example .env
# Edit values: DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE, AUTH_SECRET, etc.
```

3. Create the database (example)

```sql
CREATE DATABASE scoutiq CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

4. Run migrations and seed admin + sample data

```bash
npm run db:migrate
npm run db:seed-admin
npm run db:seed-football
```

5. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000 and sign in via the login page (`/login`).

## Environment variables

- `DB_HOST` — MySQL host (defaults may be `localhost`).
- `DB_PORT` — MySQL port (usually `3306`).
- `DB_USER` — Database user.
- `DB_PASSWORD` — Database password.
- `DB_DATABASE` — Database name (e.g., `scoutiq`).
- `AUTH_SECRET` — Secret used to sign JWTs.
- `QDRANT_URL` — Optional: Qdrant endpoint for vector indexing.
- `QDRANT_API_KEY` — Optional: key for Qdrant if configured.
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — Optional credentials used
  by the admin seed script.

Adjust `.env` as needed before running migrations/seeds.

## Database: migrations & seeds

- Migration SQL files live in `src/db/migrations/`. The migration runner
  (`src/scripts/migrate.ts`) applies files in lexicographic order.
- Seed scripts are available in `src/scripts/` and include admin and sample
  football data seeds.

Common commands:

- `npm run db:migrate` — apply DB migrations.
- `npm run db:seed-admin` — create or update the ADMIN user from env vars.
- `npm run db:seed-football` — seed sample clubs/players/contracts/etc.

If you change the DB schema, add a new SQL file in
`src/db/migrations/` with a sequential prefix (e.g. `015_my_change.sql`).

## Important scripts

From `package.json`:

- `dev` — `next dev` (start development server)
- `build` — `next build` (build production assets)
- `start` — `next start` (start production server)
- `lint` — run ESLint
- `db:migrate` — runs `src/scripts/migrate.ts`
- `db:seed-admin` — runs `src/scripts/seed-admin.ts`
- `db:seed-football` — runs `src/scripts/seed-football.ts`
- `db:seed-recruitment` — additional recruitment-specific seed
- `rebuild-vectors` — rebuilds Qdrant vectors from DB data

Use `npm run <script>` to run each helper.

## API & frontend summary

- API routes are implemented under `src/app/api/` using Next.js route handlers.
  Examples:
  - `src/app/api/auth/login/route.ts` — login
  - `src/app/api/auth/logout/route.ts` — logout
  - `src/app/api/auth/me/route.ts` — current user
  - `src/app/api/players/route.ts` — players list
  - `src/app/api/players/[id]/route.ts` — per-player subroutes

- The main app UI is located in `src/app/(app)/` and includes dashboard,
  players, comparison, shortlist and reports pages.

## Development notes and troubleshooting

- If migrations fail, inspect `src/db/migrations/` SQL files for ordering
  or SQL errors. The migration script executes files in filename order.
- For DB connection issues, validate the `.env` values and that MySQL is
  reachable from your environment.
- If push/pull from GitHub requires authentication, configure a remote
  using HTTPS with a personal access token or set up SSH keys.

Common troubleshooting commands:

```bash
# check repo status
git status
# view remotes
git remote -v
```

## Contributing & pushing changes

- Work on feature branches, commit logically, and open a PR for review.
- To push your current branch to GitHub (example HTTPS remote):

```bash
git remote add origin https://github.com/UjwalSanikam/DBMS_PROJECT.git
git push -u origin $(git rev-parse --abbrev-ref HEAD)
```

- If `origin` already exists and needs updating:

```bash
git remote set-url origin <url>
```

Note: pushing to a remote may require credentials. For CI-friendly
workflows prefer using SSH keys or a GitHub personal access token.

## Deployment

This repo is not prescriptive about hosting. For production deploys, build
the Next.js app (`npm run build`) and host using a Node process or a
platform with Next.js support (Vercel, Fly, Render, etc.). Ensure your DB
and Qdrant endpoints are accessible from the host and env vars are set.

## License

This project does not include a license file. Add a `LICENSE` file to make
licensing clear for contributors and users.

---

If you want, I can commit this README change and push it to your configured
GitHub remote. Reply to confirm and provide the remote URL if you'd like
me to set or change it before pushing.
