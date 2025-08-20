-- Add explicit RLS policies to deny anonymous access to profiles table
-- This addresses the security finding about customer personal information exposure

-- Policy to explicitly deny all access to anonymous/unauthenticated users
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Policy to ensure only authenticated users can insert profiles (for sign-up process)
CREATE POLICY "Authenticated users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Add explicit policy to deny public access (additional security layer)
CREATE POLICY "Deny public access to profiles"
ON public.profiles
FOR ALL
TO public
USING (false)
WITH CHECK (false);