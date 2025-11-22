-- RPC function to update user role with proper enum casting
-- This bypasses any trigger type issues

CREATE OR REPLACE FUNCTION update_user_role(
  p_user_id uuid,
  p_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Explicitly cast the text to user_role enum
  UPDATE public.user_profile
  SET role = p_role::user_role
  WHERE user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role(uuid, text) TO service_role;

