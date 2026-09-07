# API Reference

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
| POST | `/api/players/[id]/contracts` | ADMIN | Insert a contract and expire an existing active contract |
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
| POST | `/api/shortlist` | ADMIN or SCOUT | Add or upsert a personal shortlist entry |
| PATCH | `/api/shortlist/[id]` | Owner or ADMIN | Change priority, status, or reason |
| DELETE | `/api/shortlist/[id]` | Owner or ADMIN | Remove a shortlist entry |

## Security notes

- Request examples must never contain real passwords or secrets in submitted documentation.
- API clients must use the issued HTTP-only cookie; the role is never trusted from a request body.
- Database query values are parameterized.
- The user-list response never returns `password_hash`.
