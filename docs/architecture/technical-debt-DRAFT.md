# Technical Debt Assessment — DRAFT
> @architect (Aria) — Brownfield Discovery Phase 4 — 2026-03-16
> Consolidação das Phases 1 (Architecture), 2 (DB Audit), 3 (Frontend Spec)

---

## Sumário Executivo

**Nexus OS** é um dashboard executivo funcional com UI de alta qualidade e integrações AI/Supabase operacionais. Contudo, foi construído em modo "move fast" sem camadas de segurança, arquitetura escalável ou processos de qualidade. O sistema é **tecnicamente frágil mas visualmente maduro**.

| Dimensão | Score | Classificação |
|----------|-------|---------------|
| Segurança | 1.5/10 | 🔴 CRÍTICO |
| Arquitetura | 3/10 | 🔴 ALTO RISCO |
| Frontend / UX | 5/10 | 🟠 MÉDIO |
| Banco de Dados | 3/10 | 🔴 ALTO RISCO |
| Qualidade de Código | 4/10 | 🟠 MÉDIO |
| DevOps / Deploy | 2/10 | 🔴 CRÍTICO |
| **Score Geral** | **3/10** | **🔴 HIGH RISK** |

---

## 1. Inventário Completo de Dívidas

### 1.1 CRÍTICO — Risco Imediato (Bloqueante)

| ID | Camada | Issue | Impacto | Arquivo |
|----|--------|-------|---------|---------|
| TD-C1 | Segurança | Credenciais Supabase hardcoded | Dados expostos publicamente | `lib/supabase.ts:4-5` |
| TD-C2 | Segurança | GEMINI_API_KEY exposta no bundle | Chave comprometida, custos não controlados | `vite.config.ts:15-16` |
| TD-C3 | Segurança | Sem autenticação (Supabase Auth) | Qualquer um pode ler/escrever o banco | App inteira |
| TD-C4 | Segurança | RLS ineficaz sem auth.uid() | Policies de segurança são nulas | Supabase |
| TD-C5 | DevOps | Schema não versionado (sem migrations) | Rollback impossível, deploy arriscado | — |
| TD-C6 | Frontend | Tailwind via CDN (não npm) | Bundle ~400KB extra, sem purge, sem v4 | `index.html:7` |

### 1.2 ALTO — Risco Estrutural (Fix Prioritário)

| ID | Camada | Issue | Impacto | Arquivo |
|----|--------|-------|---------|---------|
| TD-H1 | Arquitetura | God Component (App.tsx) | Impossível testar, difícil manter | `App.tsx` |
| TD-H2 | Arquitetura | Sem state management (prop drilling) | Re-renders desnecessários, bugs de estado | Todas as páginas |
| TD-H3 | Arquitetura | Sem React Router | Sem deep link, sem back/forward, sem URL sharing | App.tsx |
| TD-H4 | Arquitetura | Event bus via window.dispatchEvent | Frágil, sem tipos, sem garantia de entrega | Múltiplos |
| TD-H5 | Arquitetura | Sem service layer (queries no componente) | Acoplamento DB ↔ UI, sem reutilização | App.tsx + páginas |
| TD-H6 | Banco | call_logs.lead_name desnormalizado | Integridade quebrada, JOINs impossíveis | Supabase |
| TD-H7 | Banco | Sem `updated_at` em 7 tabelas | Sem audit trail, sync impossível | Supabase |
| TD-H8 | Banco | SELECT * em todas as queries | Overexposure + performance | App.tsx |
| TD-H9 | Frontend | alert() como sistema de erro | UX ruim, sem context, não escalável | Pipeline, Tasks |
| TD-H10 | Frontend | Sem React Router (deep-link) | Bookmarks não funcionam, UX ruim | App.tsx |

### 1.3 MÉDIO — Débito Técnico (Backlog)

| ID | Camada | Issue | Impacto |
|----|--------|-------|---------|
| TD-M1 | Código | `any` em 5+ data mappers | TypeScript sem valor, bugs silenciosos |
| TD-M2 | Código | StoreMetric duplicada (App + Dashboard) | Divergência de tipos |
| TD-M3 | Código | renderMenuItem fora do componente | Antipattern React |
| TD-M4 | Frontend | Magic numbers tipográficos (8px,9px,10px) | Inconsistência visual |
| TD-M5 | Frontend | Border radius inconsistente (5 valores) | Inconsistência visual |
| TD-M6 | Frontend | Apenas 2/9 componentes isolados | Reuso impossível, testes impossíveis |
| TD-M7 | Frontend | Sem acessibilidade (WCAG) | Inputs sem aria-label, modais sem trapfocus |
| TD-M8 | Frontend | Sem mobile/responsive | Desktop only |
| TD-M9 | Banco | Sem paginação nas queries | Lentidão com crescimento de dados |
| TD-M10 | Banco | store_metrics com tipos inconsistentes | Cálculos ROAS potencialmente errados |
| TD-M11 | Banco | okrs.key_results em JSONB sem schema | Sem validação de estrutura |
| TD-M12 | Banco | leads.email sem UNIQUE | Duplicatas no CRM |
| TD-M13 | Qualidade | Sem ESLint / Prettier | Código inconsistente |
| TD-M14 | Qualidade | Zero testes (0% coverage) | Regressões invisíveis |
| TD-M15 | Qualidade | Mix dados mock + Supabase real | Comportamento imprevisível |
| TD-M16 | DevOps | Sem CI/CD pipeline | Deploy manual, sem validação automática |
| TD-M17 | DevOps | Sem variáveis de ambiente documentadas | Onboarding impossível |

---

## 2. Análise de Impacto por Área

### 2.1 Segurança — Score: 1.5/10

A situação de segurança é **crítica**. O sistema não tem nenhuma camada de proteção funcional:

- Credenciais expostas no repositório → **Qualquer dev que clonar o repo tem acesso ao banco de produção**
- Sem autenticação → qualquer pessoa com a URL do Supabase pode usar a anon key para ler dados
- API key Gemini no bundle → visível em DevTools → custos sem controle
- RLS existe potencialmente no Supabase, mas é **completamente ineficaz** sem `auth.uid()`

**Vetor de ataque mais simples:** Inspecionar o source no browser → copiar a anon key → fazer requests REST diretamente ao Supabase.

### 2.2 Arquitetura — Score: 3/10

O padrão arquitetural é **monolítico e acoplado**. App.tsx age como um "mega-controlador" que:
- Detém 100% do estado global
- Executa 7 queries paralelas a cada evento
- Distribui estado por prop drilling em profundidade

O event bus via `window.dispatchEvent` é um anti-pattern que:
- Não tem tipos (qualquer string pode ser dispatched)
- Não tem garantia de entrega
- Cria dependências implícitas invisíveis

### 2.3 Frontend — Score: 5/10

O **visual é a parte mais madura** do sistema. Design language consistente, micro-interações de qualidade, componentes bem pensados visualmente. Os problemas são estruturais:

- Tailwind via CDN é o bloqueador mais impactante: impossibilita treeshaking (bundle pesado), impede uso de plugins, bloqueia migração para v4
- Apenas 2 componentes verdadeiramente isolados (StatCard, Sidebar)
- Sem sistema de tokens → qualquer redesign requer busca e substituição manual

### 2.4 Banco de Dados — Score: 3/10

O banco tem dados reais mas sem estrutura de produção:
- Schema criado manualmente no dashboard do Supabase → zero reprodutibilidade
- Sem FKs → integridade referencial depende 100% do código da aplicação
- `call_logs.lead_name` como TEXT é a pior dívida individual: impossibilita analytics de funil (lead → call → venda)

### 2.5 DevOps — Score: 2/10

- Sem pipeline de CI/CD
- Sem variáveis de ambiente (tudo hardcoded)
- Sem processo de deploy documentado
- Schema não versionado

---

## 3. Arquitetura Target Recomendada

### 3.1 Stack Completo (Sem Mudança de Tecnologia)

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXUS OS — TARGET ARCHITECTURE            │
├─────────────────────────────────────────────────────────────┤
│  FRONTEND                                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React 19 + TypeScript + Vite                        │   │
│  │  React Router v7  (navegação)                        │   │
│  │  Zustand          (state management)                 │   │
│  │  Tailwind CSS npm (não CDN) + CSS Variables          │   │
│  │  shadcn/ui        (component library base)           │   │
│  │  sonner           (toast notifications)              │   │
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
│  │  Edge Functions (proxy Gemini API key)               │   │
│  │  supabase/migrations/ (schema versionado)            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Estrutura de Pastas Target

```
nexus-os/
├── src/
│   ├── features/              # Feature-based modules
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── components/    # Componentes locais da feature
│   │   │   └── hooks/         # Hooks locais
│   │   ├── crm/               # Pipeline + Leads
│   │   ├── okrs/
│   │   ├── tasks/
│   │   ├── calls/
│   │   ├── routine/
│   │   ├── content/
│   │   ├── knowledge/
│   │   └── ai-advisor/
│   ├── components/            # Componentes atômicos compartilhados
│   │   ├── ui/                # Button, Input, Modal, Toast, Badge...
│   │   └── layout/            # Sidebar, AppShell
│   ├── services/              # Supabase service layer
│   ├── store/                 # Zustand stores
│   ├── lib/                   # supabase client, config
│   ├── types/                 # Tipos globais (types.ts expandido)
│   └── hooks/                 # Hooks globais (useAuth, useData...)
├── supabase/
│   ├── migrations/            # Schema versionado
│   └── functions/             # Edge Functions (proxy Gemini)
├── .env.local                 # Credenciais (gitignored)
└── .env.example               # Template documentado
```

---

## 4. Plano de Remediação — 4 Sprints

### Sprint 1 — Security Foundation (Semana 1) 🔴
**Objetivo:** Eliminar todos os riscos críticos de segurança

| Tarefa | Esforço | Responsável |
|--------|---------|-------------|
| Mover credenciais para `.env.local` | 1h | @dev |
| Implementar Supabase Auth (login/session) | 4h | @dev |
| Criar Edge Function proxy para Gemini API | 3h | @dev |
| Criar `supabase/migrations/001_initial_schema.sql` | 2h | @data-engineer |
| Habilitar RLS em todas as tabelas | 1h | @data-engineer |
| Criar policies single-user pós-auth | 2h | @data-engineer |

**Critério de done:** Zero credenciais no código. Login funcionando. RLS ativo.

---

### Sprint 2 — Architecture Foundation (Semana 2) 🟠
**Objetivo:** Remover God Component, adicionar routing e service layer

| Tarefa | Esforço | Responsável |
|--------|---------|-------------|
| Instalar React Router v7 | 1h | @dev |
| Instalar Zustand | 30min | @dev |
| Criar `useAppStore` (migrar estado do App.tsx) | 4h | @dev |
| Criar service layer (7 services) | 6h | @dev |
| Substituir event bus por store subscriptions | 3h | @dev |
| Adicionar `updated_at` + triggers no banco | 2h | @data-engineer |
| Adicionar FK `lead_id` em `call_logs` | 2h | @data-engineer |

**Critério de done:** App.tsx sem useState globais. Navegação via URL. Queries em services.

---

### Sprint 3 — Frontend System (Semana 3) 🟡
**Objetivo:** Migrar Tailwind CDN → npm, criar component library base

| Tarefa | Esforço | Responsável |
|--------|---------|-------------|
| Migrar Tailwind CDN → npm install | 2h | @dev |
| Criar `tailwind.config.js` com design tokens | 2h | @ux-design-expert |
| Instalar shadcn/ui como base de componentes | 2h | @dev |
| Criar atoms: Button, Input, Modal, Badge | 6h | @dev |
| Instalar sonner (substituir alert()) | 1h | @dev |
| Substituir select('*') por colunas explícitas | 2h | @dev |
| Adicionar `.limit()` nas queries principais | 1h | @dev |

**Critério de done:** Zero CDN. Componentes atômicos isolados. Sem alert().

---

### Sprint 4 — Quality & DevOps (Semana 4) 🟡
**Objetivo:** Qualidade mínima e pipeline de CI/CD

| Tarefa | Esforço | Responsável |
|--------|---------|-------------|
| Configurar ESLint + Prettier | 1h | @devops |
| Remover todos os `any` dos mappers | 2h | @dev |
| Consolidar StoreMetric em types.ts | 30min | @dev |
| Configurar Vitest + primeiros testes | 4h | @dev |
| Criar GitHub Actions (lint + typecheck) | 2h | @devops |
| Documentar `.env.example` completo | 30min | @dev |

**Critério de done:** CI/CD verde. ESLint sem erros. TypeScript strict sem `any`.

---

## 5. Decisões Arquiteturais

### ADR-1: Manter React (não migrar para Next.js)
**Decisão:** Permanecer como SPA com Vite.
**Razão:** App é single-user, sem necessidade de SSR/SEO. Migração seria custo alto sem benefício claro.

### ADR-2: Zustand sobre Redux/Context
**Decisão:** Zustand para state management.
**Razão:** API minimal, TypeScript-first, sem boilerplate. Perfeito para escala deste projeto.

### ADR-3: shadcn/ui como base de componentes
**Decisão:** shadcn/ui (Radix + Tailwind) sobre criação manual de componentes.
**Razão:** Acessibilidade built-in (Radix), integra com Tailwind existente, componentes copiados (não dependência).

### ADR-4: Edge Functions para Gemini (não proxy externo)
**Decisão:** Supabase Edge Function como proxy da API Gemini.
**Razão:** Mantém stack no Supabase, zero infra adicional, protege a API key.

### ADR-5: Tailwind npm (não v4 ainda)
**Decisão:** Migrar para Tailwind v3 via npm. Não migrar para v4 agora.
**Razão:** v4 ainda instável para brownfield. v3 via npm já resolve o problema crítico do CDN.

---

## 6. Resumo de Artefatos Gerados

| Fase | Agente | Arquivo | Status |
|------|--------|---------|--------|
| 1 | @architect | `docs/architecture/system-architecture.md` | ✅ |
| 2 | @data-engineer | `docs/architecture/SCHEMA.md` | ✅ |
| 2 | @data-engineer | `docs/architecture/DB-AUDIT.md` | ✅ |
| 3 | @ux-design-expert | `docs/architecture/frontend-spec.md` | ✅ |
| 4 | @architect | `docs/architecture/technical-debt-DRAFT.md` | ✅ (este) |
| 5 | @data-engineer | `docs/architecture/db-specialist-review.md` | ⏳ |
| 6 | @ux-design-expert | `docs/architecture/ux-specialist-review.md` | ⏳ |
| 7 | @qa | `docs/architecture/qa-review.md` | ⏳ |
| 8 | @architect | `docs/architecture/technical-debt-assessment.md` | ⏳ |
| 9 | @analyst | `docs/architecture/TECHNICAL-DEBT-REPORT.md` | ⏳ |
| 10 | @pm | Epic + Stories | ⏳ |
