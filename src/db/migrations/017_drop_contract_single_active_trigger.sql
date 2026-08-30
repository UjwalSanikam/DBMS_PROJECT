-- 017_drop_contract_single_active_trigger.sql
-- Removes trg_contract_single_active_after_insert (added in 015).
--
-- MySQL does not allow a trigger to modify the same table that the
-- invoking statement is already writing to (error 1442,
-- ER_CANT_UPDATE_USED_TABLE_IN_SF_OR_TRG). This AFTER INSERT trigger on
-- `contract` tried to UPDATE `contract`, which fails on every INSERT into
-- `contract` with the default ACTIVE status -- not just bulk imports, any
-- ordinary single-row insert from the app hits the same error.
--
-- The "only one ACTIVE contract per player" invariant is now enforced in
-- application code instead: immediately before inserting a new ACTIVE
-- contract, the write path first runs
--   UPDATE contract SET contract_status = 'EXPIRED'
--   WHERE player_id = ? AND contract_status = 'ACTIVE'
-- in the same request/transaction. See:
--   - src/app/api/players/[id]/contracts/route.ts (POST)
--   - src/scripts/import-transfermarkt.ts

DROP TRIGGER IF EXISTS trg_contract_single_active_after_insert;
