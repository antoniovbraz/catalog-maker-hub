-- ============================================================
-- MERCADO LIVRE INTEGRATION - DATABASE SCHEMA
-- ============================================================

-- Criar enum para status de sincronização
CREATE TYPE ml_sync_status AS ENUM (
  'not_synced',
  'syncing', 
  'synced',
  'error',
  'conflict'
);

-- Criar enum para direção de sincronização
CREATE TYPE ml_sync_direction AS ENUM (
  'to_ml',      -- Enviar para ML
  'from_ml',    -- Importar do ML
  'bidirectional' -- Sincronização bidirecional
);

-- ============================================================
-- 1. TABELA DE TOKENS DE AUTENTICAÇÃO
-- ============================================================
CREATE TABLE public.ml_auth_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT,
  user_id_ml BIGINT, -- ID do usuário no Mercado Livre
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================
-- 2. CONFIGURAÇÕES DE APLICAÇÃO ML
-- ============================================================
CREATE TABLE public.ml_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  app_id BIGINT NOT NULL,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL, -- Criptografado via pgcrypto
  redirect_uri TEXT NOT NULL,
  webhook_url TEXT,
  country_id TEXT DEFAULT 'MLB', -- Brasil por padrão
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Garantir uma aplicação ativa por tenant
  UNIQUE(tenant_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================
-- 3. MAPEAMENTO DE PRODUTOS
-- ============================================================
CREATE TABLE public.ml_product_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ml_item_id TEXT, -- ID do item no Mercado Livre (pode ser NULL se ainda não sincronizado)
  sync_status ml_sync_status DEFAULT 'not_synced',
  sync_direction ml_sync_direction DEFAULT 'to_ml',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  ml_permalink TEXT,
  ml_title TEXT,
  ml_price NUMERIC(10,2),
  ml_currency_id TEXT DEFAULT 'BRL',
  ml_listing_type TEXT DEFAULT 'gold_special', -- free, bronze, silver, gold_pro, gold_premium, gold_special
  ml_condition TEXT DEFAULT 'new', -- new, used
  ml_category_id TEXT,
  attributes JSONB DEFAULT '{}', -- Atributos específicos da categoria ML
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Garantir um mapeamento por produto por tenant
  UNIQUE(tenant_id, product_id)
);

-- ============================================================
-- 4. MAPEAMENTO DE CATEGORIAS
-- ============================================================
CREATE TABLE public.ml_category_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  ml_category_id TEXT NOT NULL,
  ml_category_name TEXT NOT NULL,
  attributes_template JSONB DEFAULT '{}', -- Template de atributos para a categoria
  is_default BOOLEAN DEFAULT false, -- Categoria padrão para produtos sem categoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Garantir uma categoria padrão por tenant
  UNIQUE(tenant_id, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================
-- 5. VENDAS IMPORTADAS DO ML
-- ============================================================
CREATE TABLE public.ml_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  ml_order_id BIGINT NOT NULL,
  ml_item_id TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  buyer_id BIGINT,
  buyer_nickname TEXT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  currency_id TEXT DEFAULT 'BRL',
  order_status TEXT, -- confirmed, payment_required, payment_in_process, paid, shipped, delivered, cancelled
  payment_status TEXT, -- pending, in_process, approved, rejected, cancelled, refunded, charged_back
  shipping_status TEXT, -- pending, handling, ready_to_ship, shipped, delivered
  date_created TIMESTAMP WITH TIME ZONE,
  date_closed TIMESTAMP WITH TIME ZONE,
  date_last_updated TIMESTAMP WITH TIME ZONE,
  fees JSONB DEFAULT '{}', -- Taxas do ML (comissão, taxa de pagamento, etc.)
  shipping_info JSONB DEFAULT '{}', -- Informações de envio
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Garantir unicidade por order+item do ML
  UNIQUE(tenant_id, ml_order_id, ml_item_id)
);

-- ============================================================
-- 6. LOGS DE SINCRONIZAÇÃO
-- ============================================================
CREATE TABLE public.ml_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  operation_type TEXT NOT NULL, -- 'sync_product', 'sync_order', 'webhook_received', etc.
  entity_type TEXT NOT NULL, -- 'product', 'order', 'category', etc.
  entity_id UUID, -- ID da entidade local (product_id, order_id, etc.)
  ml_entity_id TEXT, -- ID da entidade no ML
  status TEXT NOT NULL, -- 'success', 'error', 'warning'
  request_data JSONB, -- Dados da requisição
  response_data JSONB, -- Resposta da API do ML
  error_details JSONB, -- Detalhes do erro, se houver
  execution_time_ms INTEGER, -- Tempo de execução em ms
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================
-- 7. EVENTOS DE WEBHOOK
-- ============================================================
CREATE TABLE public.ml_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  topic TEXT NOT NULL, -- orders, items, questions, etc.
  resource TEXT NOT NULL, -- URL do recurso afetado
  user_id_ml BIGINT NOT NULL, -- ID do usuário ML que gerou o evento
  application_id BIGINT NOT NULL, -- ID da aplicação ML
  attempts INTEGER DEFAULT 0, -- Tentativas de processamento
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  raw_payload JSONB NOT NULL, -- Payload completo do webhook
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================
-- 8. CONFIGURAÇÕES DE SINCRONIZAÇÃO
-- ============================================================
CREATE TABLE public.ml_sync_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL UNIQUE,
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_interval_hours INTEGER DEFAULT 24, -- Intervalo de sincronização automática
  auto_import_orders BOOLEAN DEFAULT true,
  auto_update_stock BOOLEAN DEFAULT true,
  auto_update_prices BOOLEAN DEFAULT false,
  default_listing_type TEXT DEFAULT 'gold_special',
  default_condition TEXT DEFAULT 'new',
  price_markup_percent NUMERIC(5,2) DEFAULT 0, -- Markup automático no preço
  settings JSONB DEFAULT '{}', -- Configurações adicionais flexíveis
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================
-- INDEXES PARA PERFORMANCE
-- ============================================================

-- Índices para consultas frequentes
CREATE INDEX idx_ml_auth_tokens_tenant_id ON public.ml_auth_tokens(tenant_id);
CREATE INDEX idx_ml_auth_tokens_expires_at ON public.ml_auth_tokens(expires_at);

CREATE INDEX idx_ml_product_mapping_tenant_product ON public.ml_product_mapping(tenant_id, product_id);
CREATE INDEX idx_ml_product_mapping_ml_item_id ON public.ml_product_mapping(ml_item_id);
CREATE INDEX idx_ml_product_mapping_sync_status ON public.ml_product_mapping(sync_status);

CREATE INDEX idx_ml_orders_tenant_id ON public.ml_orders(tenant_id);
CREATE INDEX idx_ml_orders_ml_order_id ON public.ml_orders(ml_order_id);
CREATE INDEX idx_ml_orders_product_id ON public.ml_orders(product_id);
CREATE INDEX idx_ml_orders_date_created ON public.ml_orders(date_created);

CREATE INDEX idx_ml_sync_log_tenant_id ON public.ml_sync_log(tenant_id);
CREATE INDEX idx_ml_sync_log_operation_type ON public.ml_sync_log(operation_type);
CREATE INDEX idx_ml_sync_log_created_at ON public.ml_sync_log(created_at);

CREATE INDEX idx_ml_webhook_events_tenant_id ON public.ml_webhook_events(tenant_id);
CREATE INDEX idx_ml_webhook_events_processed_at ON public.ml_webhook_events(processed_at);
CREATE INDEX idx_ml_webhook_events_topic ON public.ml_webhook_events(topic);

-- ============================================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_ml_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para tabelas com updated_at
CREATE TRIGGER update_ml_auth_tokens_updated_at
    BEFORE UPDATE ON public.ml_auth_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ml_updated_at_column();

CREATE TRIGGER update_ml_applications_updated_at
    BEFORE UPDATE ON public.ml_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ml_updated_at_column();

CREATE TRIGGER update_ml_product_mapping_updated_at
    BEFORE UPDATE ON public.ml_product_mapping
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ml_updated_at_column();

CREATE TRIGGER update_ml_category_mapping_updated_at
    BEFORE UPDATE ON public.ml_category_mapping
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ml_updated_at_column();

CREATE TRIGGER update_ml_orders_updated_at
    BEFORE UPDATE ON public.ml_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ml_updated_at_column();

CREATE TRIGGER update_ml_sync_settings_updated_at
    BEFORE UPDATE ON public.ml_sync_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ml_updated_at_column();

-- ============================================================
-- FUNÇÕES DE CONVENIÊNCIA
-- ============================================================

-- Função para criar configurações padrão de sincronização
CREATE OR REPLACE FUNCTION public.create_default_ml_settings(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.ml_sync_settings (tenant_id)
    VALUES (p_tenant_id)
    ON CONFLICT (tenant_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VIEW PARA STATUS DA INTEGRAÇÃO
-- ============================================================
CREATE VIEW public.ml_integration_status AS
SELECT 
    p.tenant_id,
    -- Status da conexão
    CASE 
        WHEN mat.id IS NOT NULL AND mat.expires_at > now() THEN 'connected'
        WHEN mat.id IS NOT NULL AND mat.expires_at <= now() THEN 'expired'
        ELSE 'disconnected'
    END as connection_status,
    
    -- Estatísticas de produtos
    COALESCE(product_stats.total_products, 0) as total_products,
    COALESCE(product_stats.synced_products, 0) as synced_products,
    COALESCE(product_stats.pending_products, 0) as pending_products,
    COALESCE(product_stats.error_products, 0) as error_products,
    
    -- Estatísticas de vendas
    COALESCE(order_stats.total_orders, 0) as total_orders,
    COALESCE(order_stats.orders_this_month, 0) as orders_this_month,
    COALESCE(order_stats.revenue_this_month, 0) as revenue_this_month,
    
    -- Última sincronização
    product_stats.last_sync as last_product_sync,
    order_stats.last_order as last_order_import

FROM (SELECT DISTINCT tenant_id FROM public.profiles) p
LEFT JOIN public.ml_auth_tokens mat ON mat.tenant_id = p.tenant_id
LEFT JOIN (
    SELECT 
        tenant_id,
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE sync_status = 'synced') as synced_products,
        COUNT(*) FILTER (WHERE sync_status IN ('not_synced', 'syncing')) as pending_products,
        COUNT(*) FILTER (WHERE sync_status = 'error') as error_products,
        MAX(last_sync_at) as last_sync
    FROM public.ml_product_mapping
    GROUP BY tenant_id
) product_stats ON product_stats.tenant_id = p.tenant_id
LEFT JOIN (
    SELECT 
        tenant_id,
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE date_created >= date_trunc('month', now())) as orders_this_month,
        COALESCE(SUM(total_amount) FILTER (WHERE date_created >= date_trunc('month', now())), 0) as revenue_this_month,
        MAX(date_created) as last_order
    FROM public.ml_orders
    GROUP BY tenant_id
) order_stats ON order_stats.tenant_id = p.tenant_id;

-- ============================================================
-- SEGURANÇA E CRIPTOGRAFIA
-- ============================================================

-- Habilitar extensão pgcrypto se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Função para criptografar client_secret
CREATE OR REPLACE FUNCTION public.encrypt_ml_client_secret()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.client_secret IS NOT NULL AND NEW.client_secret != OLD.client_secret THEN
        NEW.client_secret = encode(encrypt(NEW.client_secret::bytea, 'ml_secret_key', 'aes'), 'base64');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criptografar client_secret
CREATE TRIGGER encrypt_ml_client_secret_trigger
    BEFORE INSERT OR UPDATE ON public.ml_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.encrypt_ml_client_secret();

-- ============================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.ml_auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_product_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_category_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_sync_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para ml_auth_tokens
CREATE POLICY "Users can access own tenant ML auth tokens"
ON public.ml_auth_tokens
FOR ALL
USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    OR public.get_current_user_role() = 'super_admin'
);

-- Políticas para ml_applications
CREATE POLICY "Users can access own tenant ML applications"
ON public.ml_applications
FOR ALL
USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    OR public.get_current_user_role() = 'super_admin'
);

-- Políticas para ml_product_mapping
CREATE POLICY "Users can access own tenant ML product mapping"
ON public.ml_product_mapping
FOR ALL
USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    OR public.get_current_user_role() = 'super_admin'
);

-- Políticas para ml_category_mapping
CREATE POLICY "Users can access own tenant ML category mapping"
ON public.ml_category_mapping
FOR ALL
USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    OR public.get_current_user_role() = 'super_admin'
);

-- Políticas para ml_orders
CREATE POLICY "Users can access own tenant ML orders"
ON public.ml_orders
FOR ALL
USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    OR public.get_current_user_role() = 'super_admin'
);

-- Políticas para ml_sync_log
CREATE POLICY "Users can access own tenant ML sync logs"
ON public.ml_sync_log
FOR ALL
USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    OR public.get_current_user_role() = 'super_admin'
);

-- Políticas para ml_webhook_events
CREATE POLICY "Users can access own tenant ML webhook events"
ON public.ml_webhook_events
FOR ALL
USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    OR public.get_current_user_role() = 'super_admin'
);

-- Políticas para ml_sync_settings
CREATE POLICY "Users can access own tenant ML sync settings"
ON public.ml_sync_settings
FOR ALL
USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    OR public.get_current_user_role() = 'super_admin'
);

-- ============================================================
-- POLÍTICA DE RETENÇÃO
-- ============================================================

-- Função para limpeza automática de logs antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_ml_logs()
RETURNS VOID AS $$
BEGIN
    -- Manter apenas 90 dias de logs de sincronização
    DELETE FROM public.ml_sync_log 
    WHERE created_at < now() - INTERVAL '90 days';
    
    -- Manter apenas 30 dias de eventos de webhook processados
    DELETE FROM public.ml_webhook_events 
    WHERE processed_at IS NOT NULL 
    AND created_at < now() - INTERVAL '30 days';
    
    -- Log da limpeza
    RAISE LOG 'ML logs cleanup completed at %', now();
END;
$$ LANGUAGE plpgsql;