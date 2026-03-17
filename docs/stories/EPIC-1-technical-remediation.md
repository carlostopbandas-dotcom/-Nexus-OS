# EPIC-1 — Remediação Técnica Nexus OS
> @pm (Morgan) — Brownfield Discovery Phase 10 — 2026-03-16
> Insumo: TECHNICAL-DEBT-REPORT.md · technical-debt-assessment.md (QA Gate: APPROVED)

---

## Visão do Epic

**Transformar o Nexus OS de tecnicamente frágil para tecnicamente sólido**, sem alterar nenhuma funcionalidade existente nem degradar a qualidade visual do produto.

O sistema hoje funciona bem para o CEO mas está com riscos críticos que precisam ser endereçados antes de qualquer nova feature: banco exposto, dados sem recovery, e arquitetura que dificulta manutenção.

---

## Objetivo de Negócio

| Métrica | Hoje | Target (após Epic) |
|---------|------|-------------------|
| Vetores de ataque críticos | 3 ativos | 0 |
| Dados com recovery possível | 0% | 100% |
| Tempo de onboarding de novo dev | ~2-3 dias | ~2 horas |
| Bundle size estimado | ~900KB | ~350KB |
| Cobertura de testes | 0% | >40% nos services |
| CI/CD | Manual | Automático |

---

## Restrições

- **Funcionalidades:** Zero regressão — todas as 9 páginas devem continuar funcionando
- **Visual:** Interface deve estar idêntica (ou melhor) ao final de cada sprint
- **Stack:** Sem mudança de tecnologia principal (React, Supabase, Vite permanecem)
- **Dados:** Nenhum dado de produção deve ser perdido nas migrations

---

## Estrutura de Sprints

### Sprint 0 — Pré-requisito (1h)
> Desbloqueio imediato antes de qualquer desenvolvimento

**Critério de done:** Schema versionado. Sem credenciais no código. Branch limpa.

### Sprint 1 — Security Foundation (Semana 1) 🔴
> Fechar todos os vetores de ataque críticos

**Critério de done:** Banco protegido. Login obrigatório. Chave Gemini não exposta em DevTools.

### Sprint 2 — Architecture & DB Foundation (Semana 2) 🟠
> Remover God Component. Adicionar routing, state management e service layer. Corrigir schema.

**Critério de done:** App.tsx sem estado global. Navegação por URL. Schema com FKs, updated_at, soft delete.

### Sprint 3 — Frontend System (Semana 3) 🟡
> Migrar Tailwind CDN → npm. Design tokens. Componentes atômicos. Acessibilidade.

**Critério de done:** Zero CDN. Componentes isolados. Sem alert(). WCAG Level A. Visual idêntico ao baseline.

### Sprint 4 — Quality & DevOps (Semana 4) 🟡
> CI/CD automático e qualidade mínima.

**Critério de done:** CI verde. ESLint limpo. TypeScript strict. Testes dos services passando.

---

## Stories por Sprint

### Sprint 0

| ID | Story | Agente | Esforço |
|----|-------|--------|---------|
| 1.0.1 | Capturar schema atual em `001_initial_schema.sql` | @data-engineer | 30min |
| 1.0.2 | Mover credenciais Supabase para `.env.local` | @dev | 20min |
| 1.0.3 | Commitar mudanças em andamento do VoiceAssistant | @dev | 5min |

### Sprint 1 — Security Foundation

| ID | Story | Agente | Esforço |
|----|-------|--------|---------|
| 1.1.1 | Implementar Supabase Auth (login/session) | @dev | 4h |
| 1.1.2 | Criar Edge Function proxy para Gemini API | @dev | 3h |
| 1.1.3 | Criar migration `002_security_foundation.sql` (RLS + policies) | @data-engineer | 3h |
| 1.1.4 | Documentar `.env.example` com todas as variáveis | @dev | 30min |

### Sprint 2 — Architecture & DB Foundation

| ID | Story | Agente | Esforço |
|----|-------|--------|---------|
| 1.2.1 | Instalar React Router v7 e migrar navegação | @dev | 4h |
| 1.2.2 | Instalar Zustand e criar `useAppStore` | @dev | 4h |
| 1.2.3 | Criar service layer (7 services) | @dev | 6h |
| 1.2.4 | Substituir event bus por store subscriptions | @dev | 3h |
| 1.2.5 | Criar migration `003_schema_hardening.sql` | @data-engineer | 3h |
| 1.2.6 | Script de backfill `call_logs.lead_name → lead_id` | @data-engineer | 1h |
| 1.2.7 | Adicionar soft delete em leads e call_logs | @data-engineer | 1h |

### Sprint 3 — Frontend System

| ID | Story | Agente | Esforço |
|----|-------|--------|---------|
| 1.3.1 | Screenshot baseline das 9 páginas | @dev | 30min |
| 1.3.2 | Migrar Tailwind CDN → npm + `tailwind.config.js` | @dev | 2h |
| 1.3.3 | Criar `design-tokens.css` (Single Source of Truth) | @ux-design-expert | 2h |
| 1.3.4 | Instalar shadcn/ui | @dev | 1h |
| 1.3.5 | Criar atoms: Button, Input, Badge, Avatar | @dev | 6h |
| 1.3.6 | Criar molecules: FormField, Modal, Toast (sonner), Skeleton | @dev | 6h |
| 1.3.7 | Criar migration `004_performance_indexes.sql` | @data-engineer | 1h |
| 1.3.8 | Adicionar aria-labels WCAG Level A em todos os inputs | @dev | 2h |
| 1.3.9 | Validar visual vs baseline (pós-migração Tailwind) | @dev | 1h |

### Sprint 4 — Quality & DevOps

| ID | Story | Agente | Esforço |
|----|-------|--------|---------|
| 1.4.1 | Configurar ESLint + Prettier | @devops | 1h |
| 1.4.2 | Remover todos os `any` dos mappers TypeScript | @dev | 2h |
| 1.4.3 | Consolidar `StoreMetric` em `types.ts` | @dev | 30min |
| 1.4.4 | Criar testes Vitest para os 7 services | @dev | 4h |
| 1.4.5 | Criar GitHub Actions (lint + typecheck + test) | @devops | 2h |

---

## Sequência de Dependências

```
1.0.1 Schema capturado
    ↓
1.0.2 + 1.0.3 Ambiente limpo
    ↓
1.1.1 Auth implementado
    ↓ (RLS exige Auth)
1.1.2 + 1.1.3 Edge Function + RLS
    ↓
1.2.1 + 1.2.2 + 1.2.3 Router + Zustand + Services
    ↓
1.2.4 + 1.2.5 + 1.2.6 + 1.2.7 Event bus + Schema hardening
    ↓
1.3.1 Baseline visual (antes de tocar Tailwind)
    ↓
1.3.2 + 1.3.3 Tailwind npm + Tokens
    ↓ (shadcn exige Tailwind npm)
1.3.4 + 1.3.5 + 1.3.6 shadcn + Componentes
    ↓
1.3.7 + 1.3.8 + 1.3.9 Índices + A11y + Validação visual
    ↓
1.4.1 → 1.4.5 Quality & DevOps
```

---

## Esforço Total Estimado

| Sprint | @dev | @data-engineer | @devops | @ux-design-expert | Total |
|--------|------|----------------|---------|-------------------|-------|
| 0 | 25min | 30min | — | — | ~1h |
| 1 | 7.5h | 3h | — | — | ~10.5h |
| 2 | 17h | 5h | — | — | ~22h |
| 3 | 12.5h | 1h | — | 2h | ~15.5h |
| 4 | 6.5h | — | 3h | — | ~9.5h |
| **Total** | **~44h** | **~9.5h** | **~3h** | **~2h** | **~58.5h** |

---

## Princípio de Execução

> **A interface deve estar visualmente idêntica (ou melhor) ao final de cada sprint.**

Nenhuma sprint entrega um produto degradado. Cada sprint entrega um produto mais seguro, mais rápido, mais robusto — com o mesmo visual.

---

## Artefatos de Referência

| Artefato | Path | Uso |
|---------|------|-----|
| Technical Debt Assessment (final) | `docs/architecture/technical-debt-assessment.md` | Detalhe técnico completo |
| Executive Report | `docs/architecture/TECHNICAL-DEBT-REPORT.md` | Contexto de negócio |
| DB Specialist Review | `docs/architecture/db-specialist-review.md` | Migration scripts |
| UX Specialist Review | `docs/architecture/ux-specialist-review.md` | Design tokens, componentes |
| QA Review (APPROVED) | `docs/architecture/qa-review.md` | Critérios de done |

---

## Status das Stories

| Sprint | Total Stories | Status |
|--------|--------------|--------|
| Sprint 0 | 3 | ✅ Draft — 1.0.1, 1.0.2, 1.0.3 |
| Sprint 1 | 4 | ✅ Draft — 1.1.1, 1.1.2, 1.1.3, 1.1.4 |
| Sprint 2 | 7 | ✅ Draft — 1.2.1 a 1.2.7 |
| Sprint 3 | 9 | ✅ Draft — 1.3.1 a 1.3.9 |
| Sprint 4 | 5 | ✅ Draft — 1.4.1 a 1.4.5 |
| **Total** | **28** | **28/28 criadas ✅ — Aguardando @po validação** |

---

*28/28 stories criadas por @sm — 2026-03-17*
*Próximo passo: @po → `*validate-story-draft` para todas as 28 stories*
