-- Update tenant-based RLS policies to use tenant from profiles table
-- Drop existing policies before creating new ones to avoid conflicts

-- products
DROP POLICY IF EXISTS "Allow public access" ON public.products;
DROP POLICY IF EXISTS "Users can access own tenant products" ON public.products;
CREATE POLICY "Users can access own tenant products"
ON public.products
FOR ALL
USING (
  tenant_id = (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
  OR get_current_user_role() = 'super_admin'::user_role
)
WITH CHECK (
  tenant_id = (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
  OR get_current_user_role() = 'super_admin'::user_role
);

-- categories
DROP POLICY IF EXISTS "Allow public access" ON public.categories;
DROP POLICY IF EXISTS "Users can access own tenant categories" ON public.categories;
CREATE POLICY "Users can access own tenant categories"
ON public.categories
FOR ALL
USING (
  tenant_id = (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
  OR get_current_user_role() = 'super_admin'::user_role
)
WITH CHECK (
  tenant_id = (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
  OR get_current_user_role() = 'super_admin'::user_role
);

-- marketplaces
DROP POLICY IF EXISTS "Allow public access" ON public.marketplaces;
DROP POLICY IF EXISTS "Users can access own tenant marketplaces" ON public.marketplaces;
CREATE POLICY "Users can access own tenant marketplaces"
ON public.marketplaces
FOR ALL
USING (
  tenant_id = (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
  OR get_current_user_role() = 'super_admin'::user_role
)
WITH CHECK (
  tenant_id = (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
  OR get_current_user_role() = 'super_admin'::user_role
);

-- sales
DROP POLICY IF EXISTS "Allow public access" ON public.sales;
DROP POLICY IF EXISTS "Users can access own tenant sales" ON public.sales;
CREATE POLICY "Users can access own tenant sales"
ON public.sales
FOR ALL
USING (
  tenant_id = (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
  OR get_current_user_role() = 'super_admin'::user_role
)
WITH CHECK (
  tenant_id = (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
  OR get_current_user_role() = 'super_admin'::user_role
);

-- saved_pricing
DROP POLICY IF EXISTS "Allow public access" ON public.saved_pricing;
DROP POLICY IF EXISTS "Users can access own tenant pricing" ON public.saved_pricing;
CREATE POLICY "Users can access own tenant pricing"
ON public.saved_pricing
FOR ALL
USING (
  tenant_id = (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
  OR get_current_user_role() = 'super_admin'::user_role
)
WITH CHECK (
  tenant_id = (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
  OR get_current_user_role() = 'super_admin'::user_role
);

-- commissions
DROP POLICY IF EXISTS "Allow public access" ON public.commissions;
DROP POLICY IF EXISTS "Users can access own tenant commissions" ON public.commissions;
CREATE POLICY "Users can access own tenant commissions"
ON public.commissions
FOR ALL
USING (
  tenant_id = (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
  OR get_current_user_role() = 'super_admin'::user_role
)
WITH CHECK (
  tenant_id = (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
  OR get_current_user_role() = 'super_admin'::user_role
);

-- marketplace_fixed_fee_rules
DROP POLICY IF EXISTS "Allow public access" ON public.marketplace_fixed_fee_rules;
DROP POLICY IF EXISTS "Users can access own tenant fixed fee rules" ON public.marketplace_fixed_fee_rules;
CREATE POLICY "Users can access own tenant fixed fee rules"
ON public.marketplace_fixed_fee_rules
FOR ALL
USING (
  tenant_id = (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
  OR get_current_user_role() = 'super_admin'::user_role
)
WITH CHECK (
  tenant_id = (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
  OR get_current_user_role() = 'super_admin'::user_role
);

-- shipping_rules
DROP POLICY IF EXISTS "Allow public access" ON public.shipping_rules;
DROP POLICY IF EXISTS "Users can access own tenant shipping rules" ON public.shipping_rules;
CREATE POLICY "Users can access own tenant shipping rules"
ON public.shipping_rules
FOR ALL
USING (
  tenant_id = (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
  OR get_current_user_role() = 'super_admin'::user_role
)
WITH CHECK (
  tenant_id = (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
  OR get_current_user_role() = 'super_admin'::user_role
);

