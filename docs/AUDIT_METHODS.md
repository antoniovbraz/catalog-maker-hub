# AUDIT_METHODS.md

Este documento descreve como rodar as verificações automáticas de UI (responsividade e acessibilidade) usando Playwright + axe.

Pré‑requisitos:
- Node 18+
- Instalar dependências de teste: `pnpm add -D @playwright/test @axe-core/playwright`
- Instalar browsers do Playwright: `npx playwright install --with-deps`

Como rodar localmente:
1) Suba o app (por exemplo): `pnpm dev` (ou preview)
2) Em outro terminal, execute os testes:
   - Responsividade: `npx playwright test tests/responsiveness.spec.ts`
   - Acessibilidade: `npx playwright test tests/a11y.spec.ts`

Observações importantes:
- As rotas protegidas usam um bypass controlado somente nos testes: os arquivos de teste definem `window.__E2E__ = true` via `page.addInitScript`, liberando o `<ProtectedRoute/>` sem afetar a aplicação em produção.
- As falhas de responsividade marcam overflow horizontal em 320/375/768.
- As falhas de a11y consideram somente violações com impacto `serious` ou `critical` segundo o axe.

CI/CD:
- Você pode integrar estes testes no pipeline chamando diretamente os comandos acima. Como não alteramos package.json (limitação do ambiente), os comandos são executados com `npx`.
