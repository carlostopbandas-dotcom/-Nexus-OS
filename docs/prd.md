# Nexus OS — Brownfield Enhancement PRD
> @pm (Morgan) — 2026-03-19
> Insumo: Brownfield Discovery completo (docs/architecture/) + Elicitação direta com CEO

---

## Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Criação inicial | 2026-03-19 | 1.0 | PRD pós-EPIC-1 — evolução para plataforma multi-negócio | @pm (Morgan) |

---

## 1. Visão do Produto

**Nexus OS** é o sistema operacional executivo do CEO Carlos — hoje um dashboard pessoal robusto, amanhã uma **plataforma de gestão multi-negócio completa**.

O EPIC-1 (Remediação Técnica) entregou a base sólida. Este PRD define a próxima fase: transformar o Nexus OS em uma plataforma que conecta dois ecossistemas de negócio distintos, automatiza decisões com IA e permite que um time crescente colabore com segurança.

### Os dois ecossistemas

| Ecossistema | Negócios | Status |
|-------------|----------|--------|
| **Grupo VcChic** | VcChic, Moriel, Mivave (Dez/2026), Sezo (2º sem/2026) | E-commerce Shopify — ativo |
| **3D Digital Business** | C.E.N.D, Marketing_3D, Produção, Inovação, Negócios Digitais, C.S.C | Plataforma em construção |

### Usuário primário
**Carlos (CEO)** — visão total de ambos os ecossistemas, único usuário hoje.

### Usuários futuros (3 meses)
- **Gestor Grupo VcChic** — todas as lojas do grupo, sem dados da 3D nem financeiro consolidado
- **Vendedor/SDR 3D** — CRM da 3D + Calls, sem acesso financeiro
- **Assistente/Operacional** — Agenda e tasks delegadas

---

## 2. Contexto e Motivação

### Estado pós-EPIC-1 (base atual)

O EPIC-1 entregou:
- ✅ Supabase Auth (login obrigatório)
- ✅ Arquitetura com React Router v7, Zustand, service layer
- ✅ Design System (shadcn/ui, design-tokens.css)
- ✅ TypeScript strict, ESLint 9, Vitest (55%+ coverage)
- ✅ GitHub Actions CI (lint + typecheck + test)
- ✅ Schema versionado com soft delete e indexes

### Por que agora?

Com a base técnica saneada, o Nexus OS está pronto para crescer. Carlos opera dois ecossistemas crescentes **sem visibilidade financeira consolidada, sem integrações automáticas e sem ferramentas para o time que está chegando**. Cada decisão hoje exige acesso manual a múltiplas plataformas — Shopify, Facebook Ads, Google Ads — sem cruzamento de dados.

### Diagnóstico em uma frase
*Base sólida construída. Agora: conectar os negócios, automatizar as decisões e abrir para o time.*

---

## 3. Objetivos de Negócio

| Métrica | Hoje | Target (pós EPIC-2/3/4) |
|---------|------|------------------------|
| Visibilidade financeira | Zero | ✅ ROAS, lucro e fluxo de caixa em tempo real |
| Tempo para decisão de campanha | 20–30 min (manual) | ✅ < 2 min (dashboard automático) |
| Entrada manual de dados | Diária | ✅ Eliminada nas fontes integradas |
| Usuários no sistema | 1 (CEO) | ✅ Até 10 com permissões granulares |
| Relatórios executivos | Inexistentes | ✅ Semanal automático + PDF on demand |
| Contexto para decisões de IA | Genérico | ✅ Cruzado com dados reais do negócio |

---

## 4. Requisitos Funcionais

### Módulo Financeiro — Grupo VcChic

- **FR1:** Integração com Facebook Ads API por Business Manager (VcChic BM + Moriel/Sezo BM) para captura automática de gastos por campanha e por loja
- **FR2:** Integração com Google Ads para captura de gastos por campanha e por loja
- **FR3:** Cálculo automático de ROAS por loja (receita Shopify ÷ gasto Ads) e ROAS global consolidado do Grupo VcChic
- **FR4:** Registro de CMV (custo de mercadoria vendida) por loja — manual inicialmente, automatizável no futuro
- **FR5:** Dashboard financeiro por loja: receita, despesa Ads, CMV, lucro líquido + visão consolidada do grupo
- **FR6:** Fluxo de caixa com histórico real (receita vs despesa) e projeção futura
- **FR7:** Visibilidade de campanhas ativas com indicador de lucratividade (ROAS acima/abaixo da meta configurável por loja)

### Módulo Financeiro — 3D Digital Business

- **FR8:** Estrutura de financeiro para 3D Digital com 6 divisões — lançamento manual de receitas e despesas enquanto plataforma não existe
- **FR9:** Arquitetura preparada para integração automática futura com plataforma 3D (quando criada)

### Relatórios

- **FR10:** Relatório semanal automático gerado pelo Gemini — narrativa em texto + gráficos opcionais de métricas-chave
- **FR11:** Exportação de relatórios em PDF on demand
- **FR12:** Relatórios separados por ecossistema (Grupo VcChic vs 3D Digital) + visão consolidada CEO

### CRM Evoluído — 3D Digital

- **FR13:** Funil Kanban visual por produto da 3D: Projeto Respirar, Formação 3D, Método PSB, Mapa da Clareza Digital, IA para Negócios
- **FR14:** Timeline de interações por lead (calls, mensagens, anotações, mudanças de status) com histórico completo
- **FR15:** Alertas automáticos de follow-up — lead sem contato há X dias (threshold configurável por produto)
- **FR16:** Alerta de queda de taxa de conversão com contexto (produto afetado, período, comparativo histórico)

### OKRs Evoluídos

- **FR17:** Atualização automática de KRs com dados integrados (Shopify → receita, Ads → ROAS, futuro: 3D Digital)
- **FR18:** OKRs por divisão da 3D Digital + por loja do Grupo VcChic — além dos OKRs estratégicos do CEO
- **FR19:** Alertas de KR em risco com threshold configurável (ex: abaixo de 60% no meio do período)

### Tasks & Rotina

- **FR20:** Recorrência de tasks com reajuste automático quando surgir compromisso no Google Calendar
- **FR21:** Alertas de tasks não cumpridas no prazo (notificação no sistema + resumo diário)
- **FR22:** Critérios aprimorados de seleção automática 1-3-5 (prioridade, deadline, OKR vinculado, energia necessária)
- **FR23:** Rotina diária gerada pelo Gemini respeitando o BLUEPRINT de produtividade do CEO

### Integrações

- **FR24:** WhatsApp Business bidirecional — enviar mensagens para leads direto do CRM + receber notificações de leads no Nexus
- **FR25:** Google Calendar bidirecional — eventos criados no Nexus aparecem no Google e vice-versa
- **FR26:** Instagram Business — métricas de engajamento (alcance, interações, seguidores) por negócio/loja
- **FR27:** YAMP — visibilidade de disparos automáticos e métricas de email das lojas VcChic e Sezo no Nexus
- **FR28:** Notion/Google Docs — integração com base de conhecimento existente no Knowledge Hub
- **FR29:** Estrutura preparada para Hotmart/Kiwify — integração ativa quando produtos 3D forem lançados

### IA Aprofundada

- **FR30:** Resumo matinal automático ao abrir o Nexus — tasks do dia + calls/reuniões + OKRs em risco + métricas das lojas + alertas ativos; pausável para modo emergência
- **FR31:** AI Advisor mantém todas as funcionalidades atuais + capacidade de cruzar com dados reais do negócio (leads, receita, OKRs, campanhas)
- **FR32:** Knowledge Hub como área de estudos pessoais curada (Gestão, Liderança, Vendas, Produtividade) — separado do AI Advisor estratégico
- **FR33:** Gemini aprende o BLUEPRINT de produtividade do CEO e o respeita na geração de rotinas, sugestões de tasks e planejamento semanal

### Multi-usuário

- **FR34:** Sistema de perfis com 4 papéis: CEO, Gestor VcChic, Vendedor/SDR 3D, Assistente/Operacional
- **FR35:** RLS (Row Level Security) do Supabase aplicado por papel — cada usuário vê e edita apenas o que seu perfil permite
- **FR36:** Financeiro consolidado, AI Advisor estratégico e dados da 3D Digital restritos ao CEO
- **FR37:** Onboarding de novo usuário configurado e operacional em menos de 1 hora

---

## 5. Requisitos Não-Funcionais

- **NFR1:** Zero regressão nas 9 páginas existentes após cada entrega incremental
- **NFR2:** Dashboard carrega em menos de 3 segundos mesmo com múltiplas integrações ativas
- **NFR3:** Dados financeiros, de CRM e estratégicos criptografados em trânsito (HTTPS) e em repouso (Supabase encryption)
- **NFR4:** RLS do Supabase implementado e auditado para todos os papéis antes de qualquer usuário adicional ser criado
- **NFR5:** Todas as integrações com APIs externas com fallback gracioso — se API externa cair, restante do dashboard continua funcionando
- **NFR6:** Relatórios semanais gerados sem intervenção manual do CEO
- **NFR7:** Suporte inicial para até 10 usuários simultâneos

---

## 6. Requisitos de Compatibilidade

- **CR1:** Manter compatibilidade total com integração Shopify existente (VcChic, Moriel, Sezo já integradas)
- **CR2:** Schema Supabase evolui exclusivamente por migrations incrementais — zero perda de dados de produção
- **CR3:** UI mantém design system atual (shadcn/ui New York, slate, design-tokens.css SSoT)
- **CR4:** GitHub Actions CI (lint + typecheck + test) permanece verde após cada sprint

---

## 7. Constraints de UI/UX

### Integração com UI existente

Todas as novas telas seguem os padrões estabelecidos no EPIC-1:
- Componentes do shadcn/ui (New York style, tema slate)
- Tokens de design centralizados em `design-tokens.css`
- Sidebar de navegação existente — novas seções adicionadas sem redesign
- Mobile-first onde aplicável (relatórios, alertas)

### Telas novas/modificadas

| Tela | Tipo | Descrição |
|------|------|-----------|
| Dashboard Financeiro | Nova | ROAS, lucro, fluxo de caixa por loja + consolidado |
| CRM Kanban | Modificada | Funil visual por produto 3D |
| Timeline de Lead | Nova | Histórico completo de interações |
| OKRs por unidade | Modificada | Sub-OKRs por divisão/loja com auto-update |
| Configurações de Usuário | Nova | Perfis, permissões, onboarding |
| Resumo Matinal | Nova | Modal/painel de briefing diário com IA |
| Relatórios | Nova | Dashboard de relatórios + exportação PDF |

### Consistência de UX

- Alertas e notificações seguem sistema unificado (toast + painel de notificações)
- BLUEPRINT integrado ao fluxo de rotina — não é uma tela separada, é contexto do Gemini
- Multi-usuário transparente para o CEO — mesma interface, dados filtrados por RLS

---

## 8. Constraints Técnicas e Integrações

### Stack atual (mantida)

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React + TypeScript | 19.x + 5.8 |
| Build | Vite | 6.x |
| State | Zustand | atual |
| Router | React Router | v7 |
| UI | shadcn/ui (New York) | atual |
| Database/Auth | Supabase (PostgreSQL) | atual |
| AI/Voice | Google Gemini 2.5 Flash | @google/genai |
| CI/CD | GitHub Actions | ativo |

### Integrações externas — abordagem técnica

| Integração | Abordagem | Observações |
|-----------|-----------|-------------|
| Facebook Ads | Graph API v19+ | Por BM — requer token por BM |
| Google Ads | Google Ads API | OAuth 2.0 por conta |
| WhatsApp Business | Cloud API (Meta) | Webhook bidirecional |
| Google Calendar | Google Calendar API | OAuth 2.0 — sync bidirecional |
| Instagram Business | Graph API (via Meta) | Métricas read-only |
| YAMP | API YAMP ou webhook | Verificar disponibilidade |
| Notion | Notion API | Read + write |
| Hotmart/Kiwify | APIs respectivas | Estrutura preparatória |

### Estratégia de integração

- **Supabase Edge Functions** para proxying de APIs externas (evitar exposição de keys no frontend)
- **Webhooks** para dados em tempo real (WhatsApp, pedidos Shopify)
- **Polling agendado** para dados periódicos (Ads, métricas Instagram — a cada hora)
- **Cache em Supabase** para dados de APIs externas — evitar rate limits

### Estratégia de deployment

- Vite build + Vercel/Netlify (atual) ou Railway — manter CI/CD existente
- Secrets de APIs externas via GitHub Secrets (padrão estabelecido no EPIC-1)
- Migrações de banco via Supabase migrations versionadas

### Riscos técnicos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Rate limits das APIs de Ads | Alto | Cache em Supabase + polling inteligente |
| Facebook Graph API mudanças de versão | Médio | Versionar explicitamente, monitorar deprecations |
| WhatsApp Business approval process | Alto | Iniciar processo de aprovação Meta com antecedência |
| RLS mal configurado expõe dados entre usuários | Crítico | Auditoria de RLS obrigatória antes de multi-usuário ir para produção |
| BLUEPRINT não formalizado | Médio | CEO deve documentar BLUEPRINT antes da IA ser treinada nele |

---

## 9. Estrutura de Epics

Este PRD é implementado em 3 Epics sequenciais, priorizados por valor de negócio e dependência técnica.

---

### EPIC-2 — Financeiro, Integrações Core e Multi-usuário
> **Prioridade:** ALTA — estagiário entra em 3 meses, Carlos precisa de visibilidade financeira agora
> **Duração estimada:** 5–6 semanas

**Objetivo:** CEO tem visibilidade financeira real das lojas + time pode começar a usar o sistema com segurança.

**Stories de alto nível:**

| # | Story | Agente | Esforço |
|---|-------|--------|---------|
| 2.1 | Multi-usuário: sistema de perfis + RLS por papel | @dev + @data-engineer | 4h |
| 2.2 | Integração Facebook Ads API (VcChic BM + Moriel/Sezo BM) | @dev | 6h |
| 2.3 | Integração Google Ads API | @dev | 4h |
| 2.4 | Dashboard financeiro por loja: ROAS, lucro, fluxo de caixa | @dev + @ux-design-expert | 6h |
| 2.5 | Registro manual de CMV + despesas Grupo VcChic | @dev | 3h |
| 2.6 | Visibilidade de campanhas ativas com status lucratividade | @dev | 3h |
| 2.7 | Integração Google Calendar bidirecional | @dev | 4h |
| 2.8 | Módulo financeiro 3D Digital (lançamento manual + estrutura futura) | @dev | 3h |
| 2.9 | Onboarding de usuário + guia de permissões | @dev + @ux-design-expert | 2h |

**Critério de done:** CEO vê ROAS de cada loja em tempo real. Estagiário consegue fazer login e usar o CRM sem ver dados financeiros.

---

### EPIC-3 — IA Profunda, CRM Evoluído e Automação
> **Prioridade:** ALTA — reduz trabalho manual diário do CEO
> **Duração estimada:** 4–5 semanas

**Objetivo:** Nexus OS trabalha proativamente para Carlos — alertas, resumos e decisões baseadas em dados reais.

**Stories de alto nível:**

| # | Story | Agente | Esforço |
|---|-------|--------|---------|
| 3.1 | Resumo matinal automático (tasks + OKRs + métricas + calls do dia) | @dev | 4h |
| 3.2 | BLUEPRINT: documentar e integrar ao Gemini | @dev | 3h |
| 3.3 | Alertas de negócio: ROAS abaixo da meta, KR em risco, conversão de leads | @dev | 4h |
| 3.4 | CRM Kanban visual por produto 3D com funil de vendas | @dev + @ux-design-expert | 5h |
| 3.5 | Timeline de interações por lead | @dev | 3h |
| 3.6 | Follow-up automático: alertas de lead sem contato | @dev | 2h |
| 3.7 | OKRs automáticos: puxar dados de Shopify e Ads | @dev | 4h |
| 3.8 | OKRs por divisão 3D + por loja VcChic | @dev + @ux-design-expert | 3h |
| 3.9 | Relatório semanal automático (Gemini) + exportação PDF | @dev | 4h |
| 3.10 | AI Advisor: cruzamento com dados reais de negócio | @dev | 4h |
| 3.11 | Tasks recorrentes + alertas de não cumprimento | @dev | 3h |

**Critério de done:** Carlos abre o Nexus pela manhã e já tem o briefing do dia. Não precisa acessar Shopify ou Ads para saber se as lojas estão lucrativas.

---

### EPIC-4 — Expansão de Plataforma e Integrações Avançadas
> **Prioridade:** MÉDIA — integrações sociais e preparação para crescimento
> **Duração estimada:** 4–5 semanas

**Objetivo:** Nexus OS conectado a todos os canais relevantes e preparado para escala.

**Stories de alto nível:**

| # | Story | Agente | Esforço |
|---|-------|--------|---------|
| 4.1 | WhatsApp Business bidirecional (CRM → WhatsApp + notificações) | @dev | 6h |
| 4.2 | Instagram Business: métricas de engajamento por negócio | @dev | 3h |
| 4.3 | YAMP: visibilidade de disparos e métricas de email | @dev | 2h |
| 4.4 | Notion/Google Docs: integração com Knowledge Hub | @dev | 3h |
| 4.5 | Estrutura preparatória Hotmart/Kiwify (integração futura) | @dev | 2h |
| 4.6 | Knowledge Hub: área de estudos curada com categorias | @dev + @ux-design-expert | 3h |
| 4.7 | Tasks: critérios aprimorados de seleção automática 1-3-5 | @dev | 3h |
| 4.8 | Relatórios: Instagram + WhatsApp + email no relatório semanal | @dev | 3h |
| 4.9 | Ativação Mivave (Dez/2026) — preparação de estrutura | @dev | 2h |
| 4.10 | Ativação Sezo (2º sem/2026) — preparação de estrutura | @dev | 2h |

**Critério de done:** Carlos consegue responder um lead pelo WhatsApp direto do CRM. Instagram e email entram no relatório semanal automaticamente.

---

## 10. Priorização MoSCoW

### Must Have (EPIC-2)
- Financeiro Grupo VcChic (ROAS, lucro, fluxo de caixa)
- Multi-usuário com RLS
- Google Calendar bidirecional
- Facebook Ads + Google Ads integrados

### Should Have (EPIC-3)
- Resumo matinal com IA
- CRM Kanban evoluído
- OKRs automáticos
- Alertas de negócio
- Relatório semanal automático

### Could Have (EPIC-4)
- WhatsApp bidirecional
- Instagram métricas
- Knowledge Hub curado
- YAMP visibilidade

### Won't Have (agora)
- Área de membros própria
- Plataforma 3D Digital completa
- Integração contabilidade (sem ferramenta definida)
- AI Advisor para não-CEO (aguarda versão especializada)

---

## 11. Marcos e Timeline

| Marco | Epic | Estimativa |
|-------|------|-----------|
| Estagiário pode usar o sistema | EPIC-2 | Semana 5–6 |
| Carlos para de abrir Shopify/Ads manualmente | EPIC-2 + EPIC-3 | Semana 10–11 |
| Mivave ativa com estrutura pronta | EPIC-4 | Dezembro 2026 |
| Nexus OS totalmente conectado | EPIC-4 | 2º semestre 2026 |

---

## 12. Próximos Passos

1. **@architect** — avaliar impacto arquitetural do EPIC-2 (especialmente multi-usuário + integrações Ads)
2. **@sm** — criar stories detalhadas do EPIC-2 (começar por 2.1 multi-usuário + 2.2 Facebook Ads)
3. **CEO** — documentar o BLUEPRINT de produtividade (necessário para FR33 — Gemini aprende o BLUEPRINT)
4. **CEO** — iniciar processo de aprovação do WhatsApp Business Cloud API com a Meta (lead time ~2–4 semanas)
5. **@devops** — configurar secrets adicionais no GitHub para APIs externas (Facebook, Google, WhatsApp)

---

*Nexus OS PRD v1.0 — @pm (Morgan) — 2026-03-19*
*Fonte: Brownfield Discovery (docs/architecture/) + Elicitação com CEO Carlos*
