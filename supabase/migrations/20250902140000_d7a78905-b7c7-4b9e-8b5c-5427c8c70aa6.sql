
-- Disable trigger to avoid double encryption during backfill
ALTER TABLE public.ml_auth_tokens DISABLE TRIGGER encrypt_ml_tokens_trigger;

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
  WHERE access_token LIKE '%.%.%' OR refresh_token LIKE '%.%.%';
END;
$$;

ALTER TABLE public.ml_auth_tokens ENABLE TRIGGER encrypt_ml_tokens_trigger;

-- Update cron job to use dynamic service role key
SELECT cron.unschedule('ml-token-renewal-hourly');
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
