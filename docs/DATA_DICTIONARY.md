# Data Dictionary

This dictionary describes the final schema after migrations 001-017. The SQL
migrations remain authoritative if this document and the executable schema ever
differ.

## `user`

| Column | Type | Null | Key/default | Description |
| --- | --- | --- | --- | --- |
| `user_id` | INT UNSIGNED | No | PK, auto increment | Account identifier |
| `full_name` | VARCHAR(120) | No | - | User display name |
| `email` | VARCHAR(190) | No | Unique | Login email |
| `password_hash` | VARCHAR(255) | No | - | bcrypt password hash; never plaintext |
| `role` | ENUM(`ADMIN`,`SCOUT`) | No | `SCOUT` | Authorization role |
| `created_at` | TIMESTAMP | No | Current timestamp | Creation time |
| `updated_at` | TIMESTAMP | No | Auto-updated | Last update time |

Indexes: primary key, unique email, `idx_user_role(role)`.

## `league`

| Column | Type | Null | Key/default | Description |
| --- | --- | --- | --- | --- |
| `league_id` | INT UNSIGNED | No | PK, auto increment | League identifier |
| `league_name` | VARCHAR(120) | No | Composite unique | Competition/league name |
| `country` | VARCHAR(80) | No | Composite unique | Country |
| `tier` | TINYINT UNSIGNED | No | `1` | Domestic competition tier |

Constraint: unique (`league_name`, `country`).

## `club`

| Column | Type | Null | Key/default | Description |
| --- | --- | --- | --- | --- |
| `club_id` | INT UNSIGNED | No | PK, auto increment | Club identifier |
| `league_id` | INT UNSIGNED | No | FK | Current league |
| `club_name` | VARCHAR(120) | No | - | Club name |
| `city` | VARCHAR(80) | Yes | NULL | Home city |
| `country` | VARCHAR(80) | No | - | Home country |
| `founded_year` | SMALLINT UNSIGNED | Yes | NULL | Foundation year |
| `crest_url` | VARCHAR(500) | Yes | NULL | Club crest source URL |

Foreign key: `league_id -> league.league_id` with `ON DELETE RESTRICT`.
Index: `idx_club_league(league_id)`.

## `player`

| Column | Type | Null | Key/default | Description |
| --- | --- | --- | --- | --- |
| `player_id` | INT UNSIGNED | No | PK, auto increment | Player identifier |
| `first_name` | VARCHAR(80) | No | - | Given name |
| `last_name` | VARCHAR(80) | No | - | Family name |
| `date_of_birth` | DATE | No | - | Birth date used to derive age |
| `nationality` | VARCHAR(80) | No | - | Football nationality |
| `primary_position` | Position ENUM | No | - | Primary playing position |
| `secondary_position` | Position ENUM | Yes | NULL | Optional secondary position |
| `preferred_foot` | ENUM(`LEFT`,`RIGHT`,`BOTH`) | No | `RIGHT` | Preferred foot |
| `height_cm` | SMALLINT UNSIGNED | Yes | NULL | Height, constrained to 140-220 cm |
| `photo_url` | VARCHAR(500) | Yes | NULL | Player image source URL |
| `created_at` | TIMESTAMP | No | Current timestamp | Creation time |
| `updated_at` | TIMESTAMP | No | Auto-updated | Last update time |

Position values: `GK`, `CB`, `LB`, `RB`, `LWB`, `RWB`, `DM`, `CM`, `AM`,
`LW`, `RW`, `ST`. Indexes: `idx_player_position(primary_position)` and
`idx_player_dob(date_of_birth)`.

## `player_club`

| Column | Type | Null | Key/default | Description |
| --- | --- | --- | --- | --- |
| `player_club_id` | INT UNSIGNED | No | PK, auto increment | Membership identifier |
| `player_id` | INT UNSIGNED | No | FK | Player |
| `club_id` | INT UNSIGNED | No | FK | Club |
| `start_date` | DATE | No | - | Membership start |
| `end_date` | DATE | Yes | NULL | Membership end |
| `shirt_number` | TINYINT UNSIGNED | Yes | NULL | Squad number |
| `is_current` | BOOLEAN | No | TRUE | Whether membership is current |

Constraint: `end_date` must be NULL or after `start_date`.
Indexes: player, club, and (`player_id`, `is_current`).

## `player_statistics`

| Column | Type | Null | Default | Description |
| --- | --- | --- | --- | --- |
| `stat_id` | INT UNSIGNED | No | PK, auto increment | Statistics row identifier |
| `player_id` | INT UNSIGNED | No | FK | Player |
| `club_id` | INT UNSIGNED | No | FK | Club represented that season |
| `league_id` | INT UNSIGNED | No | FK | League represented that season |
| `season` | VARCHAR(9) | No | - | Season such as `2025-2026` |
| `appearances` | SMALLINT UNSIGNED | No | 0 | Appearances |
| `starts` | SMALLINT UNSIGNED | No | 0 | Starts; cannot exceed appearances |
| `minutes_played` | INT UNSIGNED | No | 0 | Minutes played |
| `goals` | SMALLINT UNSIGNED | No | 0 | Goals |
| `assists` | SMALLINT UNSIGNED | No | 0 | Assists |
| `xg` | DECIMAL(6,2) | No | 0 | Expected goals |
| `xa` | DECIMAL(6,2) | No | 0 | Expected assists |
| `shots` | SMALLINT UNSIGNED | No | 0 | Total shots |
| `shots_on_target` | SMALLINT UNSIGNED | No | 0 | Shots on target; cannot exceed shots |
| `key_passes` | SMALLINT UNSIGNED | No | 0 | Key passes |
| `progressive_passes` | SMALLINT UNSIGNED | No | 0 | Progressive passes |
| `pass_accuracy` | DECIMAL(5,2) | No | 0 | Pass accuracy, constrained to 0-100 |
| `tackles` | SMALLINT UNSIGNED | No | 0 | Tackles |
| `interceptions` | SMALLINT UNSIGNED | No | 0 | Interceptions |
| `created_at` | TIMESTAMP | No | Current timestamp | Creation time |
| `updated_at` | TIMESTAMP | No | Auto-updated | Last update time |

Unique key: (`player_id`, `club_id`, `league_id`, `season`). Indexes cover
player-season, club, and league.

## `injury`

| Column | Type | Null | Default | Description |
| --- | --- | --- | --- | --- |
| `injury_id` | INT UNSIGNED | No | PK, auto increment | Injury identifier |
| `player_id` | INT UNSIGNED | No | FK | Injured player |
| `injury_type` | VARCHAR(120) | No | - | Injury description |
| `body_area` | VARCHAR(80) | No | - | Affected body area |
| `injury_date` | DATE | No | - | Date sustained |
| `expected_return_date` | DATE | Yes | NULL | Expected return; not before injury date |
| `actual_return_date` | DATE | Yes | NULL | Actual return; not before injury date |
| `severity` | ENUM(`MINOR`,`MODERATE`,`MAJOR`) | No | - | Severity classification |
| `status` | ENUM(`ACTIVE`,`RECOVERING`,`RECOVERED`) | No | `ACTIVE` | Recovery state |
| `notes` | TEXT | Yes | NULL | Supporting notes |
| `created_at` | TIMESTAMP | No | Current timestamp | Creation time |
| `updated_at` | TIMESTAMP | No | Auto-updated | Last update time |

Date validity is enforced by both check constraints and insert/update triggers.

## `contract`

| Column | Type | Null | Default | Description |
| --- | --- | --- | --- | --- |
| `contract_id` | INT UNSIGNED | No | PK, auto increment | Contract identifier |
| `player_id` | INT UNSIGNED | No | FK | Contracted player |
| `club_id` | INT UNSIGNED | No | FK | Contracting club |
| `start_date` | DATE | No | - | Contract start |
| `end_date` | DATE | No | - | Contract end; must follow start |
| `weekly_salary` | DECIMAL(12,2) | Yes | NULL | Non-negative weekly salary |
| `release_clause` | DECIMAL(14,2) | Yes | NULL | Non-negative release clause |
| `currency` | CHAR(3) | No | `EUR` | ISO-style currency code |
| `contract_status` | ENUM(`ACTIVE`,`EXPIRED`,`TERMINATED`) | No | `ACTIVE` | Contract state |
| `created_at` | TIMESTAMP | No | Current timestamp | Creation time |
| `updated_at` | TIMESTAMP | No | Auto-updated | Last update time |

Indexes: (`player_id`, `end_date`) and `end_date`. Check constraints and
triggers enforce date and value validity. A scheduled event marks past active
contracts expired.

## `transfer`

| Column | Type | Null | Default | Description |
| --- | --- | --- | --- | --- |
| `transfer_id` | INT UNSIGNED | No | PK, auto increment | Transfer identifier |
| `player_id` | INT UNSIGNED | No | FK | Transferred player |
| `from_club_id` | INT UNSIGNED | Yes | FK/NULL | Origin club |
| `to_club_id` | INT UNSIGNED | Yes | FK/NULL | Destination club |
| `transfer_date` | DATE | No | - | Effective date |
| `transfer_fee` | DECIMAL(14,2) | Yes | NULL | Non-negative fee |
| `currency` | CHAR(3) | No | `EUR` | Fee currency |
| `transfer_type` | Transfer ENUM | No | - | Transfer classification |
| `notes` | TEXT | Yes | NULL | Supporting notes |
| `created_at` | TIMESTAMP | No | Current timestamp | Creation time |

Transfer values: `PERMANENT`, `LOAN`, `FREE`, `LOAN_RETURN`,
`ACADEMY_PROMOTION`. The stored procedure `sp_record_transfer` updates transfer
and current-club data atomically.

## `market_value_history`

| Column | Type | Null | Default | Description |
| --- | --- | --- | --- | --- |
| `valuation_id` | INT UNSIGNED | No | PK, auto increment | Valuation identifier |
| `player_id` | INT UNSIGNED | No | FK | Valued player |
| `valuation_date` | DATE | No | - | Effective valuation date |
| `market_value` | DECIMAL(14,2) | No | - | Non-negative value |
| `currency` | CHAR(3) | No | `EUR` | Value currency |
| `source_label` | VARCHAR(80) | Yes | NULL | Data source label |
| `created_at` | TIMESTAMP | No | Current timestamp | Creation time |

Unique key and index: (`player_id`, `valuation_date`).

## `scout_report`

| Column | Type | Null | Default | Description |
| --- | --- | --- | --- | --- |
| `report_id` | INT UNSIGNED | No | PK, auto increment | Report identifier |
| `scout_user_id` | INT UNSIGNED | No | FK | Authoring user |
| `player_id` | INT UNSIGNED | No | FK | Evaluated player |
| `overall_rating` | DECIMAL(3,1) | No | - | Rating constrained to 1.0-10.0 |
| `strengths` | TEXT | Yes | NULL | Positive assessment |
| `weaknesses` | TEXT | Yes | NULL | Risk assessment |
| `tactical_fit` | TEXT | Yes | NULL | Tactical suitability |
| `recommendation` | Recommendation ENUM | No | - | Scout recommendation |
| `notes` | TEXT | Yes | NULL | Additional notes |
| `created_at` | TIMESTAMP | No | Current timestamp | Creation time |
| `updated_at` | TIMESTAMP | No | Auto-updated | Last update time |

Recommendation values: `AVOID`, `MONITOR`, `SHORTLIST`, `PRIORITY`.

## `shortlist`

| Column | Type | Null | Default | Description |
| --- | --- | --- | --- | --- |
| `shortlist_id` | INT UNSIGNED | No | PK, auto increment | Shortlist entry identifier |
| `scout_user_id` | INT UNSIGNED | No | FK | Owning user |
| `player_id` | INT UNSIGNED | No | FK | Candidate player |
| `priority` | ENUM(`LOW`,`MEDIUM`,`HIGH`) | No | `MEDIUM` | Recruitment priority |
| `status` | Status ENUM | No | `WATCHING` | Recruitment workflow state |
| `reason` | TEXT | Yes | NULL | Reason for inclusion/status |
| `created_at` | TIMESTAMP | No | Current timestamp | Creation time |
| `updated_at` | TIMESTAMP | No | Auto-updated | Last update time |

Status values: `WATCHING`, `RECOMMENDED`, `CONTACT_CLUB`, `NEGOTIATING`,
`REJECTED`, `SIGNED`. Unique key: (`scout_user_id`, `player_id`).

## `schema_migrations`

| Column | Type | Null | Key/default | Description |
| --- | --- | --- | --- | --- |
| `filename` | VARCHAR(255) | No | PK | Applied migration filename |
| `applied_at` | TIMESTAMP | No | Current timestamp | Application time |

This table is created by the migration runner before migration files are read.

## Qdrant collection `player_profiles`

| Field | Type | Description |
| --- | --- | --- |
| Point ID | Integer | Same identifier as MySQL `player.player_id` |
| Vector | 10 floating-point values | Z-score normalized playing-style features |
| `player_id` | Payload integer | MySQL player identifier |
| `player_name` | Payload string | Display name |
| `primary_position` | Payload string | Position and optional search filter |
| `season` | Payload string | Vector season |
| `club_id` | Payload integer/null | Current club identifier |

Distance metric: cosine similarity. MySQL is authoritative; this collection is
a rebuildable derived index.
