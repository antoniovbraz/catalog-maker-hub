-- Add ML integration columns to products
ALTER TABLE public.products
  ADD COLUMN sku_source TEXT DEFAULT 'none',
  ADD COLUMN ml_item_id TEXT,
  ADD COLUMN category_ml_id TEXT,
  ADD COLUMN category_ml_path JSONB DEFAULT '[]',
  ADD COLUMN updated_from_ml_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_tenant_ml_item_id
  ON public.products (tenant_id, ml_item_id);
