# Database Schema

Esquema completo do banco de dados para a integração Mercado Livre.

## Visão Geral

O schema está organizado em 3 grupos principais:
- **Autenticação**: Tokens e aplicações ML
- **Produtos**: Mapeamento e sincronização
- **Vendas**: Pedidos e webhooks

## Tabelas Principais

### Autenticação OAuth

#### `ml_auth_tokens`
Armazena tokens de acesso do Mercado Livre.

```sql
CREATE TABLE ml_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  access_token TEXT NOT NULL, -- stored encrypted with pgp_sym_encrypt
  refresh_token TEXT, -- stored encrypted with pgp_sym_encrypt
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  user_id_ml BIGINT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

Os tokens são criptografados utilizando `pgp_sym_encrypt` e expostos através da view `ml_auth_tokens_decrypted`.

**RLS Policy:** Usuários acessam apenas tokens do próprio tenant.

#### `ml_applications`
Configurações da aplicação ML por tenant.

```sql
CREATE TABLE ml_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  app_id BIGINT NOT NULL,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  webhook_url TEXT,
  country_id TEXT DEFAULT 'MLB',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Sincronização de Produtos

#### Campos adicionais em `products`
Campos de apoio à importação do Mercado Livre.

```sql
ALTER TABLE products
  ADD COLUMN sku_source TEXT DEFAULT 'none',
  ADD COLUMN ml_item_id TEXT,
  ADD COLUMN category_ml_id TEXT,
  ADD COLUMN category_ml_path JSONB DEFAULT '[]',
  ADD COLUMN updated_from_ml_at TIMESTAMPTZ;

CREATE UNIQUE INDEX idx_products_tenant_ml_item_id
  ON products(tenant_id, ml_item_id);
```

#### `ml_product_mapping`
Mapeia produtos locais para anúncios ML.

```sql
CREATE TABLE ml_product_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  product_id UUID NOT NULL,
  ml_item_id TEXT,
  ml_title TEXT,
  ml_price NUMERIC,
  ml_category_id TEXT,
  ml_listing_type TEXT DEFAULT 'gold_special',
  ml_condition TEXT DEFAULT 'new',
  ml_currency_id TEXT DEFAULT 'BRL',
  ml_permalink TEXT,
  sync_status ml_sync_status DEFAULT 'not_synced',
  sync_direction ml_sync_direction DEFAULT 'to_ml',
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Status de Sincronização:**
- `not_synced`: Não sincronizado
- `pending`: Pendente de sincronização
- `synced`: Sincronizado com sucesso
- `error`: Erro na sincronização

**Direção da Sincronização:**
- `to_ml`: Do Hub para ML
- `from_ml`: Do ML para Hub
- `bidirectional`: Bidirecional

#### `ml_category_mapping`
Mapeia categorias locais para categorias ML.

```sql
CREATE TABLE ml_category_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  category_id UUID,
  ml_category_id TEXT NOT NULL,
  ml_category_name TEXT NOT NULL,
  attributes_template JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Gestão de Vendas

#### `ml_orders`
Armazena pedidos importados do ML.

```sql
CREATE TABLE ml_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  ml_order_id BIGINT NOT NULL,
  ml_item_id TEXT NOT NULL,
  product_id UUID,
  buyer_id BIGINT,
  buyer_nickname TEXT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  currency_id TEXT DEFAULT 'BRL',
  order_status TEXT,
  payment_status TEXT,
  shipping_status TEXT,
  date_created TIMESTAMPTZ,
  date_closed TIMESTAMPTZ,
  date_last_updated TIMESTAMPTZ,
  fees JSONB DEFAULT '{}',
  shipping_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `ml_webhook_events`
Log de eventos de webhook recebidos.

```sql
CREATE TABLE ml_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  topic TEXT NOT NULL,
  resource TEXT NOT NULL,
  user_id_ml BIGINT NOT NULL,
  application_id BIGINT NOT NULL,
  attempts INTEGER DEFAULT 0,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  raw_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Configurações e Logs

#### `ml_sync_settings`
Configurações de sincronização por tenant.

```sql
CREATE TABLE ml_sync_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE,
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_interval_hours INTEGER DEFAULT 24,
  auto_import_orders BOOLEAN DEFAULT true,
  auto_update_stock BOOLEAN DEFAULT true,
  auto_update_prices BOOLEAN DEFAULT false,
  price_markup_percent NUMERIC DEFAULT 0,
  default_listing_type TEXT DEFAULT 'gold_special',
  default_condition TEXT DEFAULT 'new',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `ml_sync_log`
Log detalhado de operações de sincronização.

```sql
CREATE TABLE ml_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  operation_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  ml_entity_id TEXT,
  status TEXT NOT NULL,
  request_data JSONB,
  response_data JSONB,
  error_details JSONB,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Views de Status

### `ml_integration_status`
View que agrega status da integração por tenant.

```sql
CREATE VIEW ml_integration_status AS
SELECT 
  t.tenant_id,
  COUNT(DISTINCT p.id) as total_products,
  COUNT(DISTINCT CASE WHEN m.sync_status = 'synced' THEN p.id END) as synced_products,
  COUNT(DISTINCT CASE WHEN m.sync_status = 'pending' THEN p.id END) as pending_products,
  COUNT(DISTINCT CASE WHEN m.sync_status = 'error' THEN p.id END) as error_products,
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT CASE WHEN o.date_created >= date_trunc('month', now()) THEN o.id END) as orders_this_month,
  COALESCE(SUM(CASE WHEN o.date_created >= date_trunc('month', now()) THEN o.total_amount END), 0) as revenue_this_month,
  MAX(m.last_sync_at) as last_product_sync,
  MAX(o.created_at) as last_order_import,
  CASE 
    WHEN COUNT(DISTINCT a.id) > 0 AND MAX(a.expires_at) > now() THEN 'connected'
    WHEN COUNT(DISTINCT a.id) > 0 THEN 'token_expired'
    ELSE 'not_connected'
  END as connection_status
FROM profiles t
LEFT JOIN products p ON p.tenant_id = t.tenant_id
LEFT JOIN ml_product_mapping m ON m.product_id = p.id
LEFT JOIN ml_orders o ON o.tenant_id = t.tenant_id
LEFT JOIN ml_auth_tokens a ON a.tenant_id = t.tenant_id
GROUP BY t.tenant_id;
```

## Índices de Performance

```sql
-- Índices para consultas frequentes
CREATE INDEX idx_ml_product_mapping_tenant_product ON ml_product_mapping(tenant_id, product_id);
CREATE INDEX idx_ml_product_mapping_ml_item ON ml_product_mapping(ml_item_id);
CREATE INDEX idx_ml_orders_tenant_date ON ml_orders(tenant_id, date_created);
CREATE INDEX idx_ml_sync_log_tenant_created ON ml_sync_log(tenant_id, created_at DESC);
CREATE INDEX idx_ml_webhook_events_processed ON ml_webhook_events(processed_at) WHERE processed_at IS NULL;
```

## Triggers Automáticos

```sql
-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_ml_updated_at_trigger
  BEFORE UPDATE ON ml_auth_tokens
  FOR EACH ROW EXECUTE FUNCTION update_ml_updated_at_column();

-- Aplicar o mesmo trigger para todas as tabelas ML
-- (implementado para cada tabela individualmente)
```

## Políticas de Segurança (RLS)

Todas as tabelas ML implementam Row Level Security baseado em `tenant_id`:

```sql
-- Exemplo de política padrão
CREATE POLICY "Users can access own tenant ML data"
ON ml_auth_tokens
FOR ALL
USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  OR get_current_user_role() = 'super_admin'
);
```

## Funções de Negócio

### `create_default_ml_settings()`
Cria configurações padrão para novos tenants.

### `cleanup_old_ml_logs()`
Limpa logs antigos automaticamente (execução via cron).

## Validações e Constraints

- **Unique Constraints**: Evitam duplicação de dados críticos
- **Check Constraints**: Validam formatos e valores
- **Foreign Keys**: Mantêm integridade referencial
- **NOT NULL**: Garantem dados obrigatórios

## Estratégia de Backup

- **Frequency**: Backup diário automatizado
- **Retention**: 30 dias para dados operacionais, 1 ano para logs
- **Recovery**: RTO < 1 hora, RPO < 15 minutos