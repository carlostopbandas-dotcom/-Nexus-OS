# EPIC-3 — CEO OS Intelligence Layer
> @pm (Morgan) — 2026-05-06
> Insumo: Plano CEO OS Evolution (Fases 4–6) — definido em sessão com Carlos Eduardo
> **STATUS: CONCLUÍDO ✅ — 2026-05-07**

---

## Visão do Epic

**Transformar o Nexus OS em um sistema de inteligência operacional**, onde a IA analisa leads, detecta oportunidades e gera insights acionáveis diretamente no Pipeline e no Dashboard — sem o CEO precisar abrir uma nova tela.

O EPIC-1 entregou a base técnica. O EPIC-2 entregará financeiro e multi-usuário. Este epic entrega a camada de inteligência: o Nexus passa de CRM para **CEO Advisor em tempo real**.

---

## Objetivo de Negócio

| Métrica | Hoje | Target (após Epic) |
|---------|------|-------------------|
| Tempo para identificar lead prioritário | Manual (lê todos os cards) | ✅ < 10s (AI score visível no card) |
| Sugestão de próxima ação | Zero automação | ✅ Gemini sugere ação por lead |
| Insights do pipeline | Zero | ✅ AI summary no Dashboard (oportunidades + riscos) |
| Tempo de follow-up perdido | Alto (sem alerta) | ✅ AI detecta leads sem ação há X dias |

---

## Contexto do Sistema Existente

- **Stack:** React + TypeScript + Vite, Supabase, Zustand, Gemini AI (Google)
- **Gemini já integrado:** `VITE_GEMINI_API_KEY` configurado, página `/ai` (AIAdvisor) operacional
- **Dados disponíveis:** tabela `leads` com status, value, product, businessUnit, module, painPoint, nextAction, followUpDate, paymentStatus, createdAt
- **Páginas afetadas:** `/pipeline` (Pipeline.tsx), `/` (Dashboard.tsx), `/clients` (Clients.tsx)
- **Padrão UI:** Tailwind + cards rounded-3xl, paleta slate/indigo/emerald — manter em tudo

---

## Estrutura de Stories

### Story 3.1 — AI Lead Score no Pipeline
**Executor:** `@dev` | **Quality Gate:** `@architect`

Gemini analisa cada lead (value, status, days in pipeline, painPoint, product) e retorna um score de prioridade (0–100) com ícone visual no card. Inclui sugestão de próxima ação gerada por IA.

- **Tipo:** Frontend + Integration (Gemini API)
- **Complexidade:** Medium
- **Quality Gates:** Pre-Commit (security — API key não exposta), Pre-PR (UX consistency)
- **Agentes:** `@dev` (executor), `@architect` (quality gate — novo padrão de integração Gemini no CRM)

### Story 3.2 — AI Pipeline Summary no Dashboard
**Executor:** `@dev` | **Quality Gate:** `@architect`

Widget no Dashboard que usa Gemini para gerar um resumo semanal do pipeline: top 3 oportunidades, leads em risco de esfriarem, e uma recomendação de foco para o CEO. Atualiza sob demanda (botão refresh).

- **Tipo:** Frontend + Integration (Gemini API)
- **Complexidade:** Medium
- **Quality Gates:** Pre-Commit, Pre-PR
- **Agentes:** `@dev` (executor), `@architect` (quality gate)

### Story 3.3 — AI Follow-up Alert em Clientes Ativos
**Executor:** `@dev` | **Quality Gate:** `@architect`

Na página `/clients`, Gemini identifica clientes sem follow-up registrado há mais de X dias e exibe um alerta visual no card. Inclui sugestão de mensagem WhatsApp gerada por IA.

- **Tipo:** Frontend + Integration (Gemini API)
- **Complexidade:** Low–Medium
- **Quality Gates:** Pre-Commit, Pre-PR
- **Agentes:** `@dev` (executor), `@architect` (quality gate)

---

## Executor Assignment

| Story | Tipo | Executor | Quality Gate | Quality Gate Tools |
|-------|------|----------|--------------|-------------------|
| 3.1 | Feature + API Integration | @dev | @architect | security_scan, ux_consistency, api_error_handling |
| 3.2 | Feature + API Integration | @dev | @architect | security_scan, performance, ux_consistency |
| 3.3 | Feature + API Integration | @dev | @architect | security_scan, ux_consistency, accessibility |

---

## Sequência de Dependências

```
3.1 AI Lead Score (Pipeline) — base da integração Gemini no CRM
    ↓
3.2 AI Pipeline Summary (Dashboard) — usa padrão estabelecido em 3.1
    ↓
3.3 AI Follow-up Alert (Clients) — extensão do padrão para /clients
```

---

## Compatibility Requirements

- [ ] Página `/ai` (AIAdvisor) existente permanece sem regressão (CR1)
- [ ] `VITE_GEMINI_API_KEY` existente reutilizada — zero nova variável de ambiente obrigatória (CR2)
- [ ] Design system atual (rounded-3xl, slate, indigo) mantido em todos os novos componentes (CR3)
- [ ] Gemini chamado client-side com tratamento de erro graceful — UI funciona mesmo offline da API (CR4)
- [ ] Nenhuma mudança no schema do banco — apenas leitura dos dados existentes (CR5)

---

## Risk Mitigation

- **Risco Principal:** Rate limit do Gemini gerando erros visíveis ao usuário
- **Mitigação:** Debounce + cache de resposta em memória (Zustand) por 5 min — chamar apenas sob demanda, nunca no render
- **Rollback:** Features de AI são aditivas — remover qualquer componente não afeta o core do CRM
- **Segurança:** API key apenas via `VITE_GEMINI_API_KEY` (variável de ambiente do Vite) — nunca hardcoded

---

## Definition of Done

- [x] Story 3.1: AI score visível em cada card do Pipeline, próxima ação sugerida ✅ 2026-05-06
- [x] Story 3.2: Widget AI Summary no Dashboard, atualização sob demanda ✅ 2026-05-07
- [x] Story 3.3: Alerta de follow-up em /clients, sugestão WhatsApp gerada por IA ✅ 2026-05-07
- [x] Zero regressão nas páginas existentes (Pipeline, Dashboard, Clients, AIAdvisor)
- [x] CI/CD verde após cada story
- [x] Deploy via @devops (Gage) após quality gate aprovado

---

## Handoff para @sm (River)

> Story Manager, por favor desenvolva as stories detalhadas deste epic brownfield.
>
> **Sistema:** Vite + React + TypeScript + Supabase + Gemini AI
> **Integração Gemini existente:** `import { GoogleGenerativeAI } from '@google/generative-ai'` — padrão já em uso em `pages/AIAdvisor.tsx`
> **Padrão de integração a seguir:** Veja como AIAdvisor.tsx chama a API Gemini e replique o padrão nos novos componentes
> **Compatibilidade crítica:** Nenhuma mudança no schema do banco — apenas leitura da tabela `leads`
> **Próxima story a criar:** 3.1 — AI Lead Score no Pipeline
