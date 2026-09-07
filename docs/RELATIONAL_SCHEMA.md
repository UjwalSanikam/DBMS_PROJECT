# Relational Schema

Notation: `PK` = primary key, `FK` = foreign key, `UK` = unique key.

```text
USER(
  user_id PK, full_name, email UK, password_hash, role,
  created_at, updated_at
)

LEAGUE(
  league_id PK, league_name, country, tier,
  UK(league_name, country)
)

CLUB(
  club_id PK, league_id FK -> LEAGUE.league_id,
  club_name, city, country, founded_year, crest_url
)

PLAYER(
  player_id PK, first_name, last_name, date_of_birth, nationality,
  primary_position, secondary_position, preferred_foot, height_cm,
  photo_url, created_at, updated_at
)

PLAYER_CLUB(
  player_club_id PK,
  player_id FK -> PLAYER.player_id,
  club_id FK -> CLUB.club_id,
  start_date, end_date, shirt_number, is_current
)

PLAYER_STATISTICS(
  stat_id PK,
  player_id FK -> PLAYER.player_id,
  club_id FK -> CLUB.club_id,
  league_id FK -> LEAGUE.league_id,
  season, appearances, starts, minutes_played, goals, assists,
  xg, xa, shots, shots_on_target, key_passes, progressive_passes,
  pass_accuracy, tackles, interceptions, created_at, updated_at,
  UK(player_id, club_id, league_id, season)
)

INJURY(
  injury_id PK, player_id FK -> PLAYER.player_id,
  injury_type, body_area, injury_date, expected_return_date,
  actual_return_date, severity, status, notes, created_at, updated_at
)

CONTRACT(
  contract_id PK,
  player_id FK -> PLAYER.player_id,
  club_id FK -> CLUB.club_id,
  start_date, end_date, weekly_salary, release_clause, currency,
  contract_status, created_at, updated_at
)

TRANSFER(
  transfer_id PK,
  player_id FK -> PLAYER.player_id,
  from_club_id FK -> CLUB.club_id NULL,
  to_club_id FK -> CLUB.club_id NULL,
  transfer_date, transfer_fee, currency, transfer_type, notes, created_at
)

MARKET_VALUE_HISTORY(
  valuation_id PK, player_id FK -> PLAYER.player_id,
  valuation_date, market_value, currency, source_label, created_at,
  UK(player_id, valuation_date)
)

SCOUT_REPORT(
  report_id PK,
  scout_user_id FK -> USER.user_id,
  player_id FK -> PLAYER.player_id,
  overall_rating, strengths, weaknesses, tactical_fit,
  recommendation, notes, created_at, updated_at
)

SHORTLIST(
  shortlist_id PK,
  scout_user_id FK -> USER.user_id,
  player_id FK -> PLAYER.player_id,
  priority, status, reason, created_at, updated_at,
  UK(scout_user_id, player_id)
)

SCHEMA_MIGRATIONS(
  filename PK, applied_at
)
```

## Referential actions

| Child relation | Parent | Delete behavior | Reason |
| --- | --- | --- | --- |
| `club.league_id` | `league` | RESTRICT | A referenced league cannot disappear silently. |
| `player_club.player_id` | `player` | CASCADE | Membership is dependent on the player. |
| `player_club.club_id` | `club` | RESTRICT | Preserve club membership integrity. |
| `player_statistics.player_id` | `player` | CASCADE | Statistics are player-dependent. |
| `player_statistics.club_id` | `club` | RESTRICT | Preserve historical club reference. |
| `player_statistics.league_id` | `league` | RESTRICT | Preserve historical league reference. |
| `injury.player_id` | `player` | CASCADE | Injury records are player-dependent. |
| `contract.player_id` | `player` | CASCADE | Contracts are player-dependent. |
| `contract.club_id` | `club` | RESTRICT | Preserve contractual club reference. |
| `transfer.player_id` | `player` | CASCADE | Transfers are player-dependent. |
| `transfer.from_club_id`, `to_club_id` | `club` | SET NULL | Preserve the transfer even if a club record is removed. |
| `market_value_history.player_id` | `player` | CASCADE | Valuations are player-dependent. |
| `scout_report.scout_user_id` | `user` | CASCADE | Reports belong to a scout account. |
| `scout_report.player_id` | `player` | CASCADE | Reports evaluate a player. |
| `shortlist.scout_user_id` | `user` | CASCADE | Shortlists belong to a scout account. |
| `shortlist.player_id` | `player` | CASCADE | Shortlist entries reference a player. |

## Normalization

The operational schema is designed to third normal form:

- Repeating histories are separated from `player` into statistics, injuries,
  contracts, transfers, valuations, reports, and shortlists.
- Club and league facts are stored once and referenced by foreign keys.
- Many-to-many and time-varying player-club membership is represented by
  `player_club` rather than duplicated player or club columns.
- Non-key descriptive attributes depend on the key of their own relation.
- Derived values such as age, availability, latest value, and months remaining
  are calculated in queries/views instead of stored redundantly.
