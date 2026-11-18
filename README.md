# ScoutIQ

Football scouting and recruitment intelligence for the DBMS Level 3 miniproject.

| Student | SRN | Responsibility allocation |
| --- | --- | --- |
| Ujwal Sanikam | PES1UG24CS506 | 50% - relational design, SQL migrations, advanced SQL, integrity and database access |
| Ved Mudkavi | PES1UG24CS522 | 50% - Next.js interface, API integration, vector workflows, testing and report assembly |

This is the team's requested responsibility allocation. Each student should be ready to explain and modify their assigned parts in the viva.

## Submission files

- [Project report](docs/PROJECT_REPORT.md)
- [Formatted PDF report](output/pdf/ScoutIQ_DBMS_Project_Report.pdf)
- [Evaluation traceability](docs/REQUIREMENTS_TRACEABILITY.md)
- [Executed test results](docs/TESTING.md)
- [Machine-readable integration evidence](docs/evidence/integration-results.json)
- [ER diagram](docs/ER_DIAGRAM.png), [editable diagram](docs/ER_DIAGRAM.svg)
- [Relational schema](docs/RELATIONAL_SCHEMA.md), [data dictionary](docs/DATA_DICTIONARY.md)
- [Demo and viva guide](docs/DEMO_GUIDE.md)

## Features and stack

Next.js 16.3.3 App Router, React 19, TypeScript, Tailwind CSS 4, MySQL 8, Qdrant, mysql2, Zod, bcryptjs and jose.

- ADMIN and SCOUT sessions with signed, expiring HTTP-only cookies.
- Player search, profiles, comparison, dashboards, reports and personal shortlists.
- APIs for injuries, contracts, transfers and valuations.
- Foreign keys, unique and CHECK constraints, six views, four triggers, two transactional procedures, a CTE/window ranking and a scheduled event.
- Ten-dimensional cosine similarity with position filtering, administrator refresh/deletion and stale-vector cleanup.
- Separate MySQL ADMIN, SCOUT and AUTH roles/accounts. Runtime users have no DDL grants. Scout ownership checks are enforced by APIs in addition to table-level database privileges.

## Fast local setup on Windows

Prerequisites: Node.js 22 or later, npm, and MySQL Server 8 installed. The default MySQL binary path is `C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqld.exe`; set `MYSQLD_PATH` if yours differs.

```powershell
npm ci
npm run setup:local
npm run dev
```

The setup command creates an isolated, local-only MySQL instance at `127.0.0.1:3307` under ignored `.runtime/mysql/`. It preserves an existing `.env` in `.runtime/mysql/original.env` before configuring local services. It does not change the installed MySQL service on port 3306. Generated passwords stay in ignored `.env`.

The command downloads the official Qdrant 1.20.2 Windows executable into ignored `.runtime/qdrant/`, starts it on `127.0.0.1:6333`, applies all 19 migrations, provisions MySQL roles, seeds a fictional demo dataset and builds the vector index. Existing player/statistics datasets are preserved when setup is repeated. On a new installation the seed produces 40 players; the reviewed local demo has 80 players.

Open http://localhost:3000 and use `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` from your own `.env`. Demo Scout emails are in `src/scripts/seed-recruitment.ts`; use your local `SEED_SCOUT_PASSWORD`. Never display `.env` during the demo.

After restarting the computer:

```powershell
npm run services:start
npm run dev
```

## Manual setup with an existing MySQL instance

For another operating system or an existing server, copy `.env.example` to `.env`. Supply real local values for all documented names. `MYSQL_ROOT_USER` and `MYSQL_ROOT_PASSWORD` are used only by provisioning, migrations and the integration test harness. The application uses the separate runtime accounts.

Start Qdrant using Docker when available:

```bash
docker run --name scoutiq-qdrant -p 127.0.0.1:6333:6333 -p 127.0.0.1:6334:6334 qdrant/qdrant:v1.20.2
npm run db:create
npm run db:migrate
npm run db:provision
npm run db:seed-admin
npm run db:seed-football
npm run db:seed-recruitment
npm run rebuild-vectors
npm run dev
```

Grant provisioning is for local database accounts at `localhost`. For a remote database, adapt account hosts deliberately before provisioning. Enable MySQL's `event_scheduler` as administrator if your server disables it. The contract-expiry view also filters expired dates independently of the event.

## Environment variables

| Names | Purpose |
| --- | --- |
| MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE | MySQL endpoint and schema |
| MYSQL_USER, MYSQL_PASSWORD | Dedicated migration/seed account |
| MYSQL_ROOT_USER, MYSQL_ROOT_PASSWORD | Administrator for setup and verification |
| MYSQL_ADMIN_USER, MYSQL_ADMIN_PASSWORD | Runtime domain/user administration account |
| MYSQL_SCOUT_USER, MYSQL_SCOUT_PASSWORD | Runtime scouting account with restricted grants |
| MYSQL_AUTH_USER, MYSQL_AUTH_PASSWORD | Login lookup account with column-level read privileges |
| QDRANT_URL, QDRANT_API_KEY | Vector endpoint; key optional for local-only service |
| AUTH_SECRET | JWT signing secret |
| SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD | Demo administrator |
| SEED_SCOUT_PASSWORD | Demo Scout password |
| TEST_BASE_URL | Integration test URL, default http://localhost:3100 |

## Verification

```powershell
npm run lint
npx tsc --noEmit
npm run build
# In another terminal, run npm run dev -- --port 3100
npm run test:integration
```

The default build and dev commands explicitly use webpack because Turbopack's CSS worker could not start in the reviewed Windows environment. The optimized production build is verified with `npm run build`.

The integration harness uses temporary fixtures and a generated `scoutiq_verify_*` database. It removes these in cleanup. It requires administrator credentials to create the temporary schema and rollback-test trigger. The harness tests API operations, MySQL integrity and grants, fresh/repeated migrations, procedure rollback, vector read/update/delete, stale cleanup and multi-club aggregation. Results are written to `docs/evidence/integration-results.json`.

## Vector demonstration

1. Open an indexed player's profile and select **Find Similar Players**.
2. Enable **Same position only** and repeat the query.
3. As Admin, select **Remove player from similarity search**; retrieval explains the missing vector.
4. Select **Refresh similarity index** to restore eligible players and remove stale IDs.

Statistics are aggregated per player and season across clubs. Nine per-90 metrics plus pass accuracy are standardized with z-scores. Qdrant uses cosine distance; payload includes player ID, name, position, club and season. The displayed percentage is a rescaled cosine score, not a probability or prediction of player quality.

## Repository and submission

Canonical migrations are `src/db/migrations/001-019`. Root SQL dumps and the separate `db/migrations` directory are historical snapshots, not setup inputs. The report and source ZIP exclude local `.env`, runtime state, dependencies, build output, backups and temporary artifacts. Install dependencies with the checked-in lockfile.

Repository: https://github.com/UjwalSanikam/DBMS_PROJECT

Technical evidence supports submission preparation. Originality, title uniqueness, individual understanding and the live viva remain the team's responsibility. No grade is predicted.
