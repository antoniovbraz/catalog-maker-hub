-- Adicionar campo source na tabela products para identificar origem
ALTER TABLE public.products 
ADD COLUMN source text NOT NULL DEFAULT 'manual'
CHECK (source IN ('manual', 'mercado_livre', 'shopee'));

-- Criar índice para performance nas consultas por origem
CREATE INDEX idx_products_source ON public.products(source);

-- Comentários para documentação
COMMENT ON COLUMN public.products.source IS 'Origem do produto: manual, mercado_livre, shopee';