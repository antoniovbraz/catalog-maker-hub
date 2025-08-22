# 📚 API Reference - Integração Mercado Livre

## 🔗 Endpoints da Integração

### Base URL
```
Production: https://peepers-hub.lovable.app/api
Development: http://localhost:3000/api
```

---

## 🔐 Autenticação

### **POST** `/ml/auth/connect`
Inicia processo de autenticação OAuth com Mercado Livre

#### Request
```typescript
interface ConnectMLRequest {
  tenant_id: string;
  redirect_url?: string; // Optional override
}
```

```bash
curl -X POST https://peepers-hub.lovable.app/api/ml/auth/connect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -d '{
    "tenant_id": "uuid-tenant-id",
    "redirect_url": "https://peepers-hub.lovable.app/integrations"
  }'
```

#### Response
```typescript
interface ConnectMLResponse {
  authorization_url: string;
  state: string;
  expires_in: number; // seconds
}
```

```json
{
  "authorization_url": "https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=123&redirect_uri=...",
  "state": "random-state-string",
  "expires_in": 600
}
```

---

### **GET** `/ml/auth/callback`
Callback do OAuth para trocar código por tokens

#### Query Parameters
```typescript
interface OAuthCallback {
  code: string;
  state: string;
  error?: string;
  error_description?: string;
}
```

#### Response
```typescript
interface OAuthCallbackResponse {
  success: boolean;
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  user_id?: string;
  error?: string;
}
```

---

### **POST** `/ml/auth/refresh`
Renovar access token usando refresh token

#### Request
```typescript
interface RefreshTokenRequest {
  tenant_id: string;
}
```

#### Response
```typescript
interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}
```

---

### **DELETE** `/ml/auth/disconnect`
Desconectar conta Mercado Livre

#### Request
```typescript
interface DisconnectMLRequest {
  tenant_id: string;
  revoke_token?: boolean; // Revogar token no ML também
}
```

#### Response
```typescript
interface DisconnectMLResponse {
  success: boolean;
  message: string;
}
```

---

## 📦 Sincronização de Produtos

### **POST** `/ml/products/sync`
Sincronizar produto individual ou lote

#### Request
```typescript
interface SyncProductsRequest {
  tenant_id: string;
  product_ids: string[];
  force_update?: boolean;
  dry_run?: boolean; // Apenas validar, não executar
}
```

```bash
curl -X POST https://peepers-hub.lovable.app/api/ml/products/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -d '{
    "tenant_id": "uuid-tenant-id",
    "product_ids": ["product-1", "product-2"],
    "force_update": false,
    "dry_run": true
  }'
```

#### Response
```typescript
interface SyncProductsResponse {
  results: Array<{
    product_id: string;
    status: 'success' | 'error' | 'skipped';
    ml_item_id?: string;
    ml_permalink?: string;
    error_message?: string;
    warnings?: string[];
  }>;
  summary: {
    total: number;
    success: number;
    errors: number;
    skipped: number;
  };
}
```

---

### **GET** `/ml/products/status`
Verificar status de sincronização de produtos

#### Query Parameters
```typescript
interface ProductStatusQuery {
  tenant_id: string;
  product_ids?: string[]; // Produtos específicos
  sync_status?: 'pending' | 'synced' | 'error' | 'conflicted';
  limit?: number;
  offset?: number;
}
```

#### Response
```typescript
interface ProductStatusResponse {
  products: Array<{
    local_product_id: string;
    product_name: string;
    ml_item_id?: string;
    ml_permalink?: string;
    sync_status: string;
    last_sync_at?: string;
    error_message?: string;
    retry_count: number;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}
```

---

### **PUT** `/ml/products/{product_id}/update`
Atualizar produto específico no ML

#### Request
```typescript
interface UpdateMLProductRequest {
  tenant_id: string;
  fields: {
    price?: number;
    available_quantity?: number;
    status?: 'active' | 'paused' | 'closed';
    title?: string;
    description?: string;
    pictures?: Array<{url: string}>;
  };
}
```

#### Response
```typescript
interface UpdateMLProductResponse {
  success: boolean;
  ml_item_id: string;
  updated_fields: string[];
  ml_permalink?: string;
  last_updated: string;
}
```

---

## 📈 Gestão de Vendas

### **GET** `/ml/orders`
Listar pedidos do Mercado Livre

#### Query Parameters
```typescript
interface OrdersQuery {
  tenant_id: string;
  status?: string; // confirmed, paid, shipped, delivered, cancelled
  from_date?: string; // ISO date
  to_date?: string; // ISO date
  limit?: number;
  offset?: number;
}
```

#### Response
```typescript
interface OrdersResponse {
  orders: Array<{
    ml_order_id: string;
    local_sale_id?: string;
    status: string;
    date_created: string;
    date_closed?: string;
    total_amount: number;
    currency_id: string;
    items: Array<{
      ml_item_id: string;
      title: string;
      quantity: number;
      unit_price: number;
    }>;
    buyer: {
      id: string;
      nickname: string;
    };
    shipping?: {
      status: string;
      tracking_number?: string;
    };
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
```

---

### **POST** `/ml/orders/{order_id}/sync`
Sincronizar pedido específico do ML

#### Request
```typescript
interface SyncOrderRequest {
  tenant_id: string;
  force_update?: boolean;
  create_local_sale?: boolean;
}
```

#### Response
```typescript
interface SyncOrderResponse {
  success: boolean;
  ml_order_id: string;
  local_sale_id?: string;
  order_status: string;
  items_updated: number;
  stock_updated: boolean;
}
```

---

## 🪝 Webhooks

### **POST** `/webhooks/mercadolivre`
Receber notificações do Mercado Livre

#### Request (enviado pelo ML)
```typescript
interface MLWebhookPayload {
  _id: string;
  resource: string; // URL do recurso que mudou
  user_id: string;
  topic: string; // orders_v2, items, payments, etc.
  application_id: string;
  attempts: number;
  sent: string; // ISO timestamp
  received: string; // ISO timestamp
}
```

#### Response
```typescript
// Sempre retornar 200 OK para confirmar recebimento
{
  "status": "received",
  "processed": boolean,
  "timestamp": "2025-01-21T10:00:00Z"
}
```

---

### **GET** `/ml/webhooks/status`
Verificar status de processamento de webhooks

#### Query Parameters
```typescript
interface WebhookStatusQuery {
  tenant_id: string;
  topic?: string;
  status?: 'pending' | 'processing' | 'success' | 'error';
  from_date?: string;
  limit?: number;
}
```

#### Response
```typescript
interface WebhookStatusResponse {
  webhooks: Array<{
    webhook_id: string;
    topic: string;
    resource: string;
    received_at: string;
    processed_at?: string;
    processing_status: string;
    error_message?: string;
    attempts: number;
  }>;
  summary: {
    total: number;
    pending: number;
    success: number;
    errors: number;
  };
}
```

---

## ⚙️ Configurações

### **GET** `/ml/settings`
Obter configurações da integração ML

#### Query Parameters
```typescript
interface SettingsQuery {
  tenant_id: string;
}
```

#### Response
```typescript
interface MLSettingsResponse {
  auto_sync_enabled: boolean;
  sync_frequency_minutes: number;
  sync_on_product_change: boolean;
  sync_on_price_change: boolean;
  sync_on_stock_change: boolean;
  batch_size: number;
  max_retries: number;
  default_listing_type: string;
  default_condition: string;
  excluded_categories: string[];
  custom_attributes: Record<string, any>;
}
```

---

### **PUT** `/ml/settings`
Atualizar configurações da integração

#### Request
```typescript
interface UpdateMLSettingsRequest {
  tenant_id: string;
  settings: Partial<MLSettingsResponse>;
}
```

#### Response
```typescript
interface UpdateMLSettingsResponse {
  success: boolean;
  updated_settings: string[];
  effective_date: string;
}
```

---

## 📊 Analytics e Logs

### **GET** `/ml/analytics`
Obter métricas da integração ML

#### Query Parameters
```typescript
interface AnalyticsQuery {
  tenant_id: string;
  metric_type: 'sync_performance' | 'sales_summary' | 'error_rate';
  period: 'hour' | 'day' | 'week' | 'month';
  from_date?: string;
  to_date?: string;
}
```

#### Response
```typescript
interface AnalyticsResponse {
  metric_type: string;
  period: string;
  data: Array<{
    timestamp: string;
    value: number;
    metadata?: Record<string, any>;
  }>;
  summary: {
    total: number;
    average: number;
    min: number;
    max: number;
  };
}
```

---

### **GET** `/ml/logs`
Obter logs detalhados da integração

#### Query Parameters
```typescript
interface LogsQuery {
  tenant_id: string;
  operation_type?: string; // create, update, delete, sync_batch, webhook
  entity_type?: string; // product, order, category, token
  status?: string; // success, error, partial, retry
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}
```

#### Response
```typescript
interface LogsResponse {
  logs: Array<{
    id: string;
    operation_type: string;
    entity_type: string;
    entity_id: string;
    status: string;
    error_message?: string;
    execution_time_ms: number;
    created_at: string;
    request_data?: any;
    response_data?: any;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
```

---

## 🔍 Utilitários

### **POST** `/ml/validate/product`
Validar se produto pode ser sincronizado

#### Request
```typescript
interface ValidateProductRequest {
  tenant_id: string;
  product_id: string;
  check_category_mapping?: boolean;
  check_required_attributes?: boolean;
}
```

#### Response
```typescript
interface ValidateProductResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
  ml_category?: {
    id: string;
    name: string;
    required_attributes: Array<{
      id: string;
      name: string;
      type: string;
      required: boolean;
    }>;
  };
}
```

---

### **GET** `/ml/categories/search`
Buscar categorias do Mercado Livre

#### Query Parameters
```typescript
interface CategorySearchQuery {
  q: string; // Termo de busca
  limit?: number;
}
```

#### Response
```typescript
interface CategorySearchResponse {
  categories: Array<{
    id: string;
    name: string;
    path_from_root: Array<{id: string, name: string}>;
    children_categories_count: number;
    attribute_types: 'required' | 'optional' | 'prohibited';
  }>;
}
```

---

### **POST** `/ml/test/connection`
Testar conectividade com Mercado Livre

#### Request
```typescript
interface TestConnectionRequest {
  tenant_id: string;
  test_webhook?: boolean;
}
```

#### Response
```typescript
interface TestConnectionResponse {
  connection_status: 'ok' | 'error';
  token_valid: boolean;
  token_expires_at?: string;
  ml_user_info?: {
    id: string;
    nickname: string;
    country_id: string;
  };
  webhook_status?: 'ok' | 'error';
  error_details?: string;
}
```

---

## 🚨 Códigos de Erro

### Códigos HTTP Específicos
- **400**: Request inválido ou dados malformados
- **401**: Token de acesso inválido ou expirado
- **403**: Permissões insuficientes
- **404**: Recurso não encontrado
- **409**: Conflito (ex: produto já sincronizado)
- **429**: Rate limit excedido
- **500**: Erro interno do servidor
- **502**: Erro na comunicação com ML API

### Códigos de Erro Personalizados
```typescript
enum MLErrorCodes {
  // Autenticação
  INVALID_TOKEN = 'ML_INVALID_TOKEN',
  TOKEN_EXPIRED = 'ML_TOKEN_EXPIRED',
  REFRESH_FAILED = 'ML_REFRESH_FAILED',
  
  // Sincronização
  PRODUCT_NOT_FOUND = 'ML_PRODUCT_NOT_FOUND',
  CATEGORY_NOT_MAPPED = 'ML_CATEGORY_NOT_MAPPED',
  REQUIRED_ATTRIBUTES_MISSING = 'ML_REQUIRED_ATTRIBUTES_MISSING',
  SYNC_CONFLICT = 'ML_SYNC_CONFLICT',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'ML_RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'ML_QUOTA_EXCEEDED',
  
  // Webhooks
  WEBHOOK_VALIDATION_FAILED = 'ML_WEBHOOK_VALIDATION_FAILED',
  WEBHOOK_PROCESSING_ERROR = 'ML_WEBHOOK_PROCESSING_ERROR',
  
  // API ML
  ML_API_ERROR = 'ML_API_ERROR',
  ML_SERVICE_UNAVAILABLE = 'ML_SERVICE_UNAVAILABLE'
}
```

---

## 📝 Rate Limits

### Limites da API Mercado Livre
- **Requisições gerais**: 5000/hora por aplicação
- **Requisições por usuário**: 1000/hora por token
- **Upload de imagens**: 100/hora por aplicação
- **Webhooks**: Sem limite específico

### Limites da API Interna
- **Sincronizações**: 100 produtos/minuto por tenant
- **Webhooks**: 1000 eventos/hora por tenant
- **Logs**: 10000 registros por consulta

---

## 🔒 Autenticação da API

Todas as requisições para a API interna devem incluir:

```bash
Authorization: Bearer $SUPABASE_JWT_TOKEN
```

O token deve ser obtido via Supabase Auth e conter as claims:
- `sub`: User ID
- `tenant_id`: Tenant ID (via custom claims)
- `role`: User role

---

## 📚 Exemplos de Uso

### Fluxo Completo de Sincronização
```typescript
// 1. Conectar ao ML
const authResponse = await fetch('/api/ml/auth/connect', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ tenant_id })
});

// 2. Validar produto
const validation = await fetch(`/api/ml/validate/product?tenant_id=${tenant_id}&product_id=${productId}`);

// 3. Sincronizar produto
const syncResponse = await fetch('/api/ml/products/sync', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    tenant_id,
    product_ids: [productId]
  })
});

// 4. Verificar status
const status = await fetch(`/api/ml/products/status?tenant_id=${tenant_id}&product_ids=${productId}`);
```