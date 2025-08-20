-- Fix security linter issue: Remove SECURITY DEFINER from view and recreate properly
DROP VIEW IF EXISTS public.public_pricing;

-- Create the public pricing view without SECURITY DEFINER
-- This is safe because it only accesses data that should be publicly visible
CREATE VIEW public.public_pricing AS
SELECT 
    id,
    display_name,
    description,
    price_monthly,
    price_yearly,
    -- Only expose basic feature flags, not detailed limits
    (features->>'price_pilot')::boolean as has_price_pilot,
    (features->>'basic_analytics')::boolean as has_basic_analytics,
    (features->>'advanced_analytics')::boolean as has_advanced_analytics,
    (features->>'email_support')::boolean as has_email_support,
    (features->>'priority_support')::boolean as has_priority_support,
    sort_order
FROM public.subscription_plans
WHERE is_active = true
ORDER BY sort_order;

-- Grant access to the view
GRANT SELECT ON public.public_pricing TO anon, authenticated;