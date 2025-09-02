-- FASE 1 - CORREÇÕES DE SEGURANÇA CRÍTICAS

-- 1. Implementar RLS na tabela public_pricing (dados de precificação expostos)
ALTER TABLE public.public_pricing ENABLE ROW LEVEL SECURITY;

-- Policy para permitir leitura pública dos planos de assinatura
CREATE POLICY "Anyone can view public pricing plans" 
ON public.public_pricing 
FOR SELECT 
USING (true);

-- 2. Implementar RLS na tabela ml_integration_status (métricas de receita expostas)
ALTER TABLE public.ml_integration_status ENABLE ROW LEVEL SECURITY;

-- Policy para permitir acesso apenas ao próprio tenant
CREATE POLICY "Users can view own tenant ML integration status" 
ON public.ml_integration_status 
FOR SELECT 
USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Policy para permitir inserção/atualização pelo próprio tenant
CREATE POLICY "Users can manage own tenant ML integration status" 
ON public.ml_integration_status 
FOR ALL 
USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 3. Corrigir funções SECURITY DEFINER com search_path mutável
-- Recriar função update_updated_at_column com search_path fixo
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- 4. Auditar e corrigir função handle_new_user para maior segurança
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

-- 5. Corrigir função get_current_user_role para prevenir loops RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;

-- 6. Adicionar função para auditoria de segurança
CREATE OR REPLACE FUNCTION public.audit_table_security()
RETURNS TABLE(
  table_name text,
  rls_enabled boolean,
  policies_count bigint,
  security_level text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::text,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname) as policies_count,
    CASE 
      WHEN t.rowsecurity = false THEN 'CRITICAL - No RLS'
      WHEN COUNT(p.policyname) = 0 THEN 'HIGH RISK - RLS enabled but no policies'
      WHEN COUNT(p.policyname) < 2 THEN 'MEDIUM RISK - Limited policies'
      ELSE 'GOOD - Adequate protection'
    END as security_level
  FROM pg_tables t
  LEFT JOIN pg_policies p ON t.tablename = p.tablename
  WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY 
    CASE 
      WHEN t.rowsecurity = false THEN 1
      WHEN COUNT(p.policyname) = 0 THEN 2
      ELSE 3
    END,
    t.tablename;
END;
$function$;