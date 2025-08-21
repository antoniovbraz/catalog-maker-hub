-- Security Fix: Finalize subscription plans protection
-- Fix the SQL syntax issue and complete the security implementation

-- Drop and recreate the view properly (PostgreSQL doesn't support SECURITY INVOKER syntax on views)
DROP VIEW IF EXISTS public.public_pricing CASCADE;

-- Create a simple view without any security modifiers
CREATE VIEW public.public_pricing AS
SELECT 
    id,
    display_name,
    description,
    price_monthly,
    price_yearly,
    (features->>'price_pilot')::boolean as has_price_pilot,
    (features->>'basic_analytics')::boolean as has_basic_analytics,
    (features->>'advanced_analytics')::boolean as has_advanced_analytics,
    (features->>'email_support')::boolean as has_email_support,
    (features->>'priority_support')::boolean as has_priority_support,
    sort_order
FROM public.subscription_plans
WHERE is_active = true
ORDER BY sort_order;

-- Grant appropriate permissions
GRANT SELECT ON public.public_pricing TO anon, authenticated;