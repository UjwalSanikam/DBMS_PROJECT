-- 005_create_contract.sql
-- ScoutIQ: CONTRACT (Phase 4 — transfer & contract intelligence)

CREATE TABLE IF NOT EXISTS contract (
  contract_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  player_id        INT UNSIGNED NOT NULL,
  club_id          INT UNSIGNED NOT NULL,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  weekly_salary    DECIMAL(12,2),
  release_clause   DECIMAL(14,2),
  currency         CHAR(3) NOT NULL DEFAULT 'EUR',
  contract_status  ENUM('ACTIVE','EXPIRED','TERMINATED') NOT NULL DEFAULT 'ACTIVE',
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_contract_player FOREIGN KEY (player_id)
    REFERENCES player (player_id) ON DELETE CASCADE,
  CONSTRAINT fk_contract_club FOREIGN KEY (club_id)
    REFERENCES club (club_id) ON DELETE RESTRICT,

  CONSTRAINT chk_contract_dates CHECK (end_date > start_date),
  CONSTRAINT chk_contract_salary CHECK (weekly_salary IS NULL OR weekly_salary >= 0),
  CONSTRAINT chk_contract_release_clause CHECK (release_clause IS NULL OR release_clause >= 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_contract_player_end ON contract (player_id, end_date);
CREATE INDEX idx_contract_end ON contract (end_date);
