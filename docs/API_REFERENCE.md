# API Reference

## Similarity engine choice and Qdrant CRUD

`GET /api/players/:id/similar?engine=qdrant|sql&samePosition=true&limit=5`
supports two explicit engines (default: `qdrant`). Qdrant searches indexed
vectors. SQL mode reads aggregated current-season statistics from MySQL and
performs exact cosine comparison in the Next.js server; it does not require
Qdrant. Both use ten z-score-normalized features and a 450-minute threshold.
Scores are rescaled cosine values, not probabilities. SQL mode sees current
statistics; Qdrant sees its most recent index update.

Per-player Qdrant endpoints at `/api/players/:id/vector`:

| Method | Access | Operation |
| --- | --- | --- |
| GET | Signed-in user | Read stored vector and payload; 404 if absent |
| POST | ADMIN | Create from current MySQL statistics; 409 if already present |
| PUT | ADMIN | Replace vector and metadata from current MySQL statistics; 404 if absent |
| DELETE | ADMIN | Delete the Qdrant point, preserving the SQL player |

Create/update return 422 for players without eligible statistics. These controls
appear under **Similar players → Qdrant vectors** on the player detail page.
A full index refresh can recreate deleted eligible points. Use a full refresh
after changing population statistics so every stored point shares the same
normalization. These operations manage derived player profiles, not relational
contracts, injuries, or reports.

All endpoints return JSON. Except for login, logout, and current-session lookup,
application endpoints require a valid ScoutIQ session cookie. Write operations
return `400` for invalid input, `401` for missing authentication, `403` for an
insufficient role/ownership, and `500` for unexpected failures.

## Authentication

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Public | Verify email/password and set the session cookie |
| POST | `/api/auth/logout` | Public | Clear the session cookie |
| GET | `/api/auth/me` | Public response | Return the user or `null` based on the cookie |

Login body:

```json
{
  "email": "admin@example.invalid",
  "password": "example-only"
}
```

## Administration

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/admin/users` | ADMIN | List users without password hashes |
| POST | `/api/admin/users` | ADMIN | Create an admin or scout account |

## Players and analytics

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/players` | Authenticated | Search and filter players |
| GET | `/api/players/[id]` | Authenticated | Player profile and related history |
| GET | `/api/players/compare?ids=1,2` | Authenticated | Compare selected players |
| GET | `/api/players/[id]/similar` | Authenticated | Retrieve nearest vector neighbors |
| GET | `/api/dashboard` | Authenticated | Dashboard aggregates and alerts |

Player-search parameters:

- Identity: `name`, `position`, `nationality`, `preferredFoot`, `club`, `league`
- Age: `ageMin`, `ageMax`
- Performance: `minAppearances`, `minMinutes`, `minGoals`, `minAssists`,
  `minXg`, `minXa`, `minPassAccuracy`, `minKeyPasses`, `minTackles`,
  `minInterceptions`
- Recruitment: `maxMarketValue`, `contractExpiresBefore`, `maxContractMonths`
- Fitness: `availableOnly`, `injurySeverity`, `maxInjuryCount`

Similarity parameters: `samePosition=true|false` and `limit`.

## Player history writes

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/players/[id]/injuries` | Authenticated | List injury history |
| POST | `/api/players/[id]/injuries` | ADMIN | Insert an injury |
| GET | `/api/players/[id]/contracts` | Authenticated | List contracts |
| POST | `/api/players/[id]/contracts` | ADMIN | Lock the player, expire the previous active contract and insert its replacement atomically |
| GET | `/api/players/[id]/transfers` | Authenticated | List transfers |
| POST | `/api/players/[id]/transfers` | ADMIN | Call the transactional transfer procedure |
| GET | `/api/players/[id]/valuations` | Authenticated | List market values |
| POST | `/api/players/[id]/valuations` | ADMIN | Insert or update a dated valuation |
| GET | `/api/players/[id]/reports` | Authenticated | List reports for a player |
| POST | `/api/players/[id]/reports` | ADMIN or SCOUT | Call the transactional recommendation procedure |

## Reports and shortlists

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/reports` | Authenticated | List reports visible to the signed-in user |
| GET | `/api/shortlist` | Authenticated | List the user's shortlist; optional `status` filter |
| POST | `/api/shortlist` | ADMIN or SCOUT | Add a personal shortlist entry; return 409 for a duplicate |
| PATCH | `/api/shortlist/[id]` | Owner or ADMIN | Change priority, status, or reason |
| DELETE | `/api/shortlist/[id]` | Owner or ADMIN | Remove a shortlist entry |

## Frontend management additions

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/players` | ADMIN | Create a player profile |
| PATCH | `/api/players/[id]` | ADMIN | Save the complete editable identity profile |
| DELETE | `/api/players/[id]` | ADMIN | Delete a player and dependent records; attempt Qdrant cleanup |
| GET | `/api/clubs` | Authenticated | List club IDs and names |
| PATCH | `/api/reports/[id]` | Owner or ADMIN | Save report fields; atomically synchronize positive recommendations to the shortlist |
| DELETE | `/api/reports/[id]` | Owner or ADMIN | Delete a report, retaining any existing shortlist entry |

Player identity writes validate names, calendar dates, positions, preferred foot and optional height. History writes validate dates, numeric amounts and allowed enum values. See [CRUD_DEMO.md](CRUD_DEMO.md) for the frontend walkthrough.

## Security notes

- Request examples must never contain real passwords or secrets in submitted documentation.
- API clients must use the issued HTTP-only cookie; the role is never trusted from a request body.
- Database query values are parameterized.
- The user-list response never returns `password_hash`.
