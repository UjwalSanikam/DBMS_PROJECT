-- 009_create_shortlist.sql
-- ScoutIQ: SHORTLIST (Phase 5 — scouting & recruitment)

CREATE TABLE IF NOT EXISTS shortlist (
  shortlist_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scout_user_id   INT UNSIGNED NOT NULL,
  player_id       INT UNSIGNED NOT NULL,
  priority        ENUM('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'MEDIUM',
  status          ENUM('WATCHING','RECOMMENDED','CONTACT_CLUB','NEGOTIATING','REJECTED','SIGNED')
                    NOT NULL DEFAULT 'WATCHING',
  reason          TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_shortlist_scout FOREIGN KEY (scout_user_id)
    REFERENCES `user` (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_shortlist_player FOREIGN KEY (player_id)
    REFERENCES player (player_id) ON DELETE CASCADE,

  CONSTRAINT uq_shortlist_scout_player UNIQUE (scout_user_id, player_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_shortlist_scout_status ON shortlist (scout_user_id, status);
CREATE INDEX idx_shortlist_player ON shortlist (player_id);
