# ARQUITETURA CATALOG MAKER HUB

## 📐 **VISÃO GERAL**
Sistema SaaS para gestão de marketplace e precificação com arquitetura moderna e escalável.

## 🏗️ **STACK TECNOLÓGICA**
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Query + Context API
- **Validação**: Zod + React Hook Form

## 📁 **ESTRUTURA DE PASTAS**

```
src/
├── components/          # Componentes React
│   ├── ui/             # shadcn/ui (NÃO MODIFICAR)
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

## 🔄 **PADRÕES ARQUITETURAIS**

### **Service Layer Pattern**
```typescript
// services/products.ts
export class ProductsService extends BaseService<ProductType> {
  async getAllWithCategories(): Promise<ProductWithCategory[]> {
    // Implementação CRUD
  }
}
```

### **Hook Pattern**
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

### **Form Pattern**
```typescript
// Zod + React Hook Form + shadcn/ui
const form = useForm<ProductFormData>({
  resolver: zodResolver(productSchema),
});
```

## 🔐 **SEGURANÇA (RLS)**
- Row Level Security habilitado em todas as tabelas
- Policies baseadas em tenant_id
- Super admin com acesso total
- Validações client + server side

## 📊 **GERENCIAMENTO DE ESTADO**
- **Server State**: React Query (cache, sync, optimistic updates)
- **Client State**: useState, useReducer
- **Global State**: Context API para auth
- **Form State**: React Hook Form

## 🎯 **PRINCÍPIOS DE QUALIDADE**
1. **Type Safety**: TypeScript strict mode
2. **Error Handling**: Centralizado com logger
3. **Performance**: Lazy loading + memoização
4. **Maintainability**: SOLID principles
5. **Testing**: Jest + Testing Library

## 🚀 **DEPLOY & CI/CD**
- Supabase migrations automáticas
- Edge Functions auto-deploy
- Vercel/Netlify para frontend
- GitHub Actions para qualidade