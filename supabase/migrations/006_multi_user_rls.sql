-- supabase/migrations/006_multi_user_rls.sql
-- Story 2.1 — Multi-usuário: sistema de perfis + RLS por papel
-- DEPENDÊNCIA: 005_performance_indexes.sql deve ter sido aplicado
-- DEPENDÊNCIA: Supabase Auth ativo (login funcional)
-- SEGURO PARA RE-EXECUTAR: usa IF NOT EXISTS / DROP IF EXISTS em todos os DDL
--
-- MODELO: Role-Level RLS (não row-level)
-- Carlos é o único dono dos dados. Outros usuários têm acesso por papel,
-- não por propriedade de linha.
--
-- PAPÉIS:
--   ceo            → acesso total (Carlos)
--   gestor_vcchic  → lê dados VcChic (store_metrics, okrs VcChic, financeiro VcChic)
--   vendedor_sdr   → lê/escreve leads 3D + call_logs próprios
--   assistente     → lê leads, events, tasks (sem financeiro, sem call_logs)
--
-- PRÉ-CHECK antes de executar:
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
--   Deve mostrar rowsecurity = true para todas as tabelas.
--
-- ROLLBACK: ver seção ao final do arquivo

-- ============================================================
-- 1. TABELA user_profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role         text NOT NULL CHECK (role IN ('ceo','gestor_vcchic','vendedor_sdr','assistente')),
  full_name    text,
  email        text,
  onboarded_at timestamptz,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Trigger updated_at (reutiliza função criada em 003_schema_hardening.sql)
DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Habilitar RLS na nova tabela
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. FUNÇÃO HELPER get_my_role()
-- Executada UMA vez por query (STABLE) — evita lookup por linha.
-- SECURITY DEFINER: lê user_profiles mesmo sem policy SELECT explícita.
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid()
$$;

-- ============================================================
-- 3. REMOVER POLICY SINGLE-USER (owner_all de 002_security_foundation.sql)
-- ============================================================

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'leads','tasks','events','call_logs',
    'okrs','content_posts','store_metrics'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "owner_all" ON %I', t);
  END LOOP;
END $$;

-- ============================================================
-- 4. POLICIES POR TABELA
-- PostgreSQL usa OR entre policies do mesmo tipo — uma basta para permitir acesso.
-- ============================================================

-- ─── leads ───────────────────────────────────────────────────
-- CEO: tudo | vendedor_sdr: lê + cria + edita | assistente: apenas lê
CREATE POLICY "leads_ceo"
  ON leads FOR ALL
  USING (get_my_role() = 'ceo');

CREATE POLICY "leads_vendedor_select"
  ON leads FOR SELECT
  USING (get_my_role() = 'vendedor_sdr');

CREATE POLICY "leads_vendedor_insert"
  ON leads FOR INSERT
  WITH CHECK (get_my_role() = 'vendedor_sdr');

CREATE POLICY "leads_vendedor_update"
  ON leads FOR UPDATE
  USING (get_my_role() = 'vendedor_sdr');

CREATE POLICY "leads_assistente_select"
  ON leads FOR SELECT
  USING (get_my_role() = 'assistente');

-- ─── tasks ───────────────────────────────────────────────────
-- CEO: tudo | assistente: lê todas + edita (para marcar como concluída)
-- NOTA: coluna assigned_to adicionada em migration futura para filtro granular
CREATE POLICY "tasks_ceo"
  ON tasks FOR ALL
  USING (get_my_role() = 'ceo');

CREATE POLICY "tasks_assistente_select"
  ON tasks FOR SELECT
  USING (get_my_role() = 'assistente');

CREATE POLICY "tasks_assistente_update"
  ON tasks FOR UPDATE
  USING (get_my_role() = 'assistente');

-- ─── events ──────────────────────────────────────────────────
-- CEO: tudo | assistente: lê + cria (agenda delegada)
CREATE POLICY "events_ceo"
  ON events FOR ALL
  USING (get_my_role() = 'ceo');

CREATE POLICY "events_assistente_select"
  ON events FOR SELECT
  USING (get_my_role() = 'assistente');

CREATE POLICY "events_assistente_insert"
  ON events FOR INSERT
  WITH CHECK (get_my_role() = 'assistente');

-- ─── call_logs ───────────────────────────────────────────────
-- CEO: tudo | vendedor_sdr: lê + cria (sem editar registros alheios)
-- NOTA: coluna created_by adicionada em migration futura para filtro por autor
CREATE POLICY "call_logs_ceo"
  ON call_logs FOR ALL
  USING (get_my_role() = 'ceo');

CREATE POLICY "call_logs_vendedor_select"
  ON call_logs FOR SELECT
  USING (get_my_role() = 'vendedor_sdr');

CREATE POLICY "call_logs_vendedor_insert"
  ON call_logs FOR INSERT
  WITH CHECK (get_my_role() = 'vendedor_sdr');

-- ─── okrs ────────────────────────────────────────────────────
-- CEO: tudo | gestor_vcchic: lê OKRs das unidades VcChic
CREATE POLICY "okrs_ceo"
  ON okrs FOR ALL
  USING (get_my_role() = 'ceo');

CREATE POLICY "okrs_gestor_vcchic_select"
  ON okrs FOR SELECT
  USING (
    get_my_role() = 'gestor_vcchic'
    AND unit IN ('VcChic','Moriel','Sezo','Grupo VcChic')
  );

-- ─── content_posts ───────────────────────────────────────────
-- CEO apenas — conteúdo estratégico não compartilhado
CREATE POLICY "content_posts_ceo"
  ON content_posts FOR ALL
  USING (get_my_role() = 'ceo');

-- ─── store_metrics ───────────────────────────────────────────
-- CEO: tudo | gestor_vcchic: lê todas as lojas do grupo
CREATE POLICY "store_metrics_ceo"
  ON store_metrics FOR ALL
  USING (get_my_role() = 'ceo');

CREATE POLICY "store_metrics_gestor_vcchic_select"
  ON store_metrics FOR SELECT
  USING (get_my_role() = 'gestor_vcchic');

-- ─── user_profiles ───────────────────────────────────────────
-- CEO: lê todos os perfis (para gestão de usuários)
-- Cada usuário: lê e atualiza o próprio perfil
CREATE POLICY "user_profiles_ceo"
  ON user_profiles FOR ALL
  USING (get_my_role() = 'ceo');

CREATE POLICY "user_profiles_own_select"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "user_profiles_own_update"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- ============================================================
-- 5. INSERIR PERFIL DO CEO (Carlos)
-- ⚠️  EXECUTAR MANUALMENTE após obter o UUID do Carlos no Supabase Auth:
--     SELECT id FROM auth.users WHERE email = 'carlos@3ddigitalbusiness.com';
--     Substituir 'CEO_UUID_AQUI' pelo UUID real.
-- ============================================================

-- INSERT INTO user_profiles (id, role, full_name, email)
-- VALUES ('CEO_UUID_AQUI', 'ceo', 'Carlos Eduardo', 'carlos@3ddigitalbusiness.com')
-- ON CONFLICT (id) DO UPDATE SET role = 'ceo';

-- ============================================================
-- VERIFICAÇÃO PÓS-EXECUÇÃO
-- ============================================================
-- 1. Verificar tabelas com RLS ativo:
--    SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
--
-- 2. Verificar policies criadas:
--    SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
--
-- 3. Testar como CEO (deve ver tudo):
--    SET LOCAL ROLE authenticated;
--    SET LOCAL "request.jwt.claims" TO '{"sub":"<ceo_uuid>","role":"authenticated"}';
--    SELECT count(*) FROM leads; -- deve retornar todos os leads
--
-- 4. Testar como vendedor (não deve ver store_metrics):
--    -- (usar *test-as-user no @data-engineer)

-- ============================================================
-- ROLLBACK DE EMERGÊNCIA
-- ============================================================
-- Se a aplicação quebrar após esta migration:
--
-- STEP 1: Restaurar policy single-user em todas as tabelas:
-- DO $$
-- DECLARE t text;
-- BEGIN
--   FOREACH t IN ARRAY ARRAY[
--     'leads','tasks','events','call_logs',
--     'okrs','content_posts','store_metrics'
--   ]
--   LOOP
--     EXECUTE format(
--       'CREATE POLICY "owner_all" ON %I FOR ALL USING (auth.uid() IS NOT NULL)', t
--     );
--   END LOOP;
-- END $$;
--
-- STEP 2: Remover policies role-based:
-- DROP POLICY IF EXISTS "leads_ceo" ON leads;
-- DROP POLICY IF EXISTS "leads_vendedor_select" ON leads;
-- DROP POLICY IF EXISTS "leads_vendedor_insert" ON leads;
-- DROP POLICY IF EXISTS "leads_vendedor_update" ON leads;
-- DROP POLICY IF EXISTS "leads_assistente_select" ON leads;
-- DROP POLICY IF EXISTS "tasks_ceo" ON tasks;
-- DROP POLICY IF EXISTS "tasks_assistente_select" ON tasks;
-- DROP POLICY IF EXISTS "tasks_assistente_update" ON tasks;
-- DROP POLICY IF EXISTS "events_ceo" ON events;
-- DROP POLICY IF EXISTS "events_assistente_select" ON events;
-- DROP POLICY IF EXISTS "events_assistente_insert" ON events;
-- DROP POLICY IF EXISTS "call_logs_ceo" ON call_logs;
-- DROP POLICY IF EXISTS "call_logs_vendedor_select" ON call_logs;
-- DROP POLICY IF EXISTS "call_logs_vendedor_insert" ON call_logs;
-- DROP POLICY IF EXISTS "okrs_ceo" ON okrs;
-- DROP POLICY IF EXISTS "okrs_gestor_vcchic_select" ON okrs;
-- DROP POLICY IF EXISTS "content_posts_ceo" ON content_posts;
-- DROP POLICY IF EXISTS "store_metrics_ceo" ON store_metrics;
-- DROP POLICY IF EXISTS "store_metrics_gestor_vcchic_select" ON store_metrics;
--
-- STEP 3: Opcional — remover user_profiles se necessário:
-- DROP TABLE IF EXISTS user_profiles;
-- DROP FUNCTION IF EXISTS get_my_role();
