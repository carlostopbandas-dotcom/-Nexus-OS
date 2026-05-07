-- supabase/migrations/010_ads_cache.sql
-- Story 2.2 — Integração Facebook Ads API: cache de campanhas VcChic BM
-- DEPENDÊNCIA: 006_multi_user_rls.sql (get_my_role() e user_profiles)
-- SEGURO PARA RE-EXECUTAR: usa IF NOT EXISTS

-- ============================================================
-- 1. TABELA ads_campaigns_cache
-- ============================================================

CREATE TABLE IF NOT EXISTS ads_campaigns_cache (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source        text NOT NULL CHECK (source IN ('facebook', 'google')),
  store_name    text NOT NULL CHECK (store_name IN ('vcchic', 'moriel', 'sezo')),
  campaign_id   text NOT NULL,
  campaign_name text NOT NULL,
  spend         numeric(12,2) NOT NULL DEFAULT 0,
  impressions   bigint,
  clicks        bigint,
  date_start    date NOT NULL,
  date_end      date NOT NULL,
  fetched_at    timestamptz DEFAULT now(),
  created_at    timestamptz DEFAULT now(),
  UNIQUE (source, campaign_id, date_start, date_end)
);

-- ============================================================
-- 2. TABELA ads_sync_log
-- ============================================================

CREATE TABLE IF NOT EXISTS ads_sync_log (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source     text NOT NULL CHECK (source IN ('facebook', 'google')),
  store_name text NOT NULL,
  status     text NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  records    integer,
  error_msg  text,
  synced_at  timestamptz DEFAULT now()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ads_cache_store_date
  ON ads_campaigns_cache (source, store_name, date_start);

CREATE INDEX IF NOT EXISTS idx_ads_sync_log_store_date
  ON ads_sync_log (source, store_name, synced_at DESC);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE ads_campaigns_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_sync_log ENABLE ROW LEVEL SECURITY;

-- CEO: acesso total
DROP POLICY IF EXISTS "ceo_all_ads_cache" ON ads_campaigns_cache;
CREATE POLICY "ceo_all_ads_cache" ON ads_campaigns_cache
  FOR ALL USING (get_my_role() = 'ceo');

DROP POLICY IF EXISTS "ceo_all_ads_sync_log" ON ads_sync_log;
CREATE POLICY "ceo_all_ads_sync_log" ON ads_sync_log
  FOR ALL USING (get_my_role() = 'ceo');

-- gestor_vcchic: somente leitura
DROP POLICY IF EXISTS "gestor_vcchic_select_ads_cache" ON ads_campaigns_cache;
CREATE POLICY "gestor_vcchic_select_ads_cache" ON ads_campaigns_cache
  FOR SELECT USING (get_my_role() = 'gestor_vcchic');

DROP POLICY IF EXISTS "gestor_vcchic_select_ads_sync_log" ON ads_sync_log;
CREATE POLICY "gestor_vcchic_select_ads_sync_log" ON ads_sync_log
  FOR SELECT USING (get_my_role() = 'gestor_vcchic');

-- ============================================================
-- ROLLBACK
-- DROP TABLE IF EXISTS ads_campaigns_cache CASCADE;
-- DROP TABLE IF EXISTS ads_sync_log CASCADE;
-- ============================================================
