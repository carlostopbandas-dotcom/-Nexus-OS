-- supabase/migrations/003_schema_hardening.sql
-- Story 1.2.5 — Schema Hardening
-- DEPENDÊNCIA: 002_security_foundation.sql deve ter sido aplicado
--
-- SEGURO PARA RE-EXECUTAR: usa IF NOT EXISTS / IF EXISTS em todos os DDL

-- ============================================================
-- PRÉ-CHECK: verificar duplicatas em leads.email antes de UNIQUE
-- Execute manualmente se necessário:
--   SELECT email, COUNT(*) FROM leads GROUP BY email HAVING COUNT(*) > 1;
-- Se houver duplicatas, limpar antes de aplicar esta migration.
-- ============================================================

-- 1. Adicionar updated_at em todas as 7 tabelas
ALTER TABLE leads         ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE tasks         ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE events        ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE call_logs     ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE okrs          ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE store_metrics ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Trigger function para auto-updated_at (idempotente via CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Aplicar trigger em todas as tabelas (idempotente via DROP IF EXISTS antes)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['leads','tasks','events','call_logs','okrs','content_posts','store_metrics']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON %I',
      t || '_updated_at', t
    );
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t || '_updated_at', t
    );
  END LOOP;
END $$;

-- 4. FK lead_id em call_logs (nova coluna opcional — lead_name permanece por compatibilidade)
ALTER TABLE call_logs
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES leads(id) ON DELETE SET NULL;

-- 5. UNIQUE em leads.email (verificar duplicatas antes com o PRÉ-CHECK acima)
ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_email_unique;
ALTER TABLE leads
  ADD CONSTRAINT leads_email_unique UNIQUE (email);

-- 6. CHECK constraints

-- leads.status — valores válidos em português (alinhado com frontend LeadStatus enum)
ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_status_valid;
ALTER TABLE leads
  ADD CONSTRAINT leads_status_valid
  CHECK (status IS NULL OR status IN (
    'Novo', 'Contatado', 'Diagnóstico Agendado', 'Proposta Enviada', 'Vendido', 'Perdido'
  ));

-- tasks.type — 1-3-5 rule
ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS tasks_type_valid;
ALTER TABLE tasks
  ADD CONSTRAINT tasks_type_valid
  CHECK (type IN ('Big Rock', 'Medium', 'Small'));

-- okrs.progress — range 0-100
ALTER TABLE okrs
  DROP CONSTRAINT IF EXISTS okrs_progress_range;
ALTER TABLE okrs
  ADD CONSTRAINT okrs_progress_range
  CHECK (progress >= 0 AND progress <= 100);

-- okrs.key_results — deve ser array JSONB
ALTER TABLE okrs
  DROP CONSTRAINT IF EXISTS okrs_key_results_array;
ALTER TABLE okrs
  ADD CONSTRAINT okrs_key_results_array
  CHECK (key_results IS NULL OR jsonb_typeof(key_results) = 'array');
