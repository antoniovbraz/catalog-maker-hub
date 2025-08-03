# Design System Catalog Maker Hub

## Introdução
O design system centraliza estilos, componentes e padrões de interface para garantir consistência e escalabilidade em toda a aplicação.

## Tokens
- **Cores**: definidos no `tailwind.config.ts` como tokens de marca e temas.
- **Tipografia**: utiliza a família padrão do projeto com tamanhos em `rem`.
- **Espaçamento**: valores de `spacing` do Tailwind servem como base para margens e paddings.
- **Radius**: tokens de borda preservam a identidade visual em elementos interativos.

## Componentes Base
Componentes atômicos ficam em `src/components/ui` (shadcn/ui) e não devem ser modificados diretamente.

### Uso de componentes `ui`
- Utilize-os como blocos de construção em `components/` ou `forms/`.
- Para personalizações, crie wrappers em `components/common` em vez de alterar o código original.
- Siga a tipagem fornecida e mantenha a composição por meio de `className` e `props` controladas.

## Padrões de Uso
### Estratégias de temas
- Suporte a `light` e `dark` via `next-themes`.
- Novos temas podem estender tokens de cor no Tailwind.
- Utilize variáveis CSS para permitir troca dinâmica de temas.

### Convenções de código
- Componentes em PascalCase e arquivos em kebab-case.
- Código TypeScript com `strict` habilitado.
- Estilos via Tailwind; classes utilitárias devem ser ordenadas de forma lógica.

## Exemplos
### Botão
```tsx
import { Button } from '@/components/ui/button';

export function SaveButton() {
  return <Button variant="default">Salvar</Button>;
}
```

### Troca de tema
```tsx
import { ThemeProvider } from 'next-themes';

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  <App />
</ThemeProvider>
```

## Catálogo Interativo (Opcional)
A integração com Storybook ou outro catálogo facilita a visualização dos componentes.
- `npx sb init` para configuração inicial.
- Publicar o Storybook pode servir como documentação viva do design system.

