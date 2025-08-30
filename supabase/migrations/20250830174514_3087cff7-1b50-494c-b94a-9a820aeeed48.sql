-- Corrigir migração anterior - adicionar constraint único antes do ON CONFLICT
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
  tenant_id uuid NOT NULL UNIQUE, -- Adicionar UNIQUE constraint
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

-- Criar configurações padrão para tenants existentes com INSERT seguro
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN 
    SELECT DISTINCT tenant_id 
    FROM public.ml_auth_tokens 
    WHERE tenant_id IS NOT NULL
  LOOP
    INSERT INTO public.ml_advanced_settings (tenant_id)
    VALUES (tenant_record.tenant_id)
    ON CONFLICT (tenant_id) DO NOTHING;
  END LOOP;
END $$;