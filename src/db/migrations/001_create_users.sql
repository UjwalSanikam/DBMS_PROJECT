-- 001_create_users.sql
-- ScoutIQ: USER table (Phase 1 — authentication & roles)

CREATE TABLE IF NOT EXISTS `user` (
  user_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(120)        NOT NULL,
  email         VARCHAR(190)        NOT NULL,
  password_hash VARCHAR(255)        NOT NULL,
  role          ENUM('ADMIN', 'SCOUT') NOT NULL DEFAULT 'SCOUT',
  created_at    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_email UNIQUE (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Speeds up "find by email" during login (also enforced unique above).
CREATE INDEX idx_user_role ON `user` (role);
