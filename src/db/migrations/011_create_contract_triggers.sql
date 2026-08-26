-- 011_create_contract_triggers.sql
-- ScoutIQ: contract validation triggers (viva demo requirement)

CREATE TRIGGER trg_contract_before_insert
BEFORE INSERT ON contract
FOR EACH ROW
BEGIN
  IF NEW.end_date <= NEW.start_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'contract end_date must be after start_date';
  END IF;
  IF NEW.weekly_salary IS NOT NULL AND NEW.weekly_salary < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'weekly_salary cannot be negative';
  END IF;
  IF NEW.release_clause IS NOT NULL AND NEW.release_clause < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'release_clause cannot be negative';
  END IF;
END;

CREATE TRIGGER trg_contract_before_update
BEFORE UPDATE ON contract
FOR EACH ROW
BEGIN
  IF NEW.end_date <= NEW.start_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'contract end_date must be after start_date';
  END IF;
  IF NEW.weekly_salary IS NOT NULL AND NEW.weekly_salary < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'weekly_salary cannot be negative';
  END IF;
  IF NEW.release_clause IS NOT NULL AND NEW.release_clause < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'release_clause cannot be negative';
  END IF;
END;
