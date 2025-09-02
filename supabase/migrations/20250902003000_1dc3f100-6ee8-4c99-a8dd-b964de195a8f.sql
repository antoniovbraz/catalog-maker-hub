-- Separate RLS policies for select and mutations using jwt claim tenant_id

-- ml_categories
DROP POLICY IF EXISTS "Users can access own tenant ML categories" ON public.ml_categories;

CREATE POLICY "Users can view own tenant ML categories"
ON public.ml_categories
FOR SELECT
USING (
  tenant_id = (auth.jwt()->>'tenant_id')::uuid
  OR get_current_user_role() = 'super_admin'::user_role
);

CREATE POLICY "Users can manage own tenant ML categories"
ON public.ml_categories
FOR INSERT, UPDATE, DELETE
USING (
  tenant_id = (auth.jwt()->>'tenant_id')::uuid
  OR get_current_user_role() = 'super_admin'::user_role
)
WITH CHECK (
  tenant_id = (auth.jwt()->>'tenant_id')::uuid
  OR get_current_user_role() = 'super_admin'::user_role
);

-- ml_integration_status
DROP POLICY IF EXISTS "Users can view own tenant ML integration status" ON public.ml_integration_status;
DROP POLICY IF EXISTS "Users can manage own tenant ML integration status" ON public.ml_integration_status;

CREATE POLICY "Users can view own tenant ML integration status"
ON public.ml_integration_status
FOR SELECT
USING (
  tenant_id = (auth.jwt()->>'tenant_id')::uuid
);

CREATE POLICY "Users can manage own tenant ML integration status"
ON public.ml_integration_status
FOR INSERT, UPDATE, DELETE
USING (
  tenant_id = (auth.jwt()->>'tenant_id')::uuid
)
WITH CHECK (
  tenant_id = (auth.jwt()->>'tenant_id')::uuid
);

-- product_images
DROP POLICY IF EXISTS "Users can access own tenant product images" ON public.product_images;

CREATE POLICY "Users can view own tenant product images"
ON public.product_images
FOR SELECT
USING (
  tenant_id = (auth.jwt()->>'tenant_id')::uuid
  OR get_current_user_role() = 'super_admin'::user_role
);

CREATE POLICY "Users can manage own tenant product images"
ON public.product_images
FOR INSERT, UPDATE, DELETE
USING (
  tenant_id = (auth.jwt()->>'tenant_id')::uuid
  OR get_current_user_role() = 'super_admin'::user_role
)
WITH CHECK (
  tenant_id = (auth.jwt()->>'tenant_id')::uuid
  OR get_current_user_role() = 'super_admin'::user_role
);
