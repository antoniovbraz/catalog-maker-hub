-- Primeiro, apenas adicionar os campos à tabela
ALTER TABLE public.marketplaces 
ADD COLUMN parent_marketplace_id UUID REFERENCES public.marketplaces(id),
ADD COLUMN marketplace_metadata JSONB DEFAULT '{}';

-- Criar índice para melhorar performance das consultas hierárquicas
CREATE INDEX idx_marketplaces_parent_id ON public.marketplaces(parent_marketplace_id);