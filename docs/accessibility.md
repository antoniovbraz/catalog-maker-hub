# Accessibility Adjustments

## 2025-08-07

- Adicionados `aria-label` e `aria-describedby` em componentes de navegação e formulário.
- Revisada paleta de cores no `tailwind.config.ts` e `index.css` garantindo contraste mínimo de 4.5:1 para tokens `destructive`, `success`, `warning` e `muted`.
- Validação com `@axe-core/cli` falhou por ausência de Chrome: ver logs para detalhes.
- `npm run type-check` executado sem erros; `npm test` e `npm run lint` apresentaram falhas existentes.
