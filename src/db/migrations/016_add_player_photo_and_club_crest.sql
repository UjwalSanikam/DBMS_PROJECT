-- 016_add_player_photo_and_club_crest.sql
-- Adds real-world image support: player photo URL (from source dataset,
-- hotlinked, never downloaded/stored) and a club crest URL.

ALTER TABLE player
  ADD COLUMN photo_url VARCHAR(500) NULL AFTER height_cm;

ALTER TABLE club
  ADD COLUMN crest_url VARCHAR(500) NULL AFTER founded_year;