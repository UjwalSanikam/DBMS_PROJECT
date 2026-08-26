-- 013_create_stored_procedures.sql
-- ScoutIQ: transactional stored procedures (Phase 6)

CREATE PROCEDURE sp_record_transfer (
  IN p_player_id      INT UNSIGNED,
  IN p_from_club_id   INT UNSIGNED,
  IN p_to_club_id     INT UNSIGNED,
  IN p_transfer_date  DATE,
  IN p_transfer_fee   DECIMAL(14,2),
  IN p_currency       CHAR(3),
  IN p_transfer_type  VARCHAR(20),
  IN p_notes          TEXT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  INSERT INTO transfer (player_id, from_club_id, to_club_id, transfer_date,
                         transfer_fee, currency, transfer_type, notes)
  VALUES (p_player_id, p_from_club_id, p_to_club_id, p_transfer_date,
          p_transfer_fee, p_currency, p_transfer_type, p_notes);

  -- Close the player's existing current club membership, if any
  UPDATE player_club
  SET end_date = p_transfer_date, is_current = FALSE
  WHERE player_id = p_player_id AND is_current = TRUE;

  -- Open the new club membership (skip for LOAN_RETURN with no destination club)
  IF p_to_club_id IS NOT NULL THEN
    INSERT INTO player_club (player_id, club_id, start_date, is_current)
    VALUES (p_player_id, p_to_club_id, p_transfer_date, TRUE);
  END IF;

  COMMIT;
END;


CREATE PROCEDURE sp_add_scout_recommendation (
  IN p_scout_user_id  INT UNSIGNED,
  IN p_player_id      INT UNSIGNED,
  IN p_overall_rating DECIMAL(3,1),
  IN p_strengths      TEXT,
  IN p_weaknesses     TEXT,
  IN p_tactical_fit   TEXT,
  IN p_recommendation VARCHAR(20),
  IN p_notes          TEXT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  INSERT INTO scout_report (scout_user_id, player_id, overall_rating, strengths,
                             weaknesses, tactical_fit, recommendation, notes)
  VALUES (p_scout_user_id, p_player_id, p_overall_rating, p_strengths,
          p_weaknesses, p_tactical_fit, p_recommendation, p_notes);

  IF p_recommendation IN ('SHORTLIST', 'PRIORITY') THEN
    INSERT INTO shortlist (scout_user_id, player_id, priority, status, reason)
    VALUES (
      p_scout_user_id, p_player_id,
      IF(p_recommendation = 'PRIORITY', 'HIGH', 'MEDIUM'),
      'RECOMMENDED',
      CONCAT('Auto-added from scout report: ', p_recommendation)
    )
    ON DUPLICATE KEY UPDATE
      status = 'RECOMMENDED',
      priority = IF(p_recommendation = 'PRIORITY', 'HIGH', VALUES(priority)),
      updated_at = CURRENT_TIMESTAMP;
  END IF;

  COMMIT;
END;
