-- 008_create_scout_report.sql
-- ScoutIQ: SCOUT_REPORT (Phase 5 — scouting & recruitment)

CREATE TABLE IF NOT EXISTS scout_report (
  report_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scout_user_id   INT UNSIGNED NOT NULL,
  player_id       INT UNSIGNED NOT NULL,
  overall_rating  DECIMAL(3,1) NOT NULL,
  strengths       TEXT,
  weaknesses      TEXT,
  tactical_fit    TEXT,
  recommendation  ENUM('AVOID','MONITOR','SHORTLIST','PRIORITY') NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_report_scout FOREIGN KEY (scout_user_id)
    REFERENCES `user` (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_report_player FOREIGN KEY (player_id)
    REFERENCES player (player_id) ON DELETE CASCADE,

  CONSTRAINT chk_report_rating CHECK (overall_rating BETWEEN 1.0 AND 10.0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_report_player ON scout_report (player_id);
CREATE INDEX idx_report_scout ON scout_report (scout_user_id);
