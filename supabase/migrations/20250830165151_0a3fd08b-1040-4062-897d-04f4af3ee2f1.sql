-- CORREÇÃO CRÍTICA ML AUTH - FASE 2
-- Corrigir constraint única e estrutura das tabelas

-- 1. Corrigir tabela ml_auth_tokens com constraint única adequada
ALTER TABLE public.ml_auth_tokens DROP CONSTRAINT IF EXISTS ml_auth_tokens_tenant_id_key;
ALTER TABLE public.ml_auth_tokens ADD CONSTRAINT ml_auth_tokens_tenant_id_unique UNIQUE (tenant_id);

-- 2. Verificar e garantir que ml_pkce_storage existe e tem índices corretos
CREATE INDEX IF NOT EXISTS idx_ml_pkce_storage_state ON public.ml_pkce_storage (state);
CREATE INDEX IF NOT EXISTS idx_ml_pkce_storage_tenant_expires ON public.ml_pkce_storage (tenant_id, expires_at);

-- 3. Criar função para verificar conexão ML por user_id_ml
CREATE OR REPLACE FUNCTION public.get_tenant_by_ml_user_id(p_user_id_ml bigint)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id uuid;
BEGIN
    SELECT tenant_id INTO v_tenant_id
    FROM public.ml_auth_tokens
    WHERE user_id_ml = p_user_id_ml
    AND expires_at > now()
    LIMIT 1;
    
    RETURN v_tenant_id;
END;
$$;

-- 4. Melhorar log de sync
CREATE INDEX IF NOT EXISTS idx_ml_sync_log_tenant_status ON public.ml_sync_log (tenant_id, status, created_at);

-- 5. Garantir que webhook events tenham índice para performance
CREATE INDEX IF NOT EXISTS idx_ml_webhook_events_user_topic ON public.ml_webhook_events (user_id_ml, topic, created_at);