-- supabase/scripts/backfill_call_logs_lead_id.sql
-- Story 1.2.6 — Backfill call_logs.lead_id a partir de lead_name
-- Script único (não recorrente) — seguro re-executar (só atualiza lead_id IS NULL)

BEGIN;

-- Match case-insensitive: lead_name → leads.id
UPDATE call_logs cl
SET lead_id = l.id
FROM leads l
WHERE LOWER(cl.lead_name) = LOWER(l.name)
  AND cl.lead_id IS NULL;

-- Relatório: matched vs unmatched
SELECT
  COUNT(*) FILTER (WHERE lead_id IS NOT NULL) AS matched,
  COUNT(*) FILTER (WHERE lead_id IS NULL)     AS unmatched,
  COUNT(*)                                    AS total
FROM call_logs;

COMMIT;
