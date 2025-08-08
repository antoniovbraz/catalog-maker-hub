# Style Guide

## Tokens de Cores

| Token | Uso |
|-------|-----|
| `background` | Plano de fundo geral da aplicação. |
| `foreground` | Texto padrão sobre `background`. |
| `primary` | Ações principais, links ativos e itens focados. |
| `primary-foreground` | Texto e ícones sobre `primary`. |
| `secondary` | Áreas secundárias e estados alternativos. |
| `secondary-foreground` | Texto sobre `secondary`. |
| `accent` | Realces sutis e hovers. |
| `accent-foreground` | Texto sobre `accent`. |
| `muted` | Superfícies desabilitadas ou neutras. |
| `muted-foreground` | Texto em elementos `muted`. |
| `destructive` | Ações de perigo ou exclusão. |
| `destructive-foreground` | Texto sobre `destructive`. |
| `card` | Fundos de cards e listas. |
| `card-foreground` | Texto dentro de cards e listas. |
| `border` / `input` | Bordas gerais e campos de formulário. |
| `ring` | Cor do foco visível (`focus-visible:ring-ring`). |

## Padrões de Uso

- **Sidebar e Header:** `bg-foreground text-background`; links ativos usam `bg-primary text-primary-foreground`.
- **Botões:** primário `bg-primary text-primary-foreground`; destrutivo `bg-destructive text-destructive-foreground`.
- **Cards e listas:** `bg-card border-border text-card-foreground` com `hover:bg-accent/40`.
- **Formulários:** campos `bg-card border-input focus-visible:ring-ring`.
- **Feedbacks:** usar `success`, `warning` e `destructive` para estados correspondentes.
