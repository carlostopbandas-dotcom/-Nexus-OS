# Database Specialist Review — Nexus OS
> @data-engineer (Dara) — Brownfield Discovery Phase 5 — 2026-03-16
> Revisão especializada do `technical-debt-DRAFT.md` — perspectiva de banco de dados

---

## Verdict de Validação

| Dimensão | Draft Score | DB Review | Delta |
|----------|-------------|-----------|-------|
| Segurança DB | 1.5/10 | **1.5/10** ✅ Confirmado | — |
| Schema Design | 3/10 | **2.5/10** ⬇️ Pior que estimado | -0.5 |
| Integridade Referencial | —  | **1/10** 🆕 Gap identificado | Novo |
| Versionamento | 0/10 | **0/10** ✅ Confirmado | — |
| Performance | 4/10 | **3.5/10** ⬇️ Pior que estimado | -0.5 |
| Observabilidade | — | **0/10** 🆕 Gap identificado | Novo |

**DB Risk Score Revisado: 9/10 — CRITICAL** (Draft dizia 8.5/10)

---

## 1. Validação dos Achados do Draft

### ✅ CONFIRMADOS (sem alteração)

| ID Draft | Finding | Confirmação |
|----------|---------|-------------|
| TD-C1 | Credenciais Supabase hardcoded | CONFIRMADO — `lib/supabase.ts:4-5` |
| TD-C2 | GEMINI_API_KEY no bundle | CONFIRMADO — `vite.config.ts:15-16` |
| TD-C3 | Sem autenticação | CONFIRMADO — zero uso de `supabase.auth` |
| TD-C4 | RLS ineficaz | CONFIRMADO — `auth.uid()` retorna NULL sempre |
| TD-C5 | Schema não versionado | CONFIRMADO — sem `supabase/migrations/` |
| TD-H6 | `call_logs.lead_name` desnormalizado | CONFIRMADO — TEXT livre sem FK |
| TD-H7 | Sem `updated_at` em 7 tabelas | CONFIRMADO — zero triggers de timestamp |
| TD-H8 | SELECT * em todas as queries | CONFIRMADO — overexposure confirmado |

### ⬇️ AGRAVADOS (mais grave que o draft indicou)

#### [AGR-1] call_logs.date e duration como TEXT — Impacto Subestimado
O draft marcou como HIGH. Revisão especializada eleva para **CRÍTICO do ponto de vista analítico**:

```sql
-- Estado atual (inferido)
date     TEXT  -- "Hoje, 15:00", "2026-03-15", "15h" — formato livre
duration TEXT  -- "35 min", "1h20", "40 minutes" — sem padronização

-- Impacto real:
-- ORDER BY date funciona errado (ordenação lexicográfica)
-- Impossível calcular duração total de calls por período
-- Funil de vendas (lead → call → conversão) é impossível de calcular
-- Dashboard de "calls hoje" é estimativa, não dado real
```

**Risco adicional identificado:** `transcript_snippet` contém PII (nomes, informações de clientes). Sem RLS, qualquer request autenticado com a anon key exposta pode extrair transcrições completas.

#### [AGR-2] store_metrics — Risco de Cálculo Silencioso
```typescript
// TypeScript atual
interface StoreMetric {
  sales: number | string;  // ❌ Union type inconsistente
  spend: number | string;
  roas: number | string;
}
```

Se o banco armazena como `TEXT` e o frontend faz `roas * 100`, o resultado é `NaN` silenciosamente. O CEO pode estar vendo ROAS calculado incorretamente **agora**.

---

## 2. Gaps Não Identificados no Draft

### 🆕 [NEW-DB-1] Zero Observabilidade de Dados

Nenhuma tabela possui:
- `deleted_at` para soft delete (audit trail de deleções)
- Tabela de `audit_log` para rastrear mudanças críticas
- Triggers de log para operações em `leads` e `call_logs`

**Impacto:** Se um lead for deletado acidentalmente, não há como recuperar. Se dados de call forem modificados, não há histórico. Para um CEO que usa o sistema como registro de negócios, isso é risco de perda de dados de negócio.

### 🆕 [NEW-DB-2] Ausência de CHECK Constraints

Nenhuma tabela tem validação no banco:

```sql
-- O que deveria existir mas não existe:
ALTER TABLE leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN ('New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'));

ALTER TABLE tasks
  ADD CONSTRAINT tasks_type_check
  CHECK (type IN ('Big Rock', 'Medium', 'Small'));

ALTER TABLE okrs
  ADD CONSTRAINT okrs_progress_range
  CHECK (progress >= 0 AND progress <= 100);

ALTER TABLE store_metrics
  ADD CONSTRAINT store_metrics_roas_positive
  CHECK (roas >= 0);
```

Sem constraints, dados inválidos podem ser inseridos via Supabase REST API diretamente — sem passar pela validação do TypeScript da aplicação.

### 🆕 [NEW-DB-3] Ausência de Índices Compostos para Access Patterns Reais

As queries mais frequentes da aplicação não têm suporte de índice:

```sql
-- Query real do Dashboard (inferida do código)
SELECT * FROM leads ORDER BY created_at DESC LIMIT 50;
-- Precisa: CREATE INDEX idx_leads_created_at ON leads (created_at DESC);

SELECT * FROM call_logs ORDER BY created_at DESC LIMIT 20;
-- Precisa: CREATE INDEX idx_call_logs_created_at ON call_logs (created_at DESC);

SELECT * FROM store_metrics WHERE date >= '2026-03-01' ORDER BY date DESC;
-- Precisa: CREATE INDEX idx_store_metrics_date ON store_metrics (date DESC);

SELECT * FROM tasks WHERE completed = false ORDER BY created_at DESC;
-- Precisa: CREATE INDEX idx_tasks_incomplete ON tasks (completed, created_at DESC) WHERE completed = false;
-- (Partial index — mais eficiente para filtragem frequente)
```

Com dados pequenos (< 1000 rows) isso não é problema hoje. Com 6 meses de dados de negócio, cada query será um full table scan.

### 🆕 [NEW-DB-4] JSONB sem Validação — okrs.key_results

```sql
-- Estado atual: qualquer JSON é aceito
key_results JSONB  -- sem schema, sem constraint

-- Exemplo de inserção inválida que o banco aceita:
INSERT INTO okrs (key_results) VALUES ('{"invalid": "structure"}');
INSERT INTO okrs (key_results) VALUES ('null');
INSERT INTO okrs (key_results) VALUES ('[]');  -- array vazio sem aviso
```

**Opção A (Quick Fix):** Adicionar CHECK constraint para validar estrutura mínima:
```sql
ALTER TABLE okrs ADD CONSTRAINT okrs_key_results_structure
  CHECK (
    key_results IS NULL OR
    (jsonb_typeof(key_results) = 'array')
  );
```

**Opção B (Clean Fix):** Criar tabela separada `okr_key_results` — recomendado para relatórios futuros.

---

## 3. Migration Plan Detalhado (DB Perspective)

### 3.1 Migration 001 — Initial Schema Capture (Sprint 1, Dia 1)

**Objetivo:** Capturar o schema atual no sistema de versionamento. Zero mudanças estruturais.

```sql
-- supabase/migrations/001_initial_schema.sql
-- CAPTURA DO ESTADO ATUAL — sem alterações

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
```

### 3.2 Migration 002 — Security Foundation (Sprint 1, após Auth implementado)

```sql
-- supabase/migrations/002_security_foundation.sql

-- 1. Mover credenciais para env vars (feito no código — não é SQL)
-- 2. Habilitar RLS em todas as tabelas
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_metrics ENABLE ROW LEVEL SECURITY;

-- 3. Policy single-user (owner_all) — requer auth.uid() != NULL
-- Após Supabase Auth implementado:
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['leads','tasks','events','call_logs','okrs','content_posts','store_metrics']
  LOOP
    EXECUTE format('CREATE POLICY "owner_all" ON %I FOR ALL USING (auth.uid() IS NOT NULL)', t);
  END LOOP;
END $$;
```

### 3.3 Migration 003 — Schema Hardening (Sprint 2)

```sql
-- supabase/migrations/003_schema_hardening.sql

-- 1. Adicionar updated_at em todas as tabelas
ALTER TABLE leads         ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE tasks         ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE events        ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE call_logs     ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE okrs          ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE store_metrics ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Trigger function para auto-updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Aplicar trigger em todas as tabelas
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['leads','tasks','events','call_logs','okrs','content_posts','store_metrics']
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- 4. Adicionar FK lead_id em call_logs (com rollback seguro)
ALTER TABLE call_logs
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES leads(id) ON DELETE SET NULL;
-- NOTA: lead_name permanece para compatibilidade durante transição

-- 5. Adicionar UNIQUE em leads.email
ALTER TABLE leads
  ADD CONSTRAINT leads_email_unique UNIQUE (email);

-- 6. Corrigir tipos de store_metrics (sales, spend, roas para NUMERIC)
-- Já devem ser NUMERIC no Supabase — confirmar via dashboard
-- Se forem TEXT: ALTER TABLE store_metrics ALTER COLUMN sales TYPE numeric USING sales::numeric;

-- 7. CHECK constraints de validação
ALTER TABLE leads ADD CONSTRAINT leads_status_valid
  CHECK (status IS NULL OR status IN ('New','Contacted','Qualified','Proposal','Won','Lost'));

ALTER TABLE tasks ADD CONSTRAINT tasks_type_valid
  CHECK (type IN ('Big Rock','Medium','Small'));

ALTER TABLE okrs ADD CONSTRAINT okrs_progress_range
  CHECK (progress >= 0 AND progress <= 100);

ALTER TABLE okrs ADD CONSTRAINT okrs_key_results_array
  CHECK (key_results IS NULL OR jsonb_typeof(key_results) = 'array');
```

### 3.4 Migration 004 — Performance Indexes (Sprint 3)

```sql
-- supabase/migrations/004_performance_indexes.sql

-- Índices para access patterns mais frequentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_created_at
  ON leads (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_status
  ON leads (status) WHERE status IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_pending
  ON tasks (created_at DESC) WHERE completed = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_call_logs_created_at
  ON call_logs (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_call_logs_lead_id
  ON call_logs (lead_id) WHERE lead_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_store_metrics_date
  ON store_metrics (date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_day_offset
  ON events (day_offset) WHERE day_offset IS NOT NULL;

-- GIN index para busca em JSONB (futuro)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_okrs_key_results_gin
  ON okrs USING GIN (key_results);
```

---

## 4. Rollback Scripts

```sql
-- supabase/rollbacks/rollback_003_schema_hardening.sql
-- USAR APENAS EM EMERGÊNCIA

BEGIN;

-- Remover triggers
DROP TRIGGER IF EXISTS leads_updated_at ON leads;
DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS events_updated_at ON events;
DROP TRIGGER IF EXISTS call_logs_updated_at ON call_logs;
DROP TRIGGER IF EXISTS okrs_updated_at ON okrs;
DROP TRIGGER IF EXISTS content_posts_updated_at ON content_posts;
DROP TRIGGER IF EXISTS store_metrics_updated_at ON store_metrics;

DROP FUNCTION IF EXISTS set_updated_at();

-- Remover constraints
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_valid;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_email_unique;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_type_valid;
ALTER TABLE okrs  DROP CONSTRAINT IF EXISTS okrs_progress_range;
ALTER TABLE okrs  DROP CONSTRAINT IF EXISTS okrs_key_results_array;
ALTER TABLE call_logs DROP CONSTRAINT IF EXISTS call_logs_lead_id_fkey;

-- Remover colunas adicionadas
ALTER TABLE leads         DROP COLUMN IF EXISTS updated_at;
ALTER TABLE tasks         DROP COLUMN IF EXISTS updated_at;
ALTER TABLE events        DROP COLUMN IF EXISTS updated_at;
ALTER TABLE call_logs     DROP COLUMN IF EXISTS updated_at;
ALTER TABLE call_logs     DROP COLUMN IF EXISTS lead_id;
ALTER TABLE okrs          DROP COLUMN IF EXISTS updated_at;
ALTER TABLE content_posts DROP COLUMN IF EXISTS updated_at;
ALTER TABLE store_metrics DROP COLUMN IF EXISTS updated_at;

COMMIT;
```

---

## 5. Gaps do Draft — Recomendações Adicionais

### 5.1 Recomendação: Soft Delete em call_logs e leads

Para dados de negócio críticos (leads e calls são ativos do CEO), soft delete é essencial:

```sql
-- Migration adicional sugerida (fora do escopo dos 4 sprints — Sprint 5+)
ALTER TABLE leads     ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- View para queries normais (excluir deletados automaticamente)
CREATE OR REPLACE VIEW active_leads AS
  SELECT * FROM leads WHERE deleted_at IS NULL;
```

### 5.2 Recomendação: Supabase Realtime para VoiceAssistant

O `VoiceAssistant.tsx` (modificado no gitStatus) provavelmente usa polling. Com `updated_at` implementado, Supabase Realtime pode substituir polling:

```typescript
// Após migration 003 — padrão de subscription possível
supabase
  .channel('leads-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, callback)
  .subscribe();
```

### 5.3 Edge Function: Proxy Gemini (Validação DB)

A Edge Function de proxy Gemini (ADR-4) deve **também** salvar contexto de uso na tabela de AI:

```sql
-- Tabela futura sugerida para audit trail de IA
CREATE TABLE ai_interactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model       text NOT NULL,
  prompt_hash text,            -- hash do prompt (não o conteúdo por privacidade)
  tokens_used integer,
  cost_usd    numeric(10,6),
  context     text,            -- 'voice', 'advisor', 'content'
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

---

## 6. Divergências com o Draft

| Item | Draft | DB Review | Ação |
|------|-------|-----------|------|
| Risk Score | 8.5/10 | **9/10** | Atualizar no relatório final |
| Sprint 2 DB scope | updated_at + lead_id | **+ CHECK constraints + índices parciais** | Ampliar scope |
| `call_logs.date` severity | HIGH | **CRÍTICO (analytics impossível)** | Reclassificar |
| Observabilidade | Não mencionado | **Gap crítico para dados de negócio** | Adicionar |
| Soft delete | Não mencionado | **Recomendado para leads + calls** | Adicionar Sprint 5+ |

---

## 7. Verdict para Phase 7 (QA Gate)

**Status: APPROVED com ressalvas**

O draft está tecnicamente correto e o plano de remediação é executável. As divergências identificadas são aditivas (não contradizem o draft). Recomendo que o relatório final:

1. ⬆️ Atualize o Risk Score DB de 8.5 → **9/10**
2. 🆕 Inclua a seção de **Observabilidade de Dados** como gap crítico
3. ⬆️ Reclassifique `call_logs.date/duration TEXT` de HIGH → **CRÍTICO**
4. ✅ Valide as 4 migrations SQL como artefatos entregáveis do Sprint

**Prioridade absoluta:** Migration 001 (captura do schema) + credenciais em `.env.local` devem acontecer **hoje**, antes de qualquer outro trabalho de desenvolvimento.

---

*Próxima fase: @ux-design-expert → ux-specialist-review.md*
