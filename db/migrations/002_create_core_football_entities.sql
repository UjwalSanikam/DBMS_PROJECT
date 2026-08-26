-- 002_create_core_football_entities.sql
-- ScoutIQ: LEAGUE, CLUB, PLAYER, PLAYER_CLUB (Phase 2 — core football data)

CREATE TABLE IF NOT EXISTS league (
  league_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  league_name VARCHAR(120) NOT NULL,
  country     VARCHAR(80)  NOT NULL,
  tier        TINYINT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT uq_league_name_country UNIQUE (league_name, country)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS club (
  club_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  league_id     INT UNSIGNED NOT NULL,
  club_name     VARCHAR(120) NOT NULL,
  city          VARCHAR(80),
  country       VARCHAR(80)  NOT NULL,
  founded_year  SMALLINT UNSIGNED,
  CONSTRAINT fk_club_league FOREIGN KEY (league_id)
    REFERENCES league (league_id) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_club_league ON club (league_id);

CREATE TABLE IF NOT EXISTS player (
  player_id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name         VARCHAR(80)  NOT NULL,
  last_name          VARCHAR(80)  NOT NULL,
  date_of_birth      DATE         NOT NULL,
  nationality        VARCHAR(80)  NOT NULL,
  primary_position    ENUM('GK','CB','LB','RB','LWB','RWB','DM','CM','AM','LW','RW','ST') NOT NULL,
  secondary_position  ENUM('GK','CB','LB','RB','LWB','RWB','DM','CM','AM','LW','RW','ST'),
  preferred_foot      ENUM('LEFT','RIGHT','BOTH') NOT NULL DEFAULT 'RIGHT',
  height_cm            SMALLINT UNSIGNED,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_player_height CHECK (height_cm IS NULL OR height_cm BETWEEN 140 AND 220)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_player_position ON player (primary_position);
CREATE INDEX idx_player_dob ON player (date_of_birth);

CREATE TABLE IF NOT EXISTS player_club (
  player_club_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  player_id       INT UNSIGNED NOT NULL,
  club_id         INT UNSIGNED NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE,
  shirt_number    TINYINT UNSIGNED,
  is_current      BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_playerclub_player FOREIGN KEY (player_id)
    REFERENCES player (player_id) ON DELETE CASCADE,
  CONSTRAINT fk_playerclub_club FOREIGN KEY (club_id)
    REFERENCES club (club_id) ON DELETE RESTRICT,
  CONSTRAINT chk_playerclub_dates CHECK (end_date IS NULL OR end_date > start_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_playerclub_player ON player_club (player_id);
CREATE INDEX idx_playerclub_club ON player_club (club_id);
CREATE INDEX idx_playerclub_current ON player_club (player_id, is_current);
