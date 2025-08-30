-- Criar agendamento automático para renovação de tokens ML
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Configurar cron job para executar a cada hora
SELECT cron.schedule(
  'ml-token-renewal-hourly',
  '0 * * * *', -- A cada hora
  $$
  SELECT
    net.http_post(
        url:='https://ngkhzbzynkhgezkqykeb.supabase.co/functions/v1/ml-token-renewal',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5na2h6Ynp5bmtoZ2V6a3F5a2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMDM3ODgsImV4cCI6MjA2OTU3OTc4OH0.EMk6edTPpwvcy_6VVDxARgoRsJrY9EiijbfR4dFDQAQ"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Criar função para limpeza de logs antigos (executar diariamente)
SELECT cron.schedule(
  'ml-cleanup-logs-daily',
  '0 2 * * *', -- Às 2h da manhã todo dia
  $$
  SELECT cleanup_old_ml_logs();
  $$
);

-- Criar índices para performance das consultas de token renewal
CREATE INDEX IF NOT EXISTS idx_ml_auth_tokens_expires_at ON public.ml_auth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_ml_auth_tokens_tenant_expires ON public.ml_auth_tokens(tenant_id, expires_at);

-- Criar view para monitoramento de saúde da integração
CREATE OR REPLACE VIEW public.ml_integration_health AS
SELECT 
  mat.tenant_id,
  mat.ml_nickname,
  mat.user_id_ml,
  mat.expires_at,
  mat.created_at as connected_at,
  CASE 
    WHEN mat.expires_at > now() + INTERVAL '24 hours' THEN 'healthy'
    WHEN mat.expires_at > now() + INTERVAL '6 hours' THEN 'good'
    WHEN mat.expires_at > now() + INTERVAL '2 hours' THEN 'warning'
    WHEN mat.expires_at > now() THEN 'critical'
    ELSE 'expired'
  END as health_status,
  EXTRACT(EPOCH FROM (mat.expires_at - now())) / 3600 as hours_until_expiry,
  (
    SELECT COUNT(*)
    FROM public.ml_sync_log msl
    WHERE msl.tenant_id = mat.tenant_id
    AND msl.operation_type = 'token_refresh'
    AND msl.status = 'success'
    AND msl.created_at > now() - INTERVAL '24 hours'
  ) as successful_renewals_24h,
  (
    SELECT COUNT(*)
    FROM public.ml_sync_log msl
    WHERE msl.tenant_id = mat.tenant_id
    AND msl.operation_type = 'token_refresh'
    AND msl.status = 'error'
    AND msl.created_at > now() - INTERVAL '24 hours'
  ) as failed_renewals_24h
FROM public.ml_auth_tokens mat
WHERE mat.tenant_id IS NOT NULL;