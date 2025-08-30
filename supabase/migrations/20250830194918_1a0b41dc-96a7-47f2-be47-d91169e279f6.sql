-- Expandir tabela products para capturar todos os dados ML
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS ml_stock_quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ml_attributes jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dimensions jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS weight numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS warranty text,
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS model text,
ADD COLUMN IF NOT EXISTS ml_seller_sku text,
ADD COLUMN IF NOT EXISTS ml_available_quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ml_sold_quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ml_variation_id text,
ADD COLUMN IF NOT EXISTS ml_pictures jsonb DEFAULT '[]';

-- Criar tabela para mapear categorias ML
CREATE TABLE IF NOT EXISTS public.ml_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  ml_category_id text NOT NULL,
  ml_category_name text NOT NULL,
  ml_path_from_root jsonb DEFAULT '[]',
  local_category_id uuid REFERENCES public.categories(id),
  auto_mapped boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tenant_id, ml_category_id)
);

-- Enable RLS na tabela ml_categories
ALTER TABLE public.ml_categories ENABLE ROW LEVEL SECURITY;

-- Criar policy para ml_categories
CREATE POLICY "Users can access own tenant ML categories" 
ON public.ml_categories FOR ALL 
USING (
  (tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()))
  OR 
  (get_current_user_role() = 'super_admin'::user_role)
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ml_categories_updated_at
BEFORE UPDATE ON public.ml_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_ml_categories_tenant_ml_id ON public.ml_categories(tenant_id, ml_category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_ml_seller_sku ON public.products(ml_seller_sku);

-- Comentários nas novas colunas
COMMENT ON COLUMN public.products.ml_stock_quantity IS 'Quantidade em estoque no ML';
COMMENT ON COLUMN public.products.ml_attributes IS 'Todos os atributos do produto ML';
COMMENT ON COLUMN public.products.dimensions IS 'Dimensões do produto (altura, largura, profundidade)';
COMMENT ON COLUMN public.products.weight IS 'Peso do produto em gramas';
COMMENT ON COLUMN public.products.warranty IS 'Informações de garantia';
COMMENT ON COLUMN public.products.brand IS 'Marca do produto';
COMMENT ON COLUMN public.products.model IS 'Modelo do produto';
COMMENT ON COLUMN public.products.ml_seller_sku IS 'SKU do vendedor no ML';
COMMENT ON COLUMN public.products.ml_available_quantity IS 'Quantidade disponível no ML';
COMMENT ON COLUMN public.products.ml_sold_quantity IS 'Quantidade vendida no ML';
COMMENT ON COLUMN public.products.ml_variation_id IS 'ID da variação no ML se aplicável';
COMMENT ON COLUMN public.products.ml_pictures IS 'URLs das imagens do produto no ML';