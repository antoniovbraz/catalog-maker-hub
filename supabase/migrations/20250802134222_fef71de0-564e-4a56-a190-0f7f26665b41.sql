-- Primeiro, vamos remover as políticas problemáticas
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;

-- Criar função security definer para verificar roles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Recriar política para super admins usando a função
CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR ALL 
USING (public.get_current_user_role() = 'super_admin');

-- Também vamos corrigir as outras políticas que podem ter o mesmo problema
-- Atualizar policies das outras tabelas para usar a função
DROP POLICY IF EXISTS "Users can access own tenant products" ON public.products;
CREATE POLICY "Users can access own tenant products" 
ON public.products 
FOR ALL 
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  OR public.get_current_user_role() = 'super_admin'
);

DROP POLICY IF EXISTS "Users can access own tenant categories" ON public.categories;
CREATE POLICY "Users can access own tenant categories" 
ON public.categories 
FOR ALL 
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  OR public.get_current_user_role() = 'super_admin'
);

DROP POLICY IF EXISTS "Users can access own tenant marketplaces" ON public.marketplaces;
CREATE POLICY "Users can access own tenant marketplaces" 
ON public.marketplaces 
FOR ALL 
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  OR public.get_current_user_role() = 'super_admin'
);

DROP POLICY IF EXISTS "Users can access own tenant sales" ON public.sales;
CREATE POLICY "Users can access own tenant sales" 
ON public.sales 
FOR ALL 
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  OR public.get_current_user_role() = 'super_admin'
);

DROP POLICY IF EXISTS "Users can access own tenant pricing" ON public.saved_pricing;
CREATE POLICY "Users can access own tenant pricing" 
ON public.saved_pricing 
FOR ALL 
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  OR public.get_current_user_role() = 'super_admin'
);

DROP POLICY IF EXISTS "Users can access own tenant commissions" ON public.commissions;
CREATE POLICY "Users can access own tenant commissions" 
ON public.commissions 
FOR ALL 
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  OR public.get_current_user_role() = 'super_admin'
);

DROP POLICY IF EXISTS "Users can access own tenant fixed fee rules" ON public.marketplace_fixed_fee_rules;
CREATE POLICY "Users can access own tenant fixed fee rules" 
ON public.marketplace_fixed_fee_rules 
FOR ALL 
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  OR public.get_current_user_role() = 'super_admin'
);

DROP POLICY IF EXISTS "Users can access own tenant shipping rules" ON public.shipping_rules;
CREATE POLICY "Users can access own tenant shipping rules" 
ON public.shipping_rules 
FOR ALL 
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  OR public.get_current_user_role() = 'super_admin'
);