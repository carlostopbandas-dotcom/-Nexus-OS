-- supabase/migrations/012_google_calendar.sql
-- Story 2.7 — Integração Google Calendar bidirecional
-- DEPENDÊNCIA: 001_initial_schema.sql (tabela events), 006_multi_user_rls.sql (get_my_role)
-- SEGURO PARA RE-EXECUTAR: usa IF NOT EXISTS + ADD COLUMN IF NOT EXISTS

-- ============================================================
-- 1. COLUNA google_event_id NA TABELA events
-- ============================================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS google_event_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_google_id
  ON events(google_event_id)
  WHERE google_event_id IS NOT NULL;

-- ============================================================
-- 2. TABELA calendar_sync_log
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_sync_log (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  status     text NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  imported   integer NOT NULL DEFAULT 0,
  exported   integer NOT NULL DEFAULT 0,
  error_msg  text,
  synced_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_synced_at
  ON calendar_sync_log (synced_at DESC);

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE calendar_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ceo_all_calendar_sync_log" ON calendar_sync_log;
CREATE POLICY "ceo_all_calendar_sync_log" ON calendar_sync_log
  FOR ALL USING (get_my_role() = 'ceo');

-- ============================================================
-- ROLLBACK
-- DROP TABLE IF EXISTS calendar_sync_log CASCADE;
-- DROP INDEX IF EXISTS idx_events_google_id;
-- ALTER TABLE events DROP COLUMN IF EXISTS google_event_id;
-- ============================================================
