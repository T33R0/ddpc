-- Fix infinite recursion in user_profile policies by introducing a security definer function

-- Create a helper function to check admin status without triggering RLS
-- We use SECURITY DEFINER to bypass RLS on the user_profile table lookup
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_profile
    WHERE user_id = auth.uid()
    AND role::text = 'admin'
  );
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS up_update_admin ON public.user_profile;

-- Recreate the policy using the safe function
CREATE POLICY up_update_admin ON public.user_profile
FOR UPDATE
TO permissive
USING (is_admin())
WITH CHECK (is_admin());
