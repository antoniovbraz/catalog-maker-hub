CREATE OR REPLACE VIEW public.ml_auth_tokens_decrypted AS
SELECT
  id,
  tenant_id,
  CASE WHEN access_token IS NOT NULL
       THEN pgp_sym_decrypt(decode(access_token, 'base64'),
            coalesce(current_setting('app.ml_encryption_key', true), 'changeme'))::text
  END AS access_token,
  CASE WHEN refresh_token IS NOT NULL
       THEN pgp_sym_decrypt(decode(refresh_token, 'base64'),
            coalesce(current_setting('app.ml_encryption_key', true), 'changeme'))::text
  END AS refresh_token,
  token_type, expires_at, scope, user_id_ml, ml_nickname,
  created_at, updated_at
FROM public.ml_auth_tokens;
