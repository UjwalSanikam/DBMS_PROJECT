-- 010_create_injury_triggers.sql
-- ScoutIQ: injury date validation triggers (viva demo requirement)

CREATE TRIGGER trg_injury_before_insert
BEFORE INSERT ON injury
FOR EACH ROW
BEGIN
  IF NEW.expected_return_date IS NOT NULL AND NEW.expected_return_date < NEW.injury_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'expected_return_date cannot be before injury_date';
  END IF;
  IF NEW.actual_return_date IS NOT NULL AND NEW.actual_return_date < NEW.injury_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'actual_return_date cannot be before injury_date';
  END IF;
END;

CREATE TRIGGER trg_injury_before_update
BEFORE UPDATE ON injury
FOR EACH ROW
BEGIN
  IF NEW.expected_return_date IS NOT NULL AND NEW.expected_return_date < NEW.injury_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'expected_return_date cannot be before injury_date';
  END IF;
  IF NEW.actual_return_date IS NOT NULL AND NEW.actual_return_date < NEW.injury_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'actual_return_date cannot be before injury_date';
  END IF;
END;