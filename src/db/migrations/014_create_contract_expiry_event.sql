-- 014_create_contract_expiry_event.sql
-- ScoutIQ: automatically mark contracts EXPIRED once their end_date passes,
-- and make vw_contract_expiry defensive against stale contract_status values.



CREATE EVENT IF NOT EXISTS ev_expire_contracts
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_DATE + INTERVAL 1 DAY)
DO
  UPDATE contract
  SET contract_status = 'EXPIRED'
  WHERE contract_status = 'ACTIVE'
    AND end_date < CURDATE();

-- Run it once immediately so existing stale data (like the seeded
-- contracts already past their end_date) is corrected right away,
-- rather than waiting for tomorrow's scheduled run.
UPDATE contract
SET contract_status = 'EXPIRED'
WHERE contract_status = 'ACTIVE'
  AND end_date < CURDATE();

-- Belt-and-suspenders: the view itself also filters by end_date, so search
-- results stay correct even in the rare window before the daily event runs.
CREATE OR REPLACE VIEW vw_contract_expiry AS
SELECT c.contract_id, c.player_id, p.first_name, p.last_name,
       c.club_id, cl.club_name, c.end_date,
       TIMESTAMPDIFF(MONTH, CURDATE(), c.end_date) AS months_remaining
FROM contract c
INNER JOIN player p ON p.player_id = c.player_id
INNER JOIN club cl ON cl.club_id = c.club_id
WHERE c.contract_status = 'ACTIVE'
  AND c.end_date >= CURDATE()
ORDER BY c.end_date ASC;
