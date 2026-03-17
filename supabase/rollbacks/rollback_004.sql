-- supabase/rollbacks/rollback_004.sql
-- Rollback da migration 004_soft_delete.sql
-- Story 1.2.7

DROP VIEW IF EXISTS active_call_logs;
DROP VIEW IF EXISTS active_leads;
ALTER TABLE call_logs DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE leads     DROP COLUMN IF EXISTS deleted_at;
