# Testing Plan and Results

## Evidence policy

This file separates planned checks from completed evidence. Do not mark a test
`PASS` until it has been executed against the final submitted version. Add the
date, tester, and short evidence note for every completed test.

Current overall status: **NOT YET EXECUTED ON THIS CHECKOUT**.

## Environment record

Complete this table during final verification.

| Item | Tested value |
| --- | --- |
| Test date | Pending |
| Tester(s) | Pending |
| Operating system | Pending |
| Node.js version | Pending |
| npm version | Pending |
| MySQL version | Pending |
| Qdrant version | Pending |
| Browser | Pending |
| Git revision / ZIP version | Pending |

## Build and setup tests

| ID | Test | Expected result | Status/evidence |
| --- | --- | --- | --- |
| SET-01 | Run `npm install` in a clean checkout | Dependencies install without an unresolved package error | Pending |
| SET-02 | Copy `.env.example` and supply local values | Every required variable is documented and accepted | Pending |
| SET-03 | Run migrations on an empty `scoutiq` database | Migrations 001-017 apply and appear in `schema_migrations` | Pending |
| SET-04 | Run migrations a second time | Every migration is skipped; schema is unchanged | Pending |
| SET-05 | Run all seed commands | Admin and demonstration football/recruitment records exist | Pending |
| SET-06 | Run `npm run lint` | No ESLint errors | Pending |
| SET-07 | Run `npm run build` | Production build completes | Pending |
| SET-08 | Run `npm run dev` | Application opens at `http://localhost:3000` | Pending |

## Authentication and authorization tests

| ID | Test | Expected result | Status/evidence |
| --- | --- | --- | --- |
| AUTH-01 | Sign in with the configured admin account | Dashboard opens and session cookie is set | Pending |
| AUTH-02 | Sign in with an invalid password | Generic invalid-credentials response; no account information leak | Pending |
| AUTH-03 | Open a protected page without a session | Redirect to `/login` | Pending |
| AUTH-04 | Create a Scout account as Admin | User is inserted with a bcrypt hash | Pending |
| AUTH-05 | Attempt the admin-users API as Scout | HTTP 403 | Pending |
| AUTH-06 | Sign out | Cookie is removed and protected pages require login | Pending |

## Database integrity tests

Run these against disposable test records.

| ID | Test | Expected result | Status/evidence |
| --- | --- | --- | --- |
| DB-01 | Insert a player with `height_cm=100` | Rejected by check constraint | Pending |
| DB-02 | Insert statistics with starts greater than appearances | Rejected by check constraint | Pending |
| DB-03 | Insert pass accuracy greater than 100 | Rejected by check constraint | Pending |
| DB-04 | Insert an injury return date before injury date | Rejected by check/trigger | Pending |
| DB-05 | Insert a contract whose end date precedes start date | Rejected by check/trigger | Pending |
| DB-06 | Insert a negative salary or release clause | Rejected by check/trigger | Pending |
| DB-07 | Insert duplicate email | Rejected by unique constraint | Pending |
| DB-08 | Add the same player twice to one scout's shortlist | Upsert or unique-key enforcement prevents duplicate rows | Pending |
| DB-09 | Delete a league referenced by a club | Rejected by foreign-key restriction | Pending |
| DB-10 | Delete a test player | Dependent test histories cascade as designed | Pending |

Representative negative test:

```sql
INSERT INTO injury (
  player_id, injury_type, body_area, injury_date,
  expected_return_date, severity, status
)
VALUES (
  <existing_player_id>, 'Test injury', 'Leg', '2026-09-10',
  '2026-09-01', 'MINOR', 'ACTIVE'
);
```

Expected result: SQLSTATE `45000` or the corresponding check-constraint error.

## CRUD and query tests

| ID | Test | Expected result | Status/evidence |
| --- | --- | --- | --- |
| CRUD-01 | Open player list | Players and joined club/league data load | Pending |
| CRUD-02 | Combine position, age, statistics, value, and availability filters | Only matching players are returned | Pending |
| CRUD-03 | Open player details | Related histories appear in date order | Pending |
| CRUD-04 | Admin records injury, contract, transfer, and valuation | Valid rows are inserted |
| CRUD-05 | Scout creates a report with `SHORTLIST` | Report and shortlist update occur atomically | Pending |
| CRUD-06 | Update shortlist priority/status/reason | Only owner or Admin can update | Pending |
| CRUD-07 | Delete shortlist entry | Row is removed and API confirms deletion | Pending |
| CRUD-08 | Compare two or more player IDs | Joined and aggregated comparison data loads | Pending |
| CRUD-09 | Open dashboard | Counts, recent records, expiry and injury alerts, and top targets load | Pending |

## Transaction tests

| ID | Test | Expected result | Status/evidence |
| --- | --- | --- | --- |
| TX-01 | Call `sp_record_transfer` with valid data | Transfer inserted, old membership closed, new membership opened | Pending |
| TX-02 | Force a failure during `sp_record_transfer` | No partial transfer or membership update remains | Pending |
| TX-03 | Call `sp_add_scout_recommendation` with `PRIORITY` | Report inserted and high-priority shortlist row created/updated | Pending |
| TX-04 | Force a failure during recommendation | Neither half of the workflow is committed | Pending |

## View, index, procedure, trigger, and event evidence

Use these commands during the database demonstration:

```sql
SHOW FULL TABLES WHERE Table_type = 'VIEW';
SHOW INDEX FROM player_statistics;
SHOW TRIGGERS;
SHOW PROCEDURE STATUS WHERE Db = 'scoutiq';
SHOW EVENTS FROM scoutiq;
SELECT * FROM vw_player_recruitment_snapshot LIMIT 10;
EXPLAIN SELECT * FROM player_statistics
WHERE player_id = 1 AND season = '2025-2026';
```

| ID | Expected evidence | Status/evidence |
| --- | --- | --- |
| ADV-01 | Five recruitment views are present | Pending |
| ADV-02 | Expected player/statistics/contract/report indexes are present | Pending |
| ADV-03 | Four active validation triggers remain after migration 017 | Pending |
| ADV-04 | Two stored procedures are present | Pending |
| ADV-05 | Contract-expiry event exists; scheduler state is recorded | Pending |
| ADV-06 | `EXPLAIN` shows the appropriate player-season index | Pending |

## Qdrant tests

| ID | Test | Expected result | Status/evidence |
| --- | --- | --- | --- |
| VEC-01 | Confirm Qdrant health at configured URL | Qdrant responds | Pending |
| VEC-02 | Run `npm run rebuild-vectors` | `player_profiles` is created and eligible points are upserted | Pending |
| VEC-03 | Inspect collection | Vector size is 10 and distance is cosine | Pending |
| VEC-04 | Request similar players | Target is excluded and nearest players are returned | Pending |
| VEC-05 | Enable same-position filter | Every returned player has the target position | Pending |
| VEC-06 | Request player below 450 minutes or not indexed | Clear 404-style explanation is returned | Pending |

## Final result summary

Complete after execution:

| Category | Passed | Failed | Blocked |
| --- | ---: | ---: | ---: |
| Setup/build | 0 | 0 | 8 pending |
| Authentication | 0 | 0 | 6 pending |
| Database integrity | 0 | 0 | 10 pending |
| CRUD/queries | 0 | 0 | 9 pending |
| Transactions | 0 | 0 | 4 pending |
| Advanced SQL | 0 | 0 | 6 pending |
| Vector search | 0 | 0 | 6 pending |

Do not submit this table with pending counts. Replace it with the actual final
totals and explain every failed or blocked test.
