# Final Demonstration Guide

Allow approximately 10 to 12 minutes.

1. Run `npm run services:start`, then `npm run dev`. Use your local credentials without showing `.env`.
2. Show `docs/ER_DIAGRAM.png`: explain keys, player histories, club membership and report/shortlist ownership.
3. Run `SHOW FULL TABLES`, `SHOW TRIGGERS`, `SHOW EVENTS` and `SHOW PROCEDURE STATUS WHERE Db='scoutiq'`. Explain six views, four triggers, two procedures and the daily expiry event.
4. Show migration 019: its CTE aggregates scout ratings and DENSE_RANK orders targets. The dashboard reads this view.
5. Sign in as Admin, show the dashboard, combine player filters, open a profile and compare two players.
6. Sign in as a Scout. Explain the missing admin navigation, show that admin APIs return 403 and that the Scout MySQL account cannot write users or core player records. Database grants protect table operations; API checks protect per-scout ownership.
7. Show the shortlist insert/update/delete APIs using disposable records. A SHORTLIST or PRIORITY report automatically updates the author's shortlist transactionally.
8. Show `docs/evidence/integration-results.json`: the transfer and recommendation tests deliberately fail after their first write, then verify rollback. Contract replacement is also transactional and locks the player row.
9. On an indexed profile, find similar players, apply the position filter, delete the target vector as Admin, observe the missing-vector message, then refresh the index to restore it. Explain all ten features, per-90 conversion, z-score standardization and cosine similarity.
10. Present the report, passing test summary and the requested equal responsibility allocation. Both students should explain and modify their assigned work in the viva.

## Useful database commands

```sql
SELECT * FROM vw_ranked_scout_targets ORDER BY recruitment_rank LIMIT 5;
SHOW FULL TABLES WHERE Table_type='VIEW';
SHOW TRIGGERS;
SHOW PROCEDURE STATUS WHERE Db='scoutiq';
SHOW EVENTS FROM scoutiq;
SHOW INDEX FROM player_statistics;
EXPLAIN SELECT * FROM player_statistics WHERE player_id=1 AND season='2025-2026';
SELECT CURRENT_ROLE();
SHOW GRANTS;
```

Log in as the specific MySQL runtime user to demonstrate its `CURRENT_ROLE()` and denied operations. Do not run destructive examples on real records. The automated test harness supplies and cleans up disposable fixtures.

## Viva preparation

- Why MySQL and Qdrant? MySQL manages related records, constraints and transactions; Qdrant is a derived similarity index.
- What happens if a transfer fails? The procedure's exit handler rolls back the transfer and membership changes together.
- What happens if a replacement contract is invalid? The transaction rolls back, preserving the prior active contract. A player-row lock serializes replacements.
- Is similarity a prediction? No. It measures numerical playing-style similarity and does not predict quality.
- How do you handle transfers within a season? Sum counting statistics and minutes across clubs, weight pass accuracy by minutes, then create one vector per player.
- How do you remove stale vectors? Rebuild upserts current eligible IDs, scans stored IDs and deletes those no longer eligible.
- Where is RBAC enforced? MySQL accounts and roles limit table/column operations; signed sessions and API checks limit application roles and shortlist ownership.
- Why does setup need an administrator? Creating schemas, accounts, roles, events and triggers requires privileges that HTTP runtime accounts deliberately lack.

The final live presentation, title uniqueness and personal contribution explanation must be completed by the students.
