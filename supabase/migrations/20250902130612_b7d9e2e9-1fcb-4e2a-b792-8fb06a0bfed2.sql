-- Enable pgcrypto and encrypt ML tokens
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt tokens before storing
CREATE OR REPLACE FUNCTION public.encrypt_ml_tokens()
RETURNS trigger AS $$
DECLARE
  secret_key text := current_setting('app.ml_encryption_key', true);
BEGIN
  IF secret_key IS NULL THEN
    secret_key := 'changeme';
  END IF;

  IF NEW.access_token IS NOT NULL THEN
    NEW.access_token := encode(pgp_sym_encrypt(NEW.access_token, secret_key), 'base64');
  END IF;

  IF NEW.refresh_token IS NOT NULL THEN
    NEW.refresh_token := encode(pgp_sym_encrypt(NEW.refresh_token, secret_key), 'base64');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS encrypt_ml_tokens_trigger ON public.ml_auth_tokens;
CREATE TRIGGER encrypt_ml_tokens_trigger
BEFORE INSERT OR UPDATE ON public.ml_auth_tokens
FOR EACH ROW EXECUTE FUNCTION public.encrypt_ml_tokens();

-- Backfill existing tokens so the decrypting view won't fail
DO $$
DECLARE
  secret_key text := current_setting('app.ml_encryption_key', true);
BEGIN
  IF secret_key IS NULL THEN
    secret_key := 'changeme';
  END IF;

  UPDATE public.ml_auth_tokens
  SET
    access_token = encode(pgp_sym_encrypt(access_token, secret_key), 'base64'),
    refresh_token = encode(pgp_sym_encrypt(refresh_token, secret_key), 'base64')
  WHERE access_token IS NOT NULL OR refresh_token IS NOT NULL;
END;
$$;

-- View with decrypted tokens
CREATE OR REPLACE VIEW public.ml_auth_tokens_decrypted AS
SELECT
  id,
  tenant_id,
  CASE WHEN access_token IS NOT NULL THEN pgp_sym_decrypt(decode(access_token, 'base64'), coalesce(current_setting('app.ml_encryption_key', true), 'changeme'))::text END AS access_token,
  CASE WHEN refresh_token IS NOT NULL THEN pgp_sym_decrypt(decode(refresh_token, 'base64'), coalesce(current_setting('app.ml_encryption_key', true), 'changeme'))::text END AS refresh_token,
  token_type,
  expires_at,
  scope,
  user_id_ml,
  ml_nickname,
  created_at,
  updated_at
FROM public.ml_auth_tokens;

-- Cron job to renew tokens hourly
SELECT cron.schedule(
  'ml-token-renewal-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://ngkhzbzynkhgezkqykeb.supabase.co/functions/v1/ml-token-renewal',
    headers:=jsonb_build_object(
      'Content-Type','application/json',
      'Authorization', 'Bearer ' || coalesce(current_setting('app.ml_service_role_key', true), '')
    ),
    body:=jsonb_build_object('triggered_at', now())
  );
  $$
);
