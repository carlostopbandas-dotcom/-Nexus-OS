-- supabase/migrations/001_initial_schema.sql
-- CAPTURA DO ESTADO ATUAL — sem alterações estruturais
-- Story 1.0.1 — Sprint 0 — 2026-03-17
-- Fonte: docs/architecture/db-specialist-review.md#3.1

-- leads
CREATE TABLE IF NOT EXISTS leads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text,
  source      text,
  status      text,
  value       numeric,
  product     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- tasks
CREATE TABLE IF NOT EXISTS tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  type        text NOT NULL,
  completed   boolean NOT NULL DEFAULT false,
  category    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- events
CREATE TABLE IF NOT EXISTS events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  start_time  text NOT NULL,
  end_time    text,
  type        text,
  attendees   text[],
  day_offset  integer,
  created_at  timestamptz DEFAULT now()
);

-- call_logs
-- Nota: lead_name é TEXT livre (sem FK) — corrigir em Story 1.2.6
-- Nota: date e duration são TEXT (sem tipo) — corrigir em Story 1.2.5
CREATE TABLE IF NOT EXISTS call_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_name           text NOT NULL,
  date                text,
  duration            text,
  type                text,
  status              text,
  sentiment           text,
  transcript_snippet  text,
  summary             text,
  recording_url       text,
  created_at          timestamptz DEFAULT now()
);

-- okrs
CREATE TABLE IF NOT EXISTS okrs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit        text NOT NULL,
  objective   text NOT NULL,
  progress    integer NOT NULL DEFAULT 0,
  key_results jsonb,
  created_at  timestamptz DEFAULT now()
);

-- content_posts
CREATE TABLE IF NOT EXISTS content_posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform      text NOT NULL,
  content       text NOT NULL,
  image_prompt  text,
  status        text,
  date          text,
  stats         jsonb,
  created_at    timestamptz DEFAULT now()
);

-- store_metrics
CREATE TABLE IF NOT EXISTS store_metrics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name  text NOT NULL,
  sales       numeric,
  spend       numeric,
  roas        numeric,
  date        date NOT NULL,
  created_at  timestamptz DEFAULT now()
);
