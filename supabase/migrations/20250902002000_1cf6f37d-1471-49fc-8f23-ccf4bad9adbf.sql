-- Adiciona coluna ml_variations na tabela products para armazenar dados de variações do Mercado Livre
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS ml_variations jsonb DEFAULT '[]';

COMMENT ON COLUMN public.products.ml_variations IS 'Variações do produto no ML';
