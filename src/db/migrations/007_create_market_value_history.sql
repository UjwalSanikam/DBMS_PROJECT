-- 007_create_market_value_history.sql
-- ScoutIQ: MARKET_VALUE_HISTORY (Phase 4 — transfer & contract intelligence)

CREATE TABLE IF NOT EXISTS market_value_history (
  valuation_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  player_id       INT UNSIGNED NOT NULL,
  valuation_date  DATE NOT NULL,
  market_value    DECIMAL(14,2) NOT NULL,
  currency        CHAR(3) NOT NULL DEFAULT 'EUR',
  source_label    VARCHAR(80),
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_valuation_player FOREIGN KEY (player_id)
    REFERENCES player (player_id) ON DELETE CASCADE,

  CONSTRAINT uq_valuation_player_date UNIQUE (player_id, valuation_date),
  CONSTRAINT chk_valuation_value CHECK (market_value >= 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE INDEX idx_valuation_player_date ON market_value_history (player_id, valuation_date);
