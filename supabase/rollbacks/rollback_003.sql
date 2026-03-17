-- supabase/rollbacks/rollback_003.sql
-- Rollback da migration 003_schema_hardening.sql
-- Story 1.2.5
--
-- ATENÇÃO: Execute APENAS se precisar reverter a migration 003.
-- Após rollback, os dados em leads.updated_at etc. serão perdidos.

-- 1. Remover CHECK constraints
ALTER TABLE okrs   DROP CONSTRAINT IF EXISTS okrs_key_results_array;
ALTER TABLE okrs   DROP CONSTRAINT IF EXISTS okrs_progress_range;
ALTER TABLE tasks  DROP CONSTRAINT IF EXISTS tasks_type_valid;
ALTER TABLE leads  DROP CONSTRAINT IF EXISTS leads_status_valid;
ALTER TABLE leads  DROP CONSTRAINT IF EXISTS leads_email_unique;

-- 2. Remover FK lead_id de call_logs
ALTER TABLE call_logs DROP COLUMN IF EXISTS lead_id;

-- 3. Remover triggers
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['leads','tasks','events','call_logs','okrs','content_posts','store_metrics']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', t || '_updated_at', t);
  END LOOP;
END $$;

-- 4. Remover trigger function (apenas se não há outros triggers usando ela)
DROP FUNCTION IF EXISTS set_updated_at();

-- 5. Remover colunas updated_at
ALTER TABLE store_metrics DROP COLUMN IF EXISTS updated_at;
ALTER TABLE content_posts DROP COLUMN IF EXISTS updated_at;
ALTER TABLE okrs          DROP COLUMN IF EXISTS updated_at;
ALTER TABLE call_logs     DROP COLUMN IF EXISTS updated_at;
ALTER TABLE events        DROP COLUMN IF EXISTS updated_at;
ALTER TABLE tasks         DROP COLUMN IF EXISTS updated_at;
ALTER TABLE leads         DROP COLUMN IF EXISTS updated_at;
