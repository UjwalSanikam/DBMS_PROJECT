# ScoutIQ

ScoutIQ is a database-driven football scouting and recruitment intelligence
platform. It helps scouts identify players, compare performance, monitor
contracts and injuries, write scouting reports, manage shortlists, and find
statistically similar players.

The project was developed for the DBMS Experiential Learning Level 3 project.
It deliberately goes beyond basic CRUD by combining a relational database,
advanced SQL features, role-based workflows, analytics, and vector similarity
search in a functional web application.

## Team

- Ujwal Sanikam
- Ved Mudkavi

Course, section, USN, and instructor details should be added to
[`docs/PROJECT_REPORT.md`](docs/PROJECT_REPORT.md) before submission.

## Main capabilities

- `ADMIN` and `SCOUT` authentication with hashed passwords and JWT cookies
- Player search with football, performance, contract, valuation, and injury filters
- Detailed player profiles and season statistics
- Player comparison dashboard
- Scout reports and personal shortlists
- Contract, transfer, injury, and market-value management
- Recruitment dashboards using joins, aggregation, views, and subqueries
- Similar-player retrieval using normalized feature vectors stored in Qdrant
- MySQL constraints, indexes, triggers, stored procedures, transactions, and an event

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 |
| Backend/API | Next.js Route Handlers |
| Relational database | MySQL through `mysql2` |
| Vector database | Qdrant through `@qdrant/js-client-rest` |
| Authentication | `bcryptjs`, `jose`, HTTP-only JWT cookie |
| Validation | Zod plus MySQL constraints and triggers |

The exact package versions are defined in [`package.json`](package.json).

## Project documentation

- [Project report](docs/PROJECT_REPORT.md)
- [Requirements traceability](docs/REQUIREMENTS_TRACEABILITY.md)
- [ER diagram](docs/ER_DIAGRAM.md)
- [Relational schema](docs/RELATIONAL_SCHEMA.md)
- [Data dictionary](docs/DATA_DICTIONARY.md)
- [System architecture](docs/ARCHITECTURE.md)
- [Important database queries](docs/IMPORTANT_QUERIES.md)
- [API reference](docs/API_REFERENCE.md)
- [Testing plan and results](docs/TESTING.md)
- [Final demonstration guide](docs/DEMO_GUIDE.md)

## Prerequisites

- Node.js 20 or later
- npm
- MySQL 8 or later
- Qdrant, required for the similar-player feature

The application can run without a Qdrant API key when Qdrant is hosted locally.

## Local setup

### 1. Install dependencies

```bash
npm install
```

`next-env.d.ts` is generated automatically by Next.js. Do not create or edit it
manually.

### 2. Create the MySQL database and application user

Sign in to MySQL using an administrative account and run:

```sql
CREATE DATABASE IF NOT EXISTS scoutiq
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

CREATE USER IF NOT EXISTS 'scoutiq_app'@'localhost'
  IDENTIFIED BY 'replace_with_mysql_password';

GRANT ALL PRIVILEGES ON scoutiq.* TO 'scoutiq_app'@'localhost';
FLUSH PRIVILEGES;
```

Use your actual local password instead of the placeholder. Do not place a real
password in a tracked file.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set the following names exactly:

| Variable | Required | Purpose |
| --- | --- | --- |
| `MYSQL_HOST` | Yes | MySQL server host |
| `MYSQL_PORT` | Yes | MySQL port, normally `3306` |
| `MYSQL_DATABASE` | Yes | Database name, normally `scoutiq` |
| `MYSQL_USER` | Yes | Application database user |
| `MYSQL_PASSWORD` | Yes | Application database password |
| `QDRANT_URL` | For similarity search | Qdrant endpoint, normally `http://localhost:6333` |
| `QDRANT_API_KEY` | Hosted Qdrant only | Qdrant authentication key |
| `AUTH_SECRET` | Yes | Secret used to sign session tokens |
| `SEED_ADMIN_NAME` | Optional | Initial administrator name |
| `SEED_ADMIN_EMAIL` | Optional | Initial administrator email |
| `SEED_ADMIN_PASSWORD` | Recommended | Initial administrator password |

Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

`.env` is ignored by Git. `.env.example` contains documentation placeholders
only and is safe to include in the submission ZIP.

### 4. Start Qdrant

Run a local Qdrant server and confirm that it is available at the URL in
`QDRANT_URL`. One Docker-based option is:

```bash
docker run --name scoutiq-qdrant -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

If the container already exists, start it with:

```bash
docker start scoutiq-qdrant
```

### 5. Apply the database migrations

```bash
npm run db:migrate
```

The migration runner reads only `src/db/migrations/*.sql`, in filename order,
and records completed files in `schema_migrations`. This directory is the
canonical database schema source. Root-level dumps are snapshots/reference
files, not the normal setup path.

The contract-expiry event requires the MySQL event scheduler. Check it with:

```sql
SHOW VARIABLES LIKE 'event_scheduler';
```

For a local demonstration, an administrator can enable it with:

```sql
SET GLOBAL event_scheduler = ON;
```

The views also exclude expired contracts defensively, so player search remains
correct even when the event scheduler is unavailable.

### 6. Seed demonstration data

```bash
npm run db:seed-admin
npm run db:seed-football
npm run db:seed-recruitment
```

For the larger Transfermarkt-derived sample dataset, use:

```bash
npm run import-transfermarkt
```

The import script reads the CSV files in `data-import/`.

### 7. Build the vector index

After player statistics have been seeded or imported:

```bash
npm run rebuild-vectors
```

This creates the Qdrant collection `player_profiles` and stores one normalized
10-dimensional playing-style vector per eligible player. Players require at
least 450 minutes in season `2025-2026` to be included.

### 8. Run the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in using the
administrator credentials configured in `.env`.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run a completed production build |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Apply pending MySQL migrations |
| `npm run db:seed-admin` | Create or update the initial admin user |
| `npm run db:seed-football` | Insert core sample football records |
| `npm run db:seed-recruitment` | Insert recruitment workflow samples |
| `npm run import-transfermarkt` | Import the supplied filtered CSV data |
| `npm run rebuild-vectors` | Rebuild the Qdrant player-vector collection |

## Main pages

| Route | Purpose |
| --- | --- |
| `/login` | Authentication |
| `/dashboard` | Recruitment summaries and alerts |
| `/players` | Search and filter player records |
| `/players/[id]` | Player profile and related history |
| `/compare` | Side-by-side player comparison |
| `/shortlist` | Scout-specific recruitment shortlist |
| `/reports` | Scouting report history |
| `/admin/users` | Administrator user management |

## Security and integrity

- Passwords are hashed using bcrypt before storage.
- Authentication tokens are signed using `AUTH_SECRET` and stored in HTTP-only cookies.
- Protected routes validate the session; administrator operations also validate the role.
- SQL input is passed using parameterized placeholders.
- Zod validates request data before database operations.
- Foreign keys, unique constraints, check constraints, triggers, and transactions protect database integrity.
- Real credentials belong only in `.env` and must not be included in the ZIP.

## Submission ZIP checklist

Before creating the final ZIP:

1. Complete all placeholders in `docs/PROJECT_REPORT.md` and `docs/TESTING.md`.
2. Add final application screenshots under `docs/screenshots/` and reference them from the report.
3. Run all test steps in `docs/TESTING.md` and record the actual results.
4. Confirm that `.env`, `.next/`, `node_modules/`, and database credentials are excluded.
5. Include `.env.example`, source code, migrations, documentation, and any permitted sample data.
6. Extract the ZIP into a clean folder and repeat the setup instructions once before submission.

## Troubleshooting

- **MySQL access denied:** confirm the `MYSQL_*` values and the grant for `scoutiq_app`.
- **Unknown database:** create `scoutiq` before running migrations.
- **Qdrant connection refused:** start Qdrant and confirm `QDRANT_URL`.
- **No similar players:** seed/import statistics, ensure players have at least 450 minutes, then run `npm run rebuild-vectors`.
- **Migration already applied:** the runner skips filenames recorded in `schema_migrations`.
- **Scheduled contract expiry does not run:** enable MySQL's `event_scheduler`, or demonstrate the defensive expiry view.

## Scope limitations and future work

ScoutIQ is an academic prototype. It does not provide live match feeds,
automated data licensing, production deployment, payment processing, or club
communication. Proposed extensions include multi-season vector indexes,
position-specific feature weighting, richer audit history, notifications, and
production monitoring.
