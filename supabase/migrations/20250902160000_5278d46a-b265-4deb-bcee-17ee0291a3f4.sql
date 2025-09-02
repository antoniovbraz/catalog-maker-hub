-- Add ML integration columns and constraints to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS origin text CHECK (origin IN ('mercado_livre','manual','import')) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS ml_item_id text,
ADD COLUMN IF NOT EXISTS sku_source text CHECK (sku_source IN ('mercado_livre','internal','none')) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS category_ml_id text,
ADD COLUMN IF NOT EXISTS category_ml_path text,
ADD COLUMN IF NOT EXISTS updated_from_ml_at timestamp with time zone;

-- Unique index for Mercado Livre items per account
CREATE UNIQUE INDEX IF NOT EXISTS ux_products_account_ml
ON public.products (tenant_id, ml_item_id)
WHERE origin = 'mercado_livre';

-- Trigger to enforce SKU integrity
CREATE OR REPLACE FUNCTION public.enforce_ml_sku_integrity()
RETURNS trigger AS $$
BEGIN
    IF NEW.sku_source = 'mercado_livre' THEN
        IF NEW.ml_item_id IS NULL THEN
            RAISE EXCEPTION 'ml_item_id must be set when sku_source = mercado_livre';
        END IF;
        IF NEW.sku IS NULL THEN
            RAISE EXCEPTION 'sku must be set when sku_source = mercado_livre';
        END IF;
    ELSIF NEW.sku_source = 'none' THEN
        IF NEW.sku IS NOT NULL THEN
            RAISE EXCEPTION 'sku must be null when sku_source = none';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_ml_sku_integrity ON public.products;
CREATE TRIGGER enforce_ml_sku_integrity
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.enforce_ml_sku_integrity();

-- Ensure ml_categories table exists
CREATE TABLE IF NOT EXISTS public.ml_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  path_from_root text,
  updated_at timestamp with time zone DEFAULT now()
);
