-- Criar função RPC para otimizar consultas do admin dashboard
CREATE OR REPLACE FUNCTION get_admin_dashboard_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_users json;
  v_subscriptions json;
  v_revenue json;
  v_result json;
BEGIN
  -- Buscar usuários
  SELECT json_agg(row_to_json(u.*))
  INTO v_users
  FROM (
    SELECT 
      id,
      full_name,
      email,
      role,
      company_name,
      created_at,
      is_active
    FROM public.profiles
    ORDER BY created_at DESC
  ) u;

  -- Buscar assinaturas com relacionamentos
  SELECT json_agg(row_to_json(s.*))
  INTO v_subscriptions
  FROM (
    SELECT 
      sub.id,
      sub.status,
      sub.current_period_end,
      json_build_object(
        'full_name', p.full_name,
        'email', p.email
      ) as user,
      json_build_object(
        'display_name', sp.display_name,
        'price_monthly', sp.price_monthly
      ) as plan
    FROM public.subscriptions sub
    LEFT JOIN public.profiles p ON p.id = sub.user_id
    LEFT JOIN public.subscription_plans sp ON sp.id = sub.plan_id
    ORDER BY sub.created_at DESC
  ) s;

  -- Calcular receita
  SELECT json_build_object(
    'monthly', COALESCE(SUM(sp.price_monthly), 0),
    'yearly', COALESCE(SUM(sp.price_monthly), 0) * 12,
    'activeSubscriptions', COUNT(*)
  )
  INTO v_revenue
  FROM public.subscriptions sub
  JOIN public.subscription_plans sp ON sp.id = sub.plan_id
  WHERE sub.status = 'active';

  -- Construir resultado final
  v_result := json_build_object(
    'users', COALESCE(v_users, '[]'::json),
    'subscriptions', COALESCE(v_subscriptions, '[]'::json),
    'revenue', COALESCE(v_revenue, json_build_object('monthly', 0, 'yearly', 0, 'activeSubscriptions', 0))
  );

  RETURN v_result;
END;
$$;

-- Criar índices para otimizar performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON public.subscriptions(created_at);