-- Corrigir search_path para funções SECURITY DEFINER
-- Estas funções precisam ter SET search_path para segurança

-- 1. Corrigir função cleanup_expired_pkce
CREATE OR REPLACE FUNCTION public.cleanup_expired_pkce()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  DELETE FROM public.ml_pkce_storage 
  WHERE expires_at < now();
END;
$function$;

-- 2. Corrigir função encrypt_ml_client_secret
CREATE OR REPLACE FUNCTION public.encrypt_ml_client_secret()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    IF NEW.client_secret IS NOT NULL AND NEW.client_secret != OLD.client_secret THEN
        NEW.client_secret = encode(encrypt(NEW.client_secret::bytea, 'ml_secret_key', 'aes'), 'base64');
    END IF;
    RETURN NEW;
END;
$function$;

-- 3. Corrigir função cleanup_old_ml_logs
CREATE OR REPLACE FUNCTION public.cleanup_old_ml_logs()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    -- Manter apenas 90 dias de logs de sincronização
    DELETE FROM public.ml_sync_log 
    WHERE created_at < now() - INTERVAL '90 days';
    
    -- Manter apenas 30 dias de eventos de webhook processados
    DELETE FROM public.ml_webhook_events 
    WHERE processed_at IS NOT NULL 
    AND created_at < now() - INTERVAL '30 days';
    
    -- Log da limpeza
    RAISE LOG 'ML logs cleanup completed at %', now();
END;
$function$;

-- 4. Corrigir função log_security_event
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type text, 
    p_user_id uuid DEFAULT auth.uid(), 
    p_details jsonb DEFAULT '{}'::jsonb
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    -- This would typically insert into a security_logs table
    -- For now, we'll use PostgreSQL's built-in logging
    RAISE LOG 'Security Event - Type: %, User: %, Details: %', 
        p_event_type, p_user_id, p_details;
END;
$function$;

-- 5. Corrigir função get_tenant_by_ml_user_id
CREATE OR REPLACE FUNCTION public.get_tenant_by_ml_user_id(p_user_id_ml bigint)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

-- 6. Corrigir função create_default_ml_settings
CREATE OR REPLACE FUNCTION public.create_default_ml_settings(p_tenant_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    INSERT INTO public.ml_sync_settings (tenant_id)
    VALUES (p_tenant_id)
    ON CONFLICT (tenant_id) DO NOTHING;
END;
$function$;

-- 7. Corrigir função encrypt_ml_tokens
CREATE OR REPLACE FUNCTION public.encrypt_ml_tokens()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;

-- 8. Corrigir função handle_new_user
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