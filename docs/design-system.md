# Design System

Este documento descreve os tokens de design utilizados na aplicação. Os tokens estão definidos em `src/styles/design-system.ts` e padronizam cores, tipografia e espaçamento.

## Tokens

### Cores
```ts
import { colors } from '@/styles/design-system'

<div className={colors.primary}>Botão Primário</div>
```

### Tipografia
```ts
import { typography } from '@/styles/design-system'

<h1 className={typography.h1}>Título</h1>
<p className={typography.body}>Texto padrão</p>
```

### Espaçamento
```ts
import { spacing } from '@/styles/design-system'

<div className={spacing.px.md}>Conteúdo com padding horizontal médio</div>
```

## Exemplo Completo
```tsx
import { colors, spacing, typography } from '@/styles/design-system'

export function ExampleCard() {
  return (
    <div className={`${colors.card} ${spacing.p.lg}`}>
      <h2 className={typography.h3}>Título do card</h2>
      <p className={typography.body}>Descrição do conteúdo.</p>
    </div>
  )
}
```
