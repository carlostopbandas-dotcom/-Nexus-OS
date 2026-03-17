-- supabase/migrations/002_security_foundation.sql
-- DEPENDÊNCIA: 001_initial_schema.sql deve existir primeiro
-- DEPENDÊNCIA: Supabase Auth deve estar configurado (Story 1.1.1)
-- RISCO: Execute APENAS após confirmar que auth.uid() retorna UUID válido
-- Story 1.1.3 — Sprint 1 — 2026-03-17

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE leads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE okrs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_metrics   ENABLE ROW LEVEL SECURITY;

-- 2. Policy single-user (owner_all) em todas as tabelas
-- Permite qualquer operação para qualquer usuário autenticado
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'leads','tasks','events','call_logs',
    'okrs','content_posts','store_metrics'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY "owner_all" ON %I FOR ALL USING (auth.uid() IS NOT NULL)',
      t
    );
  END LOOP;
END $$;

-- Verificação pós-execução:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- Deve mostrar rowsecurity = true para todas as 7 tabelas

-- Rollback de emergência (se app quebrar):
-- ALTER TABLE leads           DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks           DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE events          DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE call_logs       DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE okrs            DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE content_posts   DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE store_metrics   DISABLE ROW LEVEL SECURITY;
