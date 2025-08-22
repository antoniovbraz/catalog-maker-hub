# 🔧 Troubleshooting - Integração Mercado Livre

## 🚨 Problemas Críticos

### ❌ **Erro de Autenticação OAuth**

#### **Sintoma**
```
Error: invalid_grant - Authorization code expired or invalid
```

#### **Causas Possíveis**
1. Código de autorização usado mais de uma vez
2. Código expirado (válido por 10 minutos)
3. Client ID/Secret incorretos
4. URL de redirecionamento não configurada

#### **Soluções**
```typescript
// 1. Verificar configuração da aplicação ML
const config = {
  client_id: process.env.ML_CLIENT_ID,
  client_secret: process.env.ML_CLIENT_SECRET,
  redirect_uri: 'https://peepers-hub.lovable.app/api/ml/callback'
};

// 2. Validar se code não foi usado antes
const isCodeUsed = await supabase
  .from('ml_auth_tokens')
  .select('id')
  .eq('code_used', authCode)
  .single();

if (isCodeUsed.data) {
  throw new Error('Authorization code already used');
}

// 3. Implementar retry com novo código
if (error.message.includes('invalid_grant')) {
  // Redirecionar usuário para nova autorização
  window.location.href = getMLAuthUrl();
}
```

#### **Prevenção**
- Implementar state parameter para CSRF protection
- Usar PKCE para aplicações seguras
- Validar timestamp do código

---

### ❌ **Rate Limit Exceeded**

#### **Sintoma**
```
HTTP 429: Too Many Requests
X-RateLimit-Remaining: 0
```

#### **Soluções**
```typescript
// Implementar exponential backoff
class MLRateLimiter {
  private retryAfter: number = 0;
  
  async makeRequest(url: string, options: RequestInit) {
    if (Date.now() < this.retryAfter) {
      const waitTime = this.retryAfter - Date.now();
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      this.retryAfter = Date.now() + (parseInt(response.headers.get('retry-after') || '60') * 1000);
      throw new RateLimitError('Rate limit exceeded');
    }
    
    return response;
  }
}

// Usar queue para requisições
const requestQueue = new PQueue({
  concurrency: 1,
  interval: 1000, // 1 request per second
  intervalCap: 1
});
```

#### **Prevenção**
- Implementar queue de requisições
- Respeitar headers de rate limit
- Usar batch operations quando possível

---

### ❌ **Webhook não Recebido**

#### **Sintoma**
- Vendas não aparecem no sistema
- Logs mostram ausência de webhooks

#### **Verificações**
```bash
# 1. Testar conectividade do webhook
curl -X POST https://peepers-hub.lovable.app/api/webhooks/mercadolivre \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 2. Verificar logs do Supabase Edge Function
# Acessar: https://supabase.com/dashboard/project/[project-id]/functions/ml-webhook/logs

# 3. Validar configuração no ML
GET https://api.mercadolibre.com/applications/{app_id}
```

#### **Soluções**
```typescript
// Implementar endpoint de teste
export async function handleTestWebhook(req: Request) {
  const { test } = await req.json();
  
  if (test) {
    return new Response(JSON.stringify({ status: 'ok', timestamp: new Date() }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Processar webhook real
  return handleMLWebhook(req);
}

// Implementar retry manual para webhooks perdidos
export async function retryMissedWebhooks(tenantId: string, fromDate: Date) {
  const mlService = new MLService(tenantId);
  const orders = await mlService.getOrdersSince(fromDate);
  
  for (const order of orders) {
    await processOrderWebhook(order);
  }
}
```

---

## 🔍 Problemas de Sincronização

### ⚠️ **Produto não Sincroniza**

#### **Diagnóstico**
```sql
-- Verificar status de sincronização
SELECT 
  p.name,
  pm.sync_status,
  pm.error_message,
  pm.last_sync_at,
  pm.retry_count
FROM products p
LEFT JOIN ml_product_mapping pm ON pm.local_product_id = p.id
WHERE p.id = '[product-id]';

-- Verificar logs de sincronização
SELECT 
  operation_type,
  status,
  error_message,
  created_at
FROM ml_sync_log
WHERE entity_id = '[product-id]'
ORDER BY created_at DESC
LIMIT 10;
```

#### **Soluções Comuns**
```typescript
// 1. Produto sem categoria válida no ML
const validateProduct = (product: Product) => {
  if (!product.category_id) {
    throw new ValidationError('Product must have a category');
  }
  
  const mlCategory = await getMappedCategory(product.category_id);
  if (!mlCategory) {
    throw new ValidationError('Category not mapped to ML');
  }
};

// 2. Atributos obrigatórios faltando
const validateRequiredAttributes = (product: Product, mlCategory: MLCategory) => {
  const required = mlCategory.required_attributes;
  const missing = required.filter(attr => !product.attributes?.[attr.id]);
  
  if (missing.length > 0) {
    throw new ValidationError(`Missing required attributes: ${missing.map(a => a.name).join(', ')}`);
  }
};

// 3. Retry manual
const retryProductSync = async (productId: string) => {
  await supabase
    .from('ml_product_mapping')
    .update({ 
      sync_status: 'pending',
      retry_count: 0,
      error_message: null 
    })
    .eq('local_product_id', productId);
    
  await triggerSync(productId);
};
```

---

### ⚠️ **Conflito de Dados**

#### **Sintoma**
- Preços diferentes entre Hub e ML
- Estoque descasado
- Status `conflicted` na tabela de mapping

#### **Resolução**
```typescript
// Interface para resolução de conflitos
interface ConflictResolution {
  field: string;
  hubValue: any;
  mlValue: any;
  resolution: 'use_hub' | 'use_ml' | 'merge' | 'manual';
  resolvedValue?: any;
}

const resolveConflicts = async (productId: string, resolutions: ConflictResolution[]) => {
  for (const resolution of resolutions) {
    switch (resolution.resolution) {
      case 'use_hub':
        await syncFieldToML(productId, resolution.field, resolution.hubValue);
        break;
      case 'use_ml':
        await updateLocalField(productId, resolution.field, resolution.mlValue);
        break;
      case 'merge':
        await syncFieldToML(productId, resolution.field, resolution.resolvedValue);
        await updateLocalField(productId, resolution.field, resolution.resolvedValue);
        break;
    }
  }
  
  // Marcar conflito como resolvido
  await supabase
    .from('ml_product_mapping')
    .update({ sync_status: 'synced' })
    .eq('local_product_id', productId);
};
```

---

## 🔧 Problemas de Performance

### 🐌 **Sincronização Lenta**

#### **Diagnóstico**
```sql
-- Verificar tempo de execução das sincronizações
SELECT 
  operation_type,
  AVG(execution_time_ms) as avg_time,
  MAX(execution_time_ms) as max_time,
  COUNT(*) as total_operations
FROM ml_sync_log
WHERE created_at >= now() - interval '24 hours'
  AND status = 'success'
GROUP BY operation_type;
```

#### **Otimizações**
```typescript
// 1. Batch processing
const syncProductsBatch = async (productIds: string[]) => {
  const BATCH_SIZE = 10;
  const batches = chunk(productIds, BATCH_SIZE);
  
  for (const batch of batches) {
    await Promise.allSettled(
      batch.map(id => syncSingleProduct(id))
    );
    
    // Aguardar entre batches para respeitar rate limit
    await sleep(1000);
  }
};

// 2. Otimizar queries
const getProductsForSync = async (tenantId: string) => {
  return supabase
    .from('products')
    .select(`
      *,
      category:categories(name, ml_category_id),
      images:product_images(image_url),
      mapping:ml_product_mapping(sync_status, ml_item_id)
    `)
    .eq('tenant_id', tenantId)
    .is('mapping.sync_status', null)
    .or('mapping.sync_status.neq.synced');
};

// 3. Cache de categorias ML
const categoryCache = new Map<string, MLCategory>();

const getCachedMLCategory = async (categoryId: string) => {
  if (categoryCache.has(categoryId)) {
    return categoryCache.get(categoryId);
  }
  
  const category = await fetchMLCategory(categoryId);
  categoryCache.set(categoryId, category);
  return category;
};
```

---

## 📊 Ferramentas de Debug

### 🔍 **Debug Dashboard**

```typescript
// Componente para debug da integração
const MLDebugDashboard = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  
  const runDiagnostics = async () => {
    const diagnostics = {
      connectionStatus: await checkMLConnection(),
      tokenExpiry: await getTokenExpiry(),
      pendingSyncs: await getPendingSyncs(),
      recentErrors: await getRecentErrors(),
      webhookStatus: await testWebhookEndpoint()
    };
    
    setDebugInfo(diagnostics);
  };
  
  return (
    <div className="debug-dashboard">
      <h2>ML Integration Debug</h2>
      <button onClick={runDiagnostics}>Run Diagnostics</button>
      {debugInfo && <DebugResults data={debugInfo} />}
    </div>
  );
};
```

### 📝 **Health Check Script**

```typescript
// Script para verificar saúde da integração
export const healthCheck = async (tenantId: string) => {
  const checks = {
    mlConnection: false,
    tokenValid: false,
    webhookResponding: false,
    syncQueueEmpty: false,
    noRecentErrors: false
  };
  
  try {
    // 1. Verificar conexão ML
    const token = await getValidToken(tenantId);
    checks.tokenValid = !!token && token.expires_at > new Date();
    
    if (checks.tokenValid) {
      const userInfo = await mlApi.getUserInfo(token.access_token);
      checks.mlConnection = !!userInfo;
    }
    
    // 2. Verificar webhook
    checks.webhookResponding = await testWebhookEndpoint();
    
    // 3. Verificar queue
    const pendingSyncs = await getPendingSyncs(tenantId);
    checks.syncQueueEmpty = pendingSyncs.length === 0;
    
    // 4. Verificar erros recentes
    const recentErrors = await getRecentErrors(tenantId, '1 hour');
    checks.noRecentErrors = recentErrors.length === 0;
    
  } catch (error) {
    console.error('Health check failed:', error);
  }
  
  return checks;
};
```

---

## 📞 Contatos de Suporte

### 🏢 **Suporte Mercado Livre**
- **Developers**: https://developers.mercadolibre.com.ar/support
- **Forum**: https://developers.mercadolibre.com.ar/community
- **Status Page**: https://status.mercadolibre.com/

### 🛠️ **Suporte Interno**
- **GitHub Issues**: [Criar Issue](https://github.com/seu-repo/issues/new)
- **Logs Supabase**: [Edge Functions Logs](https://supabase.com/dashboard/project/ngkhzbzynkhgezkqykeb/functions)
- **Documentação**: [Docs Internas](../README.md)

---

## 🔄 Processo de Escalação

1. **Nível 1**: Verificar troubleshooting guide
2. **Nível 2**: Executar health check e diagnostics
3. **Nível 3**: Analisar logs detalhados
4. **Nível 4**: Contatar suporte ML ou criar issue

---

## 📚 Recursos Adicionais

- [Documentação Oficial ML](https://developers.mercadolibre.com.ar/pt_br/api-docs-pt-br)
- [Postman Collection ML](https://www.postman.com/mercadolibre-apis)
- [Status Codes Reference](https://developers.mercadolibre.com.ar/pt_br/reference)
- [Rate Limits Guide](https://developers.mercadolibre.com.ar/pt_br/api-limits)