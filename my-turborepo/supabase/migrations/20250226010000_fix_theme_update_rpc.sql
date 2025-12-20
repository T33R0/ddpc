-- Fix theme persistence by bypassing potentially recursive RLS policies
-- using a SECURITY DEFINER function for updates.

-- 1. Create the RPC function
CREATE OR REPLACE FUNCTION public.update_own_theme(new_theme text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE user_profile
  SET theme = new_theme
  WHERE user_id = auth.uid();
$$;

-- 2. Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_own_theme(text) TO authenticated;
