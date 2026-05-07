-- supabase/migrations/013_events_google_event_id_constraint.sql
-- Fix: substitui índice parcial por UNIQUE CONSTRAINT completa
-- ON CONFLICT (google_event_id) exige constraint, não partial index
-- SEGURO PARA RE-EXECUTAR: usa DROP IF EXISTS + ADD CONSTRAINT IF NOT EXISTS via DO block

DO $$
BEGIN
  -- Remove o índice parcial criado na migration 012
  DROP INDEX IF EXISTS idx_events_google_id;

  -- Adiciona UNIQUE CONSTRAINT completa (NULLs múltiplos são permitidos pelo SQL standard)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'events_google_event_id_key'
      AND conrelid = 'events'::regclass
  ) THEN
    ALTER TABLE events ADD CONSTRAINT events_google_event_id_key UNIQUE (google_event_id);
  END IF;
END $$;

-- ============================================================
-- ROLLBACK
-- ALTER TABLE events DROP CONSTRAINT IF EXISTS events_google_event_id_key;
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_events_google_id
--   ON events(google_event_id) WHERE google_event_id IS NOT NULL;
-- ============================================================
