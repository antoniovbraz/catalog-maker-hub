# Arquitetura Catalog Maker Hub

## Visão Geral
Sistema SaaS para gestão de marketplace e precificação com arquitetura moderna e escalável.

## Stack Tecnológica
- Frontend: React 18, TypeScript e Vite
- Backend: Supabase (PostgreSQL e Edge Functions)
- Styling: Tailwind CSS e shadcn/ui
- State: React Query e Context API
- Validação: Zod e React Hook Form

## Estrutura de Pastas
```
src/
├── components/          # Componentes React
│   ├── ui/             # shadcn/ui (não modificar)
│   ├── forms/          # Formulários de negócio
│   ├── charts/         # Visualizações de dados
│   ├── layout/         # Layout e navegação
│   └── common/         # Componentes compartilhados
├── hooks/              # Custom hooks + React Query
├── services/           # Camada de dados (CRUD + RPC)
├── types/              # Interfaces TypeScript
├── utils/              # Funções utilitárias
├── lib/                # Configurações
└── pages/              # Páginas da aplicação
```

## Padrões Arquiteturais
### Service Layer
```typescript
// services/products.ts
export class ProductsService extends BaseService<ProductType> {
  async getAllWithCategories(): Promise<ProductWithCategory[]> {
    // Implementação CRUD
  }
}
```

### Hook Pattern
```typescript
// hooks/useProducts.ts
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: ProductsService.getAll,
    staleTime: 5 * 60 * 1000,
  });
}
```

### Form Pattern
```typescript
// Zod + React Hook Form + shadcn/ui
const form = useForm<ProductFormData>({
  resolver: zodResolver(productSchema),
});
```

## Segurança (RLS)
- Row Level Security habilitado em todas as tabelas
- Policies baseadas em `tenant_id`
- Super admin com acesso total
- Validações no cliente e no servidor

## Gerenciamento de Estado
- Server State: React Query (cache, sincronização e atualizações otimistas)
- Client State: useState e useReducer
- Global State: Context API para autenticação
- Form State: React Hook Form

## Princípios de Qualidade
1. Type Safety: TypeScript em modo estrito
2. Error Handling: centralizado com logger
3. Performance: lazy loading e memoização
4. Maintainability: princípios SOLID
5. Testing: Vitest e Testing Library

## Regras de Negócio - Comissões
### Cadastro de Comissões
- Padrão (global): deixe o campo categoria vazio para aplicar a todas as categorias
- Específica: selecione uma categoria para aplicar apenas a ela
- Prioridade: comissões específicas têm precedência sobre as padrões
- Formato: utilizar apenas números percentuais (ex.: 14 para 14%)

### Comissões da Shopee
- Limite máximo: R$ 100,00 por transação
- Taxa padrão: 14% para produtos no Programa Frete Grátis
- Taxa alternativa: 20% para produtos fora do Programa Frete Grátis
- Cálculo: o sistema aplica automaticamente o limite máximo de R$ 100

### Produtos sem Categoria
- Selecione "Nenhuma categoria" ao cadastrar produtos
- O sistema converte automaticamente para valor nulo no banco
- Comissões padrão se aplicam a produtos sem categoria

## Deploy e CI/CD
A entrega contínua é gerenciada por GitHub Actions. Cada push ou Pull Request executa um pipeline que:
1. Instala dependências e valida o lint (`pnpm lint`).
2. Executa a suíte de testes (`npm test`).
3. Gera o build do frontend (`pnpm build`).
4. Aplica migrações e atualiza Edge Functions no Supabase.
5. Publica o frontend em Vercel ou Netlify.

Segredos e variáveis de ambiente são mantidos como secrets do repositório. O merge em `main` requer aprovação e execução bem-sucedida do pipeline.

Este documento será atualizado conforme novas necessidades surgirem.

