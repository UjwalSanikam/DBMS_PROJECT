# Final Demonstration Guide

Target duration: approximately 10-12 minutes. Adjust to the instructor's time
limit while preserving the database-focused steps.

## Before the demonstration

1. Start MySQL and confirm the `scoutiq` database is available.
2. Start Qdrant and confirm the `player_profiles` collection exists.
3. Run `npm run db:migrate` to demonstrate repeatable migration skipping.
4. Start the app with `npm run dev`.
5. Keep MySQL Workbench or the MySQL CLI ready.
6. Use demonstration accounts only; never display `.env` or real credentials.
7. Prepare player IDs that have statistics and Qdrant vectors.

## Suggested presentation sequence

### 1. Problem and motivation - 1 minute

Explain that recruitment decisions combine structured histories, human scout
reports, and similarity analysis. State why a spreadsheet or simple player CRUD
page does not maintain the necessary relationships and integrity.

### 2. ER diagram and relational schema - 2 minutes

Open `ER_DIAGRAM.md` and explain:

- One league to many clubs
- Player-club membership as a time-varying relation
- One player to many statistics, injuries, contracts, transfers, and values
- User ownership of reports and shortlists
- Primary keys, foreign keys, unique keys, and referential actions

### 3. Database implementation - 2 minutes

Run:

```sql
SHOW TABLES;
SHOW FULL TABLES WHERE Table_type = 'VIEW';
SHOW TRIGGERS;
SHOW PROCEDURE STATUS WHERE Db = 'scoutiq';
SHOW INDEX FROM player_statistics;
```

Explain at least four advanced concepts. Recommended selection: views,
transactions/stored procedures, triggers, indexing, and vector similarity.

### 4. Application workflow - 3 minutes

1. Sign in as Admin.
2. Show dashboard aggregates and alerts.
3. Search players with several filters.
4. Open a player and show related histories.
5. Compare players.
6. Sign in or explain the Scout role.
7. Create a report that automatically updates the shortlist.
8. Update and delete a disposable shortlist entry to demonstrate full DML.

### 5. Integrity and transaction proof - 1 minute

Attempt an invalid injury or contract date and show that MySQL rejects it.
Then explain how `sp_record_transfer` groups transfer insertion and club
membership updates into one atomic transaction.

### 6. Vector search - 1 minute

1. Open an indexed player.
2. Display similar players.
3. Enable same-position filtering.
4. Explain the ten features, per-90 conversion, z-score normalization, Qdrant
   storage, and cosine similarity.

### 7. Testing, contributions, and conclusion - 1-2 minutes

Show the completed `TESTING.md` summary and explain the actual team split.
Conclude that MySQL handles integrity and transactions while Qdrant handles
nearest-neighbor retrieval.

## Likely viva questions

### Why use two databases?

MySQL is appropriate for normalized relationships, constraints, transactions,
and reporting. Qdrant is appropriate for nearest-neighbor vector retrieval.
Qdrant is derived from MySQL rather than being a second source of truth.

### Why not calculate similarity only in SQL?

SQL can compare a small fixed dataset, but a vector index provides a clear and
scalable nearest-neighbor retrieval abstraction. It also supports metadata
filtering while keeping similarity logic separate from transactional data.

### What ensures consistency?

Foreign keys, unique/check constraints, triggers, parameterized statements,
role checks, and transactions. Derived views avoid storing redundant values
such as age or availability.

### What happens when part of a transfer fails?

The procedure's SQL exception handler rolls back the transaction, so the
transfer and membership history cannot be partially updated.

### What normal form is the schema?

The operational tables follow third normal form: facts are separated by entity
and history type, many-to-many/time-varying membership has its own relation,
and derived values are computed rather than duplicated.

### Is the vector an AI embedding?

It is a deterministic statistical feature embedding, not a language-model
embedding. The application normalizes ten football measures and stores the
result in Qdrant for cosine similarity.

## Demo safety

- Never open `.env` while screen sharing.
- Use test records for insert/update/delete demonstrations.
- Prepare a database backup before the demo.
- Keep screenshots available in case a service becomes unavailable.
- Do not claim a test passed unless the final version actually passed it.
