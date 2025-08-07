# Raw Reflection Log

---
Date: 2025-08-07
TaskRef: "Swap Tailwind color tokens for brand equivalents in shadcn components"

Learnings:
- Perl one-liners can efficiently replace multiple Tailwind color tokens across many files.
- Verifying with ripgrep ensures no legacy color utilities remain.

Difficulties:
- Vitest required the `--run` flag to exit in non-interactive environments.

Successes:
- Lint, type-check, and unit tests all passed after refactoring color utilities.

Improvements_Identified_For_Consolidation:
- Maintain a reusable script for future large-scale class refactors.
---

---
Date: 2025-08-07
TaskRef: "Replace hard-coded Tailwind color classes with brand utilities across forms and pages"

Learnings:
- Adding a `warning` token under `brand` in Tailwind config enables consistent semantic yellow usage.
- Ripgrep patterns with negative lookaheads help detect leftover default color classes.

Difficulties:
- `pnpm typecheck` script is named `type-check`; initial run failed until corrected.

Successes:
- Lint, type-check, and unit tests all passed after the color refactor.

Improvements_Identified_For_Consolidation:
- Remember to verify script names before executing in automation.
---
---
Date: 2025-08-07
TaskRef: "Tokenize hex colors in App.css and chart components"

Learnings:
- Tailwind's `theme()` function injects brand tokens into CSS variables via `@layer base`.
- Recharts selectors can use Tailwind arbitrary variants to apply brand colors without hex codes.

Difficulties:
- Vitest's watch mode left a Sidebar accessibility test failing and required manual exit.

Successes:
- Replaced legacy hex codes with `brand.*`-based variables and utilities.

Improvements_Identified_For_Consolidation:
- Configure Vitest to run once in CI to avoid hanging on failures.
---
---
Date: 2025-08-07
TaskRef: "Verify layout breakpoints after color token updates and remove overlapping utilities"

Learnings:
- Tailwind eslint rule `no-custom-classname` flags gradient color stops with opacity (e.g., `to-brand-primary/5`), requiring simpler class usage.
- Running `pnpm test --run` avoids watch mode hangs in CI.

Difficulties:
- Multiple files still used legacy `primary` classes; careful `rg` searches were needed to catch them all.

Successes:
- Lint, type-check, tests and dev server all ran cleanly after updates.
- Manual review confirmed responsive classes (`sm:`, `md:`, `lg:`) remained intact across pages.

Improvements_Identified_For_Consolidation:
- Create a checklist for color token migrations to ensure gradient utilities are lint-compliant.
---

---
Date: 2025-08-07
TaskRef: "Wrap shadcn Table components with horizontal scroll containers"

Learnings:
- Adicionando um wrapper `overflow-x-auto` com `w-full` resolve overflow horizontal sem quebrar layout.
- `min-w-full` nas tabelas evita compressão de colunas em telas estreitas.

Difficulties:
- Nenhuma complicação significativa ao atualizar múltiplos componentes.

Successes:
- Lint, type-check e testes passaram após as alterações.

Improvements_Identified_For_Consolidation:
- Criar utilitário ou wrapper reutilizável para tabelas responsivas evitando repetição de código.
---
