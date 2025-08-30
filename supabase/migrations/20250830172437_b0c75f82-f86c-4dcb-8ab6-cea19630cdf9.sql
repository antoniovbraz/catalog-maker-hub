-- Corrigir problemas de segurança detectados pelo linter

-- 1. Corrigir view de saúde da integração ML para usar RLS adequado
DROP VIEW IF EXISTS public.ml_integration_health;

-- 2. Criar função segura para obter dados de saúde da integração
CREATE OR REPLACE FUNCTION public.get_ml_integration_health()
RETURNS TABLE(
  tenant_id uuid,
  ml_nickname text,
  user_id_ml bigint,
  expires_at timestamp with time zone,
  connected_at timestamp with time zone,
  health_status text,
  hours_until_expiry numeric,
  successful_renewals_24h bigint,
  failed_renewals_24h bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Obter tenant_id do usuário atual
  SELECT profiles.tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE profiles.id = auth.uid();
  
  -- Verificar se usuário é super_admin ou tem acesso ao tenant
  IF NOT (get_current_user_role() = 'super_admin'::user_role OR v_tenant_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  
  RETURN QUERY
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
  WHERE (get_current_user_role() = 'super_admin'::user_role OR mat.tenant_id = v_tenant_id);
END;
$$;

-- 3. Criar função para métricas de performance da integração ML
CREATE OR REPLACE FUNCTION public.get_ml_performance_metrics(p_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_result jsonb;
BEGIN
  -- Obter tenant_id do usuário atual
  SELECT profiles.tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE profiles.id = auth.uid();
  
  IF v_tenant_id IS NULL AND get_current_user_role() != 'super_admin'::user_role THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  
  SELECT jsonb_build_object(
    'total_operations', COUNT(*),
    'successful_operations', COUNT(*) FILTER (WHERE status = 'success'),
    'failed_operations', COUNT(*) FILTER (WHERE status = 'error'),
    'average_response_time', AVG(execution_time_ms),
    'success_rate', 
      CASE 
        WHEN COUNT(*) > 0 THEN 
          ROUND((COUNT(*) FILTER (WHERE status = 'success')::numeric / COUNT(*)) * 100, 2)
        ELSE 0 
      END,
    'operations_by_type', jsonb_object_agg(
      operation_type, 
      COUNT(*)
    ) FILTER (WHERE operation_type IS NOT NULL)
  )
  INTO v_result
  FROM public.ml_sync_log
  WHERE created_at > now() - (p_days || ' days')::interval
  AND (get_current_user_role() = 'super_admin'::user_role OR tenant_id = v_tenant_id);
  
  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- 4. Criar função para backup de configurações ML
CREATE OR REPLACE FUNCTION public.backup_ml_configuration()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_backup jsonb;
BEGIN
  -- Obter tenant_id do usuário atual
  SELECT profiles.tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE profiles.id = auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant não encontrado';
  END IF;
  
  SELECT jsonb_build_object(
    'backup_timestamp', now(),
    'tenant_id', v_tenant_id,
    'sync_settings', (
      SELECT row_to_json(ms.*)
      FROM public.ml_sync_settings ms
      WHERE ms.tenant_id = v_tenant_id
    ),
    'auth_status', (
      SELECT jsonb_build_object(
        'user_id_ml', mat.user_id_ml,
        'ml_nickname', mat.ml_nickname,
        'scope', mat.scope,
        'created_at', mat.created_at
      )
      FROM public.ml_auth_tokens mat
      WHERE mat.tenant_id = v_tenant_id
      LIMIT 1
    ),
    'total_products_mapped', (
      SELECT COUNT(*)
      FROM public.ml_product_mapping mpm
      WHERE mpm.tenant_id = v_tenant_id
    )
  )
  INTO v_backup;
  
  -- Log do backup
  INSERT INTO public.ml_sync_log (
    tenant_id,
    operation_type,
    entity_type,
    status,
    response_data
  ) VALUES (
    v_tenant_id,
    'backup',
    'configuration',
    'success',
    v_backup
  );
  
  RETURN v_backup;
END;
$$;

-- 5. Criar função para circuit breaker de rate limiting
CREATE OR REPLACE FUNCTION public.check_ml_rate_limit(p_operation_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_recent_ops integer;
  v_rate_limit integer;
BEGIN
  -- Obter tenant_id do usuário atual
  SELECT profiles.tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE profiles.id = auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Definir limites por tipo de operação
  v_rate_limit := CASE p_operation_type
    WHEN 'sync_product' THEN 60 -- 60 sync por hora
    WHEN 'sync_order' THEN 100  -- 100 orders por hora
    WHEN 'token_refresh' THEN 5 -- 5 refresh por hora
    ELSE 30 -- Default 30 ops por hora
  END;
  
  -- Contar operações recentes
  SELECT COUNT(*)
  INTO v_recent_ops
  FROM public.ml_sync_log
  WHERE tenant_id = v_tenant_id
  AND operation_type = p_operation_type
  AND created_at > now() - INTERVAL '1 hour';
  
  -- Log se exceder limite
  IF v_recent_ops >= v_rate_limit THEN
    INSERT INTO public.ml_sync_log (
      tenant_id,
      operation_type,
      entity_type,
      status,
      error_details
    ) VALUES (
      v_tenant_id,
      'rate_limit',
      'system',
      'blocked',
      jsonb_build_object(
        'operation', p_operation_type,
        'current_count', v_recent_ops,
        'limit', v_rate_limit,
        'blocked_at', now()
      )
    );
  END IF;
  
  RETURN v_recent_ops < v_rate_limit;
END;
$$;