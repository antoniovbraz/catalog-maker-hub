
-- Fase 1: Configurar variáveis de ambiente no banco
ALTER DATABASE postgres SET app.ml_encryption_key = 'ml_tokens_encryption_key_2024_secure_catalog_maker_hub_v1';
ALTER DATABASE postgres SET app.ml_service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5na2h6Ynp5bmtoZ2V6a3F5a2ViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAwMzc4OCwiZXhwIjoyMDY5NTc5Nzg4fQ.JKOeXhPuJBVBOB55XtNn36Bd3jgfFAKlrO9F7SH0mAI';

-- Fase 2: Criar função de criptografia para tokens ML
CREATE OR REPLACE FUNCTION public.encrypt_ml_tokens()
RETURNS TRIGGER AS $$
DECLARE
    secret_key text;
BEGIN
    -- Obter chave de criptografia
    secret_key := current_setting('app.ml_encryption_key', true);
    IF secret_key IS NULL THEN
        secret_key := 'changeme';
    END IF;
    
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger de criptografia
DROP TRIGGER IF EXISTS encrypt_ml_tokens_trigger ON public.ml_auth_tokens;
CREATE TRIGGER encrypt_ml_tokens_trigger
    BEFORE INSERT OR UPDATE ON public.ml_auth_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.encrypt_ml_tokens();

-- Fase 3: Criar view de tokens descriptografados
CREATE OR REPLACE VIEW public.ml_auth_tokens_decrypted AS
SELECT
    id,
    tenant_id,
    CASE 
        WHEN access_token IS NOT NULL AND access_token != '' THEN
            CASE 
                WHEN access_token LIKE '%=%' OR access_token LIKE '%+%' OR access_token LIKE '%/%' THEN
                    -- Token está criptografado, descriptografar
                    pgp_sym_decrypt(decode(access_token, 'base64'), 
                                  coalesce(current_setting('app.ml_encryption_key', true), 'changeme'))::text
                ELSE
                    -- Token não está criptografado, retornar como está
                    access_token
            END
        ELSE
            access_token
    END AS access_token,
    CASE 
        WHEN refresh_token IS NOT NULL AND refresh_token != '' THEN
            CASE 
                WHEN refresh_token LIKE '%=%' OR refresh_token LIKE '%+%' OR refresh_token LIKE '%/%' THEN
                    -- Token está criptografado, descriptografar
                    pgp_sym_decrypt(decode(refresh_token, 'base64'), 
                                  coalesce(current_setting('app.ml_encryption_key', true), 'changeme'))::text
                ELSE
                    -- Token não está criptografado, retornar como está
                    refresh_token
            END
        ELSE
            refresh_token
    END AS refresh_token,
    token_type,
    expires_at,
    scope,
    user_id_ml,
    ml_nickname,
    created_at,
    updated_at
FROM public.ml_auth_tokens;

-- Fase 4: Criptografar tokens existentes (em texto puro)
-- Desabilitar trigger temporariamente para evitar dupla criptografia
ALTER TABLE public.ml_auth_tokens DISABLE TRIGGER encrypt_ml_tokens_trigger;

-- Criptografar tokens que ainda estão em texto puro
UPDATE public.ml_auth_tokens 
SET 
    access_token = encode(pgp_sym_encrypt(access_token::bytea, 
                         coalesce(current_setting('app.ml_encryption_key', true), 'changeme')), 'base64'),
    refresh_token = CASE 
        WHEN refresh_token IS NOT NULL AND refresh_token != '' THEN
            encode(pgp_sym_encrypt(refresh_token::bytea, 
                                 coalesce(current_setting('app.ml_encryption_key', true), 'changeme')), 'base64')
        ELSE 
            refresh_token 
    END,
    updated_at = now()
WHERE 
    access_token IS NOT NULL 
    AND access_token != ''
    AND access_token NOT LIKE '%=%' 
    AND access_token NOT LIKE '%+%' 
    AND access_token NOT LIKE '%/%';

-- Reabilitar trigger
ALTER TABLE public.ml_auth_tokens ENABLE TRIGGER encrypt_ml_tokens_trigger;

-- Fase 5: Atualizar job de cron para usar service role key
SELECT cron.unschedule('ml-token-renewal-hourly');

SELECT cron.schedule(
    'ml-token-renewal-hourly',
    '0 * * * *',
    $$
    SELECT
        net.http_post(
            url:='https://ngkhzbzynkhgezkqykeb.supabase.co/functions/v1/ml-token-renewal',
            headers:=jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || coalesce(current_setting('app.ml_service_role_key', true), '')
            ),
            body:=jsonb_build_object('timestamp', now())
        ) as request_id;
    $$
);

-- Criar índices para melhor performance da view
CREATE INDEX IF NOT EXISTS idx_ml_auth_tokens_tenant_expires 
ON public.ml_auth_tokens(tenant_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_ml_auth_tokens_expires_at 
ON public.ml_auth_tokens(expires_at) 
WHERE expires_at > now();
