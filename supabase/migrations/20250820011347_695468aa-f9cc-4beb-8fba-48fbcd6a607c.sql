-- Security Enhancement Phase 1: Authentication Configuration and RLS Cleanup

-- First, clean up redundant RLS policies on profiles table
-- Remove the redundant policies we just added since they overlap with existing ones
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny public access to profiles" ON public.profiles;

-- Keep only the necessary policies and optimize them
-- The existing policies already handle most cases, but we'll add explicit anonymous denial

-- Add a single comprehensive policy to explicitly deny anonymous access
CREATE POLICY "Block anonymous access to profiles" 
ON public.profiles 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- Phase 2: Add tenant validation safeguards
-- Create a security function to validate tenant associations
CREATE OR REPLACE FUNCTION public.validate_tenant_access(p_user_id uuid, p_tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_tenant_id uuid;
BEGIN
    -- Get the user's actual tenant_id
    SELECT tenant_id INTO v_user_tenant_id
    FROM public.profiles
    WHERE id = p_user_id;
    
    -- Return true if tenant_id matches or user is super_admin
    RETURN (v_user_tenant_id = p_tenant_id) OR 
           (get_current_user_role() = 'super_admin'::user_role);
END;
$$;

-- Create logging function for security audit trail
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type text,
    p_user_id uuid DEFAULT auth.uid(),
    p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- This would typically insert into a security_logs table
    -- For now, we'll use PostgreSQL's built-in logging
    RAISE LOG 'Security Event - Type: %, User: %, Details: %', 
        p_event_type, p_user_id, p_details;
END;
$$;