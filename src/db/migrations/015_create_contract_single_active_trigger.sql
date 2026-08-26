-- 015_create_contract_single_active_trigger.sql
-- ScoutIQ: ensure a player has at most one ACTIVE contract at a time.
-- When a new ACTIVE contract is inserted, automatically expire any other
-- ACTIVE contract already on file for that player.

CREATE TRIGGER trg_contract_single_active_after_insert
AFTER INSERT ON contract
FOR EACH ROW
BEGIN
  IF NEW.contract_status = 'ACTIVE' THEN
    UPDATE contract
    SET contract_status = 'EXPIRED'
    WHERE player_id = NEW.player_id
      AND contract_id <> NEW.contract_id
      AND contract_status = 'ACTIVE';
  END IF;
END;
