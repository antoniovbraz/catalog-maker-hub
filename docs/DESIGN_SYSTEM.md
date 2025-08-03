# Design System Catalog Maker Hub

## Introdução
O design system centraliza estilos, componentes e padrões de interface para garantir consistência e escalabilidade em toda a aplicação.

## Tokens
- **Cores, tipografia e espaçamento**: centralizados em `src/styles/tokens.ts` e importados pelo `tailwind.config.ts` e pelos componentes que precisarem dessas variáveis.
- **Radius**: tokens de borda preservam a identidade visual em elementos interativos.

## Componentes Base
Componentes atômicos ficam em `src/components/ui` (shadcn/ui) e não devem ser modificados diretamente.

### Uso de componentes `ui`
- Utilize-os como blocos de construção em `components/` ou `forms/`.
- Para personalizações, crie wrappers em `components/common` em vez de alterar o código original.
- Siga a tipagem fornecida e mantenha a composição por meio de `className` e `props` controladas.

#### Wrappers em `components/common`
Crie um arquivo por variação que ajuste estilos ou comportamento sem modificar os componentes base:

```tsx
import { Button, type ButtonProps } from '@/components/ui/button';

export function PrimaryButton(props: ButtonProps) {
  return <Button {...props} className="bg-primary text-white" />;
}
```

Os wrappers devem reexportar a tipagem do componente base e aceitar `className` para composições adicionais.

## Padrões de Uso
### Estratégias de temas
- Suporte a `light` e `dark` via `next-themes`.
- Novos temas podem estender tokens de cor no Tailwind.
- Utilize variáveis CSS para permitir troca dinâmica de temas.

### Convenções de código
- Componentes em PascalCase e arquivos em kebab-case.
- Código TypeScript com `strict` habilitado.
- Estilos via Tailwind; classes utilitárias devem ser ordenadas de forma lógica.

## Layout Responsivo

### Breakpoints
Baseado nas configurações do Tailwind:

| Prefixo | Largura mínima |
| ------- | -------------- |
| `sm`    | 640px          |
| `md`    | 768px          |
| `lg`    | 1024px         |
| `xl`    | 1280px         |
| `2xl`   | 1536px (container limitado a 1400px) |

### Grid responsivo
- Utilize classes `grid` e `grid-cols-*` com prefixos responsivos (`sm:grid-cols-2`, `lg:grid-cols-4`).
- O utilitário `container` centraliza o conteúdo e aplica `padding` nas laterais.
- Combine `gap-*` para controlar o espaçamento entre colunas.

### Exemplo de layout
```tsx
import { Card } from '@/components/ui/card';

export function DashboardGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="h-24" />
      <Card className="h-24" />
      <Card className="h-24" />
      <Card className="h-24" />
    </div>
  );
}
```

## Acessibilidade

Checklist básico para novos componentes:
- Utilize elementos HTML semânticos.
- Garanta contraste adequado entre texto e fundo.
- Forneça `alt` para imagens e `aria-label` quando necessário.
- Assegure navegação completa por teclado.
- Teste com leitores de tela e mantenha foco visível.

## Performance

Diretrizes para manter a aplicação leve:
- Prefira `React.lazy` e `import()` dinâmico para dividir código.
- Otimize imagens (formatos modernos e tamanhos responsivos).
- Evite re-renderizações desnecessárias com `memo` e hooks bem tipados.
- Monitore o tamanho do bundle ao executar `vite build`.

## Ferramentas Internas
Utilize ferramentas internas para validar visualmente as variações:
- `npm run storybook` abre o Storybook para conferir componentes e layouts em diferentes breakpoints.
- Publicar o Storybook pode servir como documentação viva do design system.

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

