# API Reference

## Role and ownership rules

| Action | SCOUT | ADMIN |
| --- | --- | --- |
| Read players, clubs, history and dashboard | Allowed | Allowed |
| Add/edit/delete players; add injuries, contracts, transfers or valuations | Denied | Allowed |
| Manage users; create/update/delete vectors; rebuild index | Denied | Allowed |
| Create reports | Allowed; author is the session user | Allowed; author is the session user |
| Edit/delete reports or shortlist entries | Own records only | Any record |
| List reports at `/api/reports` | Own records only | All reports from all authors |
| List personal shortlist | Own records only | Own records only |
| Read reports on a player profile | All reports, with author names | All reports, with author names |
| List/edit/delete custom teams | Own teams only | Own teams only |

The Scout Reports page names the **player** being reviewed and separately shows
`Written by <scout name>` with `· Your report` only for the current user's own
reports. Administrators see all authors; scouts see their own reports on this page.
The reports API returns `scope` (`all` or `mine`) and `is_own` for each report.
Seeded demo reports are owned by the
seeded scout accounts. Edit/delete controls require the API's `can_manage` flag;
the mutation route independently checks the signed session against the report
owner under a row lock, and constrains the SQL write to that owner.

Database roles enforce table/column permissions. Application sessions enforce
per-user ownership because scouts share one backend database account. The scout
database account cannot directly update/delete reports; the report mutation API
uses the admin pool only after checking report ownership. The authentication
account can only read the login-related user columns.

## Custom teams

The **Create your team** workspace is available to scouts and administrators.
All team endpoints require a session; saved teams belong to the current user.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/teams` | List your saved teams with players and slot indexes |
| POST | `/api/teams` | Create a personal team |
| PUT | `/api/teams/:id` | Replace your team's name, formation and lineup atomically |
| DELETE | `/api/teams/:id` | Delete your team and its lineup |
| GET | `/api/teams/players?name=&position=` | Search player names and filter natural positions; up to 50 matches |

Create/update accepts `{ "team_name": "My XI", "formation": "4-3-3", "players": [{ "player_id": 1, "slot_index": 0 }] }`.
Supported formations: 4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 3-4-3, 5-3-2.
Slots 0–10 are starters (goalkeeper first, then defensive through attacking rows,
left to right); slots 11–17 are substitutes. Partial and empty lineups may be saved.
Repeated players or slots are rejected with 400. Missing or other users' teams
return 404 for updates/deletes. Failed lineup writes roll back the entire update.

Existing installations: run `npm run db:migrate`, then
`npx tsx src/scripts/provision-team-access.ts` to grant only the new tables to the
existing scout role. New installations use the regular provisioning workflow.
Run `npx tsx src/scripts/test-teams.ts` against the development server (default
`http://localhost:3000`, override with `TEST_BASE_URL`) to verify the feature.

## Similarity engine choice and Qdrant CRUD

Qdrant mode returns exactly two distinct other players, tagged `match_type`:
`closest` (highest cosine similarity) and `most_different` (lowest cosine
similarity among the remaining players). Both use exact Qdrant queries, excluding
the target; the second query uses the negated target vector and excludes the
closest result. Its score is inverted back before displaying similarity.
`samePosition=true` applies to both results. Qdrant mode ignores the requested
result count and returns 422 when fewer than two other eligible points exist.
"Most different" is relative to the available index, not a guarantee of a
completely opposite style. SQL mode retains its existing ranked-list behavior.

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
