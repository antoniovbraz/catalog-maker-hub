-- Fase 1: Corrigir problemas críticos do banco

-- 1. Criar função get_ml_advanced_settings que está faltando (causando erro 404)
CREATE OR REPLACE FUNCTION public.get_ml_advanced_settings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id uuid;
  v_settings jsonb;
BEGIN
  -- Obter tenant_id do usuário atual
  SELECT profiles.tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE profiles.id = auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant não encontrado para o usuário';
  END IF;
  
  -- Buscar configurações avançadas, criar padrão se não existir
  SELECT row_to_json(mas.*)::jsonb INTO v_settings
  FROM public.ml_advanced_settings mas
  WHERE mas.tenant_id = v_tenant_id;
  
  -- Se não existir, criar configuração padrão
  IF v_settings IS NULL THEN
    INSERT INTO public.ml_advanced_settings (
      tenant_id,
      feature_flags,
      rate_limits,
      auto_recovery_enabled,
      advanced_monitoring,
      multi_account_enabled,
      backup_schedule,
      security_level
    ) VALUES (
      v_tenant_id,
      '{"auto_sync": true, "batch_sync": true, "webhook_processing": true}'::jsonb,
      '{"default": 30, "sync_order": 100, "sync_product": 60, "token_refresh": 5}'::jsonb,
      true,
      false,
      false,
      'daily',
      'standard'
    ) RETURNING row_to_json(ml_advanced_settings.*)::jsonb INTO v_settings;
  END IF;
  
  RETURN v_settings;
END;
$function$;

-- 2. Corrigir função get_ml_performance_metrics (causando erro 400)
DROP FUNCTION IF EXISTS public.get_ml_performance_metrics(integer);

CREATE OR REPLACE FUNCTION public.get_ml_performance_metrics(p_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id uuid;
  v_result jsonb;
  v_total_ops bigint;
  v_successful_ops bigint;
  v_failed_ops bigint;
  v_avg_response_time numeric;
  v_operations_by_type jsonb;
BEGIN
  -- Obter tenant_id do usuário atual
  SELECT profiles.tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE profiles.id = auth.uid();
  
  IF v_tenant_id IS NULL AND get_current_user_role() != 'super_admin'::user_role THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  
  -- Calcular métricas separadamente para evitar problemas de agregação
  SELECT COUNT(*) INTO v_total_ops
  FROM public.ml_sync_log
  WHERE created_at > now() - (p_days || ' days')::interval
  AND (get_current_user_role() = 'super_admin'::user_role OR tenant_id = v_tenant_id);
  
  SELECT COUNT(*) INTO v_successful_ops
  FROM public.ml_sync_log
  WHERE created_at > now() - (p_days || ' days')::interval
  AND status = 'success'
  AND (get_current_user_role() = 'super_admin'::user_role OR tenant_id = v_tenant_id);
  
  SELECT COUNT(*) INTO v_failed_ops
  FROM public.ml_sync_log
  WHERE created_at > now() - (p_days || ' days')::interval
  AND status = 'error'
  AND (get_current_user_role() = 'super_admin'::user_role OR tenant_id = v_tenant_id);
  
  SELECT COALESCE(AVG(execution_time_ms), 0) INTO v_avg_response_time
  FROM public.ml_sync_log
  WHERE created_at > now() - (p_days || ' days')::interval
  AND execution_time_ms IS NOT NULL
  AND (get_current_user_role() = 'super_admin'::user_role OR tenant_id = v_tenant_id);
  
  -- Calcular operações por tipo
  SELECT COALESCE(
    jsonb_object_agg(operation_type, operation_count),
    '{}'::jsonb
  ) INTO v_operations_by_type
  FROM (
    SELECT 
      operation_type,
      COUNT(*) as operation_count
    FROM public.ml_sync_log
    WHERE created_at > now() - (p_days || ' days')::interval
    AND operation_type IS NOT NULL
    AND (get_current_user_role() = 'super_admin'::user_role OR tenant_id = v_tenant_id)
    GROUP BY operation_type
  ) subq;
  
  -- Construir resultado final
  v_result := jsonb_build_object(
    'total_operations', v_total_ops,
    'successful_operations', v_successful_ops,
    'failed_operations', v_failed_ops,
    'average_response_time', ROUND(v_avg_response_time, 2),
    'success_rate', 
      CASE 
        WHEN v_total_ops > 0 THEN 
          ROUND((v_successful_ops::numeric / v_total_ops) * 100, 2)
        ELSE 0 
      END,
    'operations_by_type', v_operations_by_type
  );
  
  RETURN v_result;
END;
$function$;

-- 3. Criar função update_ml_advanced_settings que está faltando
CREATE OR REPLACE FUNCTION public.update_ml_advanced_settings(p_settings jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id uuid;
  v_updated_settings jsonb;
BEGIN
  -- Obter tenant_id do usuário atual
  SELECT profiles.tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE profiles.id = auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant não encontrado para o usuário';
  END IF;
  
  -- Atualizar configurações
  UPDATE public.ml_advanced_settings 
  SET
    feature_flags = COALESCE(p_settings->>'feature_flags', feature_flags::text)::jsonb,
    rate_limits = COALESCE(p_settings->>'rate_limits', rate_limits::text)::jsonb,
    auto_recovery_enabled = COALESCE((p_settings->>'auto_recovery_enabled')::boolean, auto_recovery_enabled),
    advanced_monitoring = COALESCE((p_settings->>'advanced_monitoring')::boolean, advanced_monitoring),
    multi_account_enabled = COALESCE((p_settings->>'multi_account_enabled')::boolean, multi_account_enabled),
    backup_schedule = COALESCE(p_settings->>'backup_schedule', backup_schedule),
    security_level = COALESCE(p_settings->>'security_level', security_level),
    updated_at = now()
  WHERE tenant_id = v_tenant_id
  RETURNING row_to_json(ml_advanced_settings.*)::jsonb INTO v_updated_settings;
  
  -- Se não existir, criar
  IF v_updated_settings IS NULL THEN
    INSERT INTO public.ml_advanced_settings (
      tenant_id,
      feature_flags,
      rate_limits,
      auto_recovery_enabled,
      advanced_monitoring,
      multi_account_enabled,
      backup_schedule,
      security_level
    ) VALUES (
      v_tenant_id,
      COALESCE(p_settings->'feature_flags', '{"auto_sync": true, "batch_sync": true, "webhook_processing": true}'::jsonb),
      COALESCE(p_settings->'rate_limits', '{"default": 30, "sync_order": 100, "sync_product": 60, "token_refresh": 5}'::jsonb),
      COALESCE((p_settings->>'auto_recovery_enabled')::boolean, true),
      COALESCE((p_settings->>'advanced_monitoring')::boolean, false),
      COALESCE((p_settings->>'multi_account_enabled')::boolean, false),
      COALESCE(p_settings->>'backup_schedule', 'daily'),
      COALESCE(p_settings->>'security_level', 'standard')
    ) RETURNING row_to_json(ml_advanced_settings.*)::jsonb INTO v_updated_settings;
  END IF;
  
  RETURN v_updated_settings;
END;
$function$;

-- 4. Função para inicialização automática de configurações para novos tenants
CREATE OR REPLACE FUNCTION public.initialize_ml_tenant_settings(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Criar configurações padrão de sync se não existir
  INSERT INTO public.ml_sync_settings (tenant_id)
  VALUES (p_tenant_id)
  ON CONFLICT (tenant_id) DO NOTHING;
  
  -- Criar configurações avançadas padrão se não existir
  INSERT INTO public.ml_advanced_settings (
    tenant_id,
    feature_flags,
    rate_limits,
    auto_recovery_enabled,
    advanced_monitoring,
    multi_account_enabled,
    backup_schedule,
    security_level
  ) VALUES (
    p_tenant_id,
    '{"auto_sync": true, "batch_sync": true, "webhook_processing": true}'::jsonb,
    '{"default": 30, "sync_order": 100, "sync_product": 60, "token_refresh": 5}'::jsonb,
    true,
    false,
    false,
    'daily',
    'standard'
  ) ON CONFLICT (tenant_id) DO NOTHING;
END;
$function$;

-- 5. Melhorar a view ml_integration_status com performance otimizada
DROP VIEW IF EXISTS public.ml_integration_status;

CREATE VIEW public.ml_integration_status AS
SELECT 
  mpm.tenant_id,
  COUNT(DISTINCT mpm.product_id) as total_products,
  COUNT(DISTINCT CASE WHEN mpm.sync_status = 'synced' THEN mpm.product_id END) as synced_products,
  COUNT(DISTINCT CASE WHEN mpm.sync_status = 'pending' THEN mpm.product_id END) as pending_products,
  COUNT(DISTINCT CASE WHEN mpm.sync_status = 'error' THEN mpm.product_id END) as error_products,
  COALESCE(order_stats.total_orders, 0) as total_orders,
  COALESCE(order_stats.orders_this_month, 0) as orders_this_month,
  COALESCE(order_stats.revenue_this_month, 0) as revenue_this_month,
  MAX(mpm.last_sync_at) as last_product_sync,
  COALESCE(order_stats.last_order_import, NULL) as last_order_import,
  CASE 
    WHEN mat.expires_at > now() THEN 'connected'
    WHEN mat.expires_at IS NOT NULL THEN 'expired'
    ELSE 'disconnected'
  END as connection_status
FROM public.ml_product_mapping mpm
LEFT JOIN public.ml_auth_tokens mat ON mat.tenant_id = mpm.tenant_id
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN mo.created_at >= date_trunc('month', now()) THEN 1 END) as orders_this_month,
    SUM(CASE WHEN mo.created_at >= date_trunc('month', now()) THEN mo.total_amount ELSE 0 END) as revenue_this_month,
    MAX(mo.created_at) as last_order_import
  FROM public.ml_orders mo
  WHERE mo.tenant_id = mpm.tenant_id
) order_stats ON true
WHERE mpm.tenant_id IS NOT NULL
GROUP BY mpm.tenant_id, mat.expires_at, order_stats.total_orders, order_stats.orders_this_month, order_stats.revenue_this_month, order_stats.last_order_import;