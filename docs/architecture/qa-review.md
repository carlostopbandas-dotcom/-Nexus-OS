# QA Gate Review — Brownfield Discovery
> @qa (Quinn) — Brownfield Discovery Phase 7 — 2026-03-16
> Revisão dos artefatos das Phases 1-6 e decisão de gate

---

## Decisão Final

```
╔══════════════════════════════════════════════════════╗
║  GATE DECISION: APPROVED                             ║
║  Com 6 condições obrigatórias para o relatório final ║
╚══════════════════════════════════════════════════════╝
```

**Justificativa:** O conjunto de artefatos das Phases 1-6 é tecnicamente sólido, internamente consistente, e representa cobertura adequada do sistema. Os specialists reviews (DB + UX) validaram e enriqueceram o draft sem contradições estruturais. As condições abaixo devem ser incorporadas no relatório final (Phase 8) para que o assessment seja executável.

---

## 1. Checklist de Artefatos

| Artefato | Fase | Agente | Status | Qualidade |
|---------|------|--------|--------|-----------|
| `system-architecture.md` | 1 | @architect | ✅ Presente | Adequada |
| `SCHEMA.md` | 2 | @data-engineer | ✅ Presente | Boa |
| `DB-AUDIT.md` | 2 | @data-engineer | ✅ Presente | Boa |
| `frontend-spec.md` | 3 | @ux-design-expert | ✅ Presente | Boa |
| `technical-debt-DRAFT.md` | 4 | @architect | ✅ Presente | Boa |
| `db-specialist-review.md` | 5 | @data-engineer | ✅ Presente | Excelente |
| `ux-specialist-review.md` | 6 | @ux-design-expert | ✅ Presente | Excelente |

**Cobertura:** 7/7 artefatos presentes. ✅

---

## 2. Validação de Consistência

### 2.1 Achados Cross-Agent — Sem Contradições

| Finding | @architect | @data-engineer | @ux-design-expert | Consistência |
|---------|-----------|----------------|-------------------|-------------|
| Credenciais hardcoded | TD-C1/C2 | CRIT-DB-1/3 | — | ✅ Alinhado |
| Sem autenticação | TD-C3/C4 | CRIT-DB-1 | — | ✅ Alinhado |
| Tailwind via CDN | TD-C6 | — | UX-CRIT-1 | ✅ Alinhado |
| Schema não versionado | TD-C5 | CRIT-DB-4 | — | ✅ Alinhado |
| God Component | TD-H1 | — | — | ✅ Único owner |
| Sem React Router | TD-H3 | — | UX-CRIT-2 | ✅ Alinhado |
| SELECT * | TD-H8 | HIGH-DB-5 | — | ✅ Alinhado |
| Sem WCAG | TD-M7 | — | UX-CRIT-3 + AGR | ✅ Alinhado (UX agravou) |

**Resultado:** Zero contradições entre os 3 agentes especialistas. ✅

### 2.2 Score Final Consolidado

| Dimensão | Draft | DB Review | UX Review | Score Final Recomendado |
|----------|-------|-----------|-----------|------------------------|
| Segurança | 1.5/10 | 1.5/10 | — | **1.5/10** |
| Arquitetura | 3/10 | — | — | **3/10** |
| Banco de Dados | 3/10 | **2.5/10** ⬇️ | — | **2.5/10** |
| Integridade Referencial | — | **1/10** 🆕 | — | **1/10** |
| Frontend / UX | 5/10 | — | **4.5/10** ⬇️ | **4.5/10** |
| Design System | — | — | **1/10** 🆕 | **1/10** |
| Acessibilidade | — | — | **1.5/10** 🆕 | **1.5/10** |
| Qualidade de Código | 4/10 | — | — | **4/10** |
| DevOps / Deploy | 2/10 | — | — | **2/10** |
| Observabilidade | — | **0/10** 🆕 | — | **0/10** |
| **Score Geral** | **3/10** | — | — | **2.5/10** ⬇️ |

---

## 3. Análise de Riscos — Validação

### 3.1 Vetor de Ataque Crítico — Confirmado

O seguinte vetor é **trivialmente explorável hoje** e foi corretamente identificado:

```
1. Abrir DevTools no browser
2. Copiar supabaseAnonKey do código-fonte
3. curl -H "apikey: {key}" https://zfmfevpdcwcwatpkttnr.supabase.co/rest/v1/leads
4. Todos os leads, calls, OKRs, métricas expostos
```

**Classificação QA:** BLOQUEANTE. Não é teórico — é um ataque de 30 segundos.

### 3.2 Risco de Perda de Dados de Negócio — Novo Finding QA

Nenhum dos especialistas explicitou este risco combinado:

> **Sem `updated_at` + Sem soft delete + Sem migrations versionadas = Perda irreversível de dados de negócio.**

Se alguém (ou um bug) deletar um lead ou call_log:
- Não há `deleted_at` para recuperar
- Não há audit log
- O schema não está documentado em migrations — restaurar o banco seria inviável

Para um CEO que usa o sistema como registro de negócios, este é um risco **operacional**, não apenas técnico.

### 3.3 Matriz de Risco Final

| Risco | Probabilidade | Impacto | Score | Prioridade |
|-------|--------------|---------|-------|-----------|
| Exposição de dados via anon key | Alta | Crítico | 🔴 25 | P0 — Hoje |
| Perda de dados sem recovery | Média | Crítico | 🔴 20 | P0 — Esta semana |
| GEMINI_API_KEY comprometida | Alta | Alto | 🔴 20 | P0 — Esta semana |
| Cálculo ROAS incorreto (tipos) | Média | Alto | 🟠 15 | P1 — Sprint 2 |
| Bundle ~900KB (performance) | Alta | Médio | 🟠 12 | P2 — Sprint 3 |
| WCAG failures (acessibilidade) | Certa | Médio | 🟠 10 | P2 — Sprint 3 |
| Sem React Router (UX) | Certa | Médio | 🟠 10 | P2 — Sprint 2 |
| God Component (manutenção) | Certa | Baixo | 🟡 5 | P3 — Sprint 2 |

---

## 4. Avaliação dos Planos de Remediação

### 4.1 Sprint 1 — APROVADO ✅

O plano de Sprint 1 (Security Foundation) está correto e suficiente como ponto de partida. A sequência `.env.local` → Auth → Edge Function → Migrations → RLS é a ordem correta de dependências.

**Observação QA:** A Migration 001 (captura do schema atual) deve ser executada **antes** de qualquer mudança, mesmo antes de mover credenciais. Sem isso, qualquer erro de schema no banco deixa o sistema sem recovery.

### 4.2 Sprint 2 — APROVADO com adição ✅

O escopo está correto. Adição recomendada pelo DB Specialist Review (`updated_at` + triggers + FK + CHECK constraints) deve ser incluída.

**Observação QA:** A migração da FK `lead_id` em `call_logs` precisa de uma estratégia de backfill para dados existentes:

```sql
-- Passo necessário antes de NOT NULL na FK:
UPDATE call_logs cl
SET lead_id = l.id
FROM leads l
WHERE LOWER(l.name) = LOWER(cl.lead_name);
-- lead_name permanece nullable para compatibilidade durante transição
```

Sem este backfill, dados históricos ficam órfãos e a FK não pode ser enforcement.

### 4.3 Sprint 3 — APROVADO com ressalva ✅

A migração Tailwind CDN → npm é a operação mais arriscada do projeto do ponto de vista visual. Sem testes visuais antes/depois, é possível quebrar a UI silenciosamente.

**Recomendação QA:** Antes da migração Tailwind, criar screenshots das 9 páginas como baseline visual (usando Playwright ou manual). Após migração, comparar visualmente.

### 4.4 Sprint 4 — APROVADO ✅

CI/CD + ESLint + Vitest é o escopo correto. Prioridade correta (última sprint).

---

## 5. Condições Obrigatórias para o Relatório Final

As seguintes condições devem ser incorporadas no `technical-debt-assessment.md` (Phase 8) para que o gate seja considerado PASSED:

### ✅ CONDIÇÃO 1 — Score Geral Atualizado
O relatório final deve usar **2.5/10** (não 3/10) como score geral, refletindo os achados dos specialist reviews.

### ✅ CONDIÇÃO 2 — Reclassificações de Severidade
| Finding | Severidade Atual | Severidade Correta |
|---------|-----------------|-------------------|
| `call_logs.date/duration TEXT` | HIGH | **CRÍTICO** |
| Acessibilidade (WCAG Level A) | MÉDIO | **ALTO** |
| Design System inexistente | Não mencionado | **ALTO** |
| Observabilidade de dados | Não mencionado | **ALTO** |

### ✅ CONDIÇÃO 3 — Risco de Perda de Dados Documentado
Incluir explicitamente o risco combinado: *Sem soft delete + Sem audit log + Sem migrations = perda irreversível de dados de negócio*.

### ✅ CONDIÇÃO 4 — Backfill Strategy para lead_id FK
O Sprint 2 deve incluir o script de backfill `call_logs.lead_name → lead_id` para dados históricos.

### ✅ CONDIÇÃO 5 — Baseline Visual para Migração Tailwind
O Sprint 3 deve incluir task de screenshot baseline antes da migração Tailwind CDN → npm.

### ✅ CONDIÇÃO 6 — Micro-interações na Lista de Preservação
O relatório final deve incluir seção explícita de "O que preservar" (framer-motion, hover states, glassmorphism VoiceAssistant) para que a refatoração não destrua o diferencial visual do produto.

---

## 6. Gaps Identificados pelo QA (Não cobertos pelos especialistas)

### [QA-GAP-1] Sem Estratégia de Testes para Remediação

O plano de 4 sprints não menciona como testar as mudanças críticas. Recomendação mínima:

| Sprint | Teste Mínimo |
|--------|-------------|
| Sprint 1 | Login funciona → Dados protegidos → RLS bloqueia sem auth |
| Sprint 2 | Migrations rodam sem erro → Rollback funciona → FK não quebra histórico |
| Sprint 3 | UI visualmente idêntica após migração Tailwind → Components renderizam |
| Sprint 4 | CI verde → Lint sem erros → TypeScript strict sem any |

### [QA-GAP-2] Sem Critério de Done para "Migrar Gemini para Edge Function"

O Sprint 1 lista "Criar Edge Function proxy para Gemini API" mas não define o critério de done:
- A key deve ser removida do `vite.config.ts:define` ✅
- A key deve ser movida para Supabase Vault ✅
- O VoiceAssistant deve chamar a Edge Function (não o Gemini diretamente) ✅
- DevTools não deve expor a key em nenhuma network request ✅

### [QA-GAP-3] VoiceAssistant.tsx Modificado (gitStatus)

O `gitStatus` indica `components/VoiceAssistant.tsx` com modificações não commitadas. Este arquivo não foi inspecionado em detalhe pelos especialistas. Risco: mudanças em andamento podem conflitar com as migrations de Auth do Sprint 1 (VoiceAssistant usa Supabase client diretamente).

**Recomendação:** Commitir ou stashar as mudanças do VoiceAssistant antes de iniciar Sprint 1.

---

## 7. Resumo do Gate

```
Artefatos completos:     ✅ 7/7
Consistência interna:    ✅ Zero contradições
Cobertura de riscos:     ✅ Todos P0 identificados
Plano de remediação:     ✅ 4 sprints executáveis
Gaps identificados:      ⚠️ 3 gaps menores adicionados
Condições de merge:      6 condições para Phase 8
```

**GATE: APPROVED** — O Brownfield Discovery pode avançar para Phase 8 (relatório final) e Phase 9 (executive report). As 6 condições devem ser incorporadas pelo @architect na Phase 8.

---

*Próxima fase: @architect → `technical-debt-assessment.md` (Phase 8 — Finalization)*
