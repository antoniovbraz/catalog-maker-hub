# Diretrizes para IAs - Projeto Lovable

## 🤖 Instruções Críticas para Assistentes IA

### CONTEXTO OBRIGATÓRIO
```
Este é um projeto Lovable - SaaS de Gestão de Marketplace e Precificação
Stack: React + TypeScript + Vite + Supabase + Tailwind CSS + shadcn/ui
Metodologia: Vibe Code (simplicidade > abstração)
Arquitetura: Serverless com Edge Functions
```

## 🚨 REGRAS ABSOLUTAS

### ✅ SEMPRE FAZER
1. **Frontend**: React + TypeScript + Vite (NUNCA outros frameworks)
2. **Backend**: Supabase Edge Functions (NUNCA Node.js/Express)
3. **Database**: PostgreSQL com RLS obrigatório
4. **Styling**: Tailwind + shadcn/ui (NUNCA CSS-in-JS)
5. **State**: React Query para servidor, Context local quando necessário
6. **Forms**: React Hook Form + Zod sempre
7. **Secrets**: Supabase Vault para privados, .env apenas para VITE_*
8. **Services**: Camada de abstração para Supabase
9. **Tipos**: TypeScript strict mode sempre

### ❌ NUNCA FAZER
1. Sugerir Next.js, Angular, Vue ou outros frameworks
2. Criar servidores Node.js, Express, ou backend tradicional
3. Usar MongoDB, MySQL ou outras databases
4. Implementar styled-components ou CSS-in-JS
5. Colocar secrets privados no .env
6. Ignorar RLS policies
7. Fazer chamadas diretas ao Supabase nos componentes
8. Usar bibliotecas de state management além do React Query

## 📋 Checklist de Verificação

Antes de qualquer sugestão, pergunte-se:

### Arquitetura
- [ ] Estou usando React + TypeScript + Vite?
- [ ] Estou propondo Edge Functions em vez de backend tradicional?
- [ ] Todas as tabelas têm RLS implementado?
- [ ] Estou usando Supabase client corretamente?

### Código
- [ ] Estou usando shadcn/ui para componentes base?
- [ ] Estou usando Tailwind classes semânticas do design system?
- [ ] Estou criando services em vez de calls diretas?
- [ ] Estou usando React Query para estado servidor?

### Segurança
- [ ] Secrets privados estão indo para Supabase Vault?
- [ ] RLS policies estão cobrindo todas as operações?
- [ ] Validação está sendo feita no backend (Edge Functions)?

## 🔧 Padrões de Implementação

### Service Layer Pattern
```typescript
// ✅ CORRETO
export class ProductsService {
  static async getAll() {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data;
  }
}

// ❌ ERRADO - Call direta no componente
const { data } = await supabase.from('products').select('*');
```

### Hook Pattern
```typescript
// ✅ CORRETO
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: ProductsService.getAll,
    staleTime: 5 * 60 * 1000,
  });
}

// ❌ ERRADO - useState + useEffect
const [products, setProducts] = useState([]);
useEffect(() => { /* fetch logic */ }, []);
```

### Component Pattern
```typescript
// ✅ CORRETO - shadcn/ui + semantic tokens
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

<Card className="p-6">
  <Button variant="primary">Ação</Button>
</Card>

// ❌ ERRADO - CSS customizado
<div className="bg-blue-500 p-4 rounded">
  <button className="bg-green-600 text-white">Ação</button>
</div>
```

### Edge Function Pattern
```typescript
// ✅ CORRETO - Estrutura padrão
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // 1. CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Validation
    const { param } = await req.json();
    if (!param) throw new Error('Missing required parameter');

    // 3. Business logic
    const result = await processBusinessLogic(param);

    // 4. Response
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

## 🎯 Casos de Uso Específicos

### Para Autenticação
```typescript
// ✅ USAR Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// ❌ NUNCA implementar auth customizado
```

### Para Uploads
```typescript
// ✅ USAR Supabase Storage
const { data, error } = await supabase.storage
  .from('bucket')
  .upload(path, file);

// ❌ NUNCA implementar upload customizado
```

### Para Real-time
```typescript
// ✅ USAR Supabase Realtime
supabase
  .channel('products')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'products'
  }, (payload) => {
    // Handle changes
  })
  .subscribe();
```

## 🚫 Red Flags - Pare Imediatamente

Se você encontrar ou for tentado a sugerir qualquer um desses, PARE:

### Arquitetura
- `import express from 'express'`
- `import next from 'next'`
- `const app = express()`
- `mongoose.connect()`
- `import styled from 'styled-components'`

### Environment
- Colocar API keys no .env
- Não usar VITE_ prefix para públicas
- Criar .env.local ou .env.production

### Database
- Criar tabelas sem RLS
- Fazer queries sem policies
- Usar ORMs diferentes do Supabase

## 📚 Recursos de Referência

### Documentação Obrigatória
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Tailwind Docs](https://tailwindcss.com/docs)

### Arquivos do Projeto
- `LOVABLE_SPECS.md` - Especificações técnicas
- `docs/development/vibe-code-methodology.md` - Metodologia
- `.ai-config.json` - Configurações para IAs
- `src/types/` - Definições TypeScript
- `src/services/` - Camada de dados

## 🎉 Conclusão

Lembre-se: Lovable é uma plataforma específica com constrains bem definidos. Respeitar essas limitações não é opcional - é fundamental para o funcionamento do projeto.

**Quando em dúvida, sempre escolha a solução mais simples que funcione dentro do ecossistema Lovable.**