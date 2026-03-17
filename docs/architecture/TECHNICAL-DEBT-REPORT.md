# Technical Debt Report — Nexus OS
> @analyst (Atlas) — Brownfield Discovery Phase 9 — 2026-03-16
> Executive Summary · Para uso do @pm na criação do Epic (Phase 10)

---

## TL;DR — Para Decisão Imediata

```
O Nexus OS funciona bem visualmente, mas está com o banco de produção
completamente exposto à internet. Qualquer pessoa pode acessar todos
os leads, calls e métricas de negócio agora, com zero conhecimento
técnico. Isso precisa ser corrigido antes de qualquer outra coisa.

Fora isso: 4 semanas de trabalho focado transforma o sistema em uma
base técnica sólida, sem mudar nada no visual ou nas funcionalidades.
```

---

## 1. Situação Atual

### O Produto

Nexus OS é um dashboard executivo para gestão de múltiplos negócios (3D Digital, Mivave, VcChic, Moriel, Sezo). Reúne CRM, OKRs, agenda, tasks, métricas de e-commerce, calls de vendas e assistente de IA em uma única interface.

**O que funciona bem hoje:**
- Interface visual premium e consistente — resultado de qualidade acima da média
- 9 módulos funcionais integrados ao Supabase
- Assistente de voz (Gemini Live) com comandos por fala
- Fluxos de usuário completos (lead → call → OKR)

**O diagnóstico em uma frase:** *Motor de Ferrari, sem freios e com a porta aberta.*

### Score Geral: 2.5/10 — HIGH RISK

```
🔴 CRÍTICO (score ≤ 2)          🟠 ALTO (score 3-5)      🟡 OK (score ≥ 6)
────────────────────────────────────────────────────────────────────────────
Segurança:              1.5/10  Frontend/UX:    4.5/10  UX/Usabilidade: 6/10
Integridade de dados:   1.0/10  Qualidade:      4.0/10
Design System:          1.0/10
Observabilidade:        0.0/10  ←  Nenhum log, nenhum audit trail
DevOps:                 2.0/10
Banco de Dados:         2.5/10
Arquitetura:            3.0/10
```

---

## 2. Os 3 Riscos que Precisam de Ação Imediata

### Risco 1 — Banco Aberto (Hoje)

A chave de acesso ao banco Supabase está visível no código-fonte da aplicação. Qualquer pessoa que abrir o DevTools do browser pode copiá-la e acessar todos os dados diretamente — sem login, sem senha, sem rastro.

**Dados expostos:** todos os leads, emails, valores de negócio, transcrições de calls, OKRs, métricas das lojas.

**Tempo para explorar:** menos de 30 segundos. Sem conhecimento técnico.

**Fix:** mover a chave para variável de ambiente + implementar login. Estimativa: 1 dia de trabalho.

---

### Risco 2 — Chave de IA Exposta (Hoje)

A chave da API Gemini (inteligência artificial do assistente de voz) está embutida no código que vai para o browser. Isso significa que qualquer pessoa pode usar essa chave para fazer requisições à API Gemini, gerando custos sem controle para o titular da conta.

**Fix:** mover as chamadas ao Gemini para um servidor intermediário (Edge Function no Supabase). Estimativa: 3-4 horas.

---

### Risco 3 — Perda Irreversível de Dados (Risco Contínuo)

Se qualquer lead, call ou registro for deletado hoje — por acidente, por um bug, ou intencionalmente — não existe forma de recuperar. Não há lixeira, não há histórico de alterações, não há backup de schema.

Para um sistema que é o registro central de negócios do CEO, isso representa risco de perda de informação estratégica sem possibilidade de recovery.

**Fix:** adicionar soft delete (marcar como deletado em vez de apagar) + versionar o schema do banco. Estimativa: 2-3 horas.

---

## 3. O Que Está Bom — Não Mudar

Antes de listar o que precisa de correção, é importante registrar o que **não deve ser tocado** na refatoração:

| Asset | Por quê preservar |
|-------|------------------|
| Design visual (dark sidebar + light content) | Escolha forte, consistente, premium |
| Animações e micro-interações (framer-motion) | Diferencial visual — sensação de produto caro |
| Fluxos de usuário completos | CRM, voz, OKRs já funcionam bem |
| Assistente de voz integrado | Funcionalidade avançada e diferenciada |
| Color coding por unidade de negócio | Identidade visual de cada empresa preservada |

**Princípio da refatoração:** a interface deve estar visualmente igual (ou melhor) após cada semana de trabalho.

---

## 4. Plano de Remediação — 4 Semanas

### Semana 0 — Pré-requisito (1h · Esta tarde)

Antes de qualquer desenvolvimento, três ações que levam ~1 hora:
1. Capturar o schema do banco em arquivo de versionamento (30 min)
2. Mover credenciais do Supabase para arquivo de ambiente local (20 min)
3. Salvar as mudanças em andamento do componente VoiceAssistant (5 min)

**Por que primeiro:** se algo der errado nas próximas semanas, existe recovery.

---

### Semana 1 — Segurança (Sprint 1) 🔴

**Objetivo:** fechar todos os vetores de ataque críticos.

| O que fazer | Quem | Tempo estimado |
|------------|------|---------------|
| Implementar login/autenticação para o CEO | @dev | 4h |
| Criar proxy para proteger chave Gemini | @dev | 3h |
| Ativar proteção de linhas (RLS) no Supabase | @data-engineer | 3h |
| Documentar variáveis de ambiente necessárias | @dev | 30min |

**Resultado:** banco protegido. Login obrigatório. Chave Gemini não mais exposta.

---

### Semana 2 — Arquitetura & Banco (Sprint 2) 🟠

**Objetivo:** consertar a estrutura interna sem mudar nada visível.

| O que fazer | Quem | Tempo estimado |
|------------|------|---------------|
| Adicionar React Router (URLs reais para cada módulo) | @dev | 4h |
| Criar gerenciamento de estado centralizado (Zustand) | @dev | 4h |
| Separar queries do banco em camada de serviços | @dev | 6h |
| Adicionar timestamps de atualização no banco | @data-engineer | 3h |
| Adicionar soft delete em leads e calls | @data-engineer | 1h |
| Criar vínculo real entre calls e leads (FK) | @data-engineer | 2h |

**Resultado:** navegação por URL. Estado previsível. Banco com integridade relacional.

---

### Semana 3 — Frontend System (Sprint 3) 🟡

**Objetivo:** migrar Tailwind CDN → npm, criar sistema de componentes, corrigir acessibilidade.

| O que fazer | Quem | Tempo estimado |
|------------|------|---------------|
| Tirar screenshots das 9 páginas (baseline visual) | @dev | 30min |
| Instalar Tailwind via npm (remover CDN) | @dev | 2h |
| Criar arquivo de tokens de design (CSS variables) | @ux-design-expert | 2h |
| Criar componentes base: Button, Input, Modal, Toast | @dev | 6h |
| Substituir alert() por notificações visuais | @dev | 2h |
| Adicionar labels de acessibilidade nos inputs | @dev | 2h |
| Verificar visual idêntico ao baseline | @dev | 1h |

**Resultado:** bundle ~60% menor. Componentes reutilizáveis. Sem alert(). Acessível.

---

### Semana 4 — Qualidade & DevOps (Sprint 4) 🟡

**Objetivo:** CI/CD automático e qualidade mínima de código.

| O que fazer | Quem | Tempo estimado |
|------------|------|---------------|
| Configurar ESLint + Prettier | @devops | 1h |
| Remover tipagens `any` do TypeScript | @dev | 2h |
| Criar primeiros testes automatizados (serviços) | @dev | 4h |
| Configurar GitHub Actions (lint + tipos + testes) | @devops | 2h |

**Resultado:** CI verde. Código consistente. Regressões detectadas automaticamente.

---

## 5. Resumo de Esforço

| Sprint | Foco | Dev Total | DB | DevOps |
|--------|------|-----------|-----|--------|
| 0 | Pré-requisito | 25min | 35min | — |
| 1 | Segurança | 7.5h | 3h | — |
| 2 | Arquitetura & DB | 14h | 6h | — |
| 3 | Frontend | 13.5h | 1h | — |
| 4 | Qualidade | 6h | — | 3h |
| **Total** | | **~41h** | **~10h** | **~3h** |

Estimativa total: **~54 horas de desenvolvimento** distribuídas em 4 semanas.

---

## 6. O Que Não Fazer

Com base no assessment, as seguintes decisões foram tomadas deliberadamente:

| Decisão | Razão |
|---------|-------|
| **Não migrar para Next.js** | App é single-user, sem necessidade de SEO/SSR. Custo alto, benefício nulo. |
| **Não migrar para Tailwind v4** | Versão ainda instável para projetos existentes. v3 via npm resolve o problema. |
| **Não trocar React** | Base já funcional. Quebrar para reescrever não agrega valor. |
| **Não usar Redux** | Zustand é suficiente e tem 1/10 da complexidade para este escopo. |
| **Não criar nova UI do zero** | O visual atual é um ativo. Refatorar a estrutura, preservar o estilo. |

---

## 7. Próximo Passo

**Phase 10 — @pm:** Com este relatório, o PM pode criar o **Epic de Remediação Técnica** com as stories derivadas de cada sprint, priorizadas pela ordem de dependências documentada.

Insumos disponíveis para o PM:
- Este relatório (executive summary)
- `technical-debt-assessment.md` (detalhe técnico completo)
- 4 migration SQL scripts prontos para implementação
- ADRs 1-7 documentadas com justificativas
- Critérios de done por sprint

---

*Gerado a partir de: system-architecture.md · SCHEMA.md · DB-AUDIT.md · frontend-spec.md · technical-debt-DRAFT.md · db-specialist-review.md · ux-specialist-review.md · qa-review.md · technical-debt-assessment.md*

*Próxima fase: @pm → Epic + Stories (Phase 10)*
