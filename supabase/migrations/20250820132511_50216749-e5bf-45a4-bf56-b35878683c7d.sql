-- Security Fix: Restrict Public Access to Subscription Plans
-- Remove the overly permissive public access to subscription plans

-- Drop the existing policy that allows everyone to view all subscription plans
DROP POLICY IF EXISTS "Everyone can view subscription plans" ON public.subscription_plans;

-- Create a more restrictive policy: authenticated users can only view active plans for subscription selection
CREATE POLICY "Authenticated users can view active subscription plans" 
ON public.subscription_plans 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Create a limited public view for marketing/pricing pages that only exposes safe information
CREATE OR REPLACE VIEW public.public_pricing AS
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

-- Make the public pricing view accessible to everyone (including anonymous users)
-- This is safe because it only exposes marketing information
GRANT SELECT ON public.public_pricing TO anon, authenticated;