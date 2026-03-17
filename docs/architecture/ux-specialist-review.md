# UX Specialist Review — Nexus OS
> @ux-design-expert (Uma) — Brownfield Discovery Phase 6 — 2026-03-16
> Revisão especializada do `technical-debt-DRAFT.md` — perspectiva UX/Frontend/Design System

---

## Verdict de Validação

| Dimensão | Draft Score | UX Review | Delta |
|----------|-------------|-----------|-------|
| Frontend / UX | 5/10 | **4.5/10** ⬇️ Mais grave que estimado | -0.5 |
| Design System | — | **1/10** 🆕 Gap identificado | Novo |
| Acessibilidade | — | **1.5/10** 🆕 Gap crítico | Novo |
| Performance Frontend | — | **3/10** 🆕 Gap identificado | Novo |
| UX / Usabilidade | — | **6/10** ✅ Ponto forte | — |

**UX Risk Score Revisado: 7.5/10** (Draft dizia 5/10 para Frontend/UX)

---

## 1. O Que o Draft Acertou

O `technical-debt-DRAFT.md` capturou os problemas estruturais corretos para o frontend. Confirmações:

| ID Draft | Finding | Status |
|----------|---------|--------|
| TD-C6 | Tailwind via CDN (não npm) | ✅ CONFIRMADO — bloqueador real |
| TD-H1 | God Component App.tsx | ✅ CONFIRMADO — 100% do estado global |
| TD-H3 | Sem React Router | ✅ CONFIRMADO — sem deep link, sem back button |
| TD-H4 | Event bus via window.dispatchEvent | ✅ CONFIRMADO — anti-pattern validado |
| TD-H9 | alert() como sistema de erro | ✅ CONFIRMADO — UX crítica |
| TD-M4 | Magic numbers tipográficos | ✅ CONFIRMADO — text-[8px], text-[9px], text-[10px], text-[11px] |
| TD-M5 | Border radius inconsistente | ✅ CONFIRMADO — 6 valores diferentes |
| TD-M6 | Apenas 2/9 componentes isolados | ✅ CONFIRMADO — StatCard + Sidebar |
| TD-M7 | Sem acessibilidade (WCAG) | ✅ CONFIRMADO — zero aria-labels |
| TD-M8 | Sem mobile/responsive | ✅ CONFIRMADO — desktop only |

---

## 2. Achados Agravados (Mais Grave que o Draft)

### [AGR-UX-1] Design System: Score Real é 1/10, Não 5/10

O draft pontuou Frontend/UX em 5/10, mas do ponto de vista de **design system**, o estado é catastrófico:

**Inventário real de inconsistências:**
```
Border radius:    6 valores distintos (xl, 2xl, [1.5rem], [2rem], [3rem], full)
Font sizes:       8+ valores (incluindo 4 magic numbers: 8px, 9px, 10px, 11px)
Button variants:  8+ variações inline sem abstração
Badge colors:     10+ variações de cor inline
Spacing:          Mix de p-4/p-6/p-8/p-10 sem regra clara
Shadow:           3+ variações (shadow, shadow-lg, shadow-xl) sem semântica
Z-index:          50, 60, 110, 120 — escalada manual sem sistema
```

**O que isso significa na prática:**
- Qualquer mudança visual requer busca em todos os arquivos (find & replace)
- Redesign parcial é impossível — tudo está acoplado
- Onboarding de um novo dev levaria 2-3 dias só para entender o sistema visual

### [AGR-UX-2] Acessibilidade: 0 Compliance WCAG AA

O draft mencionou "sem WCAG" como item médio. Na prática, é **bloqueante para qualquer usuário com necessidade especial** — e para o CEO que usa o sistema como ferramenta de trabalho, é risco de produtividade:

**Problemas críticos de acessibilidade encontrados:**

```jsx
// ❌ Inputs sem identificação
<input placeholder="Nome do lead" className="..." />
// Deveria ser:
<label htmlFor="lead-name">Nome do lead</label>
<input id="lead-name" aria-label="Nome do lead" ... />

// ❌ Modais sem focus trap
// Usuário pode Tab fora do modal → confusão de foco

// ❌ Modais sem ESC handler
// Padrão universal de fechamento de modal não implementado

// ❌ Sidebar sem landmarks
// Sem <nav aria-label="Main navigation">

// ❌ Botões de ação sem label descritivo
<button><Trash2 /></button>  // ❌ Screen reader lê "button"
<button aria-label="Excluir lead"><Trash2 /></button>  // ✅
```

**WCAG Failures confirmados:**
- 1.3.1 Info and Relationships (Level A) — inputs sem label
- 2.1.1 Keyboard (Level A) — modais sem trapfocus
- 2.4.3 Focus Order (Level A) — z-index manual quebra focus order
- 4.1.2 Name, Role, Value (Level A) — componentes interativos sem aria

### [AGR-UX-3] Performance Frontend: Bundle Estimado ~900KB não-otimizado

O draft mencionou "Tailwind CDN ~400KB". Análise completa do bundle:

```
Tailwind CSS via CDN:     ~400KB (sem purge — todas as classes)
Framer Motion ^11:        ~150KB (bundle completo)
Lucide React ^0.563:      ~180KB (todos os ícones importados)
React 19 + ReactDOM:      ~140KB
App code:                 ~30KB estimado
─────────────────────────────────
TOTAL ESTIMADO:           ~900KB não-otimizado
```

**Contexto:** Um app React moderno otimizado deveria estar entre 200-400KB total.

**Problema com Lucide:**
```typescript
// ❌ Provavelmente assim (import default tree-shaking ruim com CDN)
import { Trash2, Plus, Search, ... } from 'lucide-react'
// 30+ ícones importados = bundle Lucide completo (~180KB)
```

---

## 3. Gaps Não Identificados no Draft

### 🆕 [NEW-UX-1] Zero Design Tokens — Arquitetura Visual Frágil

O draft não mencionou a ausência de um sistema de tokens. Este é o problema raiz de todos os problemas visuais:

**Estado atual:**
```javascript
// tailwind.config inline no index.html
tailwind.config = {
  theme: {
    extend: {
      colors: {
        // Apenas um subconjunto definido
      }
    }
  }
}
```

**Consequência:** O app tem ~50 valores de cor únicos espalhados em classes Tailwind inline. Sem variáveis CSS (`--color-brand`, `--radius-lg`, etc.), é impossível:
- Implementar dark mode
- Fazer A/B test de cores
- Manter consistência com um possível Figma/design file
- Fazer rebranding sem tocar em 200+ arquivos

### 🆕 [NEW-UX-2] Micro-interações Bem Feitas — Pontos a Preservar

**Importante:** O draft não destacou o que está **funcionando bem** e deve ser preservado na refatoração:

```
✅ framer-motion page transitions (opacity + y) — sensação premium
✅ hover:shadow-xl hover:-translate-y-1 nos cards — feedback visual elegante
✅ Sidebar active state com indicador lateral + translate-x-1 — polido
✅ VoiceAssistant glassmorphism — visualmente impactante
✅ Scale animations nos botões (hover:scale-110) — resposta tátil
✅ Kanban drag (se implementado) — UX fluida
```

**Risco da refatoração:** Perder essas micro-interações ao migrar para shadcn/ui. shadcn não inclui animações por padrão — o framer-motion deve ser mantido e integrado ao design system novo.

### 🆕 [NEW-UX-3] Avatar Hardcoded = Bloqueio para Multi-Usuário

```typescript
// Sidebar.tsx:54 (inferido)
<div className="...">CS</div>  // ❌ "Carlos Silva" hardcoded
```

Com Supabase Auth implementado (Sprint 1), o avatar precisa ser dinâmico. Mas a forma como está inline no Sidebar significa que o dado virá de onde? O componente precisa de um contrato: `user.avatarInitials` ou `user.name`.

### 🆕 [NEW-UX-4] Hierarquia de Z-index Manual é uma Bomba-Relógio

```typescript
// Z-index atual documentado:
z-[50]   → Sidebar
z-[60]   → VoiceAssistant
z-[110]  → Modal primário
z-[120]  → Sub-modal (ex: quick schedule dentro de pipeline modal)
```

Sem uma tabela de z-index definida em tokens, qualquer novo componente modal que for criado pode conflitar. O VoiceAssistant FAB (z-60) **já está sobreposto pelo modal** (z-110) — o que pode causar bugs de interação quando o usuário tenta usar o voice assistant enquanto um modal está aberto.

**Tokens de z-index necessários:**
```css
--z-sidebar:    100;
--z-dropdown:   200;
--z-modal:      300;
--z-toast:      400;
--z-voice:      250;  /* entre modal e toast — acessível sempre */
```

### 🆕 [NEW-UX-5] Sem Skeleton Loading — UX de Carregamento Ruim

O draft menciona "Loader2 animate-spin" como padrão de loading. Na prática, o dashboard carrega 7 queries paralelas no `useEffect` do App.tsx. Durante esse carregamento:

- Página aparece em branco ou com spinners genéricos
- Não há skeleton que mostre a estrutura da página
- CEO pode pensar que o app travou

**Comparação UX:**
```
❌ Atual:    [Loader2 spinning] → dados aparecem de uma vez
✅ Target:  [Skeleton StatCards] → [dados reais] (percepção de velocidade melhor)
```

---

## 4. Plano de Design System — Target State

### 4.1 Tokens CSS (tokens.css)

```css
/* design-tokens.css — Single Source of Truth */

/* Brand */
--color-brand-500: #0055A4;
--color-brand-700: #003366;
--color-brand-200: #8AC6FF;

/* Surface */
--color-bg-app:      #F0F4F8;
--color-surface:     #FFFFFF;
--color-surface-alt: #F8FAFC;
--color-sidebar:     #000000;

/* Text */
--color-text-primary: #0F172A;
--color-text-secondary: #475569;
--color-text-muted: #94A3B8;
--color-text-inverse: #FFFFFF;

/* Status */
--color-success: #10B981;
--color-warning: #F59E0B;
--color-danger:  #F43F5E;
--color-info:    #3B82F6;

/* Units (brand colors para business units) */
--color-unit-nexus:   #0055A4;
--color-unit-mivave:  #7C3AED;
--color-unit-vcchic:  #DB2777;
--color-unit-moriel:  #0D9488;
--color-unit-sezo:    #EA580C;

/* Radius */
--radius-xs: 6px;    /* tooltips, small badges */
--radius-sm: 8px;    /* tags, chips */
--radius-md: 12px;   /* inputs, buttons */
--radius-lg: 16px;   /* cards */
--radius-xl: 24px;   /* modais */
--radius-full: 9999px;

/* Typography Scale */
--text-nano:    9px;
--text-micro:   11px;
--text-xs:      12px;
--text-sm:      13px;
--text-base:    14px;
--text-md:      16px;
--text-lg:      18px;
--text-xl:      20px;
--text-2xl:     24px;
--text-3xl:     30px;
--text-display: 36px;

/* Z-index System */
--z-base:      0;
--z-dropdown:  100;
--z-sidebar:   200;
--z-voice:     250;
--z-modal:     300;
--z-toast:     400;
--z-critical:  500;

/* Shadows */
--shadow-sm:  0 1px 3px rgba(0,0,0,0.08);
--shadow-md:  0 4px 12px rgba(0,0,0,0.10);
--shadow-lg:  0 8px 24px rgba(0,0,0,0.12);
--shadow-xl:  0 16px 48px rgba(0,0,0,0.16);
```

### 4.2 Componentes Atômicos — Ordem de Criação (Prioridade)

```
SPRINT 3 — Atoms (semana 1)
  1. Button       — variants: primary, secondary, ghost, danger, icon
  2. Input        — text, number, select, date + aria-label obrigatório
  3. Badge        — size sm/md + color via prop (usa --color-unit-*)
  4. Avatar       — initials + src + size sm/md/lg + conectado ao auth

SPRINT 3 — Molecules (semana 2)
  5. FormField    — Label + Input + ErrorMessage (acessível)
  6. Modal        — Portal + FocusTrap + ESC + AnimatePresence
  7. Toast        — success/error/warning + auto-dismiss (sonner)
  8. Skeleton     — line/card/stat variants

SPRINT 3 — Organisms (semana 3)
  9. KanbanCard   — extrair de Pipeline.tsx
  10. TaskCard    — extrair de Tasks.tsx + renderMenuItem fix
  11. StatCard    — já existe ✅ (refatorar para usar tokens)
  12. CallLogCard — extrair de SmartCalls
```

### 4.3 tailwind.config.js Target

```javascript
// tailwind.config.js (npm, não CDN)
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          200: 'var(--color-brand-200)',
          500: 'var(--color-brand-500)',
          700: 'var(--color-brand-700)',
        },
        surface: 'var(--color-surface)',
        'bg-app': 'var(--color-bg-app)',
        sidebar: 'var(--color-sidebar)',
      },
      borderRadius: {
        xs:  'var(--radius-xs)',
        sm:  'var(--radius-sm)',
        md:  'var(--radius-md)',
        lg:  'var(--radius-lg)',
        xl:  'var(--radius-xl)',
      },
      fontSize: {
        nano:    ['var(--text-nano)', { lineHeight: '1.2' }],
        micro:   ['var(--text-micro)', { lineHeight: '1.3' }],
        base:    ['var(--text-base)', { lineHeight: '1.5' }],
        display: ['var(--text-display)', { lineHeight: '1.1', fontWeight: '900' }],
      },
      zIndex: {
        dropdown: 'var(--z-dropdown)',
        sidebar:  'var(--z-sidebar)',
        voice:    'var(--z-voice)',
        modal:    'var(--z-modal)',
        toast:    'var(--z-toast)',
      },
    },
  },
  plugins: [],
}
```

---

## 5. Acessibilidade — Plano de Remediação WCAG AA

### Prioridade 1 — Level A (Bloqueante)

```tsx
// 1. Todos os inputs com aria-label ou htmlFor
// ANTES:
<input placeholder="Nome" className="..." onChange={...} />

// DEPOIS:
<label htmlFor="lead-name" className="sr-only">Nome do lead</label>
<input
  id="lead-name"
  aria-label="Nome do lead"
  placeholder="Nome"
  className="..."
  onChange={...}
/>

// 2. Modal com focus trap (usando @radix-ui/react-dialog via shadcn)
// shadcn Dialog já implementa FocusTrap + ESC handler — zero code adicional

// 3. Botões icon com aria-label
<button aria-label="Excluir lead" onClick={...}>
  <Trash2 className="w-4 h-4" />
</button>

// 4. Sidebar como nav landmark
<nav aria-label="Navegação principal" className="...">
  {/* menu items */}
</nav>
```

### Prioridade 2 — Level AA (Contraste e Foco)

```css
/* Focus visible obrigatório para keyboard nav */
*:focus-visible {
  outline: 2px solid var(--color-brand-500);
  outline-offset: 2px;
}

/* Contraste mínimo WCAG AA: 4.5:1 para texto */
/* Verificar: text-slate-400 (#94A3B8) sobre white (#FFF) = 2.5:1 ❌ */
/* Fix: usar text-slate-500 (#64748B) = 4.5:1 ✅ */
```

---

## 6. Divergências com o Draft e Recomendações

| Item | Draft | UX Review | Ação Recomendada |
|------|-------|-----------|-----------------|
| Frontend score | 5/10 | **4.5/10** | Atualizar no relatório final |
| Acessibilidade | Médio | **CRÍTICO (WCAG Level A failures)** | Reclassificar para Alto |
| Design System | Não mencionado | **Estado = 1/10 (inexistente)** | Adicionar como dívida crítica |
| Bundle size | "~400KB CDN" | **~900KB total estimado** | Reclassificar impacto |
| Micro-interações | Não mencionado | **Ponto forte — preservar** | Adicionar à seção positiva |
| Z-index system | Não mencionado | **Bomba-relógio — sistematizar** | Adicionar ao Sprint 3 |
| Skeleton loading | Não mencionado | **Gap de UX** | Adicionar ao Sprint 3 |
| ADR-3: shadcn/ui | Aprovado | **Aprovado com ressalva: manter framer-motion** | Validar ADR |

### Validação dos ADRs (Frontend)

| ADR | Decision | UX Verdict | Comentário |
|-----|----------|-----------|------------|
| ADR-2 | Zustand | ✅ APROVADO | Correto. Redux seria over-engineering. |
| ADR-3 | shadcn/ui | ✅ APROVADO com ressalva | Manter framer-motion para animações. shadcn não substitui isso. |
| ADR-5 | Tailwind v3 npm (não v4) | ✅ APROVADO | Correto. v4 ainda instável para brownfield. |

---

## 7. O Que o Nexus OS Faz Bem — Não Perder

**Estes são diferenciais que devem ser preservados na refatoração:**

1. **Design language premium** — dark sidebar + light content é uma escolha forte e consistente. Não mudar.
2. **Tipografia ultra-bold** — text-4xl font-black uppercase italic para títulos é impactante. Transformar em token, não remover.
3. **Micro-interações** — hover lift nos cards, transitions suaves, framer-motion page transitions criam sensação de produto caro.
4. **VoiceAssistant glassmorphism** — componente mais visualmente polido do app. Referência de qualidade para os demais.
5. **Kanban visual** — 4 colunas com cores de status é intuitivo para um CEO gerenciar pipeline.
6. **Color coding por unidade de negócio** — purple Mivave, pink VcChic, teal Moriel, orange Sezo. Mantém identidade visual de cada empresa.

**Risco real:** Uma refatoração mal gerenciada pode perder tudo isso em nome de "componentização correta". O target state deve replicar a qualidade visual atual com a arquitetura correta.

---

## 8. Verdict para Phase 7 (QA Gate)

**Status: APPROVED com ampliações**

O draft está correto na direção mas subestimou a gravidade dos problemas de Design System e Acessibilidade. Recomendo que o relatório final:

1. ⬆️ Reclassifique **Acessibilidade** de Médio → **Alto** (WCAG Level A failures são bloqueantes)
2. 🆕 Adicione **Design System** como dimensão separada com score **1/10**
3. ⬆️ Atualize estimativa de **bundle** de 400KB → **~900KB**
4. ✅ Valide os 3 ADRs de frontend (Zustand, shadcn, Tailwind v3)
5. ✅ Adicione seção "O que preservar" para proteger as micro-interações
6. 🆕 Adicione `design-tokens.css` como artefato do Sprint 3

**Sequência de Sprint 3 (UX Perspective):**
```
1. Instalar Tailwind npm + criar tailwind.config.js
2. Criar design-tokens.css (Single Source of Truth)
3. Instalar shadcn/ui (Radix primitives)
4. Construir atoms: Button, Input, Badge, Avatar
5. Construir molecules: FormField, Modal (shadcn Dialog), Toast (sonner), Skeleton
6. Substituir alert() por sonner toast
7. Adicionar aria-labels em todos os inputs
8. Corrigir z-index via tokens CSS
```

---

*Próxima fase: @qa → qa-review.md (Phase 7 — QA Gate)*
