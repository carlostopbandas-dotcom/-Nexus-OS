# Technical Debt Assessment — Nexus OS (Final)
> @architect (Aria) — Brownfield Discovery Phase 8 — 2026-03-16
> Consolidação final das Phases 1-7 · QA Gate: APPROVED

---

## Sumário Executivo

**Nexus OS** é um dashboard executivo single-page para gestão multi-negócio de alto potencial visual e funcional, construído em modo "move fast" sem camadas de segurança, arquitetura escalável ou processos de qualidade. O sistema é **visualmente maduro, tecnicamente frágil**.

| Dimensão | Score Final | Classificação |
|----------|-------------|---------------|
| Segurança | 1.5/10 | 🔴 CRÍTICO |
| Banco de Dados | 2.5/10 | 🔴 ALTO RISCO |
| Integridade Referencial | 1/10 | 🔴 CRÍTICO |
| Design System | 1/10 | 🔴 CRÍTICO |
| Acessibilidade | 1.5/10 | 🔴 CRÍTICO |
| Arquitetura | 3/10 | 🔴 ALTO RISCO |
| DevOps / Deploy | 2/10 | 🔴 CRÍTICO |
| Observabilidade | 0/10 | 🔴 CRÍTICO |
| Frontend / UX | 4.5/10 | 🟠 ALTO |
| Qualidade de Código | 4/10 | 🟠 ALTO |
| UX / Usabilidade | 6/10 | 🟡 MÉDIO |
| **Score Geral** | **2.5/10** | **🔴 HIGH RISK** |

> **Score revisado de 3/10 para 2.5/10** — incorpora achados dos specialist reviews (DB e UX) e gaps identificados pelo QA Gate.

---

## ⚠️ Alerta Operacional Imediato

> **RISCO COMBINADO — Perda Irreversível de Dados de Negócio**
>
> A combinação de três ausências cria um risco operacional crítico para o CEO:
> - Sem `soft delete` (`deleted_at`) → deleção de lead/call é permanente
> - Sem `audit log` → sem histórico de modificações
> - Sem `migrations` versionadas → restore de schema impossível
>
> Se um lead ou call_log for deletado acidentalmente hoje, **não há recovery possível**.
> Os dados de pipeline de vendas, histórico de calls e OKRs são ativos de negócio — não apenas dados técnicos.

---

## Vetor de Ataque Ativo (P0 — Hoje)

O seguinte ataque é executável em **menos de 30 segundos** por qualquer pessoa que acesse o app:

```bash
# 1. Abrir DevTools no browser → Network ou Sources
# 2. Localizar: supabaseAnonKey = 'sb_publishable_BD0fsd916WaTIoCnLjT6pQ_tQozy6tz'
# 3. Executar:
curl -H "apikey: sb_publishable_BD0fsd916WaTIoCnLjT6pQ_tQozy6tz" \
     https://zfmfevpdcwcwatpkttnr.supabase.co/rest/v1/leads

# Resultado: todos os leads, emails, valores de negócio expostos
```

**Este ataque não requer nenhum conhecimento técnico especial.** A anon key exposta + sem RLS ativo = banco de produção completamente aberto.

---

## 1. Inventário Completo de Dívidas

### 1.1 CRÍTICO — Risco Imediato (Bloqueante · Fix Antes de Qualquer Dev)

| ID | Camada | Issue | Impacto | Arquivo |
|----|--------|-------|---------|---------|
| TD-C1 | Segurança | Credenciais Supabase hardcoded | Banco de produção exposto publicamente | `lib/supabase.ts:4-5` |
| TD-C2 | Segurança | GEMINI_API_KEY exposta no bundle | Chave comprometida, custos sem controle | `vite.config.ts:15-16` |
| TD-C3 | Segurança | Sem autenticação (Supabase Auth) | Qualquer pessoa lê/escreve o banco | App inteira |
| TD-C4 | Segurança | RLS ineficaz sem `auth.uid()` | Policies de segurança são nulas | Supabase |
| TD-C5 | DevOps | Schema não versionado (sem migrations) | Rollback impossível, restore inviável | — |
| TD-C6 | Frontend | Tailwind via CDN (não npm) | Bundle ~400KB extra, sem purge, sem v4 | `index.html:7` |
| TD-C7 | Banco | Sem soft delete em leads/call_logs | Deleção acidental = perda permanente | Supabase |
| TD-C8 | Banco | Integridade referencial zero (sem FKs) | Órfãos invisíveis, JOINs incorretos | Supabase |

### 1.2 ALTO — Risco Estrutural (Fix Prioritário)

| ID | Camada | Issue | Impacto | Arquivo |
|----|--------|-------|---------|---------|
| TD-H1 | Arquitetura | God Component (App.tsx) | Impossível testar, difícil manter | `App.tsx` |
| TD-H2 | Arquitetura | Sem state management (prop drilling) | Re-renders desnecessários, bugs de estado | Todas as páginas |
| TD-H3 | Arquitetura | Sem React Router | Sem deep link, sem back/forward | `App.tsx` |
| TD-H4 | Arquitetura | Event bus via `window.dispatchEvent` | Frágil, sem tipos, sem garantia de entrega | Múltiplos |
| TD-H5 | Arquitetura | Sem service layer (queries no componente) | Acoplamento DB ↔ UI | `App.tsx` + páginas |
| TD-H6 | Banco | `call_logs.lead_name` desnormalizado | JOINs impossíveis, analytics de funil quebrado | Supabase |
| TD-H7 | Banco | `call_logs.date/duration` como TEXT | **CRÍTICO para analytics** — ORDER BY errado, cálculos impossíveis | Supabase |
| TD-H8 | Banco | Sem `updated_at` em 7 tabelas | Sem audit trail, sync impossível | Supabase |
| TD-H9 | Banco | SELECT * em todas as queries | Overexposure + performance | `App.tsx` |
| TD-H10 | Frontend | Sem acessibilidade WCAG Level A | Inputs sem aria-label, modais sem focus trap | Todas as páginas |
| TD-H11 | Frontend | Design System inexistente | Redesign = busca manual em 200+ arquivos | Todos os componentes |
| TD-H12 | Frontend | alert() como sistema de erro | UX ruim, sem context, não escalável | Pipeline, Tasks |
| TD-H13 | Frontend | Z-index escalado manualmente | Conflitos visuais em novos modais | App inteira |
| TD-H14 | Frontend | Bundle ~900KB não-otimizado | Performance degradada | index.html + deps |

### 1.3 MÉDIO — Débito Técnico (Backlog)

| ID | Camada | Issue |
|----|--------|-------|
| TD-M1 | Código | `any` em 5+ data mappers — TypeScript sem valor |
| TD-M2 | Código | `StoreMetric` duplicada (App.tsx + Dashboard.tsx) |
| TD-M3 | Código | `renderMenuItem` fora do componente — antipattern React |
| TD-M4 | Frontend | Magic numbers tipográficos (`text-[8px]`, `text-[9px]`, `text-[10px]`, `text-[11px]`) |
| TD-M5 | Frontend | Border radius inconsistente (6 valores distintos) |
| TD-M6 | Frontend | Apenas 2/9 componentes isolados (StatCard + Sidebar) |
| TD-M7 | Frontend | Sem mobile/responsive — desktop only |
| TD-M8 | Frontend | Avatar "CS" hardcoded no Sidebar |
| TD-M9 | Frontend | Sem skeleton loading — UX de carregamento ruim |
| TD-M10 | Banco | Sem paginação nas queries |
| TD-M11 | Banco | `store_metrics` com tipos inconsistentes (sales/spend/roas) |
| TD-M12 | Banco | `okrs.key_results` em JSONB sem schema/constraint |
| TD-M13 | Banco | `leads.email` sem UNIQUE constraint |
| TD-M14 | Banco | Sem índices em colunas de filtro frequente |
| TD-M15 | Banco | Sem observabilidade (audit_log, soft delete) |
| TD-M16 | Qualidade | Sem ESLint / Prettier |
| TD-M17 | Qualidade | Zero testes (0% coverage) |
| TD-M18 | Qualidade | Mix dados mock + Supabase real |
| TD-M19 | DevOps | Sem CI/CD pipeline |
| TD-M20 | DevOps | Sem variáveis de ambiente documentadas |

---

## 2. O Que Está Funcionando Bem — Preservar na Refatoração

> Esta seção é obrigatória para evitar que a refatoração destrua os diferenciais visuais do produto.

| Asset | Localização | Por Que Preservar |
|-------|------------|-------------------|
| Design language premium (dark sidebar + light content) | App.tsx + Sidebar | Escolha visual forte e consistente — não mudar |
| Tipografia ultra-bold (`text-4xl font-black uppercase italic`) | Todas as páginas | Impactante e único — transformar em token, não remover |
| Page transitions (framer-motion opacity + y) | App.tsx | Sensação de produto caro — manter ao migrar para Router |
| Hover lift nos cards (`hover:shadow-xl hover:-translate-y-1`) | Cards | Feedback visual elegante — manter nos novos componentes |
| Sidebar active state com indicador lateral | Sidebar.tsx | Polido e funcional — replicar no Router |
| VoiceAssistant glassmorphism | VoiceAssistant.tsx | Componente mais polido do app — referência de qualidade |
| Color coding por business unit | App.tsx, types.ts | Identidade visual de cada empresa — preservar nos tokens |
| Optimistic updates (Pipeline, OKRs) | Pipeline.tsx, Okrs.tsx | UX avançada já implementada — não regredir |

**Regra de ouro da refatoração:** A UI deve estar visualmente idêntica (ou melhor) após cada sprint. Nunca sacrificar a qualidade visual pelo progresso técnico.

---

## 3. Arquitetura Target

### 3.1 Stack Completo (Zero Mudança de Tecnologia)

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXUS OS — TARGET ARCHITECTURE            │
├─────────────────────────────────────────────────────────────┤
│  FRONTEND                                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React 19 + TypeScript + Vite                        │   │
│  │  React Router v7      (navegação + deep links)       │   │
│  │  Zustand              (state management)             │   │
│  │  Tailwind CSS v3 npm  (não CDN) + CSS Variables      │   │
│  │  shadcn/ui            (component library base)       │   │
│  │  framer-motion        (animações — manter)           │   │
│  │  sonner               (toast notifications)          │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  SERVICE LAYER                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  services/                                           │   │
│  │  ├── leads.service.ts                                │   │
│  │  ├── tasks.service.ts                                │   │
│  │  ├── calls.service.ts                                │   │
│  │  ├── okrs.service.ts                                 │   │
│  │  ├── events.service.ts                               │   │
│  │  ├── content.service.ts                              │   │
│  │  └── metrics.service.ts                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  BACKEND (Supabase)                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL + RLS + Auth                             │   │
│  │  Edge Functions (proxy Gemini — protege API key)     │   │
│  │  supabase/migrations/ (schema versionado)            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Estrutura de Pastas Target

```
nexus-os/
├── src/
│   ├── features/
│   │   ├── dashboard/   ├── crm/        ├── okrs/
│   │   ├── tasks/       ├── calls/      ├── routine/
│   │   ├── content/     ├── knowledge/  └── ai-advisor/
│   ├── components/
│   │   ├── ui/          # Button, Input, Modal, Toast, Badge, Skeleton, Avatar
│   │   └── layout/      # Sidebar, AppShell
│   ├── services/        # Supabase service layer (7 services)
│   ├── store/           # Zustand stores
│   ├── lib/             # supabase client
│   ├── styles/          # design-tokens.css (Single Source of Truth)
│   ├── types/           # tipos globais
│   └── hooks/           # useAuth, useData...
├── supabase/
│   ├── migrations/      # Schema versionado (001-004)
│   └── functions/       # Edge Function proxy Gemini
├── .env.local           # Credenciais (gitignored)
└── .env.example         # Template documentado
```

### 3.3 Design Tokens — Single Source of Truth

```css
/* src/styles/design-tokens.css */
:root {
  /* Brand */
  --color-brand:        #0055A4;
  --color-brand-dark:   #003366;
  --color-brand-light:  #8AC6FF;

  /* Surface */
  --color-bg-app:    #F0F4F8;
  --color-surface:   #FFFFFF;
  --color-sidebar:   #000000;

  /* Status */
  --color-success:   #10B981;
  --color-warning:   #F59E0B;
  --color-danger:    #F43F5E;

  /* Business Units */
  --color-nexus:    #0055A4;
  --color-mivave:   #7C3AED;
  --color-vcchic:   #DB2777;
  --color-moriel:   #0D9488;
  --color-sezo:     #EA580C;

  /* Radius (de 6 valores inconsistentes → 5 semânticos) */
  --radius-xs:   6px;
  --radius-sm:   8px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-xl:   24px;
  --radius-2xl:  32px;

  /* Z-index (de manual → sistema) */
  --z-sidebar:   200;
  --z-voice:     250;
  --z-modal:     300;
  --z-toast:     400;
}
```

---

## 4. Decisões Arquiteturais (ADRs)

### ADR-1: Manter React SPA (não migrar para Next.js)
**Decisão:** Permanecer como SPA com Vite.
**Razão:** App é single-user, sem necessidade de SSR/SEO. Migração seria custo alto sem benefício claro.

### ADR-2: Zustand sobre Redux/Context
**Decisão:** Zustand para state management.
**Razão:** API minimal, TypeScript-first, zero boilerplate. Perfeito para escala deste projeto.

### ADR-3: shadcn/ui + framer-motion (não apenas shadcn)
**Decisão:** shadcn/ui (Radix + Tailwind) como base de componentes **mantendo framer-motion** para animações.
**Razão:** shadcn fornece acessibilidade e estrutura. framer-motion fornece o diferencial visual premium. Os dois são complementares, não excludentes.

### ADR-4: Edge Functions para Gemini (não proxy externo)
**Decisão:** Supabase Edge Function como proxy da API Gemini.
**Razão:** Mantém stack no Supabase, zero infra adicional, protege a API key do bundle.

### ADR-5: Tailwind v3 npm (não v4)
**Decisão:** Migrar para Tailwind v3 via npm. Não migrar para v4 agora.
**Razão:** v4 ainda instável para brownfield. v3 via npm resolve o problema crítico do CDN com risco mínimo.

### ADR-6: Soft Delete em leads e call_logs
**Decisão:** Adicionar `deleted_at timestamptz` em `leads` e `call_logs`.
**Razão:** Dados de pipeline de vendas são ativos de negócio. Recovery de deleção acidental é requisito operacional, não técnico.

### ADR-7: Backfill Strategy para lead_id FK
**Decisão:** `call_logs.lead_name` permanece durante a transição. `lead_id UUID FK` adicionado como nullable. Backfill via script antes de enforcement.
**Razão:** Dados históricos existentes não têm `lead_id`. Forçar NOT NULL quebraria todos os registros atuais. Transição gradual preserva integridade.

---

## 5. Plano de Remediação — 4 Sprints

### Sprint 0 — Pré-Requisito (Antes de tudo · 1 hora)

> **Não é sprint — é desbloqueio imediato.**

| Tarefa | Tempo | Por quê primeiro |
|--------|-------|-----------------|
| Commitar/stashar `VoiceAssistant.tsx` (modificações em andamento) | 5min | Evita conflito com Sprint 1 Auth |
| Criar `supabase/migrations/001_initial_schema.sql` (captura estado atual) | 30min | Sem isso, qualquer erro de schema não tem recovery |
| Mover credenciais para `.env.local` | 20min | Fecha o vetor de ataque mais crítico |

**Critério de done:** Sem credenciais no código. Schema versionado. Branch limpa.

---

### Sprint 1 — Security Foundation (Semana 1) 🔴

**Objetivo:** Eliminar todos os riscos críticos de segurança

| Tarefa | Esforço | Responsável | Teste Mínimo |
|--------|---------|-------------|-------------|
| Implementar Supabase Auth (login/session para Carlos) | 4h | @dev | Login funciona → sessão persiste |
| Criar Edge Function proxy Gemini | 3h | @dev | DevTools não expõe key em network requests |
| Migration `002_security_foundation.sql` (RLS + policies) | 2h | @data-engineer | Sem auth → requests bloqueados pelo RLS |
| Configurar `.env.example` documentado | 30min | @dev | Novo dev consegue rodar o app |

**Critério de done:** Zero credenciais no código. Login funcionando. RLS ativo. DevTools não expõe nenhuma chave.

---

### Sprint 2 — Architecture & DB Foundation (Semana 2) 🟠

**Objetivo:** Remover God Component, adicionar routing e corrigir schema

| Tarefa | Esforço | Responsável | Teste Mínimo |
|--------|---------|-------------|-------------|
| Instalar React Router v7 + migrar navegação | 4h | @dev | URL muda ao navegar · Back/forward funciona |
| Instalar Zustand + criar `useAppStore` | 4h | @dev | App.tsx sem useState globais |
| Criar service layer (7 services) | 6h | @dev | Queries movidas para services |
| Substituir event bus por store subscriptions | 3h | @dev | Sem window.dispatchEvent no código |
| Migration `003_schema_hardening.sql` | 3h | @data-engineer | Migrations rodam sem erro · Rollback funciona |
| Script backfill `call_logs.lead_name → lead_id` | 1h | @data-engineer | Dados históricos mapeados corretamente |
| Adicionar soft delete (leads + call_logs) | 1h | @data-engineer | Deleção usa `deleted_at`, não DELETE |

**Critério de done:** App.tsx sem useState globais. Navegação via URL. Queries em services. Schema com FKs, updated_at, soft delete.

---

### Sprint 3 — Frontend System (Semana 3) 🟡

**Objetivo:** Migrar Tailwind CDN → npm, criar design system base, corrigir acessibilidade

| Tarefa | Esforço | Responsável | Teste Mínimo |
|--------|---------|-------------|-------------|
| **Screenshot baseline das 9 páginas** (antes da migração) | 30min | @dev | Screenshots salvas em `docs/visual-baseline/` |
| Instalar Tailwind npm + criar `tailwind.config.js` | 2h | @dev | Build funciona sem CDN |
| Criar `src/styles/design-tokens.css` | 2h | @ux-design-expert | Zero magic numbers restantes |
| Instalar shadcn/ui | 1h | @dev | Dialog, Button base funcionando |
| Construir atoms: Button, Input, Badge, Avatar | 6h | @dev | Storybook ou test manual de variantes |
| Construir molecules: FormField, Modal (shadcn Dialog), Toast (sonner), Skeleton | 6h | @dev | Modal com focus trap + ESC · Toast substitui alert() |
| Migration `004_performance_indexes.sql` | 1h | @data-engineer | EXPLAIN ANALYZE mostra Index Scan |
| Adicionar aria-labels em todos os inputs | 2h | @dev | WCAG Level A — sem violations em aXe |
| Comparar visual com baseline (pós-migração) | 1h | @dev | UI visualmente idêntica nas 9 páginas |

**Critério de done:** Zero CDN. Componentes atômicos isolados. Sem alert(). WCAG Level A. Visual idêntico ao baseline.

---

### Sprint 4 — Quality & DevOps (Semana 4) 🟡

**Objetivo:** Qualidade mínima e pipeline de CI/CD

| Tarefa | Esforço | Responsável | Teste Mínimo |
|--------|---------|-------------|-------------|
| Configurar ESLint + Prettier | 1h | @devops | `npm run lint` sem erros |
| Remover todos os `any` dos mappers | 2h | @dev | `tsc --noEmit` sem erros |
| Consolidar StoreMetric em `types.ts` | 30min | @dev | Sem definições duplicadas |
| Configurar Vitest + primeiros testes de serviços | 4h | @dev | Cobertura dos 7 services |
| Criar GitHub Actions (lint + typecheck + test) | 2h | @devops | CI verde no push |

**Critério de done:** CI/CD verde. ESLint sem erros. TypeScript strict. Testes dos services passando.

---

## 6. Sequência de Dependências

```
Sprint 0: Schema capturado + Credenciais movidas
    ↓
Sprint 1: Auth implementado
    ↓ (RLS só funciona com Auth)
Sprint 1: RLS + policies ativas
    ↓
Sprint 2: React Router + Zustand + Service Layer
    ↓
Sprint 2: Schema hardening (updated_at, FK, soft delete)
    ↓
Sprint 3: Tailwind npm + Design Tokens
    ↓ (shadcn requer Tailwind npm)
Sprint 3: Componentes atômicos + Acessibilidade
    ↓
Sprint 4: CI/CD + Testes
```

---

## 7. Resumo de Artefatos Gerados

| Fase | Agente | Arquivo | Status |
|------|--------|---------|--------|
| 1 | @architect | `docs/architecture/system-architecture.md` | ✅ |
| 2 | @data-engineer | `docs/architecture/SCHEMA.md` | ✅ |
| 2 | @data-engineer | `docs/architecture/DB-AUDIT.md` | ✅ |
| 3 | @ux-design-expert | `docs/architecture/frontend-spec.md` | ✅ |
| 4 | @architect | `docs/architecture/technical-debt-DRAFT.md` | ✅ |
| 5 | @data-engineer | `docs/architecture/db-specialist-review.md` | ✅ |
| 6 | @ux-design-expert | `docs/architecture/ux-specialist-review.md` | ✅ |
| 7 | @qa | `docs/architecture/qa-review.md` | ✅ APPROVED |
| **8** | **@architect** | **`docs/architecture/technical-debt-assessment.md`** | **✅ (este)** |
| 9 | @analyst | `docs/architecture/TECHNICAL-DEBT-REPORT.md` | ⏳ |
| 10 | @pm | Epic + Stories | ⏳ |

---

*Próxima fase: @analyst → `TECHNICAL-DEBT-REPORT.md` (Phase 9 — Executive Report)*
