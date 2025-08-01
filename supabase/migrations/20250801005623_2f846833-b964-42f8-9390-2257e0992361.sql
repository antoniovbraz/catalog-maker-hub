-- Criar tabela para armazenar precificações salvas
CREATE TABLE public.saved_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  marketplace_id UUID NOT NULL REFERENCES public.marketplaces(id) ON DELETE CASCADE,
  taxa_cartao NUMERIC NOT NULL DEFAULT 0,
  provisao_desconto NUMERIC NOT NULL DEFAULT 0,
  margem_desejada NUMERIC NOT NULL DEFAULT 0,
  custo_total NUMERIC NOT NULL,
  valor_fixo NUMERIC NOT NULL DEFAULT 0,
  frete NUMERIC NOT NULL DEFAULT 0,
  comissao NUMERIC NOT NULL DEFAULT 0,
  preco_sugerido NUMERIC NOT NULL,
  margem_unitaria NUMERIC NOT NULL,
  margem_percentual NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, marketplace_id)
);

-- Enable RLS
ALTER TABLE public.saved_pricing ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Allow public access" 
ON public.saved_pricing 
FOR ALL 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_pricing_updated_at
BEFORE UPDATE ON public.saved_pricing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_saved_pricing_product_marketplace ON public.saved_pricing(product_id, marketplace_id);
CREATE INDEX idx_saved_pricing_created_at ON public.saved_pricing(created_at DESC);