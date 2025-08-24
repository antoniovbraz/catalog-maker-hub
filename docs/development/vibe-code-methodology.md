# 🎯 Metodologia Vibe Code - Catalog Maker Hub

## 📋 Visão Geral

A **Metodologia Vibe Code** é nossa abordagem pragmática para desenvolvimento que prioriza **entrega rápida**, **qualidade técnica** e **manutenibilidade**. Focamos em soluções que funcionam e escalam.

## 🎪 Princípios Fundamentais

### 1. **Code First, Polish Later**
```typescript
// ✅ VIBE CODE: Funcional e direto
const syncProduct = async (productId: string) => {
  const result = await mlSync.createItem(productId);
  return result;
}

// ❌ OVER-ENGINEERING: Complexo demais para MVP
class ProductSyncOrchestrator {
  constructor(
    private strategy: SyncStrategy,
    private validator: ValidationEngine,
    private factory: ItemFactory
  ) {}
  // ... 200 linhas de abstração
}
```

### 2. **Progressive Enhancement**
- **Semana 1**: Função básica funcionando
- **Semana 2**: Error handling + logs
- **Semana 3**: UI polida + UX
- **Semana 4**: Performance + edge cases

### 3. **Real World Ready**
- Sempre testar com dados reais
- Priorizar casos de uso comuns (80/20)
- Error handling para cenários reais
- Logs úteis para debug em produção

## 🏗️ Estrutura de Desenvolvimento

### **Phase 1: Core Infrastructure** ✅
```bash
# Foundation que funciona
├── Database Schema (RLS + Security) ✅
├── Edge Functions Base (Auth/Sync/Webhook) ✅
├── TypeScript Types (Auto-generated) ✅
└── Security Layer (Tenant Isolation) ✅
```

### **Phase 2: Feature Implementation** 🔄
```bash
# Funcionalidades essenciais
├── OAuth Flow (Login + Token Refresh) 
├── Product Sync (Hub → ML → Hub)
├── Order Processing (Webhook → Sales)
└── UI Components (Management Interface)
```

### **Phase 3: Production Polish** 📅
```bash
# Qualidade e performance
├── Error Boundaries + Retry Logic
├── Loading States + User Feedback  
├── Analytics + Monitoring
└── Documentation + Testing
```

## 🎯 Padrões de Código Vibe

### **Services Layer Pattern**
```typescript
// services/ml-auth.ts
export class MLAuthService {
  static async startAuth(tenantId: string) {
    // Implementação direta, sem over-abstraction
    const authUrl = await supabase.functions.invoke('ml-auth', {
      body: { action: 'start', tenantId }
    });
    return authUrl.data;
  }
}
```

### **Hook Pattern**
```typescript
// hooks/useMLAuth.ts  
export function useMLAuth() {
  return useQuery({
    queryKey: ['ml-auth'],
    queryFn: MLAuthService.getStatus,
    refetchInterval: 5 * 60 * 1000 // 5 min
  });
}
```

### **Component Pattern**
```typescript
// components/ml/MLConnectionStatus.tsx
export function MLConnectionStatus() {
  const { data: status, isLoading } = useMLAuth();
  
  if (isLoading) return <Skeleton />;
  
  return (
    <Card>
      <ConnectionStatusBadge status={status?.connection} />
      <MLConnectionActions status={status} />
    </Card>
  );
}
```

## 🔧 Desenvolvimento Prático

### **1. Database First**
- Sempre começar pelo schema
- RLS desde o primeiro dia
- Migrations versionadas
- Types auto-gerados

### **2. Edge Functions para Logic**
```typescript
// Padrão para todas Edge Functions
export default async (req: Request) => {
  // 1. CORS Headers
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // 2. Input Validation
  const { action, ...params } = await req.json();
  
  // 3. Business Logic
  const result = await processAction(action, params);
  
  // 4. Response + Logging
  console.log(`ML Auth ${action}:`, result);
  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

### **3. React Query Everywhere**
```typescript
// Padrão para estado do servidor
const useMLProducts = () => useQuery({
  queryKey: ['ml-products'],
  queryFn: MLService.getProducts,
  staleTime: 2 * 60 * 1000 // 2 min
});

const useMLSync = () => useMutation({
  mutationFn: MLService.syncProduct,
  onSuccess: () => {
    queryClient.invalidateQueries(['ml-products']);
    toast.success('Produto sincronizado!');
  }
});
```

## 📊 Métricas de Qualidade Vibe

### **Development Velocity**
- ✅ Feature básica: 1-2 dias
- ✅ Feature polida: 3-5 dias  
- ✅ Feature produção: 5-7 dias

### **Code Quality**
- ✅ TypeScript strict mode
- ✅ ESLint + Prettier
- ✅ 80%+ test coverage (crítico)
- ✅ Zero security warnings

### **User Experience**
- ✅ Loading states em tudo
- ✅ Error boundaries
- ✅ Toast feedback
- ✅ Mobile responsive

## 🚨 Anti-Patterns Vibe

### **❌ Over-Abstraction**
```typescript
// NÃO FAZER: Factory pattern desnecessário
class MLServiceFactory {
  createSyncService(): ISyncService { ... }
  createAuthService(): IAuthService { ... }
}

// FAZER: Service direto e funcional
export const MLAuthService = {
  async login() { ... },
  async refresh() { ... }
}
```

### **❌ Premature Optimization**
```typescript
// NÃO FAZER: Cache complexo sem necessidade
const memoizedProductProcessor = useMemo(() => 
  createProductProcessor(config), [config]);

// FAZER: Simples e direto
const processProduct = (product) => {
  // Lógica direta
}
```

### **❌ Feature Creep**
```typescript
// NÃO FAZER: Adicionar funcionalidades não solicitadas
const MLSyncButton = () => {
  // ... sync logic
  // ... auto-retry logic  
  // ... batch processing
  // ... scheduling
  // ... analytics
}

// FAZER: Apenas o que foi pedido
const MLSyncButton = () => {
  const handleSync = () => MLService.syncProduct(productId);
  return <Button onClick={handleSync}>Sincronizar</Button>
}
```

## 🎪 Vibe Code em Ação

### **Sprint Planning Vibe**
1. **Define MVP**: O que é o mínimo funcional?
2. **Code MVP**: Implementa apenas isso
3. **Test MVP**: Funciona com dados reais?
4. **Ship MVP**: Deploy e feedback
5. **Iterate**: Melhora baseado no uso real

### **Code Review Vibe**
- ✅ **Funciona?** Testa com dados reais
- ✅ **É simples?** Pode ser entendido rapidamente?
- ✅ **É seguro?** RLS + validação
- ✅ **É manutenível?** Futuro dev entenderá?

### **Debug Vibe**
```typescript
// Logs úteis em produção
console.log('ML Sync started:', { productId, tenantId, timestamp: new Date() });
console.log('ML API Response:', { status, data: response.data, timing: Date.now() - start });
console.log('ML Sync completed:', { success: true, productId, mlItemId: response.id });
```

## 🎯 Próximos Passos

### **Immediate (Esta Sprint)**
1. **OAuth Testing**: Testar fluxo completo no ambiente real
2. **Product Mapping**: Implementar lógica Hub ↔ ML
3. **UI Components**: Criar componentes de gestão ML
4. **Error Handling**: Implementar retry + user feedback

### **Next Sprint**
1. **Webhook Processing**: Automatizar vendas
2. **Dashboard**: Métricas ML
3. **Performance**: Otimização de queries
4. **Documentation**: Guias para usuários

---

> 🎪 **Vibe Code = Ship Fast, Code Smart, Scale Real**