-- Keep fresh installations consistent with the production recruitment view.
CREATE OR REPLACE VIEW vw_contract_expiry AS
SELECT c.contract_id, c.player_id, p.first_name, p.last_name,
       c.club_id, cl.club_name, c.end_date,
       TIMESTAMPDIFF(MONTH, CURDATE(), c.end_date) AS months_remaining
FROM contract c
INNER JOIN player p ON p.player_id = c.player_id
INNER JOIN club cl ON cl.club_id = c.club_id
WHERE c.contract_status = 'ACTIVE' AND c.end_date >= CURDATE()
ORDER BY c.end_date ASC;
