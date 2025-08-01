-- Adicionar coluna preco_praticado na tabela saved_pricing
ALTER TABLE public.saved_pricing 
ADD COLUMN preco_praticado NUMERIC DEFAULT 0;