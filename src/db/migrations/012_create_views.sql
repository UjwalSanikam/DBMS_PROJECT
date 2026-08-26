-- 012_create_views.sql
-- ScoutIQ: recruitment-facing views (Phase 6)

-- vw_latest_market_values: most recent valuation per player
CREATE OR REPLACE VIEW vw_latest_market_values AS
SELECT mvh.player_id, mvh.market_value, mvh.currency, mvh.valuation_date
FROM market_value_history mvh
INNER JOIN (
  SELECT player_id, MAX(valuation_date) AS max_date
  FROM market_value_history
  GROUP BY player_id
) latest
  ON latest.player_id = mvh.player_id
 AND latest.max_date = mvh.valuation_date;

-- vw_available_players: players with no ACTIVE/RECOVERING injury right now
CREATE OR REPLACE VIEW vw_available_players AS
SELECT p.player_id, p.first_name, p.last_name, p.primary_position
FROM player p
WHERE NOT EXISTS (
  SELECT 1 FROM injury i
  WHERE i.player_id = p.player_id
    AND i.status IN ('ACTIVE', 'RECOVERING')
);

-- vw_contract_expiry: current active contracts, soonest expiry first
CREATE OR REPLACE VIEW vw_contract_expiry AS
SELECT c.contract_id, c.player_id, p.first_name, p.last_name,
       c.club_id, cl.club_name, c.end_date,
       TIMESTAMPDIFF(MONTH, CURDATE(), c.end_date) AS months_remaining
FROM contract c
INNER JOIN player p ON p.player_id = c.player_id
INNER JOIN club cl ON cl.club_id = c.club_id
WHERE c.contract_status = 'ACTIVE'
ORDER BY c.end_date ASC;

-- vw_u23_recruitment_candidates: players under 23 with recruitment info
CREATE OR REPLACE VIEW vw_u23_recruitment_candidates AS
SELECT p.player_id, p.first_name, p.last_name, p.primary_position,
       TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) AS age,
       lmv.market_value, ce.end_date AS contract_end,
       CASE WHEN av.player_id IS NULL THEN 'INJURED' ELSE 'AVAILABLE' END AS availability
FROM player p
LEFT JOIN vw_latest_market_values lmv ON lmv.player_id = p.player_id
LEFT JOIN vw_contract_expiry ce ON ce.player_id = p.player_id
LEFT JOIN vw_available_players av ON av.player_id = p.player_id
WHERE TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) < 23;

-- vw_player_recruitment_snapshot: the main combined view powering search
CREATE OR REPLACE VIEW vw_player_recruitment_snapshot AS
SELECT
  p.player_id,
  CONCAT(p.first_name, ' ', p.last_name) AS player_name,
  TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) AS age,
  p.primary_position AS position,
  cl.club_name,
  lg.league_name,
  lmv.market_value,
  ce.end_date AS contract_end,
  CASE WHEN av.player_id IS NULL THEN 'INJURED' ELSE 'AVAILABLE' END AS availability,
  active_inj.injury_type,
  active_inj.expected_return_date
FROM player p
LEFT JOIN player_club pc ON pc.player_id = p.player_id AND pc.is_current = TRUE
LEFT JOIN club cl ON cl.club_id = pc.club_id
LEFT JOIN league lg ON lg.league_id = cl.league_id
LEFT JOIN vw_latest_market_values lmv ON lmv.player_id = p.player_id
LEFT JOIN vw_contract_expiry ce ON ce.player_id = p.player_id
LEFT JOIN vw_available_players av ON av.player_id = p.player_id
LEFT JOIN (
  SELECT i1.player_id, i1.injury_type, i1.expected_return_date
  FROM injury i1
  WHERE i1.status IN ('ACTIVE', 'RECOVERING')
    AND i1.injury_date = (
      SELECT MAX(i2.injury_date) FROM injury i2
      WHERE i2.player_id = i1.player_id AND i2.status IN ('ACTIVE', 'RECOVERING')
    )
) active_inj ON active_inj.player_id = p.player_id;
