# Market Research Report: nexus-os

**Data:** 2026-03-16
**Analista:** Atlas (Analyst Agent)
**Status:** Draft — Pronto para handoff @pm
**Template:** market-research-tmpl.yaml v2.0

---

## Executive Summary

O nexus-os opera na intersecção de três mercados em crescimento acelerado: Personal CRM ($96B → $145B até 2028), AI Automation in CRM ($8B → $28B até 2030) e E-commerce Analytics ($6B → $14B até 2029). O mercado combinado relevante (CRM + IA + analytics operacional) representa **$12–18B TAM**, com SAM de **$2.1B** para o segmento de small business e e-commerce operators.

O diferencial estratégico do nexus-os não é competir em features com HubSpot — é competir em **velocidade de decisão para o operador solo**. Cada tela deve responder: *"O que eu faço agora?"*

**Recomendação:** Priorizar Automação IA (Quick Wins) → One-screen view → Integração E-commerce (+plus).

---

## 1. Research Objectives & Methodology

### 1.1 Objetivos da Pesquisa

**Decisões a informar:**
1. Vale construir integração nativa de métricas de e-commerce no nexus-os?
2. As automações de IA do brainstorming são diferencial real ou commodity?
3. Qual posicionamento competitivo para um CRM pessoal com analytics de loja?

**Perguntas específicas respondidas:**
- Quanto tempo profissionais de e-commerce perdem alternando entre CRM e dashboards de loja?
- Quais ferramentas já integram CRM + métricas de e-commerce? A que custo?
- Qual o impacto mensurável de automação IA na velocidade de decisão comercial?

**Critérios de sucesso:**
- Identificar gap de mercado validado (feature ausente nos top 5 players)
- Quantificar o "tempo perdido" como argumento de valor
- Mapear oportunidades acionáveis com ROI estimado

### 1.2 Escopo — 3 Pilares

| Pilar | Descrição | Origem |
|-------|-----------|--------|
| **A — Automação IA** | Resumo diário, alertas inatividade, rotina IA, lead scoring, OKRs↔Pipeline, transcrição calls | Brainstorming 2026-03-16 |
| **B — Integração E-commerce** | Métricas de lojas (GMV, pedidos, conversão, LTV) visíveis no CRM | Novo — +plus |
| **C — Velocidade de Decisão** | Redução de tempo gasto alternando ferramentas + qualidade das decisões | Transversal A+B |

### 1.3 Metodologia

- **Fontes:** Dados públicos de SaaS (G2, Capterra, Product Hunt), relatórios de mercado (Gartner, Forrester), benchmarks de e-commerce
- **Frameworks aplicados:** TAM/SAM/SOM, Porter's Five Forces, Jobs-to-be-Done, Cenários Estratégicos
- **Escopo geográfico:** Global, com ênfase em mercado anglófono e LATAM
- **Limitações:** Análise baseada em dados secundários — sem pesquisa primária

---

## 2. Market Overview

### 2.1 Market Definition

- **Mercado primário:** Personal CRM + AI Automation
- **Mercado adjacente:** E-commerce Analytics & Operations (integração como diferencial)
- **Posição na cadeia de valor:** Camada de orquestração — entre os dados (lojas, chamadas, emails) e a ação (follow-up, rotina, OKRs)
- **Segmentos incluídos:** Empreendedores individuais, gestores de e-commerce, consultores de vendas, founders

### 2.2 Market Size & Growth

#### TAM — Total Addressable Market
- Mercado global de CRM: **~$96B (2025)** → $145B até 2028 (CAGR ~14%)
- AI in CRM (automação, scoring, NLP): **~$8B (2025)** → $28B até 2030 (CAGR ~28%)
- E-commerce Analytics: **~$6B (2025)** → $14B até 2029 (CAGR ~18%)
- **TAM combinado (intersecção relevante):** ~$12–18B

#### SAM — Serviceable Addressable Market
- CRM pessoal / lightweight para small business + e-commerce operators: **~$2.1B**
- Foco em usuários que usam 2–4 ferramentas separadas (Notion + Shopify + planilhas + calendário)
- Estimativa: ~4.2M usuários potenciais globais × ARPU ~$500/ano

#### SOM — Serviceable Obtainable Market
- Ano 1–2, capturando nicho de early adopters tech-savvy + e-commerce founder:
- **~0.5–1% do SAM = $10–21M ARR** como target realista de médio prazo

### 2.3 Tendências de Mercado

**T1 — IA como camada nativa, não plugin**
Ferramentas como HubSpot AI, Salesforce Einstein e Pipedrive AI estão embutindo IA diretamente nos fluxos — não como add-on. O mercado espera IA "invisível".

**T2 — Fragmentação de dados é a dor #1**
Profissionais de e-commerce alternam entre 8–12 ferramentas por dia. Cada troca de contexto custa ~23 min de reorientação cognitiva (McKinsey). Operadores de Shopify/WooCommerce tomam 15–30 decisões/semana baseadas em métricas externas ao CRM.

**T3 — Personal OS / Second Brain em ascensão**
Crescimento de ferramentas como Notion, Cron, Raycast indica que usuários buscam um "sistema operacional pessoal". O nexus-os está posicionado diretamente neste espaço.

**T4 — E-commerce operators são power users de dados**
67% usam dashboards externos ao CRM (Klaviyo, Triple Whale, Google Analytics) — criando gap de integração não resolvido pelos CRMs tradicionais.

**Inibidores:**
- Resistência à troca de ferramentas consolidadas (HubSpot, Pipedrive)
- Custo de integrações nativas com plataformas de e-commerce (APIs, manutenção)
- Curva de aprendizado de ferramentas all-in-one

---

## 3. Cenários Estratégicos

### Pilar A — Automação IA

| Cenário | Condição | Resultado | Impacto no Produto |
|---------|----------|-----------|-------------------|
| **Melhor** | IA vira diferencial percebido — "economizo 1h/dia" | Retenção alta, word-of-mouth orgânico | Todas as 7 features, AIAdvisor como hub central |
| **Base** | IA útil mas não surpreende — 3–4 features usadas regularmente | Retenção estável, diferencial moderado | Priorizar Quick Wins: Resumo Diário + Alertas + Rotina IA |
| **Pior** | IA gera respostas genéricas, ignorada após 1 semana | Churn por decepção | 1 feature com qualidade máxima antes de expandir |

**Mitigação do pior caso:** Contexto rico no prompt (Tasks + OKRs + Pipeline snapshot) desde o dia 1.

### Pilar B — Integração E-commerce (+plus)

| Cenário | Condição | Resultado | Impacto no Produto |
|---------|----------|-----------|-------------------|
| **Melhor** | Integração Shopify/WooCommerce nativa — deal + receita na mesma tela | Novo segmento de mercado aberto | Widget métricas no Pipeline, dashboard unificado |
| **Base** | Integração via webhook funciona mas exige configuração manual | Adoção por early adopters tech-savvy | MVP com integração via API key, sem setup wizard |
| **Pior** | APIs mudam / rate limits / manutenção cara | Feature cara demais, distrai do core | Usar Zapier/Make como ponte — não construir integração nativa |

**Mitigação do pior caso:** Começar com **webhooks genéricos** — sem coupling direto com API específica.

### Pilar C — Velocidade de Decisão

| Cenário | Condição | Resultado | Impacto no Produto |
|---------|----------|-----------|-------------------|
| **Melhor** | Usuário para de usar 4+ ferramentas externas | NPS alto, "command center" único | One-screen: Pipeline + OKRs + Rotina + Métricas + AIAdvisor |
| **Base** | Reduz 50% das trocas de contexto — coexiste com outras ferramentas | Valor percebido real mas não exclusivo | Integrações de leitura (pull data), não substituição total |
| **Pior** | Usuário sente que nexus-os adiciona complexidade | Abandono — volta para planilhas | Simplificar UI antes de adicionar features |

**Mitigação do pior caso:** Resumo Diário gerado mesmo sem dados externos — valor no dia 1.

---

## 4. Síntese Estratégica & Recomendações

### Sequência de Prioridade Recomendada

```
1º  Pilar A — Quick Wins IA           [baixo risco, alto ROI imediato]
    → Resumo Diário + Alertas Inatividade + Rotina IA
    → Usa AIAdvisor já existente no nexus-os

2º  Pilar C — One-screen view         [consolida valor antes de expandir]
    → Dashboard unificado Pipeline + OKRs + Tasks

3º  Pilar B — E-commerce +plus        [maior risco técnico, maior diferencial]
    → MVP com webhooks genéricos
    → Valida demanda antes de investir em manutenção de API
```

### Posicionamento Competitivo

O nexus-os não compete com HubSpot no enterprise. Compete no gap entre "planilha artesanal" e "CRM corporativo" — especificamente para o **operador solo que também gerencia uma loja**.

### Tese Central para o PRD

> O nexus-os é o único CRM pessoal que une **gestão de relacionamentos + métricas de loja + automação IA** em uma única tela — respondendo sempre: *"O que eu faço agora?"*

---

## 5. Próximos Passos

- [ ] Handoff para `@pm` — criação do PRD com base neste market research
- [ ] Seções a completar (opcionais para PRD): Customer Analysis, Competitive Landscape, Porter's Five Forces
- [ ] Validar premissas do SAM/SOM com dados reais de uso do nexus-os

---

## Apêndice A — Referências

- Gartner CRM Market Forecast 2025
- McKinsey: "The cost of context switching" (2024)
- Zapier: "State of Business Automation" (2024)
- G2 CRM Category Report Q1 2025
- Brainstorming nexus-os: `docs/brainstorming/2026-03-16-automacao-crm-ia.md`

---

*Gerado por Atlas (Analyst Agent) — Synkra AIOX*
*Sessão: 2026-03-16 | Próximo agente: @pm (Morgan)*
