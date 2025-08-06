-- Adicionar coluna mode na tabela assistants para separar assistentes rápidos dos estratégicos
ALTER TABLE public.assistants ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'quick';

-- Criar constraint para garantir valores válidos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assistants_mode_check'
  ) THEN
    ALTER TABLE public.assistants ADD CONSTRAINT assistants_mode_check 
    CHECK (mode IN ('quick', 'strategic'));
  END IF;
END $$;

-- Remover constraint única atual de marketplace (se existir)
ALTER TABLE public.assistants DROP CONSTRAINT IF EXISTS assistants_marketplace_key;
ALTER TABLE public.assistants DROP CONSTRAINT IF EXISTS unique_marketplace_per_tenant;

-- Criar constraint única composta para marketplace + mode + tenant_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assistants_marketplace_mode_unique'
  ) THEN
    ALTER TABLE public.assistants ADD CONSTRAINT assistants_marketplace_mode_unique 
    UNIQUE (marketplace, mode, tenant_id);
  END IF;
END $$;

-- Comentário explicativo
COMMENT ON COLUMN public.assistants.mode IS 'Modo do assistente: quick (rápido) ou strategic (estratégico)';