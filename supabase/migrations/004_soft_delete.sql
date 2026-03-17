-- supabase/migrations/004_soft_delete.sql
-- Story 1.2.7 — Soft Delete em leads e call_logs
-- DEPENDÊNCIA: 003_schema_hardening.sql deve ter sido aplicado
-- SEGURO PARA RE-EXECUTAR: usa IF NOT EXISTS / CREATE OR REPLACE

-- 1. Adicionar deleted_at nas tabelas
ALTER TABLE leads     ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2. Views que filtram registros deletados
CREATE OR REPLACE VIEW active_leads AS
  SELECT * FROM leads WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_call_logs AS
  SELECT * FROM call_logs WHERE deleted_at IS NULL;
