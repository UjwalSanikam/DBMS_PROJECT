# Testing Results

Executed on 18 November 2026 using the final local checkout. Automated execution by Codex; this is technical verification and does not substitute for the students' viva.

## Environment

| Item | Value |
| --- | --- |
| OS | Windows |
| Node and npm | Node 26.13.0; npm 11.20.0 |
| MySQL | 8.0.46; isolated local instance on 3307 |
| Qdrant | 1.20.2; local-only service on 6333 |
| Browser | Microsoft Edge through Playwright |
| Source snapshot | Working checkout; submission ZIP identifies the final file contents |

## Build and setup

| Command | Result |
| --- | --- |
| npm ci in isolated clean directory | PASS |
| npm run setup:local | PASS; repeated setup preserves existing demo dataset |
| npm run db:migrate | PASS; all 19 already-applied files skipped |
| npm run lint | PASS |
| npx tsc --noEmit | PASS |
| npm run build | PASS; webpack explicitly configured |

## Integration results

**52 passed, 0 failed across 52 checks.**

The harness creates disposable fixtures, a temporary verification database and a rollback-test trigger, then removes them in cleanup. It uses the configured administrator only for setup and direct integrity assertions. APIs use restricted runtime accounts.

| Check | Result |
| --- | --- |
| SET-03 fresh migrations | PASS |
| SET-04 repeat migrations | PASS |
| SET-05 seeded data | PASS |
| AUTH-01 admin login and secure cookie | PASS |
| AUTH-02 invalid password | PASS |
| AUTH-03 protected page and API | PASS |
| AUTH-04 admin creates hashed scout | PASS |
| AUTH-05 scout denied admin operations | PASS |
| DB-01 height constraint | PASS |
| DB-02 appearances constraint | PASS |
| DB-03 pass accuracy constraint | PASS |
| DB-04 injury dates | PASS |
| DB-05 contract dates | PASS |
| DB-06 negative contract salary | PASS |
| DB-07 email unique | PASS |
| DB-09 referenced league restriction | PASS |
| DB-10 cascade deletion | PASS |
| CRUD-01 player list | PASS |
| CRUD-02 combined filters | PASS |
| CRUD-03 player detail | PASS |
| CRUD-04 admin writes | PASS |
| TX-05 failed contract replacement preserves active | PASS |
| CRUD-05 scout recommendation | PASS |
| DB-08 shortlist unique | PASS |
| CRUD-06 ownership and update | PASS |
| CRUD-07 ownership and delete | PASS |
| CRUD-08 comparison | PASS |
| CRUD-09 dashboard CTE ranking | PASS |
| TX-01 transfer commit | PASS |
| TX-02 transfer mid-operation rollback | PASS |
| TX-03 recommendation commit | PASS |
| TX-04 recommendation mid-operation rollback | PASS |
| ADV-01 six views | PASS |
| ADV-02 indexes | PASS |
| ADV-03 four validation triggers | PASS |
| ADV-04 two stored procedures | PASS |
| ADV-05 scheduled event | PASS |
| ADV-06 explain indexed lookup | PASS |
| RBAC-01 scout database denies users and core writes | PASS |
| RBAC-02 admin database denies DDL | PASS |
| RBAC-03 authentication account is read only | PASS |
| VEC-01 Qdrant connection | PASS |
| VEC-02 vector rebuild | PASS |
| VEC-03 dimensions and metric | PASS |
| VEC-04 neighbor retrieval excludes target | PASS |
| VEC-05 position filter | PASS |
| VEC-06 non-indexed player | PASS |
| VEC-07 delete and restore via API | PASS |
| VEC-08 prune obsolete points | PASS |
| VEC-09 combine multi-club statistics | PASS |
| VEC-10 invalid limits | PASS |
| AUTH-06 logout invalidates browser cookie | PASS |

## Reproduce

Start services with `npm run services:start`, run `npm run dev -- --port 3100` in another terminal, then execute `npm run test:integration`. Set TEST_BASE_URL to test a different port. Raw results: `docs/evidence/integration-results.json`.

The tests verify deliberate mid-operation failure and rollback in both stored procedures, invalid contract replacement preserving the old active contract, cross-scout shortlist denial, database grants, vector deletion/restoration and stale cleanup. The UI was also captured through a real browser.

## Evaluation boundaries

Originality, title uniqueness, individual contribution history and live viva performance require the students and evaluator. No automatic test assigns marks. Runtime evidence reflects the local demo; clean installations generate a smaller fictional seed dataset.

The same 52 checks also passed against the production server at http://localhost:3000. A separate clean source installation built successfully without .env.
