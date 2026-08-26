-- 004_create_injury.sql
-- ScoutIQ: INJURY (Phase 4 — injury & availability intelligence)

CREATE TABLE IF NOT EXISTS injury (
  injury_id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  player_id             INT UNSIGNED NOT NULL,
  injury_type           VARCHAR(120) NOT NULL,
  body_area             VARCHAR(80)  NOT NULL,
  injury_date           DATE NOT NULL,
  expected_return_date  DATE,
  actual_return_date    DATE,
  severity              ENUM('MINOR','MODERATE','MAJOR') NOT NULL,
  status                ENUM('ACTIVE','RECOVERING','RECOVERED') NOT NULL DEFAULT 'ACTIVE',
  notes                 TEXT,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_injury_player FOREIGN KEY (player_id)
    REFERENCES player (player_id) ON DELETE CASCADE,

  CONSTRAINT chk_injury_expected_return
    CHECK (expected_return_date IS NULL OR expected_return_date >= injury_date),
  CONSTRAINT chk_injury_actual_return
    CHECK (actual_return_date IS NULL OR actual_return_date >= injury_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_injury_player_status ON injury (player_id, status);
CREATE INDEX idx_injury_expected_return ON injury (expected_return_date);
