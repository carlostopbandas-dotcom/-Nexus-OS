-- Migration 005: Performance Indexes para access patterns frequentes
-- Story 1.3.7 | Sprint 3
-- Source: docs/architecture/db-specialist-review.md#34-migration-004--performance-indexes
--
-- Todos os índices criados com CONCURRENTLY (sem lock de tabela)
-- Podem ser executados com o app em produção sem downtime.

-- 1. leads: queries por data (dashboard recente) e status (kanban)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_created_at
  ON leads (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_status
  ON leads (status) WHERE status IS NOT NULL;

-- 2. tasks: apenas tasks pendentes aparecem na UI principal
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_pending
  ON tasks (created_at DESC) WHERE completed = false;

-- 3. call_logs: queries por data e por lead associado
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_call_logs_created_at
  ON call_logs (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_call_logs_lead_id
  ON call_logs (lead_id) WHERE lead_id IS NOT NULL;

-- 4. store_metrics: queries por data (dashboards Shopify)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_store_metrics_date
  ON store_metrics (date DESC);

-- 5. events: queries por day_offset (agenda/rotina)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_day_offset
  ON events (day_offset) WHERE day_offset IS NOT NULL;

-- 6. okrs: GIN index para buscas futuras no JSONB key_results
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_okrs_key_results_gin
  ON okrs USING GIN (key_results);
