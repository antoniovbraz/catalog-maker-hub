-- Atualizar função para reconhecer o novo email de super admin
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
      WHEN NEW.email = 'peepers.shop@gmail.com' THEN 'super_admin'::user_role
      ELSE 'user'::user_role
    END,
    gen_random_uuid()
  );
  RETURN NEW;
END;
$$;