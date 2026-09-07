# Important Database Queries and Operations

These examples are drawn from the implemented migrations and server modules.
They are suitable for the report and final demonstration.

## 1. Latest market value using aggregation and a subquery

```sql
SELECT mvh.player_id, mvh.market_value, mvh.currency, mvh.valuation_date
FROM market_value_history mvh
INNER JOIN (
  SELECT player_id, MAX(valuation_date) AS max_date
  FROM market_value_history
  GROUP BY player_id
) latest
  ON latest.player_id = mvh.player_id
 AND latest.max_date = mvh.valuation_date;
```

Purpose: selects only the newest dated valuation for each player. It is stored
as view `vw_latest_market_values` so application queries can reuse it.

## 2. Available players using a correlated subquery

```sql
SELECT p.player_id, p.first_name, p.last_name, p.primary_position
FROM player p
WHERE NOT EXISTS (
  SELECT 1
  FROM injury i
  WHERE i.player_id = p.player_id
    AND i.status IN ('ACTIVE', 'RECOVERING')
);
```

Purpose: identifies players without an unresolved injury. `NOT EXISTS` avoids
duplicate players when multiple injury rows exist.

## 3. Recruitment dashboard aggregation with `GROUP BY` and `HAVING`

```sql
SELECT r.player_id,
       CONCAT(p.first_name, ' ', p.last_name) AS player_name,
       AVG(r.overall_rating) AS avg_rating,
       COUNT(*) AS report_count
FROM scout_report r
INNER JOIN player p ON p.player_id = r.player_id
GROUP BY r.player_id, p.first_name, p.last_name
HAVING COUNT(*) >= 1
ORDER BY avg_rating DESC
LIMIT 5;
```

Purpose: ranks frequently evaluated recruitment targets by average scout rating.
It demonstrates joining, aggregation, grouping, `HAVING`, ordering, and limiting.

## 4. Multi-criteria player search

The player-list API builds a parameterized query containing joins to club,
league, latest value, contract expiry, availability, seasonal statistics, and
an injury-count subquery. Optional filters are appended to `WHERE` or `HAVING`.

Representative form:

```sql
SELECT p.player_id, p.first_name, p.last_name,
       cl.club_name, lg.league_name,
       lmv.market_value, ce.end_date AS contract_end,
       ps.appearances, ps.goals, ps.assists,
       COALESCE(ic.injury_count, 0) AS injury_count
FROM player p
LEFT JOIN player_club pc
  ON pc.player_id = p.player_id AND pc.is_current = TRUE
LEFT JOIN club cl ON cl.club_id = pc.club_id
LEFT JOIN league lg ON lg.league_id = cl.league_id
LEFT JOIN vw_latest_market_values lmv ON lmv.player_id = p.player_id
LEFT JOIN vw_contract_expiry ce ON ce.player_id = p.player_id
LEFT JOIN player_statistics ps
  ON ps.player_id = p.player_id AND ps.season = ?
LEFT JOIN (
  SELECT player_id, COUNT(*) AS injury_count
  FROM injury
  GROUP BY player_id
) ic ON ic.player_id = p.player_id
WHERE p.primary_position = ?
HAVING COALESCE(ps.appearances, 0) >= ?
ORDER BY p.last_name, p.first_name
LIMIT 100;
```

Purpose: supports meaningful recruitment decisions rather than a basic table
listing. All user-controlled values are placeholders.

## 5. Transactional transfer procedure

`sp_record_transfer` performs three dependent operations in one transaction:

1. Insert the transfer history row.
2. Close the current `player_club` membership.
3. Open the destination-club membership when applicable.

```sql
START TRANSACTION;

INSERT INTO transfer (...)
VALUES (...);

UPDATE player_club
SET end_date = p_transfer_date, is_current = FALSE
WHERE player_id = p_player_id AND is_current = TRUE;

INSERT INTO player_club (player_id, club_id, start_date, is_current)
VALUES (p_player_id, p_to_club_id, p_transfer_date, TRUE);

COMMIT;
```

An exit handler executes `ROLLBACK` and rethrows the database error. This avoids
half-recorded transfers.

## 6. Transactional scout recommendation procedure

`sp_add_scout_recommendation` inserts a report and, for `SHORTLIST` or
`PRIORITY`, inserts or updates the same scout's shortlist row in one transaction.
The unique key (`scout_user_id`, `player_id`) prevents duplicate ownership rows.

## 7. Injury validation trigger

```sql
IF NEW.expected_return_date IS NOT NULL
   AND NEW.expected_return_date < NEW.injury_date THEN
  SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'expected_return_date cannot be before injury_date';
END IF;
```

Purpose: rejects invalid dates even when a write bypasses the web interface.
Equivalent validation protects the actual return date and update operations.

## 8. Contract validation trigger

Insert and update triggers reject an end date that is not after the start date,
a negative weekly salary, or a negative release clause. These duplicate key
business rules at the database boundary for integrity.

## 9. Scheduled contract expiration

```sql
CREATE EVENT IF NOT EXISTS ev_expire_contracts
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_DATE + INTERVAL 1 DAY)
DO
  UPDATE contract
  SET contract_status = 'EXPIRED'
  WHERE contract_status = 'ACTIVE'
    AND end_date < CURDATE();
```

Purpose: prevents active status from remaining stale after the end date. The
`vw_contract_expiry` view also checks the date for defensive consistency.

## 10. Vector construction and similarity search

For each eligible player and feature `x`, the vector builder computes:

```text
per_90 = (total / minutes_played) * 90
z_score = (x - population_mean) / population_standard_deviation
```

The Qdrant point contains the 10 normalized features and a payload with player
ID, name, position, season, and club ID. Qdrant cosine search retrieves nearest
neighbors. The requested player is removed from results, and the query can
filter `primary_position`.

## 11. CRUD evidence

| Operation | Example |
| --- | --- |
| CREATE/INSERT | Users, injuries, contracts, transfers, valuations, reports, shortlists |
| READ/SELECT | Player search, detail, comparison, dashboard, reports |
| UPDATE | Shortlist workflow, active contract expiry, valuation upsert |
| DELETE | Shortlist removal |
| ALTER | Migration 016 adds player photo and club crest URLs |
| DROP | Migration 017 removes the invalid retired contract trigger |
