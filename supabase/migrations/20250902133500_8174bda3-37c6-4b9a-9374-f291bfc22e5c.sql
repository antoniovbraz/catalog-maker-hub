-- Add index for tenant product queries
CREATE INDEX IF NOT EXISTS idx_products_tenant_created_at
  ON public.products (tenant_id, created_at DESC);
