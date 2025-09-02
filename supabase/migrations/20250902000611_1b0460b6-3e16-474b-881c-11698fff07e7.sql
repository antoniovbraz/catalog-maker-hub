-- FASE 1 - CORREÇÕES DE SEGURANÇA CRÍTICAS (CORRIGIDO)

-- 1. Como public_pricing e ml_integration_status são VIEWS, não precisam de RLS
-- Vou auditar todas as tabelas reais que podem estar expostas

-- 2. Corrigir funções SECURITY DEFINER com search_path mutável
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- 3. Melhorar função handle_new_user para maior segurança
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Validação adicional de segurança
  IF NEW.id IS NULL OR NEW.email IS NULL THEN
    RAISE EXCEPTION 'Invalid user data provided';
  END IF;

  -- Inserir perfil com validação
  INSERT INTO public.profiles (id, email, full_name, role, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN NEW.email = 'peepers.shop@gmail.com' THEN 'super_admin'::public.user_role
      ELSE 'user'::public.user_role
    END,
    gen_random_uuid()
  );

  -- Criar configurações padrão do ML para o novo tenant
  PERFORM create_default_ml_settings(
    (SELECT tenant_id FROM public.profiles WHERE id = NEW.id)
  );

  RETURN NEW;
END;
$function$;

-- 4. Corrigir função get_current_user_role para prevenir loops RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;

-- 5. Adicionar função para auditoria de segurança completa
CREATE OR REPLACE FUNCTION public.audit_table_security()
RETURNS TABLE(
  object_name text,
  object_type text,
  rls_enabled boolean,
  policies_count bigint,
  security_level text,
  recommendation text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH security_audit AS (
    -- Auditar tabelas
    SELECT 
      t.tablename::text as name,
      'TABLE'::text as type,
      t.rowsecurity as rls,
      COUNT(p.policyname) as policies,
      CASE 
        WHEN t.rowsecurity = false THEN 'CRITICAL - No RLS'
        WHEN COUNT(p.policyname) = 0 THEN 'HIGH RISK - RLS enabled but no policies'
        WHEN COUNT(p.policyname) < 2 THEN 'MEDIUM RISK - Limited policies'
        ELSE 'GOOD - Adequate protection'
      END as level,
      CASE 
        WHEN t.rowsecurity = false THEN 'Enable RLS immediately'
        WHEN COUNT(p.policyname) = 0 THEN 'Add RLS policies'
        WHEN COUNT(p.policyname) < 2 THEN 'Review and add more specific policies'
        ELSE 'Monitor regularly'
      END as rec
    FROM pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename
    WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    GROUP BY t.tablename, t.rowsecurity
    
    UNION ALL
    
    -- Auditar views
    SELECT 
      v.table_name::text as name,
      'VIEW'::text as type,
      false as rls,
      0 as policies,
      'INFO - View (inherits base table security)' as level,
      'Review underlying table security' as rec
    FROM information_schema.views v
    WHERE v.table_schema = 'public'
  )
  SELECT * FROM security_audit
  ORDER BY 
    CASE 
      WHEN level LIKE 'CRITICAL%' THEN 1
      WHEN level LIKE 'HIGH RISK%' THEN 2
      WHEN level LIKE 'MEDIUM RISK%' THEN 3
      ELSE 4
    END,
    name;
END;
$function$;

-- 6. Função para verificar funções SECURITY DEFINER potencialmente inseguras
CREATE OR REPLACE FUNCTION public.audit_security_definer_functions()
RETURNS TABLE(
  function_name text,
  search_path_setting text,
  security_level text,
  recommendation text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.proname::text as function_name,
    COALESCE(
      (SELECT setting FROM pg_proc_config WHERE pg_proc_config.prooid = p.oid AND configname = 'search_path'),
      'NOT SET'
    ) as search_path_setting,
    CASE 
      WHEN (SELECT setting FROM pg_proc_config WHERE pg_proc_config.prooid = p.oid AND configname = 'search_path') IS NULL 
        THEN 'HIGH RISK - No search_path set'
      WHEN (SELECT setting FROM pg_proc_config WHERE pg_proc_config.prooid = p.oid AND configname = 'search_path') = 'public'
        OR (SELECT setting FROM pg_proc_config WHERE pg_proc_config.prooid = p.oid AND configname = 'search_path') = '''public'''
        THEN 'GOOD - Secure search_path'
      ELSE 'MEDIUM RISK - Review search_path setting'
    END as security_level,
    CASE 
      WHEN (SELECT setting FROM pg_proc_config WHERE pg_proc_config.prooid = p.oid AND configname = 'search_path') IS NULL 
        THEN 'Add "SET search_path = ''public''" to function'
      ELSE 'Review current setting'
    END as recommendation
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.prosecdef = true  -- SECURITY DEFINER functions only
  ORDER BY 
    CASE 
      WHEN (SELECT setting FROM pg_proc_config WHERE pg_proc_config.prooid = p.oid AND configname = 'search_path') IS NULL THEN 1
      ELSE 2
    END,
    p.proname;
END;
$function$;