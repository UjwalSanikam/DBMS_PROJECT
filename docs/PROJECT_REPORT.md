# ScoutIQ Project Report

## Cover information

| Field | Value |
| --- | --- |
| Project title | ScoutIQ - Football Scouting and Recruitment Intelligence Platform |
| Course | Database Management Systems - Experiential Learning Level 3 |
| Institution | PES University |
| Team member 1 | Ujwal Sanikam |
| Team member 2 | Ved Mudkavi |
| Section | **To be completed before submission** |
| USNs | **To be completed before submission** |
| Instructor | **To be completed before submission** |
| Submission date | **To be completed before submission** |

## 1. Problem statement

Football recruitment decisions require information from several related areas:
player identity, club membership, seasonal performance, injury history,
contract status, market value, transfer history, scout assessments, and
shortlist decisions. When these records are kept in separate spreadsheets,
scouts cannot reliably enforce data consistency, compare candidates, track
changing recruitment status, or find players with similar playing styles.

ScoutIQ addresses this problem through a database-first web application. MySQL
stores structured and transactional football data, while Qdrant stores
normalized player feature vectors for similarity retrieval. A Next.js
interface makes both database systems available through role-protected scouting
workflows.

## 2. Motivation

The project demonstrates how relational modeling and advanced DBMS concepts can
support a realistic decision-making workflow. The objective is not merely to
store players, but to connect performance, fitness, contracts, market value,
and human scouting observations into actionable recruitment information.

## 3. Objectives

1. Design a normalized relational schema for football recruitment data.
2. Maintain entity integrity, referential integrity, and domain validity.
3. Support authenticated `ADMIN` and `SCOUT` roles.
4. Provide meaningful insert, update, delete, search, filter, and reporting operations.
5. Demonstrate joins, aggregation, grouping, `HAVING`, ordering, and subqueries.
6. Demonstrate at least four advanced database features.
7. Use a vector database to retrieve statistically similar players.
8. Expose the database functionality through a usable Next.js application.
9. Provide reproducible setup, testing, and demonstration instructions.

## 4. Scope

### Included

- Account authentication and role-based authorization
- Football leagues, clubs, players, and club membership history
- Seasonal player statistics
- Injury, contract, transfer, and market-value history
- Scout reports and personal shortlists
- Recruitment dashboards and player comparison
- Multi-criteria player search and filtering
- Qdrant-based player similarity search
- CSV import, migrations, and demonstration seed data

### Excluded

- Live match feeds and real-time event ingestion
- Contract negotiation or communication with clubs
- Financial settlement, payments, or legal contract execution
- Production hosting, monitoring, and disaster recovery
- Automated verification of third-party data licenses
- Predictive match-outcome or injury-risk machine-learning models

## 5. Functional requirements

| ID | Requirement |
| --- | --- |
| FR-01 | A user can sign in and sign out securely. |
| FR-02 | An administrator can list and create `ADMIN` or `SCOUT` accounts. |
| FR-03 | An authenticated user can search players by identity, club, league, position, age, performance, contract, value, and injury criteria. |
| FR-04 | A user can view a player with statistics, injuries, contracts, transfers, valuations, and reports. |
| FR-05 | A scout can create reports and recommendations for a player. |
| FR-06 | A scout can create, update, and remove personal shortlist entries. |
| FR-07 | A user can compare selected players using consistent recruitment measures. |
| FR-08 | Authorized workflows can record injuries, contracts, transfers, and valuations. |
| FR-09 | A user can retrieve players with a similar statistical playing style. |
| FR-10 | The dashboard presents aggregates, expiring contracts, injury alerts, recent reports, and shortlist activity. |

## 6. Non-functional requirements

- Database credentials and signing secrets are supplied through environment variables.
- Passwords are stored as bcrypt hashes, never as plaintext database values.
- SQL statements use parameterized values for user-controlled input.
- Database constraints remain the final enforcement layer for critical invariants.
- Migration execution is repeatable through the `schema_migrations` ledger.
- The interface is implemented with reusable typed React and TypeScript components.

## 7. Database choice and justification

### MySQL

MySQL is the primary database because ScoutIQ contains highly structured,
related data and transactional workflows. Foreign keys are required between
players, clubs, leagues, users, reports, and recruitment history. Transactions
are important when a transfer must insert a transfer record and update club
membership atomically. MySQL also supports the project's views, check
constraints, indexes, triggers, stored procedures, and scheduled event.

### Qdrant

Qdrant is used only for the problem that does not fit ordinary relational
filtering: nearest-neighbor retrieval of players by playing style. Each eligible
player is represented by a normalized 10-dimensional numeric vector. Qdrant
stores these vectors and evaluates cosine similarity efficiently. MySQL remains
the source of truth; Qdrant is a derived search index that can be rebuilt.

This separation is intentional. Qdrant is not included merely to demonstrate a
technology; it serves similarity retrieval, while MySQL serves relational and
transactional data.

## 8. Data model

The complete model is documented in:

- [ER diagram](ER_DIAGRAM.md)
- [Relational schema](RELATIONAL_SCHEMA.md)
- [Data dictionary](DATA_DICTIONARY.md)

The canonical executable schema is `src/db/migrations/*.sql`.

## 9. Advanced database concepts

| Concept | Implementation |
| --- | --- |
| Transactions | Transfer and scout-recommendation procedures; application transaction helper |
| Views | Latest values, available players, contract expiry, U23 candidates, recruitment snapshot |
| Stored procedures | `sp_record_transfer`, `sp_add_scout_recommendation` |
| Triggers | Injury-date and contract-value/date validation |
| Indexing | Search, foreign-key, date, status, player, club, and season indexes |
| Scheduled event | Daily expiry of past active contracts |
| Vector similarity | Qdrant cosine search over normalized player-statistic vectors |

Detailed examples are in [Important database queries](IMPORTANT_QUERIES.md).

## 10. Vector model and retrieval strategy

Players with fewer than 450 minutes in season `2025-2026` are excluded because
per-90 measures are unstable for very small samples. The following values form
the vector:

1. Goals per 90 minutes
2. Assists per 90 minutes
3. Expected goals per 90 minutes
4. Expected assists per 90 minutes
5. Shots per 90 minutes
6. Key passes per 90 minutes
7. Progressive passes per 90 minutes
8. Pass accuracy
9. Tackles per 90 minutes
10. Interceptions per 90 minutes

Each feature is standardized using a z-score over the eligible player
population. The resulting vector is stored in Qdrant collection
`player_profiles` with the MySQL player ID and descriptive payload. Retrieval
uses cosine similarity, optionally filtered to the target player's position.

This is a statistical feature embedding rather than a text-embedding model. No
external AI model is required.

## 11. Application architecture

The Next.js interface calls server-side Route Handlers. Route Handlers validate
the session and request data before using parameterized MySQL queries or the
Qdrant client. MySQL supplies all authoritative player and workflow data.
Qdrant IDs correspond to MySQL player IDs. See [System architecture](ARCHITECTURE.md).

## 12. Security and integrity

- bcrypt hashing with 12 salt rounds
- Signed, expiring JWT session tokens
- HTTP-only, same-site session cookies
- Role checks in protected pages and APIs
- Parameterized SQL queries
- Zod request validation
- Foreign keys with deliberate cascade/restrict/set-null actions
- Unique constraints for emails, seasonal statistics, valuations, and shortlists
- Check constraints for ranges and chronological validity
- Triggers for important injury and contract checks
- Environment variables for credentials and secrets

The supplied `.env` is a local-only file and must not be placed in the final ZIP.

## 13. Team responsibilities

The table below is a documentation framework and must be adjusted to match the
work actually performed before submission.

| Member | Database responsibilities | Application responsibilities | Documentation/testing |
| --- | --- | --- | --- |
| Ujwal Sanikam | Core schema, migrations, seed/import workflow, advanced SQL | Core APIs, authentication, player and recruitment screens | Explain original design decisions and database implementation |
| Ved Mudkavi | Fresh-database verification, constraint/query validation, vector-index verification | Local integration, workflow verification, setup corrections | Report assembly, test evidence, screenshots, ZIP verification |
| Both | Schema review and viva query preparation | End-to-end demonstration and defect correction | Final proofreading and presentation |

## 14. Testing

The test specification and evidence table are maintained in [Testing](TESTING.md).
Results must be recorded only after running the project against a fresh local
database and Qdrant instance.

## 15. Application screenshots

Final screenshots must be stored in `docs/screenshots/` and added here before
submission. Required captures are listed in `docs/screenshots/README.md`.

## 16. Conclusion

ScoutIQ demonstrates a clear connection between database concepts and a
functional application. Relational modeling supports consistency and complex
reporting, transactions protect multi-step recruitment workflows, and the
vector index adds a retrieval capability that traditional filters do not
provide. The database is therefore central to the application rather than a
passive persistence layer.

## 17. Future enhancements

- Position-specific vector features and weights
- Multiple seasonal vectors per player
- Report review and audit history
- Contract and injury notifications
- Club-specific permissions and multi-tenancy
- Automated integration tests and CI
- Production deployment, backups, and monitoring
