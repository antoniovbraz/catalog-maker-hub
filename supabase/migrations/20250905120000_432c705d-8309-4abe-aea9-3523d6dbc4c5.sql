-- Recreate encrypt_ml_tokens function and trigger
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
