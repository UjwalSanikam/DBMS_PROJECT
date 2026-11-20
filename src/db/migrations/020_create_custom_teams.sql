-- Personal lineups: eleven starters and up to seven substitutes.
CREATE TABLE IF NOT EXISTS custom_team (
  team_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_user_id INT UNSIGNED NOT NULL,
  team_name VARCHAR(80) NOT NULL,
  formation ENUM('4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2') NOT NULL DEFAULT '4-3-3',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_custom_team_owner FOREIGN KEY (owner_user_id) REFERENCES `user` (user_id) ON DELETE CASCADE,
  INDEX idx_custom_team_owner (owner_user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS custom_team_player (
  team_id INT UNSIGNED NOT NULL,
  slot_index TINYINT UNSIGNED NOT NULL,
  player_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (team_id, slot_index),
  CONSTRAINT uq_custom_team_player UNIQUE (team_id, player_id),
  CONSTRAINT chk_custom_team_slot CHECK (slot_index BETWEEN 0 AND 17),
  CONSTRAINT fk_custom_team_player_team FOREIGN KEY (team_id) REFERENCES custom_team (team_id) ON DELETE CASCADE,
  CONSTRAINT fk_custom_team_player_player FOREIGN KEY (player_id) REFERENCES player (player_id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
