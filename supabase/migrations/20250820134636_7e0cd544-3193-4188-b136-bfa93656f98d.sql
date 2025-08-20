-- Final security cleanup: Check and remove any remaining SECURITY DEFINER issues

-- List all functions to identify potential SECURITY DEFINER issues
-- Note: The required functions (get_current_user_role, validate_tenant_access, etc.) are legitimate SECURITY DEFINER functions

-- The linter might be flagging one of our legitimate functions or there might be a view we missed
-- Let's ensure our public_pricing view is completely clean by recreating it one more time

-- Double-check that the public_pricing view doesn't have any SECURITY DEFINER properties
DROP VIEW IF EXISTS public.public_pricing CASCADE;

-- Recreate the view with explicit security context
CREATE VIEW public.public_pricing
SECURITY INVOKER  -- Explicitly set as SECURITY INVOKER (the safe default)
AS
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

-- Re-grant permissions
GRANT SELECT ON public.public_pricing TO anon, authenticated;