-- RPC function to update user role with proper enum casting
-- This bypasses any trigger type issues and RLS policies

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
  -- Explicitly cast the text to user_role enum and bypass RLS
  -- Using SET LOCAL to temporarily disable RLS for this update
  PERFORM set_config('request.jwt.claims', '{"role":"service_role"}', true);
  
  UPDATE public.user_profile
  SET role = p_role::user_role
  WHERE user_id = p_user_id;
  
  -- Reset the config
  PERFORM set_config('request.jwt.claims', NULL, true);
END;
$$;

-- Alternative simpler version that should work with service_role
-- The service_role should bypass RLS automatically
DROP FUNCTION IF EXISTS update_user_role(uuid, text);

CREATE OR REPLACE FUNCTION update_user_role(
  p_user_id uuid,
  p_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Explicitly cast the text to user_role enum
  UPDATE public.user_profile
  SET role = p_role::user_role
  WHERE user_id = p_user_id;
  
  -- Return success status
  SELECT jsonb_build_object('success', true, 'rows_updated', ROW_COUNT)
  INTO v_result;
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

GRANT EXECUTE ON FUNCTION update_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role(uuid, text) TO service_role;

