# Frontend Specification — Nexus OS
> @ux-design-expert (Uma) — Brownfield Discovery Phase 3 — 2026-03-16

---

## 1. Visão Geral

**Nexus OS** é um dashboard executivo single-page para gestão multi-negócio. Design language: dark sidebar + light content, tipografia ultra-bold, visual premium com glassmorphism e micro-interações.

| Atributo | Valor |
|----------|-------|
| Framework | React 19 (SPA) |
| Styling | **Tailwind CSS via CDN** (⚠️ não via npm) |
| Animações | framer-motion ^11 |
| Ícones | lucide-react ^0.563 |
| Font | Inter (Google Fonts CDN) |
| Viewport | Desktop only (sem responsividade mobile) |
| Color Mode | Light only (sem dark mode) |

---

## 2. Design Tokens (Estado Atual)

### 2.1 Paleta de Cores

Definida inline em `index.html` via `tailwind.config`:

```
PRIMÁRIAS
  blue-600:  #0055A4  → Azul Primário (brand, CTA, active states)
  blue-800:  #003366  → Azul Escuro
  blue-300:  #8AC6FF  → Azul Claro

NEUTRAS
  slate-900: #000000  → Preto (sidebar bg, textos principais)
  slate-700: #333333  → Cinza Escuro
  slate-400: #B0B0B0  → Cinza Médio (textos secundários)
  bg-app:    #F0F4F8  → Background principal (hardcoded em App.tsx)

STATUS
  emerald-500 → Success / Good / Vendido
  amber-500   → Warning / Em progresso
  rose-500    → Critical / Perdido / Hot lead
  purple-600  → Mivave / Special
  pink-600    → VcChic
  teal-600    → Moriel
  orange-600  → Sezo
```

⚠️ **Issues:**
- `bg-[#F0F4F8]` hardcoded em App.tsx (não usa token)
- Tailwind via CDN — sem purge/treeshaking → bundle ~400KB desnecessário
- Paleta de status (emerald/amber/rose) não documentada formalmente

---

### 2.2 Tipografia

Font: **Inter** (Google Fonts CDN)

| Uso | Classe Tailwind | Tamanho Real |
|-----|-----------------|--------------|
| Page titles | `text-4xl font-black uppercase italic` | 36px / 800 |
| Section headers | `text-2xl font-black tracking-tighter` | 24px / 800 |
| Nav labels | `text-xs font-bold` | 12px / 700 |
| Card titles | `text-sm font-bold` | 14px / 700 |
| Micro-labels | `text-[9px] font-black uppercase tracking-widest` | 9px / 800 |
| Nano-labels | `text-[8px] font-black uppercase tracking-widest` | 8px / 800 |
| Values/Numbers | `text-3xl font-black tracking-tighter` | 30px / 800 |

⚠️ **Issues:**
- Magic numbers: `text-[8px]`, `text-[9px]`, `text-[10px]`, `text-[11px]` — não padronizados
- Hierarquia visual inconsistente entre páginas
- Fonte carregada via CDN (latência + dependência externa)

---

### 2.3 Espaçamento e Raio

**Border Radius (inconsistente):**
```
rounded-xl       → 12px (inputs pequenos, badges)
rounded-2xl      → 16px (botões, cards menores)
rounded-[1.5rem] → 24px (botões de ação)
rounded-[2rem]   → 32px (cards principais, modais internos)
rounded-[3rem]   → 48px (modais) ← máximo
rounded-full     → círculos (avatars, FAB, dots)
```

**Spacing padrão observado:**
```
p-4 (16px)  → cards internos, itens de lista
p-6 (24px)  → cards base
p-8 (32px)  → conteúdo principal
p-10 (40px) → modais, headers
px-8 py-10  → sidebar brand header
```

---

## 3. Mapa de Componentes (Atomic Design)

### 3.1 Átomos

| Componente | Arquivo | Status | Issues |
|-----------|---------|--------|--------|
| Button Primary | inline (múltiplos) | ⚠️ Duplicado | 8+ variações sem abstração |
| Button Ghost | inline | ⚠️ Duplicado | — |
| Input Text | inline | ⚠️ Duplicado | Sem aria-label |
| Input Select | inline | ⚠️ Duplicado | Sem aria-label |
| Badge/Tag | inline | ⚠️ Duplicado | 10+ variações de cor |
| StatusDot | inline (Sidebar) | ⚠️ Inline | Apenas emerald-500 |
| LoadingSpinner | inline (`<Loader2 animate-spin>`) | ✅ Consistente | — |
| Icon | lucide-react | ✅ Library | 30+ ícones importados |
| Avatar | inline (Sidebar footer) | ⚠️ Hardcoded | "CS" hardcoded |

### 3.2 Moléculas

| Componente | Arquivo | Status | Issues |
|-----------|---------|--------|--------|
| **StatCard** | `components/StatCard.tsx` | ✅ Componentizado | Único componente isolado |
| KanbanCard | inline `pages/Pipeline.tsx` | ⚠️ Inline | Deveria ser componente |
| TaskCard | inline `pages/Tasks.tsx` | ⚠️ Inline | `renderMenuItem` antipattern |
| MenuItemButton | inline `components/Sidebar.tsx` | ⚠️ Função externa | Fora do componente |
| FormField | inline (modais) | ⚠️ Inline | Duplicado em 3 páginas |
| MessageBubble | inline `pages/AIAdvisor.tsx` | ⚠️ Inline | — |
| OKRCard | inline `pages/Okrs.tsx` | ⚠️ Inline | — |

### 3.3 Organismos

| Componente | Arquivo | Status | Issues |
|-----------|---------|--------|--------|
| **Sidebar** | `components/Sidebar.tsx` | ✅ Componentizado | renderMenuItem antipattern |
| **VoiceAssistant** | `components/VoiceAssistant.tsx` | ✅ Componentizado | FAB + expanded panel |
| KanbanBoard | inline `pages/Pipeline.tsx` | ⚠️ Inline | Grid 4 colunas, hardcoded |
| Modal | inline (Pipeline, Tasks) | ⚠️ Duplicado | Sem Portal, sem trapfocus |
| ChatInterface | inline `pages/AIAdvisor.tsx` | ⚠️ Inline | — |
| DashboardMetrics | inline `pages/Dashboard.tsx` | ⚠️ Inline | StoreMetric duplicada |

### 3.4 Templates

| Template | Descrição |
|---------|-----------|
| AppShell | Sidebar (w-72 fixed) + Main (ml-72 flex-1) |
| PageContainer | `max-w-[1440px] mx-auto` + `p-8` |
| ModalOverlay | `fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110]` |

---

## 4. Inventário de Páginas

### Navigation Map (Sidebar)

```
COMMAND
  ├── Cockpit CEO      (dashboard)
  ├── Estratégia & OKRs (okrs)
  └── CRM & Vendas     (pipeline)

OPERATIONS
  ├── Content Machine  (content)
  ├── Knowledge Hub    (knowledge)
  └── Smart Calls      (calls)

PERFORMANCE
  ├── Agenda & Rotina  (routine)
  ├── Sprint 1-3-5     (tasks)
  └── IA Advisor       (ai)

GLOBAL (floating)
  └── Nexus Voice      (VoiceAssistant FAB)
```

### Páginas Detalhadas

| Página | Complexidade | Componentes Principais | Estado |
|--------|-------------|----------------------|--------|
| Dashboard | Alta | StatCard, gráficos ROAS, tabs de unidade | Funcional |
| OKRs | Média | Cards de objetivo, progress bars, key results | Funcional |
| Pipeline | Alta | Kanban 4 colunas, modal lead, quick-schedule | Funcional |
| ContentMachine | Média | Cards de post, modal criação com IA | Funcional |
| KnowledgeHub | Baixa | — (não inspecionado em detalhe) | — |
| SmartCalls | Média | Lista de calls, transcrição, modal voice | Funcional |
| Routine | Média | Calendário semanal, agenda diária | Funcional |
| Tasks | Alta | Lista 1-3-5, IA geração, categorias | Funcional |
| AIAdvisor | Alta | Chat interface, file upload, Gemini 2.0 Flash | Funcional |

---

## 5. Padrões de Interação

### 5.1 Navegação
- **Tipo:** Tab-based (useState, sem React Router)
- **Animação:** framer-motion `opacity + y: 10→0` (200ms) por página
- **Sidebar:** Fixed left, w-72, z-50
- **Active state:** `bg-blue-600` + indicador lateral branco + `translate-x-1`

### 5.2 Modais
- **Trigger:** `isModalOpen` state local por página
- **Backdrop:** `bg-slate-900/80 backdrop-blur-md`
- **Z-index hierarchy:** `z-[50]` sidebar → `z-[60]` VoiceAssistant → `z-[110]` modal → `z-[120]` sub-modal
- **Animação:** `scale 0.9→1 + opacity 0→1` (framer-motion)
- ⚠️ Sem focus trap, sem ESC handler, sem Portal

### 5.3 Feedback de Estado
- Loading: `<Loader2 animate-spin>` + disabled state
- Success: `<Check>` icon + verde (Pipeline save)
- Optimistic updates: em Pipeline (rollback em erro), OKRs
- Error: `alert()` nativo — ⚠️ sem toast/notificação

### 5.4 Data Sync
- Event bus: `window.dispatchEvent(new CustomEvent('nexus-data-updated'))`
- Refresh: `fetchData()` no App.tsx re-busca tudo
- Nenhum estado local sincronizado (sem Zustand/Context)

---

## 6. Design Language — Padrões Visuais

### Estilo Geral
- **Aesthetic:** Premium executive, tech-forward, high-contrast
- **Vibe:** Bloomberg Terminal + Apple Design + Notion
- **Cards:** White + border-slate-100 + shadow sutil + hover lift
- **Sidebar:** Pure black (slate-900 = #000000)
- **Background:** `#F0F4F8` com orbs decorativos blur

### Orbs Decorativos (App.tsx)
```css
/* Background decoration */
.orb-1: blue-200/20, w-500px, blur-100px, top-right
.orb-2: indigo-200/20, w-600px, blur-120px, bottom-left
```

### Glassmorphism (VoiceAssistant)
```css
bg-slate-900/90 backdrop-blur-md border-slate-700
```

### Hover States
```
Cards:    hover:shadow-xl hover:-translate-y-1
Buttons:  hover:bg-blue-600 hover:scale-110
Nav:      hover:text-white hover:bg-white/5
```

---

## 7. Issues UX/Frontend (Priorizado)

### 🔴 CRÍTICO

| ID | Issue | Localização | Fix |
|----|-------|------------|-----|
| UX-CRIT-1 | Tailwind via CDN — sem purge (~400KB bundle) | `index.html:7` | Migrar para `npm install tailwindcss` |
| UX-CRIT-2 | Sem React Router — sem deep link, sem back button | App.tsx | Adicionar React Router v7 |
| UX-CRIT-3 | Sem acessibilidade — inputs sem aria-label, modais sem trapfocus | Todas as páginas | Audit WCAG + fixes |

### 🟠 ALTO

| ID | Issue | Localização | Fix |
|----|-------|------------|-----|
| UX-HIGH-1 | alert() como UI de erro | Pipeline, Tasks | Implementar toast (sonner) |
| UX-HIGH-2 | StoreMetric interface duplicada | App.tsx + Dashboard.tsx | Mover para types.ts |
| UX-HIGH-3 | renderMenuItem fora do componente | Sidebar.tsx:67 | Mover para dentro ou extrair componente |
| UX-HIGH-4 | Sem mobile/responsive | App.tsx | Sidebar collapsa, grid adapta |
| UX-HIGH-5 | Magic numbers de fonte (text-[8px] etc.) | Múltiplos | Design tokens tipográficos |

### 🟡 MÉDIO

| ID | Issue | Localização | Fix |
|----|-------|------------|-----|
| UX-MED-1 | KanbanCard, TaskCard, FormField não componentizados | Pipeline, Tasks | Extrair para components/ |
| UX-MED-2 | 8+ variações de botão sem abstração | Múltiplos | Button atom com variants |
| UX-MED-3 | Border radius inconsistente (xl/2xl/[1.5rem]/[2rem]/[3rem]) | Todos | Padronizar em 3 tamanhos |
| UX-MED-4 | Avatar "CS" hardcoded | Sidebar.tsx:54 | Conectar ao Auth user |
| UX-MED-5 | Sem feedback de conexão perdida | — | Indicador de status online |

---

## 8. Design System Recomendado (Target State)

### Tokens Prioritários
```css
/* Colors */
--color-brand:       #0055A4;
--color-bg-app:      #F0F4F8;
--color-surface:     #FFFFFF;
--color-sidebar:     #000000;
--color-text-primary: #0F172A;
--color-text-muted:  #94A3B8;
--color-success:     #10B981;
--color-warning:     #F59E0B;
--color-danger:      #F43F5E;

/* Radius */
--radius-sm:  8px;   /* badges, pills */
--radius-md:  16px;  /* botões, inputs */
--radius-lg:  24px;  /* cards */
--radius-xl:  32px;  /* modais */

/* Typography */
--text-nano:  9px;
--text-micro: 11px;
--text-sm:    13px;
--text-base:  14px;
--text-lg:    16px;
--text-xl:    20px;
--text-2xl:   24px;
--text-display: 36px;
```

### Componentes a Criar (Prioridade)
1. `Button` — variants: primary, secondary, ghost, danger
2. `Input` — text, number, select, date com aria-label
3. `Modal` — com Portal, focus trap, ESC handler
4. `Toast` — success, error, warning (substituir alert())
5. `KanbanCard` — extrair de Pipeline.tsx
6. `TaskCard` — extrair de Tasks.tsx
7. `Badge` — com color prop dinâmica

---

## 9. Fluxos de Usuário Principais

### Fluxo 1: Registrar Lead + Agendar Call
```
Pipeline → [+ Novo Lead] → Modal "Inject Lead" → Preencher form → "Sync to Cloud"
         → Lead aparece na coluna "Novos" → Hover → [⚡ Zap] → Quick Schedule modal
         → Selecionar data/hora/tipo → "Confirmar & Sincronizar"
         → Lead muda para "Diagnóstico Agendado" + event criado + call_log criado
```

### Fluxo 2: Voice Log de Call
```
[FAB Mic] (bottom-right) → Conectar ao Gemini Live
→ Falar: "Registre uma call do Mapa da Clareza com a Julia"
→ Gemini extrai: leadName, sentiment, type → chama log_sales_call()
→ call_log inserido no Supabase → nexus-data-updated → refresh global
```

### Fluxo 3: Atualizar OKR
```
OKRs → Card de objetivo → Checkbox de key result
→ Optimistic update local → persist to Supabase
→ Progresso recalculado automaticamente (%)
```

---

## 10. Próximas Fases (Brownfield Discovery)

- **Phase 4:** @architect → `technical-debt-DRAFT.md` (consolidar achados)
- **Phase 5:** @data-engineer → `db-specialist-review.md`
- **Phase 6:** @ux-design-expert → `ux-specialist-review.md`
- **Phase 7:** @qa → `qa-review.md` (QA Gate)
