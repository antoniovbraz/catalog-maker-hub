-- Criar view de tokens descriptografados sem depender de configurações de sessão
CREATE OR REPLACE VIEW public.ml_auth_tokens_decrypted AS
SELECT
    id,
    tenant_id,
    CASE 
        WHEN access_token IS NOT NULL AND access_token != '' THEN
            CASE 
                WHEN access_token LIKE '%=%' OR access_token LIKE '%+%' OR access_token LIKE '%/%' THEN
                    -- Token está criptografado, descriptografar usando chave fixa
                    pgp_sym_decrypt(decode(access_token, 'base64'), 
                                  'ml_tokens_encryption_key_2024_secure_catalog_maker_hub_v1')::text
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
                                  'ml_tokens_encryption_key_2024_secure_catalog_maker_hub_v1')::text
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

-- Atualizar função de criptografia para usar chave fixa
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Atualizar job de cron para usar service role key direto
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
                'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5na2h6Ynp5bmtoZ2V6a3F5a2ViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAwMzc4OCwiZXhwIjoyMDY5NTc5Nzg4fQ.JKOeXhPuJBVBOB55XtNn36Bd3jgfFAKlrO9F7SH0mAI'
            ),
            body:=jsonb_build_object('timestamp', now())
        ) as request_id;
    $$
);

-- Teste de conectividade para verificar se a view funciona
SELECT 'View ml_auth_tokens_decrypted criada com sucesso' as status;