-- Criar enum para roles
CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'user');

-- Criar tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'user',
  tenant_id UUID NOT NULL DEFAULT gen_random_uuid(),
  plan_type TEXT DEFAULT 'free',
  plan_expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(email)
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN NEW.email = 'admin@peepershub.com' THEN 'super_admin'::user_role
      ELSE 'user'::user_role
    END,
    gen_random_uuid()
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar tenant_id nas tabelas existentes
ALTER TABLE public.products ADD COLUMN tenant_id UUID;
ALTER TABLE public.categories ADD COLUMN tenant_id UUID;
ALTER TABLE public.marketplaces ADD COLUMN tenant_id UUID;
ALTER TABLE public.sales ADD COLUMN tenant_id UUID;
ALTER TABLE public.saved_pricing ADD COLUMN tenant_id UUID;
ALTER TABLE public.commissions ADD COLUMN tenant_id UUID;
ALTER TABLE public.marketplace_fixed_fee_rules ADD COLUMN tenant_id UUID;
ALTER TABLE public.shipping_rules ADD COLUMN tenant_id UUID;

-- Atualizar RLS policies para incluir tenant_id
CREATE POLICY "Users can access own tenant products"
ON public.products
FOR ALL
USING (tenant_id = auth.uid());

CREATE POLICY "Users can access own tenant categories"
ON public.categories
FOR ALL
USING (tenant_id = auth.uid());

CREATE POLICY "Users can access own tenant marketplaces"
ON public.marketplaces
FOR ALL
USING (tenant_id = auth.uid());

CREATE POLICY "Users can access own tenant sales"
ON public.sales
FOR ALL
USING (tenant_id = auth.uid());

CREATE POLICY "Users can access own tenant pricing"
ON public.saved_pricing
FOR ALL
USING (tenant_id = auth.uid());

CREATE POLICY "Users can access own tenant commissions"
ON public.commissions
FOR ALL
USING (tenant_id = auth.uid());

CREATE POLICY "Users can access own tenant fixed fee rules"
ON public.marketplace_fixed_fee_rules
FOR ALL
USING (tenant_id = auth.uid());

CREATE POLICY "Users can access own tenant shipping rules"
ON public.shipping_rules
FOR ALL
USING (tenant_id = auth.uid());