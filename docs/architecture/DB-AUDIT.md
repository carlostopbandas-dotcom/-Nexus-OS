# Database Security Audit — Nexus OS
> @data-engineer (Dara) — Brownfield Discovery Phase 2 — 2026-03-16
> Scope: full (RLS + Schema + Security Best Practices)

---

## Executive Summary

| Dimensão          | Status   | Issues |
|-------------------|----------|--------|
| RLS Coverage      | ❌ CRÍTICO | Sem Auth layer — RLS ineficaz |
| Schema Design     | ⚠️ ALTO   | Sem FKs, sem updated_at, tipos inconsistentes |
| Data Integrity    | ⚠️ ALTO   | Desnormalização em call_logs |
| Security Config   | ❌ CRÍTICO | Credentials hardcoded + API key exposta |
| Versioning        | ❌ AUSENTE | Sem supabase/migrations/ |
| Performance       | ⚠️ MÉDIO  | SELECT *, sem paginação, sem índices confirmados |

**Risk Score: 8.5/10 — HIGH RISK**

---

## CRÍTICO (Fix Imediato)

### [CRIT-DB-1] Sem Sistema de Autenticação
**Impacto:** Qualquer pessoa com a anon key (exposta no código fonte) pode:
- Ler todos os leads, calls, OKRs
- Inserir leads falsos
- Deletar registros

**Raiz:** App não usa `supabase.auth` em nenhum momento. Sem `auth.uid()`, políticas RLS baseadas em identidade são inúteis.

**Fix:** Implementar Supabase Auth (email/password ou magic link) para o usuário CEO.

---

### [CRIT-DB-2] Credentials Hardcoded
**Arquivo:** `lib/supabase.ts:4-5`
```typescript
// ❌ PROBLEMÁTICO
const supabaseUrl = 'https://zfmfevpdcwcwatpkttnr.supabase.co';
const supabaseAnonKey = 'sb_publishable_BD0fsd916WaTIoCnLjT6pQ_tQozy6tz';
```

**Fix:**
```typescript
// ✅ CORRETO
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

---

### [CRIT-DB-3] API Key Gemini Exposta no Bundle
**Arquivo:** `vite.config.ts:15-16`

`process.env.GEMINI_API_KEY` injetado via `define` no bundle → visível em qualquer DevTools.

**Fix:** Mover chamadas Gemini para Edge Function Supabase ou proxy backend.

---

### [CRIT-DB-4] Schema Não Versionado
**Impacto:** Impossível fazer rollback. Sem histórico de alterações. Deploy seguro impossível.

**Fix:** Criar `supabase/migrations/` e documentar schema atual como migration inicial.

---

## ALTO (Fix Prioritário)

### [HIGH-DB-1] call_logs.lead_name Desnormalizado
**Problema:** `lead_name` é TEXT livre, não FK para `leads.id`.
```sql
-- ❌ Estado atual (inferido)
lead_name TEXT  -- ex: "Ana Souza"

-- ✅ Deveria ser
lead_id UUID REFERENCES leads(id) ON DELETE SET NULL
```
**Impacto:** Leads deletados "orphanizam" call_logs. Nome pode divergir. Impossível fazer JOIN consistente.

---

### [HIGH-DB-2] Nenhuma Tabela tem `updated_at`
**Impacto:** Impossível implementar sync, cache invalidation, ou audit trail.

**Fix para todas as tabelas:**
```sql
ALTER TABLE leads ADD COLUMN updated_at timestamptz DEFAULT now();
ALTER TABLE tasks ADD COLUMN updated_at timestamptz DEFAULT now();
-- ... (repita para todas as tabelas)

-- Trigger automático
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

### [HIGH-DB-3] store_metrics com Tipos Inconsistentes
**Problema:** `sales`, `spend`, `roas` declarados como `number | string` no TypeScript.
Supabase pode ter os campos como `text`, causando erros de cálculo silenciosos.

**Fix:** Garantir que sejam `NUMERIC(15,2)` no banco. Corrigir `StoreMetric` interface.

---

### [HIGH-DB-4] events.start_time como TEXT
**Problema:** `start_time` e `end_time` são strings livres ("09:00", ISO, etc.).
**Fix:** Migrar para `timestamptz` ou `time` consistente.

---

### [HIGH-DB-5] SELECT * em Todas as Queries
**Problema:** `supabase.from('leads').select('*')` expõe todos os campos ao frontend.
**Fix:** Selecionar apenas colunas necessárias:
```typescript
supabase.from('leads').select('id, name, email, status, value, product, created_at')
```

---

## MÉDIO (Débito Técnico)

### [MED-DB-1] Sem Paginação nas Queries
Todas as queries retornam todos os registros sem `.limit()`.
Risco de performance e exposição em massa conforme dados crescem.

### [MED-DB-2] okrs.key_results em JSONB Sem Schema
Estrutura `{text: string, completed: boolean}[]` em JSONB sem validação no banco.
Considerar tabela separada `okr_key_results` para integridade.

### [MED-DB-3] Sem Índices Confirmados em Colunas de Query
Queries frequentes em `created_at`, `status`, `date` sem índices confirmados.

### [MED-DB-4] leads.email Sem Unique Constraint
Permite duplicatas de e-mail no CRM.

---

## Plano de Remediação Priorizado

### Sprint 1 — Crítico (Esta semana)
- [ ] Mover credentials para `.env.local` (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] Criar `supabase/migrations/001_initial_schema.sql`
- [ ] Implementar Supabase Auth (login básico para Carlos)

### Sprint 2 — Alto (Próxima semana)
- [ ] Adicionar `updated_at` + triggers em todas as tabelas
- [ ] Adicionar `lead_id UUID FK` em `call_logs`
- [ ] Corrigir tipos de `store_metrics` (sales, spend, roas → NUMERIC)
- [ ] Habilitar RLS com policy de single-user após Auth implementado

### Sprint 3 — Médio (Próximo mês)
- [ ] Substituir `select('*')` por seleção explícita de colunas
- [ ] Adicionar `.limit()` nas queries principais
- [ ] Criar índices em colunas de filtro frequente
- [ ] Adicionar UNIQUE em `leads.email`

---

## RLS Policy Design (Pós-Auth)

Após implementar Auth, aplicar políticas de single-user:

```sql
-- Habilitar RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_metrics ENABLE ROW LEVEL SECURITY;

-- Policy padrão: apenas o usuário autenticado tem acesso total
CREATE POLICY "owner_all" ON leads
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Repetir para todas as tabelas (single-user app)
```

---

*Próxima fase: @ux-design-expert → frontend-spec.md*
