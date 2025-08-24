# 🗄️ Database Schema - Integração Mercado Livre

## 📋 Visão Geral

Schema **IMPLEMENTADO** das tabelas Mercado Livre no Catalog Maker Hub. Todas as tabelas estão criadas com RLS habilitado e Edge Functions funcionais.

> **Status**: ✅ **Implementado e Funcional**  
> **Última Atualização**: Janeiro 2025  
> **Ambiente**: Produção Ready

## 🔐 Tabelas de Autenticação

### `ml_auth_tokens` ✅ **IMPLEMENTADO**
Armazenamento seguro de tokens OAuth do Mercado Livre

**Schema Real (Implementado):**
```sql
-- TABELA CRIADA E FUNCIONAL
TABLE ml_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT,
  user_id_ml BIGINT, -- ID do usuário no ML  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS HABILITADO
ALTER TABLE public.ml_auth_tokens ENABLE ROW LEVEL SECURITY;

-- POLICY IMPLEMENTADA
CREATE POLICY "Users can access own tenant ML auth tokens" 
ON public.ml_auth_tokens FOR ALL 
USING ((tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid())) 
       OR (get_current_user_role() = 'super_admin'::user_role));
```

### `ml_applications`
Configurações da aplicação ML por tenant

```sql
CREATE TABLE public.ml_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  app_id TEXT NOT NULL, -- Client ID da aplicação ML
  client_secret TEXT NOT NULL, -- Encrypted
  redirect_url TEXT NOT NULL DEFAULT 'https://peepers-hub.lovable.app/api/ml/callback',
  webhook_url TEXT DEFAULT 'https://peepers-hub.lovable.app/api/webhooks/mercadolivre',
  webhook_secret TEXT, -- Para validação de webhooks
  site_id TEXT NOT NULL DEFAULT 'MLB', -- MLB = Brasil
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT ml_applications_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES profiles(tenant_id),
  CONSTRAINT ml_applications_unique_tenant 
    UNIQUE (tenant_id)
);

-- RLS Policy
ALTER TABLE public.ml_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own tenant ml applications" 
ON public.ml_applications 
FOR ALL 
USING ((tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid())) 
       OR (get_current_user_role() = 'super_admin'::user_role));
```

## 📦 Tabelas de Produtos

### `ml_product_mapping`
Mapeamento entre produtos locais e itens do ML

```sql
CREATE TABLE public.ml_product_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  local_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ml_item_id TEXT NOT NULL, -- ID do item no ML
  ml_permalink TEXT, -- URL permanente do anúncio
  ml_category_id TEXT, -- Categoria no ML
  listing_type_id TEXT DEFAULT 'gold_special', -- Tipo de anúncio
  sync_status TEXT NOT NULL DEFAULT 'pending', -- pending, synced, error, conflicted
  sync_direction TEXT NOT NULL DEFAULT 'to_ml', -- to_ml, from_ml, bidirectional
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_sync_data JSONB, -- Últimos dados sincronizados
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT ml_product_mapping_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES profiles(tenant_id),
  CONSTRAINT ml_product_mapping_unique_product 
    UNIQUE (tenant_id, local_product_id),
  CONSTRAINT ml_product_mapping_unique_ml_item 
    UNIQUE (tenant_id, ml_item_id),
  CONSTRAINT ml_product_mapping_sync_status_check 
    CHECK (sync_status IN ('pending', 'synced', 'error', 'conflicted')),
  CONSTRAINT ml_product_mapping_sync_direction_check 
    CHECK (sync_direction IN ('to_ml', 'from_ml', 'bidirectional'))
);

-- Indexes para performance
CREATE INDEX idx_ml_product_mapping_tenant_id ON public.ml_product_mapping(tenant_id);
CREATE INDEX idx_ml_product_mapping_local_product_id ON public.ml_product_mapping(local_product_id);
CREATE INDEX idx_ml_product_mapping_ml_item_id ON public.ml_product_mapping(ml_item_id);
CREATE INDEX idx_ml_product_mapping_sync_status ON public.ml_product_mapping(sync_status);
CREATE INDEX idx_ml_product_mapping_last_sync_at ON public.ml_product_mapping(last_sync_at);

-- RLS Policy
ALTER TABLE public.ml_product_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own tenant ml product mapping" 
ON public.ml_product_mapping 
FOR ALL 
USING ((tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid())) 
       OR (get_current_user_role() = 'super_admin'::user_role));
```

### `ml_category_mapping`
Mapeamento entre categorias locais e categorias ML

```sql
CREATE TABLE public.ml_category_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  local_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  ml_category_id TEXT NOT NULL,
  ml_category_name TEXT NOT NULL,
  ml_category_path TEXT[], -- Path completo da categoria
  required_attributes JSONB DEFAULT '[]'::jsonb, -- Atributos obrigatórios
  optional_attributes JSONB DEFAULT '[]'::jsonb, -- Atributos opcionais
  is_leaf BOOLEAN NOT NULL DEFAULT true, -- Se é categoria folha
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT ml_category_mapping_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES profiles(tenant_id),
  CONSTRAINT ml_category_mapping_unique_local 
    UNIQUE (tenant_id, local_category_id),
  CONSTRAINT ml_category_mapping_unique_ml 
    UNIQUE (tenant_id, ml_category_id)
);

-- RLS Policy
ALTER TABLE public.ml_category_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own tenant ml category mapping" 
ON public.ml_category_mapping 
FOR ALL 
USING ((tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid())) 
       OR (get_current_user_role() = 'super_admin'::user_role));
```

## 📈 Tabelas de Vendas

### `ml_orders`
Pedidos importados do Mercado Livre

```sql
CREATE TABLE public.ml_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  ml_order_id TEXT NOT NULL, -- ID do pedido no ML
  local_sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  status TEXT NOT NULL, -- confirmed, payment_required, payment_in_process, paid, shipped, delivered, cancelled
  status_detail TEXT,
  date_created TIMESTAMP WITH TIME ZONE NOT NULL,
  date_closed TIMESTAMP WITH TIME ZONE,
  order_items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de itens do pedido
  total_amount NUMERIC(10,2) NOT NULL,
  currency_id TEXT NOT NULL DEFAULT 'BRL',
  buyer_info JSONB NOT NULL DEFAULT '{}'::jsonb, -- Informações do comprador
  shipping_info JSONB DEFAULT '{}'::jsonb, -- Informações de envio
  payment_info JSONB DEFAULT '{}'::jsonb, -- Informações de pagamento
  feedback_sale JSONB DEFAULT '{}'::jsonb, -- Feedback do vendedor
  feedback_purchase JSONB DEFAULT '{}'::jsonb, -- Feedback do comprador
  raw_data JSONB NOT NULL, -- Dados completos do webhook/API
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT ml_orders_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES profiles(tenant_id),
  CONSTRAINT ml_orders_unique_ml_order 
    UNIQUE (tenant_id, ml_order_id),
  CONSTRAINT ml_orders_status_check 
    CHECK (status IN ('confirmed', 'payment_required', 'payment_in_process', 
                      'paid', 'shipped', 'delivered', 'cancelled'))
);

-- Indexes para performance
CREATE INDEX idx_ml_orders_tenant_id ON public.ml_orders(tenant_id);
CREATE INDEX idx_ml_orders_ml_order_id ON public.ml_orders(ml_order_id);
CREATE INDEX idx_ml_orders_status ON public.ml_orders(status);
CREATE INDEX idx_ml_orders_date_created ON public.ml_orders(date_created);
CREATE INDEX idx_ml_orders_processed_at ON public.ml_orders(processed_at);

-- RLS Policy
ALTER TABLE public.ml_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own tenant ml orders" 
ON public.ml_orders 
FOR ALL 
USING ((tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid())) 
       OR (get_current_user_role() = 'super_admin'::user_role));
```

## 📋 Tabelas de Logs e Monitoramento

### `ml_sync_log`
Log detalhado de operações de sincronização

```sql
CREATE TABLE public.ml_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  operation_type TEXT NOT NULL, -- create, update, delete, sync_batch, webhook
  entity_type TEXT NOT NULL, -- product, order, category, token
  entity_id TEXT NOT NULL, -- ID da entidade (local ou ML)
  ml_item_id TEXT, -- ID do item no ML (quando aplicável)
  status TEXT NOT NULL, -- success, error, partial, retry
  http_status INTEGER, -- Status HTTP da requisição ML
  error_code TEXT, -- Código de erro específico
  error_message TEXT, -- Mensagem de erro
  request_data JSONB, -- Dados enviados para ML
  response_data JSONB, -- Resposta completa do ML
  execution_time_ms INTEGER, -- Tempo de execução em ms
  retry_attempt INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT ml_sync_log_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES profiles(tenant_id),
  CONSTRAINT ml_sync_log_operation_type_check 
    CHECK (operation_type IN ('create', 'update', 'delete', 'sync_batch', 'webhook', 'auth')),
  CONSTRAINT ml_sync_log_entity_type_check 
    CHECK (entity_type IN ('product', 'order', 'category', 'token', 'webhook')),
  CONSTRAINT ml_sync_log_status_check 
    CHECK (status IN ('success', 'error', 'partial', 'retry', 'pending'))
);

-- Indexes para performance e queries de log
CREATE INDEX idx_ml_sync_log_tenant_id ON public.ml_sync_log(tenant_id);
CREATE INDEX idx_ml_sync_log_created_at ON public.ml_sync_log(created_at);
CREATE INDEX idx_ml_sync_log_status ON public.ml_sync_log(status);
CREATE INDEX idx_ml_sync_log_operation_type ON public.ml_sync_log(operation_type);
CREATE INDEX idx_ml_sync_log_entity_type ON public.ml_sync_log(entity_type);
CREATE INDEX idx_ml_sync_log_entity_id ON public.ml_sync_log(entity_id);

-- RLS Policy
ALTER TABLE public.ml_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own tenant ml sync log" 
ON public.ml_sync_log 
FOR ALL 
USING ((tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid())) 
       OR (get_current_user_role() = 'super_admin'::user_role));
```

### `ml_webhook_events`
Log de eventos de webhook recebidos

```sql
CREATE TABLE public.ml_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  webhook_id TEXT, -- ID único do webhook (se fornecido pelo ML)
  topic TEXT NOT NULL, -- orders_v2, items, payments, etc.
  resource TEXT NOT NULL, -- URL do recurso que mudou
  application_id TEXT NOT NULL, -- ID da aplicação ML
  attempts INTEGER NOT NULL DEFAULT 1,
  sent TIMESTAMP WITH TIME ZONE NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, success, error
  error_message TEXT,
  raw_payload JSONB NOT NULL, -- Payload completo do webhook
  processed_data JSONB, -- Dados processados/normalizados
  
  -- Constraints
  CONSTRAINT ml_webhook_events_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES profiles(tenant_id),
  CONSTRAINT ml_webhook_events_processing_status_check 
    CHECK (processing_status IN ('pending', 'processing', 'success', 'error', 'duplicate'))
);

-- Indexes para performance
CREATE INDEX idx_ml_webhook_events_tenant_id ON public.ml_webhook_events(tenant_id);
CREATE INDEX idx_ml_webhook_events_topic ON public.ml_webhook_events(topic);
CREATE INDEX idx_ml_webhook_events_resource ON public.ml_webhook_events(resource);
CREATE INDEX idx_ml_webhook_events_received_at ON public.ml_webhook_events(received_at);
CREATE INDEX idx_ml_webhook_events_processing_status ON public.ml_webhook_events(processing_status);

-- RLS Policy
ALTER TABLE public.ml_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own tenant ml webhook events" 
ON public.ml_webhook_events 
FOR ALL 
USING ((tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid())) 
       OR (get_current_user_role() = 'super_admin'::user_role));
```

## ⚙️ Tabelas de Configuração

### `ml_sync_settings`
Configurações de sincronização por tenant

```sql
CREATE TABLE public.ml_sync_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  auto_sync_enabled BOOLEAN NOT NULL DEFAULT true,
  sync_frequency_minutes INTEGER NOT NULL DEFAULT 30,
  sync_on_product_change BOOLEAN NOT NULL DEFAULT true,
  sync_on_price_change BOOLEAN NOT NULL DEFAULT true,
  sync_on_stock_change BOOLEAN NOT NULL DEFAULT true,
  batch_size INTEGER NOT NULL DEFAULT 10,
  max_retries INTEGER NOT NULL DEFAULT 3,
  retry_delay_seconds INTEGER NOT NULL DEFAULT 60,
  price_margin_percentage NUMERIC(5,2) DEFAULT 0, -- Margem automática de preço
  default_listing_type TEXT DEFAULT 'gold_special',
  default_condition TEXT DEFAULT 'new',
  default_shipping_mode TEXT DEFAULT 'me2',
  excluded_categories UUID[] DEFAULT '{}', -- Categorias excluídas da sync
  custom_attributes JSONB DEFAULT '{}'::jsonb, -- Atributos customizados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT ml_sync_settings_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES profiles(tenant_id),
  CONSTRAINT ml_sync_settings_unique_tenant 
    UNIQUE (tenant_id),
  CONSTRAINT ml_sync_settings_sync_frequency_check 
    CHECK (sync_frequency_minutes >= 5),
  CONSTRAINT ml_sync_settings_batch_size_check 
    CHECK (batch_size >= 1 AND batch_size <= 100),
  CONSTRAINT ml_sync_settings_max_retries_check 
    CHECK (max_retries >= 0 AND max_retries <= 10)
);

-- RLS Policy
ALTER TABLE public.ml_sync_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own tenant ml sync settings" 
ON public.ml_sync_settings 
FOR ALL 
USING ((tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid())) 
       OR (get_current_user_role() = 'super_admin'::user_role));
```

## 🔧 Funções e Triggers

### Função para atualizar `updated_at`

```sql
-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_ml_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers nas tabelas relevantes
CREATE TRIGGER update_ml_auth_tokens_updated_at
    BEFORE UPDATE ON public.ml_auth_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_ml_updated_at_column();

CREATE TRIGGER update_ml_applications_updated_at
    BEFORE UPDATE ON public.ml_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_ml_updated_at_column();

CREATE TRIGGER update_ml_product_mapping_updated_at
    BEFORE UPDATE ON public.ml_product_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_ml_updated_at_column();

CREATE TRIGGER update_ml_category_mapping_updated_at
    BEFORE UPDATE ON public.ml_category_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_ml_updated_at_column();

CREATE TRIGGER update_ml_orders_updated_at
    BEFORE UPDATE ON public.ml_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_ml_updated_at_column();

CREATE TRIGGER update_ml_sync_settings_updated_at
    BEFORE UPDATE ON public.ml_sync_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_ml_updated_at_column();
```

### Função para inserir configurações padrão

```sql
-- Função para criar configurações padrão quando um usuário se conecta ao ML
CREATE OR REPLACE FUNCTION create_default_ml_settings(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.ml_sync_settings (tenant_id)
    VALUES (p_tenant_id)
    ON CONFLICT (tenant_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📊 Views Úteis

### View para status geral da integração

```sql
CREATE VIEW ml_integration_status AS
SELECT 
    p.tenant_id,
    p.id as user_id,
    p.full_name,
    p.email,
    -- Status da conexão
    CASE 
        WHEN mat.id IS NOT NULL AND mat.expires_at > now() THEN 'connected'
        WHEN mat.id IS NOT NULL AND mat.expires_at <= now() THEN 'expired'
        ELSE 'disconnected'
    END as connection_status,
    mat.expires_at as token_expires_at,
    mat.ml_user_id,
    -- Estatísticas de produtos
    COALESCE(product_stats.total_products, 0) as total_products,
    COALESCE(product_stats.synced_products, 0) as synced_products,
    COALESCE(product_stats.pending_products, 0) as pending_products,
    COALESCE(product_stats.error_products, 0) as error_products,
    -- Estatísticas de vendas
    COALESCE(order_stats.total_orders, 0) as total_ml_orders,
    COALESCE(order_stats.total_revenue, 0) as total_ml_revenue,
    -- Última atividade
    GREATEST(
        mat.updated_at,
        product_stats.last_sync,
        order_stats.last_order
    ) as last_activity
FROM profiles p
LEFT JOIN ml_auth_tokens mat ON mat.tenant_id = p.tenant_id
LEFT JOIN (
    SELECT 
        tenant_id,
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE sync_status = 'synced') as synced_products,
        COUNT(*) FILTER (WHERE sync_status = 'pending') as pending_products,
        COUNT(*) FILTER (WHERE sync_status = 'error') as error_products,
        MAX(last_sync_at) as last_sync
    FROM ml_product_mapping
    GROUP BY tenant_id
) product_stats ON product_stats.tenant_id = p.tenant_id
LEFT JOIN (
    SELECT 
        tenant_id,
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        MAX(date_created) as last_order
    FROM ml_orders
    GROUP BY tenant_id
) order_stats ON order_stats.tenant_id = p.tenant_id;
```

## 🔒 Políticas de Segurança

### Encryption de dados sensíveis
```sql
-- Função para encrypt/decrypt client_secret
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Trigger para encriptar client_secret antes de inserir
CREATE OR REPLACE FUNCTION encrypt_ml_client_secret()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.client_secret IS NOT NULL AND NEW.client_secret != OLD.client_secret THEN
        NEW.client_secret = pgp_sym_encrypt(NEW.client_secret, current_setting('app.encryption_key'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER encrypt_ml_applications_client_secret
    BEFORE INSERT OR UPDATE ON public.ml_applications
    FOR EACH ROW
    EXECUTE FUNCTION encrypt_ml_client_secret();
```

## 📈 Índices de Performance

```sql
-- Índices compostos para queries comuns
CREATE INDEX idx_ml_product_mapping_tenant_status 
ON public.ml_product_mapping(tenant_id, sync_status);

CREATE INDEX idx_ml_orders_tenant_status_date 
ON public.ml_orders(tenant_id, status, date_created);

CREATE INDEX idx_ml_sync_log_tenant_entity_date 
ON public.ml_sync_log(tenant_id, entity_type, created_at);

-- Índices para busca de texto em logs
CREATE INDEX idx_ml_sync_log_error_message_gin 
ON public.ml_sync_log USING gin(to_tsvector('portuguese', error_message));
```

## 🗑️ Política de Retenção

```sql
-- Função para limpeza automática de logs antigos
CREATE OR REPLACE FUNCTION cleanup_old_ml_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Manter logs por 90 dias
    DELETE FROM public.ml_sync_log 
    WHERE created_at < now() - interval '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Manter webhook events por 30 dias
    DELETE FROM public.ml_webhook_events 
    WHERE received_at < now() - interval '30 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```