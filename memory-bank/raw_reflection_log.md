# Raw Reflection Log

---
Date: 2025-08-07
TaskRef: "Refatorar utilitários de largura fixos para classes responsivas"

Learnings:
- `w-full max-w-sm md:w-96` evita overflow em telas de 375 px mantendo largura controlada em breakpoints maiores.
- Testes com `pnpm test --run` encerram corretamente o Vitest sem ficar em modo watch.

Difficulties:
- Identificar quais classes `w-*` eram containers e quais eram ícones exigiu revisão manual.

Successes:
- Lint, type-check, testes e dev server rodaram sem erros após os ajustes de largura.

Improvements_Identified_For_Consolidation:
- Criar regra de lint para evitar `w-[0-9]+` em novos componentes.
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
---
Date: 2025-08-07
TaskRef: "Refatorar grids fixos para responsivos com breakpoints"

Learnings:
- Padrão `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` mantém legibilidade em 375 px sem sacrificar desktop.
- `rg "grid-cols-[234]"` identifica grids sem prefixos responsivos.

Difficulties:
- Diversas formas tinham seções pequenas que exigiram julgamento para definir breakpoints adequados.

Successes:
- Lint, typecheck, testes e dev server rodaram limpos após ajustes responsivos.

Improvements_Identified_For_Consolidation:
- Avaliar regra de lint para evitar `grid-cols-*` sem prefixos em novos componentes.
---
---
Date: 2025-08-07
TaskRef: "Aplicar break-words em descrições de tabelas"

Learnings:
- `DataVisualization` aplica a mesma `className` ao cabeçalho e à célula; ao usar `break-words` evita overflow de descrições longas.
- Um teste com string contínua valida que a classe é realmente renderizada.

Difficulties:
- `pnpm test` inicia em modo watch; é necessário usar `--run` para encerrar.

Successes:
- Lint, type-check, testes unitários e servidor de desenvolvimento funcionaram sem erros.

Improvements_Identified_For_Consolidation:
- Futuramente separar `cellClassName` de `className` em `DataVisualization` para estilizar cabeçalhos e células de forma independente.
---
---
Date: 2025-08-07
TaskRef: "Ensure button groups wrap on small screens"

Learnings:
- `flex-wrap` com `gap-2` evita overflow de botões em telas de 375 px.
- `justify-start` combinado com `sm:justify-end` mantém alinhamento em desktop.

Difficulties:
- Localizar todos os grupos de botões exigiu script Node para varrer o projeto.

Successes:
- Lint, type-check e testes passaram após aplicar as classes responsivas.

Improvements_Identified_For_Consolidation:
- Criar utilitário padrão para grupos de botões responsivos.
---
---
Date: 2025-08-08
TaskRef: "Adjust text utilities to responsive variants"

Learnings:
- `text-base sm:text-lg md:text-xl` evita tipografia exagerada em telas de 375 px.
- Ripgrep localiza rapidamente tamanhos de texto fixos em páginas.

Difficulties:
- Saída do lint contém centenas de avisos Tailwind, mas nenhum erro.

Successes:
- Lint, type-check, testes e servidor de desenvolvimento rodaram sem falhas após os ajustes.

Improvements_Identified_For_Consolidation:
- Considerar regra de lint para impedir `text-lg`/`text-xl` isolados em novos componentes.
---

---
Date: 2025-08-08
TaskRef: "Documentar tokens brand e verificação de acessibilidade"

Learnings:
- Incluir comandos `rg` e testes `axe-core` no checklist evita regressões de estilo e acessibilidade.

Difficulties:
- Nenhuma.

Successes:
- README, AGENTS e docs atualizados para uso exclusivo de Tailwind/shadcn e tokens `brand-*`.

Improvements_Identified_For_Consolidation:
- Criar script `pnpm check:colors` para automatizar a busca por cores hexadecimais.
---

---
Date: 2025-08-08
TaskRef: "Remover App.css e migrar tokens de marca"

Learnings:
- Adicionar variáveis `--brand-*` ao `index.css` mantém tokens acessíveis após exclusão do CSS legado.
- `rg` confirma ausência de importações de `App.css` no projeto.

Difficulties:
- Nenhuma.

Successes:
- Lint, type-check, testes e servidor de desenvolvimento rodaram sem erros após a remoção do arquivo.

Improvements_Identified_For_Consolidation:
- Avaliar remoção periódica de referências a arquivos obsoletos na base de código.
---

---
Date: 2025-08-08
TaskRef: "Migrate inline styles to Tailwind utilities"

Learnings:
- Tailwind arbitrary properties `[--var:value]` substituem `<style>` dinâmicas mantendo temas.
- Transforms do `dnd-kit` exigem variáveis CSS para refletir `translate` em tempo real.

Difficulties:
- Testes de acessibilidade Playwright falharam por falta de navegadores instalados.

Successes:
- Componentes de gráficos e formulários agora usam classes utilitárias sem `style=` direto.

Improvements_Identified_For_Consolidation:
- Documentar padrão de uso de variáveis CSS via Tailwind para futuros componentes.
---
---
Date: 2025-08-08
TaskRef: "Wrap toast to use brand tokens and remove default colors"

Learnings:
- Wrappers em `components/common` permitem ajustar variantes sem alterar `ui` original.
- `rg "bg-(red|blue|green|...)"` verifica rapidamente ausência de cores padrão.

Difficulties:
- `pnpm test --run` e `npx playwright test` falharam por configurações e navegadores ausentes.

Successes:
- Lint, type-check e servidor de desenvolvimento executaram sem erros.
- Nenhuma classe `bg-red-*` restante após os ajustes de tema.

Improvements_Identified_For_Consolidation:
- Preparar scripts que instalam navegadores do Playwright para evitar falhas nos testes.
---

---
Date: 2025-08-08
TaskRef: "Replace fixed widths with responsive utilities"

Learnings:
- `flex-wrap` combinado com `w-full sm:w-*` elimina overflow em cabeçalhos de tabelas.
- Verificação com Playwright a 320 px e 768 px assegura que a página de login não possui scroll horizontal.

Difficulties:
- `pnpm test --run` e `npx playwright test` falharam por testes existentes dependentes de autenticação.

Successes:
- Lint e type-check executaram sem erros após ajustes responsivos.

Improvements_Identified_For_Consolidation:
- Automatizar login de teste para validar rotas protegidas em verificação de overflow.
---
