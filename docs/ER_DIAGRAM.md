# Entity-Relationship Diagram

The diagram represents the physical MySQL tables created by
`src/db/migrations`. Derived views and the Qdrant collection are shown
separately because they are not independent relational entities.

```mermaid
erDiagram
    USER {
        int user_id PK
        varchar full_name
        varchar email UK
        varchar password_hash
        enum role
    }
    LEAGUE {
        int league_id PK
        varchar league_name
        varchar country
        tinyint tier
    }
    CLUB {
        int club_id PK
        int league_id FK
        varchar club_name
        varchar country
        varchar crest_url
    }
    PLAYER {
        int player_id PK
        varchar first_name
        varchar last_name
        date date_of_birth
        enum primary_position
        varchar photo_url
    }
    PLAYER_CLUB {
        int player_club_id PK
        int player_id FK
        int club_id FK
        date start_date
        date end_date
        boolean is_current
    }
    PLAYER_STATISTICS {
        int stat_id PK
        int player_id FK
        int club_id FK
        int league_id FK
        varchar season
        int minutes_played
        decimal xg
        decimal xa
    }
    INJURY {
        int injury_id PK
        int player_id FK
        date injury_date
        date expected_return_date
        enum severity
        enum status
    }
    CONTRACT {
        int contract_id PK
        int player_id FK
        int club_id FK
        date start_date
        date end_date
        decimal weekly_salary
        enum contract_status
    }
    TRANSFER {
        int transfer_id PK
        int player_id FK
        int from_club_id FK
        int to_club_id FK
        date transfer_date
        decimal transfer_fee
        enum transfer_type
    }
    MARKET_VALUE_HISTORY {
        int valuation_id PK
        int player_id FK
        date valuation_date
        decimal market_value
        char currency
    }
    SCOUT_REPORT {
        int report_id PK
        int scout_user_id FK
        int player_id FK
        decimal overall_rating
        enum recommendation
    }
    SHORTLIST {
        int shortlist_id PK
        int scout_user_id FK
        int player_id FK
        enum priority
        enum status
    }

    LEAGUE ||--o{ CLUB : contains
    LEAGUE ||--o{ PLAYER_STATISTICS : classifies
    CLUB ||--o{ PLAYER_CLUB : has_membership
    PLAYER ||--o{ PLAYER_CLUB : joins
    CLUB ||--o{ PLAYER_STATISTICS : records_for
    PLAYER ||--o{ PLAYER_STATISTICS : produces
    PLAYER ||--o{ INJURY : experiences
    CLUB ||--o{ CONTRACT : offers
    PLAYER ||--o{ CONTRACT : signs
    PLAYER ||--o{ TRANSFER : undergoes
    CLUB o|--o{ TRANSFER : source_club
    CLUB o|--o{ TRANSFER : destination_club
    PLAYER ||--o{ MARKET_VALUE_HISTORY : receives
    USER ||--o{ SCOUT_REPORT : writes
    PLAYER ||--o{ SCOUT_REPORT : evaluated_in
    USER ||--o{ SHORTLIST : owns
    PLAYER ||--o{ SHORTLIST : appears_in
```

## Derived database objects

- `schema_migrations` records applied migration filenames.
- `vw_latest_market_values` returns the latest valuation per player.
- `vw_available_players` excludes active or recovering injuries.
- `vw_contract_expiry` returns current, non-expired active contracts.
- `vw_u23_recruitment_candidates` combines age, value, contract, and availability.
- `vw_player_recruitment_snapshot` combines the principal recruitment fields.
- Qdrant collection `player_profiles` stores a vector keyed by `player_id`.

The Qdrant `player_id` is an application-level reference to `PLAYER.player_id`;
it is not a MySQL foreign key because it exists in a different database system.
