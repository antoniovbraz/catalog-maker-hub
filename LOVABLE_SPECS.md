# Especificações Técnicas - Projeto Lovable

## 🚀 Stack Tecnológico Obrigatório

### Frontend
- **React 18+** com TypeScript
- **Vite** como bundler (NUNCA Webpack/Parcel)
- **Tailwind CSS** + **shadcn/ui** para styling
- **React Router** para navegação
- **React Query** para gerenciamento de estado servidor

### Backend
- **Supabase Edge Functions** exclusivamente
- **PostgreSQL** com Row Level Security (RLS)
- **Supabase Auth** para autenticação
- **Supabase Storage** para arquivos

### Gerenciamento de Estado
- **React Query** para estado servidor
- **React Hook Form** + **Zod** para formulários
- **React Context** para estado local quando necessário

## 🚫 Tecnologias Proibidas

### Frameworks Proibidos
- ❌ Next.js / Nuxt.js
- ❌ Angular / Vue.js
- ❌ Svelte / SvelteKit

### Backend Proibido
- ❌ Node.js/Express
- ❌ Python/Django/FastAPI
- ❌ PHP/Laravel
- ❌ Ruby on Rails
- ❌ Go/Gin
- ❌ Java/Spring

### Styling Proibido
- ❌ CSS-in-JS (styled-components, emotion)
- ❌ CSS Modules
- ❌ SASS/LESS sem Tailwind
- ❌ Bootstrap/Material-UI

### Database Proibido
- ❌ MongoDB / NoSQL
- ❌ MySQL / MariaDB
- ❌ SQLite
- ❌ Redis como primary DB

## 🔐 Gerenciamento de Secrets

### Secrets Públicos (.env)
```bash
# ✅ Permitido - variáveis públicas
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_AUTH_REDIRECT_URL=...
```

### Secrets Privados (Supabase Vault)
```bash
# ✅ Obrigatório - usar Supabase Secrets
OPENAI_API_KEY=... # Via Supabase
STRIPE_SECRET_KEY=... # Via Supabase
WEBHOOK_SECRET=... # Via Supabase
```

### ❌ Nunca no .env
- API Keys privadas
- Tokens de acesso
- Senhas de banco
- Chaves de criptografia

## 🏗️ Arquitetura Serverless

### Edge Functions
```typescript
// ✅ Padrão obrigatório
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // CORS headers
  // Validation
  // Business logic
  // Response
})
```

### RLS Policies
```sql
-- ✅ Sempre implementar RLS
ALTER TABLE public.tabela ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" 
ON public.tabela 
FOR SELECT 
USING (auth.uid() = user_id);
```

## 📁 Estrutura de Pastas Obrigatória

```
src/
├── components/
│   ├── ui/              # shadcn/ui (NÃO MODIFICAR)
│   └── forms/           # Formulários específicos
├── hooks/               # Custom hooks com React Query
├── services/            # Camada Supabase (CRUD + RPC)
├── lib/                 # Configurações e utils
├── types/               # Tipos TypeScript
├── utils/               # Funções auxiliares
└── pages/               # Páginas da aplicação
```

## 🎯 Metodologia Vibe Code

### Princípios
1. **Code First, Polish Later** - Funcionalidade > Abstração
2. **Progressive Enhancement** - Melhoria iterativa
3. **Real World Ready** - Testes com dados reais
4. **Ship Fast, Code Smart** - Entrega rápida e qualidade

### Padrões de Código
```typescript
// ✅ Services Layer
export class ProductsService {
  static async getAll() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
    if (error) throw new Error(error.message)
    return data
  }
}

// ✅ Custom Hooks
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: ProductsService.getAll,
    staleTime: 5 * 60 * 1000
  })
}
```

## 🔍 Validações Automáticas

### Imports Proibidos
- `import express from 'express'`
- `import next from 'next'`
- `import styled from 'styled-components'`

### Padrões Obrigatórios
- Todos os componentes devem usar TypeScript
- Todas as tabelas devem ter RLS
- Todos os forms devem usar React Hook Form + Zod
- Todas as API calls devem usar React Query

## 🚨 Red Flags para IAs

Se uma IA sugerir qualquer item abaixo, está VIOLANDO as especificações Lovable:

1. Criar servidor Node.js/Express
2. Usar .env para secrets privados
3. Implementar auth custom (usar Supabase Auth)
4. Usar frameworks diferentes de React
5. Ignorar RLS policies
6. Criar CSS custom sem Tailwind
7. Usar ORMs diferentes do Supabase client

## ✅ Checklist de Conformidade

- [ ] Frontend: React + TypeScript + Vite
- [ ] Backend: Edge Functions apenas
- [ ] Database: PostgreSQL + RLS
- [ ] Styling: Tailwind + shadcn/ui
- [ ] State: React Query
- [ ] Forms: React Hook Form + Zod
- [ ] Secrets: Supabase Vault para privados
- [ ] Architecture: Serverless first
- [ ] Methodology: Vibe Code principles