# Level 3 Requirements Traceability

This matrix maps the DBMS Level 3 project requirements to ScoutIQ artifacts.
`Implemented` means supporting source exists. `Pending evidence` means the team
must still run or capture the result before submission.

| No. | Requirement | ScoutIQ evidence | Status |
| --- | --- | --- | --- |
| 1 | Unique, meaningful project title | ScoutIQ football recruitment problem statement | Confirm uniqueness within section |
| 2 | Two-member team with defined responsibilities | Team section in `PROJECT_REPORT.md` | Review before submission |
| 3 | SQL plus NoSQL/vector database | MySQL and Qdrant | Implemented; runtime proof pending |
| 4 | ER diagram and relational schema | `ER_DIAGRAM.md`, `RELATIONAL_SCHEMA.md` | Documented |
| 5 | DDL: CREATE, ALTER, DROP, keys, constraints, indexes, views | Migrations 001-017 | Implemented |
| 6 | INSERT, UPDATE, DELETE, SELECT and complex queries | APIs, seeds, stored procedures, dashboard queries | Implemented |
| 7 | At least four advanced database concepts | Transactions, views, procedures, triggers, indexes, event, vector search | Implemented |
| 8 | Explain vector data, method, storage, metric, retrieval | Project report section 10 and `IMPORTANT_QUERIES.md` | Documented; demo pending |
| 9 | Functional Next.js web interface | Pages under `src/app` | Implemented; screenshots pending |
| 10 | Database access through backend/API and environment variables | Route Handlers, `src/lib/db.ts`, `.env.example` | Implemented |
| 11 | Authentication and minimum two roles | JWT cookie, `ADMIN` and `SCOUT` | Implemented |
| 12 | Database-level validation and integrity | FKs, unique/check constraints, triggers, transactions | Implemented |
| 13 | Database/web security and no plaintext credentials | Hashing, role checks, parameterized SQL, ignored `.env` | Implemented; ZIP inspection pending |
| 14 | Complete project documentation | `docs/` documentation set | Draft complete; screenshots/results/details pending |
| 15 | Git/GitHub and suitable README | Repository, corrected `README.md` | Implemented |
| 16 | Final evaluation demonstration | `DEMO_GUIDE.md` | Rehearsal pending |
| 17 | Original design and implementation | Domain-specific schema and workflows | Team/instructor confirmation required |
| 18 | Go beyond CRUD and justify database choices | Analytics, procedures, triggers, transactions, vector retrieval | Implemented |

## Remaining evidence before submission

1. Confirm the title is unique within the section.
2. Replace report cover placeholders with the official team information.
3. Run every test in `TESTING.md` and record the actual outcome.
4. Capture the required application and database screenshots.
5. Rehearse every step in `DEMO_GUIDE.md`.
6. Inspect the final ZIP to ensure that `.env` and other secrets are absent.
