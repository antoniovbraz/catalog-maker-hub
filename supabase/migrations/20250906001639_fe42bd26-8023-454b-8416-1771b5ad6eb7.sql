-- Adicionar colunas faltantes na tabela products para suporte completo ao ML
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category_ml_id TEXT,
ADD COLUMN IF NOT EXISTS category_ml_path TEXT, 
ADD COLUMN IF NOT EXISTS updated_from_ml_at TIMESTAMP WITH TIME ZONE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_products_category_ml_id ON public.products(category_ml_id);
CREATE INDEX IF NOT EXISTS idx_products_source ON public.products(source);
CREATE INDEX IF NOT EXISTS idx_products_ml_seller_sku ON public.products(ml_seller_sku);

-- Otimizar índices existentes na ml_product_mapping
CREATE INDEX IF NOT EXISTS idx_ml_product_mapping_ml_item_id ON public.ml_product_mapping(ml_item_id);
CREATE INDEX IF NOT EXISTS idx_ml_product_mapping_tenant_product ON public.ml_product_mapping(tenant_id, product_id);

-- Adicionar constraint para evitar duplicatas de ml_item_id por tenant
ALTER TABLE public.ml_product_mapping 
ADD CONSTRAINT IF NOT EXISTS uq_ml_product_mapping_tenant_ml_item 
UNIQUE (tenant_id, ml_item_id);