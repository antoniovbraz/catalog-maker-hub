-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA
-- 1.1 Corrigir Search Path em Funções SECURITY DEFINER

-- Fixar função encrypt_ml_tokens
CREATE OR REPLACE FUNCTION public.encrypt_ml_tokens()
RETURNS TRIGGER AS $$
DECLARE
    secret_key text := 'ml_tokens_encryption_key_2024_secure_catalog_maker_hub_v1';
BEGIN
    -- Criptografar access_token se não estiver vazio e não for já criptografado
    IF NEW.access_token IS NOT NULL AND NEW.access_token != '' THEN
        -- Verificar se já está criptografado (contém caracteres base64 típicos)
        IF NEW.access_token NOT LIKE '%=%' AND NEW.access_token NOT LIKE '%+%' AND NEW.access_token NOT LIKE '%/%' THEN
            NEW.access_token := encode(pgp_sym_encrypt(NEW.access_token::bytea, secret_key), 'base64');
        END IF;
    END IF;
    
    -- Criptografar refresh_token se não estiver vazio e não for já criptografado
    IF NEW.refresh_token IS NOT NULL AND NEW.refresh_token != '' THEN
        -- Verificar se já está criptografado
        IF NEW.refresh_token NOT LIKE '%=%' AND NEW.refresh_token NOT LIKE '%+%' AND NEW.refresh_token NOT LIKE '%/%' THEN
            NEW.refresh_token := encode(pgp_sym_encrypt(NEW.refresh_token::bytea, secret_key), 'base64');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Fixar função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Fixar função cleanup_expired_pkce
CREATE OR REPLACE FUNCTION public.cleanup_expired_pkce()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.ml_pkce_storage 
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 1.2 Adicionar RLS para tabelas críticas expostas por views

-- Habilitar RLS na tabela public_pricing se não estiver habilitado
ALTER TABLE public.public_pricing ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública dos planos de preços
CREATE POLICY "Anyone can view public pricing plans" 
ON public.public_pricing 
FOR SELECT 
USING (true);

-- Habilitar RLS na tabela ml_integration_status se não estiver habilitado  
ALTER TABLE public.ml_integration_status ENABLE ROW LEVEL SECURITY;

-- Política para acesso por tenant ou super admin
CREATE POLICY "Users can access own tenant integration status" 
ON public.ml_integration_status 
FOR ALL 
USING ((tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid())) 
       OR (get_current_user_role() = 'super_admin'::user_role));

-- 1.3 Criar função segura para tokens descriptografados
CREATE OR REPLACE FUNCTION public.get_decrypted_ml_tokens()
RETURNS TABLE(
  id uuid,
  tenant_id uuid,
  expires_at timestamp with time zone,
  user_id_ml bigint,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  access_token text,
  refresh_token text,
  token_type text,
  scope text,
  ml_nickname text
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE
    v_tenant_id uuid;
    secret_key text := 'ml_tokens_encryption_key_2024_secure_catalog_maker_hub_v1';
BEGIN
    -- Verificar se usuário tem acesso
    SELECT profiles.tenant_id INTO v_tenant_id
    FROM public.profiles
    WHERE profiles.id = auth.uid();
    
    -- Super admin pode ver todos, usuários normais só do seu tenant
    IF get_current_user_role() != 'super_admin'::user_role AND v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    RETURN QUERY
    SELECT 
        mat.id,
        mat.tenant_id,
        mat.expires_at,
        mat.user_id_ml,
        mat.created_at,
        mat.updated_at,
        -- Descriptografar tokens de forma segura
        CASE 
            WHEN mat.access_token LIKE '%=%' OR mat.access_token LIKE '%+%' OR mat.access_token LIKE '%/%' THEN
                convert_from(pgp_sym_decrypt(decode(mat.access_token, 'base64'), secret_key), 'UTF8')
            ELSE mat.access_token
        END as access_token,
        CASE 
            WHEN mat.refresh_token LIKE '%=%' OR mat.refresh_token LIKE '%+%' OR mat.refresh_token LIKE '%/%' THEN
                convert_from(pgp_sym_decrypt(decode(mat.refresh_token, 'base64'), secret_key), 'UTF8')
            ELSE mat.refresh_token
        END as refresh_token,
        mat.token_type,
        mat.scope,
        mat.ml_nickname
    FROM public.ml_auth_tokens mat
    WHERE (get_current_user_role() = 'super_admin'::user_role OR mat.tenant_id = v_tenant_id);
END;
$$;

-- 1.4 Adicionar indices para performance nas tabelas críticas
CREATE INDEX IF NOT EXISTS idx_products_tenant_created ON public.products (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ml_sync_log_tenant_created ON public.ml_sync_log (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ml_product_mapping_tenant ON public.ml_product_mapping (tenant_id, product_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_date ON public.sales (tenant_id, sold_at);
CREATE INDEX IF NOT EXISTS idx_ml_auth_tokens_tenant ON public.ml_auth_tokens (tenant_id, expires_at);