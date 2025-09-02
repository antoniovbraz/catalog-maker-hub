-- Drop public "Allow public access" policies and enforce tenant-based RLS

-- Drop old public policies
DROP POLICY IF EXISTS "Allow public access" ON public.products;
DROP POLICY IF EXISTS "Allow public access" ON public.categories;
DROP POLICY IF EXISTS "Allow public access" ON public.marketplaces;
DROP POLICY IF EXISTS "Allow public access" ON public.sales;
DROP POLICY IF EXISTS "Allow public access" ON public.saved_pricing;
DROP POLICY IF EXISTS "Allow public access" ON public.commissions;
DROP POLICY IF EXISTS "Allow public access" ON public.marketplace_fixed_fee_rules;
DROP POLICY IF EXISTS "Allow public access" ON public.shipping_rules;

-- Tenant aware policies
CREATE POLICY "Users can access own tenant products"
ON public.products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.role = 'super_admin' OR p.tenant_id = public.products.tenant_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.role = 'super_admin' OR p.tenant_id = public.products.tenant_id)
  )
);

CREATE POLICY "Users can access own tenant categories"
ON public.categories
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.role = 'super_admin' OR p.tenant_id = public.categories.tenant_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.role = 'super_admin' OR p.tenant_id = public.categories.tenant_id)
  )
);

CREATE POLICY "Users can access own tenant marketplaces"
ON public.marketplaces
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.role = 'super_admin' OR p.tenant_id = public.marketplaces.tenant_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.role = 'super_admin' OR p.tenant_id = public.marketplaces.tenant_id)
  )
);

CREATE POLICY "Users can access own tenant sales"
ON public.sales
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.role = 'super_admin' OR p.tenant_id = public.sales.tenant_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.role = 'super_admin' OR p.tenant_id = public.sales.tenant_id)
  )
);

CREATE POLICY "Users can access own tenant pricing"
ON public.saved_pricing
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.role = 'super_admin' OR p.tenant_id = public.saved_pricing.tenant_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.role = 'super_admin' OR p.tenant_id = public.saved_pricing.tenant_id)
  )
);

CREATE POLICY "Users can access own tenant commissions"
ON public.commissions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.role = 'super_admin' OR p.tenant_id = public.commissions.tenant_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.role = 'super_admin' OR p.tenant_id = public.commissions.tenant_id)
  )
);

CREATE POLICY "Users can access own tenant fixed fee rules"
ON public.marketplace_fixed_fee_rules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.role = 'super_admin' OR p.tenant_id = public.marketplace_fixed_fee_rules.tenant_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.role = 'super_admin' OR p.tenant_id = public.marketplace_fixed_fee_rules.tenant_id)
  )
);

CREATE POLICY "Users can access own tenant shipping rules"
ON public.shipping_rules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.role = 'super_admin' OR p.tenant_id = public.shipping_rules.tenant_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.role = 'super_admin' OR p.tenant_id = public.shipping_rules.tenant_id)
  )
);
