-- 006_create_transfer.sql
-- ScoutIQ: TRANSFER (Phase 4 — transfer & contract intelligence)

CREATE TABLE IF NOT EXISTS transfer (
  transfer_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  player_id       INT UNSIGNED NOT NULL,
  from_club_id    INT UNSIGNED NULL,
  to_club_id      INT UNSIGNED NULL,
  transfer_date   DATE NOT NULL,
  transfer_fee    DECIMAL(14,2),
  currency        CHAR(3) NOT NULL DEFAULT 'EUR',
  transfer_type   ENUM('PERMANENT','LOAN','FREE','LOAN_RETURN','ACADEMY_PROMOTION') NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_transfer_player FOREIGN KEY (player_id)
    REFERENCES player (player_id) ON DELETE CASCADE,
  CONSTRAINT fk_transfer_from_club FOREIGN KEY (from_club_id)
    REFERENCES club (club_id) ON DELETE SET NULL,
  CONSTRAINT fk_transfer_to_club FOREIGN KEY (to_club_id)
    REFERENCES club (club_id) ON DELETE SET NULL,

  CONSTRAINT chk_transfer_fee CHECK (transfer_fee IS NULL OR transfer_fee >= 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_transfer_player_date ON transfer (player_id, transfer_date);
CREATE INDEX idx_transfer_to_club ON transfer (to_club_id);
