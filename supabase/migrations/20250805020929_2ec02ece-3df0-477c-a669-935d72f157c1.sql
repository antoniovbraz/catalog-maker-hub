-- Adicionar coluna mode na tabela assistants para separar assistentes rápidos dos estratégicos
ALTER TABLE public.assistants ADD COLUMN mode text NOT NULL DEFAULT 'quick';

-- Criar constraint para garantir valores válidos
ALTER TABLE public.assistants ADD CONSTRAINT assistants_mode_check 
CHECK (mode IN ('quick', 'strategic'));

-- Remover constraint única atual de marketplace (se existir)
ALTER TABLE public.assistants DROP CONSTRAINT IF EXISTS assistants_marketplace_key;

-- Criar constraint única composta para marketplace + mode
ALTER TABLE public.assistants ADD CONSTRAINT assistants_marketplace_mode_unique 
UNIQUE (marketplace, mode, tenant_id);

-- Comentário explicativo
COMMENT ON COLUMN public.assistants.mode IS 'Modo do assistente: quick (rápido) ou strategic (estratégico)';