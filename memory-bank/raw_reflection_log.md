# Raw Reflection Log

---
Date: 2025-08-07
TaskRef: "Refatorar utilitários de largura fixos para classes responsivas"
...
---
Date: 2025-08-08
---
Date: 2025-08-08
TaskRef: "Padronizar fundos brancos no tema Corporate"

Learnings:
- Ajustar variáveis de tema exige sincronizar tokens Tailwind e documentação.
- Gradientes que referenciam `--background` também devem refletir o novo valor.

Difficulties:
- Avaliar se o sidebar deveria seguir o novo fundo branco sem quebrar contraste.

Successes:
- Lint, type-check e testes foram executados após atualização das cores de fundo.

Improvements_Identified_For_Consolidation:
- Considerar guideline explícita sobre escopo dos tokens de fundo para evitar ambiguidades futuras.
---
Date: 2025-08-08
TaskRef: "Add accessibility labels to interactive icons"

Learnings:
- Botões com ícones precisam de `aria-label` e ícones decorativos devem usar `aria-hidden`.
- `TableHead` interativo requer um `<button>` interno para suporte a teclado e leitor de tela.
- Instalação de dependências do Playwright (`apt-get install` + `npx playwright install`) é necessária para executar testes de acessibilidade.

Difficulties:
- `pnpm test --run` incluiu arquivos Playwright e falhou; exclusão via CLI não funcionou.
- `npx playwright test` exigiu bibliotecas do sistema e servidor local, resultando em erros de conexão.

Successes:
- Lint e type-check passaram sem erros após ajustes.
- Adicionados `aria-label` e `aria-hidden` em vários componentes e páginas, melhorando a acessibilidade.

Improvements_Identified_For_Consolidation:
- Documentar comandos corretos para executar apenas testes Vitest e configurar ambiente do Playwright.
---
---