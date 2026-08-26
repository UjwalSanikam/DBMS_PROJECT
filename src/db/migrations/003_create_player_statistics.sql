-- 003_create_player_statistics.sql
-- ScoutIQ: PLAYER_STATISTICS (Phase 3 — season-level performance data)

CREATE TABLE IF NOT EXISTS player_statistics (
  stat_id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  player_id           INT UNSIGNED NOT NULL,
  club_id             INT UNSIGNED NOT NULL,
  league_id           INT UNSIGNED NOT NULL,
  season              VARCHAR(9)   NOT NULL,          -- e.g. '2025-2026'
  appearances         SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  starts              SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  minutes_played       INT UNSIGNED NOT NULL DEFAULT 0,
  goals                SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  assists              SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  xg                   DECIMAL(6,2) NOT NULL DEFAULT 0,
  xa                   DECIMAL(6,2) NOT NULL DEFAULT 0,
  shots                SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  shots_on_target      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  key_passes           SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  progressive_passes   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  pass_accuracy        DECIMAL(5,2) NOT NULL DEFAULT 0,  -- percentage 0-100
  tackles              SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  interceptions        SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_stats_player FOREIGN KEY (player_id)
    REFERENCES player (player_id) ON DELETE CASCADE,
  CONSTRAINT fk_stats_club FOREIGN KEY (club_id)
    REFERENCES club (club_id) ON DELETE RESTRICT,
  CONSTRAINT fk_stats_league FOREIGN KEY (league_id)
    REFERENCES league (league_id) ON DELETE RESTRICT,

  CONSTRAINT uq_stats_player_club_league_season
    UNIQUE (player_id, club_id, league_id, season),

  CONSTRAINT chk_stats_starts_le_apps CHECK (starts <= appearances),
  CONSTRAINT chk_stats_pass_accuracy CHECK (pass_accuracy BETWEEN 0 AND 100),
  CONSTRAINT chk_stats_shots_on_target CHECK (shots_on_target <= shots)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_stats_player_season ON player_statistics (player_id, season);
CREATE INDEX idx_stats_club ON player_statistics (club_id);
CREATE INDEX idx_stats_league ON player_statistics (league_id);
