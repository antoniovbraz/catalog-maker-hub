# 🚀 Quick Start - Integração ML com Vibe Code

## 🎯 Setup Rápido (15 minutos)

### **1. Verificar Implementação Atual** ✅
```bash
# Projeto já configurado e funcional
git clone [projeto]
npm install
npm run dev

# ✅ Database: 15 tabelas ML implementadas
# ✅ Edge Functions: ml-auth, ml-sync, ml-webhook funcionais  
# ✅ RLS: Segurança habilitada
# ✅ Types: Auto-gerados pelo Supabase
```

### **2. Configurar Credenciais ML** 
```bash
# Secrets já configurados no Supabase:
# ✅ ML_CLIENT_ID 
# ✅ ML_CLIENT_SECRET

# Verificar no dashboard:
# https://supabase.com/dashboard/project/ngkhzbzynkhgezkqykeb/settings/functions
```

### **3. Testar Edge Functions** 🧪
```typescript
// Testar ml-auth
const response = await supabase.functions.invoke('ml-auth', {
  body: { action: 'status', tenantId: 'your-tenant-id' }
});
console.log('ML Auth Status:', response.data);

// Testar ml-webhook  
const webhook = await supabase.functions.invoke('ml-webhook', {
  body: { topic: 'test', resource: '/test', user_id: 123 }
});
console.log('Webhook Response:', webhook.data);
```

## 🎪 Vibe Code em Ação

### **Próximos Passos - Sprint Atual**

#### **1. OAuth Integration Testing** (2-3 dias)
```typescript
// Implementar UI básica
export function MLConnectionButton() {
  const startAuth = async () => {
    const { data } = await supabase.functions.invoke('ml-auth', {
      body: { action: 'start', tenantId: userTenantId }
    });
    window.location.href = data.authUrl;
  };
  
  return <Button onClick={startAuth}>Conectar ML</Button>;
}
```

#### **2. Product Sync MVP** (3-4 dias)
```typescript
// Implementar lógica básica Hub → ML
export async function syncProductToML(productId: string) {
  // 1. Buscar produto local
  const product = await getProduct(productId);
  
  // 2. Mapear para formato ML
  const mlItem = mapProductToMLItem(product);
  
  // 3. Enviar para ML via Edge Function
  const result = await supabase.functions.invoke('ml-sync', {
    body: { action: 'sync-product', productId, mlItem }
  });
  
  return result;
}
```

#### **3. UI Components ML** (2-3 dias)
```typescript
// Componentes essenciais
<MLConnectionCard />      // Status conexão
<ProductSyncButton />     // Sync individual
<MLSyncStatusBadge />     // Status por produto
<MLOrdersList />          // Pedidos recebidos
```

### **Metodologia: Ship Fast, Code Smart**

```bash
# Semana 1: MVP Funcional
✅ OAuth flow completo
✅ Sync básico funcionando  
✅ UI minimalista

# Semana 2: Production Ready
📅 Error handling robusto
📅 Bulk operations
📅 Analytics básico

# Semana 3: Scale & Polish
📅 Performance optimization
📅 Advanced features
📅 Full documentation
```

## 🔧 Debugging Rápido

### **Verificar Edge Functions**
```bash
# Logs em tempo real
# https://supabase.com/dashboard/project/ngkhzbzynkhgezkqykeb/functions/ml-auth/logs
# https://supabase.com/dashboard/project/ngkhzbzynkhgezkqykeb/functions/ml-sync/logs  
# https://supabase.com/dashboard/project/ngkhzbzynkhgezkqykeb/functions/ml-webhook/logs
```

### **SQL Debugging**
```sql
-- Status das tabelas ML
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'ml_%';

-- Verificar dados de teste
SELECT COUNT(*) FROM ml_auth_tokens;
SELECT COUNT(*) FROM ml_webhook_events;
SELECT COUNT(*) FROM ml_sync_log;
```

### **Frontend Testing**
```typescript
// Hook para testar rapidamente
export function useMLDebug() {
  const testAuth = async () => {
    const result = await supabase.functions.invoke('ml-auth', {
      body: { action: 'status', tenantId: 'test' }
    });
    console.log('Auth Test:', result);
  };
  
  const testSync = async () => {
    const result = await supabase.functions.invoke('ml-sync', {
      body: { action: 'sync-status', productId: 'test', tenantId: 'test' }
    });
    console.log('Sync Test:', result);
  };
  
  return { testAuth, testSync };
}
```

## 📊 Status Check Rápido

```typescript
// Executar para verificar implementação atual
export async function quickStatusCheck() {
  console.log('🔍 ML Integration Status Check');
  
  // 1. Database
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .like('table_name', 'ml_%');
  console.log('✅ ML Tables:', tables?.length || 0);
  
  // 2. Edge Functions  
  const authTest = await supabase.functions.invoke('ml-auth', {
    body: { action: 'status', tenantId: 'test' }
  });
  console.log('✅ ml-auth:', authTest.error ? '❌' : '✅');
  
  // 3. Webhooks
  const webhookTest = await supabase.functions.invoke('ml-webhook', {
    body: { topic: 'test' }
  });
  console.log('✅ ml-webhook:', webhookTest.error ? '❌' : '✅');
  
  console.log('🎯 Ready for development!');
}
```

## 🎯 Próximos Commits

```bash
# Exemplo de commits Vibe Code
feat: implement ML OAuth UI integration
feat: add basic product sync to ML  
feat: create ML connection status card
fix: handle ML API rate limits
refactor: optimize ML sync performance
docs: update ML integration status
```

---

> 🎪 **Vibe Code = Menos documentação, mais código funcionando!**  
> 📖 **Status sempre atualizado em**: `docs/development/implementation-status.md`