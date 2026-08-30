# ScoutIQ

ScoutIQ is a scouting and recruitment intelligence platform for football
teams and scouts. This repository contains a working Phase 1+ implementation
that includes authentication, a relational data model for players and
football entities, a vector-index integration for similarity search, import
and seed scripts, a simple admin UI, and a set of API endpoints and pages to
support core scouting workflows.

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
testing; production hardening, monitoring, and deployment automation are not
included out of the box.

## Architecture & key technologies

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 for styling
- MySQL (via `mysql2`) for primary relational storage
- Auth: `bcryptjs` for password hashing and `jose` for signing JWTs
- Validation: `zod`
- Vector index: Qdrant (client present; vector rebuild script included)

See [package.json](package.json) for exact dependency versions.

## Exhaustive feature list (implemented)

The following features are implemented in this repository. Pick the files
noted below to inspect each feature's implementation.

- Authentication & authorization
  - Role-based users with `ADMIN` and `SCOUT` roles (`src/db/migrations/001_create_users.sql`).
  - Password hashing with `bcryptjs` and JWT session cookies signed with `jose`.
  - Login/logout and current-user endpoints: `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/app/api/auth/me/route.ts`.
  - Edge middleware protection: `src/middleware.ts`.

- Users / Admin
  - Admin user management API: `src/app/api/admin/users/route.ts`.
  - Admin UI for creating users: `src/app/(app)/admin/users/new-user-form.tsx` and admin users page.
  - Seed script to create/update ADMIN user: `src/scripts/seed-admin.ts`.

- Players & football data model
  - Player entities and core football tables via migrations in `src/db/migrations/` (players, clubs, competitions, player statistics, contracts, injuries, transfers, market value history, scout reports, shortlist, views, procedures, and triggers).
  - Player list API: `src/app/api/players/route.ts`.
  - Per-player endpoints for details, contracts, injuries, transfers, valuations, reports: `src/app/api/players/[id]/route.ts`, and subroutes under `src/app/api/players/[id]/*`.
  - Player UI pages and components: `src/app/(app)/players/page.tsx`, `src/app/(app)/players/players-table.tsx`, `src/app/(app)/players/[id]/page.tsx`, `player-photo.tsx`, and `similar-players.tsx`.

- Similarity / vector search
  - Qdrant client helper and integrations: `src/lib/qdrant.ts`, `src/lib/similarity.ts`.
  - Rebuild vectors script: `src/scripts/rebuild-vectors.ts`.
  - API route to fetch similar players: `src/app/api/players/[id]/similar/route.ts`.

- Comparison, shortlist & reports
  - Player comparison API: `src/app/api/players/compare/route.ts` and comparison UI: `src/app/(app)/compare/page.tsx`.
  - Shortlist API and pages: `src/app/api/shortlist/route.ts`, `src/app/api/shortlist/[id]/route.ts`, and `src/app/(app)/shortlist/page.tsx`.
  - Reports API and UI: `src/app/api/reports/route.ts`, `src/app/(app)/reports/page.tsx`.

- Contracts / transfers / valuations / injuries
  - Dedicated per-player endpoints to manage/view contracts, transfers, valuations, and injuries: `src/app/api/players/[id]/contracts/route.ts`, `.../transfers/route.ts`, `.../valuations/route.ts`, `.../injuries/route.ts`.
  - Migration scripts create contract triggers and stored procedures to maintain integrity and expiry events.

- Dashboard & analytics
  - Dashboard API: `src/app/api/dashboard/route.ts` and UI: `src/app/(app)/dashboard/page.tsx`.
  - `src/lib/dashboard.ts` contains helper logic for aggregation queries and view generation.

- Data import and sample datasets
  - Transfermarkt CSV import helper: `src/scripts/import-transfermarkt.ts` and local `data-import/` sample CSV files.
  - Seed scripts for football data and recruitment samples: `src/scripts/seed-football.ts`, `src/scripts/seed-recruitment.ts`.

- Migration tooling
  - Migration runner: `src/scripts/migrate.ts` executes SQL files in `src/db/migrations/` in filename order.

- Misc utilities
  - `src/lib/db.ts` — MySQL pool, parameterized query helpers, and transaction helpers.
  - `src/lib/session.ts` — server-side session read/write helpers.
  - `src/lib/player-detail.ts` — helper to assemble player details for UI/API consumption.

## Files of note (quick index)

- API routes: `src/app/api/**`
- Frontend pages: `src/app/(app)/**` and `src/app/login/**`
- DB migrations: `src/db/migrations/*.sql` (see filenames for full list)
- Scripts: `src/scripts/*.ts` (migrate, seeds, rebuild-vectors, import)
- Library helpers: `src/lib/*.ts`

## Getting started (local development)

Follow the steps in the previous Getting started section (install, copy `.env`, create DB, run migrations, run seeds, start dev server).

## Development notes and troubleshooting

- Importing Transfermarkt CSVs: the import script expects specific CSV columns; inspect `src/scripts/import-transfermarkt.ts` and the sample files in `data-import/`.
- Qdrant: if you plan to use vector search, configure `QDRANT_URL` and `QDRANT_API_KEY` and run `src/scripts/rebuild-vectors.ts` after seeding players.
- If you add migrations, increment the numeric prefix (e.g. `018_add_x.sql`) and run `npm run db:migrate`.

## How I generated this feature list

This README section was generated by scanning implemented routes, scripts,
libraries and SQL migrations found under `src/`. For a more in-depth
walkthrough of any feature, open the file referenced in the index above and
I can extract or expand documentation for that specific area.

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
