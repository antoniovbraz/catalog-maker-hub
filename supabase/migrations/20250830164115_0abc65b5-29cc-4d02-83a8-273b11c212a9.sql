-- Criar tabela para armazenar PKCE code_verifier temporariamente
CREATE TABLE IF NOT EXISTS public.ml_pkce_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  state TEXT NOT NULL UNIQUE,
  code_verifier TEXT NOT NULL,
  code_challenge TEXT NOT NULL,
  code_challenge_method TEXT NOT NULL DEFAULT 'S256',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '10 minutes')
);

-- Habilitar RLS
ALTER TABLE public.ml_pkce_storage ENABLE ROW LEVEL SECURITY;

-- Política RLS para PKCE storage
CREATE POLICY "Users can access own tenant PKCE data"
ON public.ml_pkce_storage
FOR ALL
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) OR 
  get_current_user_role() = 'super_admin'::user_role
);

-- Trigger para limpeza automática de dados expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_pkce()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.ml_pkce_storage 
  WHERE expires_at < now();
END;
$$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ml_pkce_storage_tenant_id ON public.ml_pkce_storage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ml_pkce_storage_state ON public.ml_pkce_storage(state);
CREATE INDEX IF NOT EXISTS idx_ml_pkce_storage_expires_at ON public.ml_pkce_storage(expires_at);

-- Adicionar campo para melhorar logs de debug
ALTER TABLE public.ml_sync_log 
ADD COLUMN IF NOT EXISTS request_url TEXT,
ADD COLUMN IF NOT EXISTS response_status INTEGER,
ADD COLUMN IF NOT EXISTS response_headers JSONB;