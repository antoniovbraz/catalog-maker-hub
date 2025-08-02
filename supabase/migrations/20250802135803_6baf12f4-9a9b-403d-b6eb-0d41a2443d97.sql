-- FASE 3: Sistema de Planos e Assinaturas
-- Criar tabela de planos
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de assinaturas
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Criar tabela de uso/cotas
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  resource_type TEXT NOT NULL, -- 'products', 'marketplaces', 'api_calls', etc
  current_usage INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()),
  period_end TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, tenant_id, resource_type, period_start)
);

-- Habilitar RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para subscription_plans (público para leitura)
CREATE POLICY "Everyone can view subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Super admins can manage subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (public.get_current_user_role() = 'super_admin');

-- Políticas RLS para subscriptions
CREATE POLICY "Users can view own subscription" 
ON public.subscriptions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (public.get_current_user_role() = 'super_admin');

-- Políticas RLS para usage_tracking
CREATE POLICY "Users can view own usage" 
ON public.usage_tracking 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update own usage" 
ON public.usage_tracking 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all usage" 
ON public.usage_tracking 
FOR ALL 
USING (public.get_current_user_role() = 'super_admin');

-- Triggers para updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir planos padrão
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, features, limits) VALUES
('free', 'Gratuito', 'Plano gratuito para testar a plataforma', 0.00, 0.00, 
 '{"price_pilot": true, "basic_analytics": true, "email_support": true}',
 '{"products": 10, "marketplaces": 2, "api_calls_month": 100}'),

('basic', 'Básico', 'Ideal para pequenos negócios', 29.90, 299.00,
 '{"price_pilot": true, "advanced_analytics": true, "email_support": true, "bulk_operations": true}',
 '{"products": 100, "marketplaces": -1, "api_calls_month": 1000}'),

('pro', 'Professional', 'Para negócios em crescimento', 59.90, 599.00,
 '{"price_pilot": true, "advanced_analytics": true, "priority_support": true, "bulk_operations": true, "custom_reports": true, "api_access": true}',
 '{"products": -1, "marketplaces": -1, "api_calls_month": 10000}'),

('enterprise', 'Enterprise', 'Para grandes empresas', 149.90, 1499.00,
 '{"price_pilot": true, "advanced_analytics": true, "priority_support": true, "bulk_operations": true, "custom_reports": true, "api_access": true, "multi_user": true, "custom_integrations": true}',
 '{"products": -1, "marketplaces": -1, "api_calls_month": -1, "users": -1}');

-- Função para verificar limites de uso
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  p_user_id UUID,
  p_resource_type TEXT,
  p_increment INTEGER DEFAULT 1
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_current_usage INTEGER := 0;
  v_limit INTEGER := 0;
  v_tenant_id UUID;
  v_plan_limits JSONB;
BEGIN
  -- Buscar tenant_id do usuário
  SELECT tenant_id INTO v_tenant_id 
  FROM public.profiles 
  WHERE id = p_user_id;
  
  -- Buscar limites do plano atual
  SELECT sp.limits INTO v_plan_limits
  FROM public.subscription_plans sp
  JOIN public.subscriptions s ON s.plan_id = sp.id
  WHERE s.user_id = p_user_id 
  AND s.status = 'active';
  
  -- Se não tem assinatura ativa, usar plano gratuito
  IF v_plan_limits IS NULL THEN
    SELECT limits INTO v_plan_limits
    FROM public.subscription_plans
    WHERE name = 'free';
  END IF;
  
  -- Verificar se o recurso tem limite (-1 = ilimitado)
  v_limit := (v_plan_limits->>p_resource_type)::INTEGER;
  IF v_limit = -1 THEN
    RETURN true;
  END IF;
  
  -- Buscar uso atual
  SELECT COALESCE(current_usage, 0) INTO v_current_usage
  FROM public.usage_tracking
  WHERE user_id = p_user_id 
  AND tenant_id = v_tenant_id
  AND resource_type = p_resource_type
  AND period_start = date_trunc('month', now());
  
  -- Verificar se pode incrementar
  RETURN (v_current_usage + p_increment) <= v_limit;
END;
$$;

-- Função para incrementar uso
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id UUID,
  p_resource_type TEXT,
  p_increment INTEGER DEFAULT 1
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Buscar tenant_id do usuário
  SELECT tenant_id INTO v_tenant_id 
  FROM public.profiles 
  WHERE id = p_user_id;
  
  -- Inserir ou atualizar uso
  INSERT INTO public.usage_tracking (user_id, tenant_id, resource_type, current_usage)
  VALUES (p_user_id, v_tenant_id, p_resource_type, p_increment)
  ON CONFLICT (user_id, tenant_id, resource_type, period_start)
  DO UPDATE SET 
    current_usage = usage_tracking.current_usage + p_increment,
    updated_at = now();
END;
$$;