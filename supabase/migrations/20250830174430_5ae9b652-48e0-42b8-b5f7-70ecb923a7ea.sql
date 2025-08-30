-- Adicionar cron job para monitoramento de segurança
SELECT cron.schedule(
  'ml-security-monitor-daily',
  '0 6 * * *', -- Às 6h da manhã todo dia
  $$
  SELECT
    net.http_post(
        url:='https://ngkhzbzynkhgezkqykeb.supabase.co/functions/v1/ml-security-monitor',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5na2h6Ynp5bmtoZ2V6a3F5a2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMDM3ODgsImV4cCI6MjA2OTU3OTc4OH0.EMk6edTPpwvcy_6VVDxARgoRsJrY9EiijbfR4dFDQAQ"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Criar tabela para configurações avançadas do sistema ML
CREATE TABLE IF NOT EXISTS public.ml_advanced_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  feature_flags jsonb DEFAULT '{}'::jsonb,
  rate_limits jsonb DEFAULT '{
    "sync_product": 60,
    "sync_order": 100,
    "token_refresh": 5,
    "default": 30
  }'::jsonb,
  backup_schedule text DEFAULT 'daily',
  auto_recovery_enabled boolean DEFAULT true,
  advanced_monitoring boolean DEFAULT false,
  multi_account_enabled boolean DEFAULT false,
  security_level text DEFAULT 'standard',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS para ml_advanced_settings
ALTER TABLE public.ml_advanced_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own tenant ML advanced settings"
ON public.ml_advanced_settings
FOR ALL
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) 
  OR get_current_user_role() = 'super_admin'::user_role
);

-- Trigger para updated_at
CREATE TRIGGER update_ml_advanced_settings_updated_at
  BEFORE UPDATE ON public.ml_advanced_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ml_updated_at_column();

-- Criar configurações padrão para tenants existentes
INSERT INTO public.ml_advanced_settings (tenant_id)
SELECT DISTINCT tenant_id 
FROM public.ml_auth_tokens 
WHERE tenant_id IS NOT NULL
ON CONFLICT (tenant_id) DO NOTHING;

-- Função para obter configurações avançadas
CREATE OR REPLACE FUNCTION public.get_ml_advanced_settings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_settings jsonb;
BEGIN
  -- Obter tenant_id do usuário atual
  SELECT profiles.tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE profiles.id = auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant não encontrado';
  END IF;
  
  -- Buscar ou criar configurações
  SELECT to_jsonb(mas.*) INTO v_settings
  FROM public.ml_advanced_settings mas
  WHERE mas.tenant_id = v_tenant_id;
  
  -- Se não existir, criar configuração padrão
  IF v_settings IS NULL THEN
    INSERT INTO public.ml_advanced_settings (tenant_id)
    VALUES (v_tenant_id)
    RETURNING to_jsonb(ml_advanced_settings.*) INTO v_settings;
  END IF;
  
  RETURN v_settings;
END;
$$;

-- Função para atualizar configurações avançadas
CREATE OR REPLACE FUNCTION public.update_ml_advanced_settings(p_settings jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_updated_settings jsonb;
BEGIN
  -- Obter tenant_id do usuário atual
  SELECT profiles.tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE profiles.id = auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant não encontrado';
  END IF;
  
  -- Atualizar configurações
  UPDATE public.ml_advanced_settings
  SET 
    feature_flags = COALESCE(p_settings->>'feature_flags', feature_flags),
    rate_limits = COALESCE(p_settings->>'rate_limits', rate_limits),
    backup_schedule = COALESCE(p_settings->>'backup_schedule', backup_schedule),
    auto_recovery_enabled = COALESCE((p_settings->>'auto_recovery_enabled')::boolean, auto_recovery_enabled),
    advanced_monitoring = COALESCE((p_settings->>'advanced_monitoring')::boolean, advanced_monitoring),
    multi_account_enabled = COALESCE((p_settings->>'multi_account_enabled')::boolean, multi_account_enabled),
    security_level = COALESCE(p_settings->>'security_level', security_level),
    updated_at = now()
  WHERE tenant_id = v_tenant_id
  RETURNING to_jsonb(ml_advanced_settings.*) INTO v_updated_settings;
  
  -- Log da atualização
  INSERT INTO public.ml_sync_log (
    tenant_id,
    operation_type,
    entity_type,
    status,
    response_data
  ) VALUES (
    v_tenant_id,
    'settings_update',
    'configuration',
    'success',
    v_updated_settings
  );
  
  RETURN v_updated_settings;
END;
$$;