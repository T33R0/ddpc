-- Simple, robust RPC function for updating user roles
-- This version handles all edge cases and provides better error reporting

-- Drop the existing function first if it has a different return type
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
  v_old_role user_role;
  v_new_role user_role;
  v_result jsonb;
BEGIN
  -- Validate the role value
  IF p_role NOT IN ('user', 'helper', 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid role value. Must be user, helper, or admin',
      'error_code', 'INVALID_ROLE'
    );
  END IF;
  
  -- Get current role
  SELECT role INTO v_old_role
  FROM public.user_profile
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found',
      'error_code', 'USER_NOT_FOUND'
    );
  END IF;
  
  -- Cast to enum
  v_new_role := p_role::user_role;
  
  -- Update the role (this will trigger the activity log trigger)
  UPDATE public.user_profile
  SET role = v_new_role
  WHERE user_id = p_user_id;
  
  -- Return success with details
  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'old_role', v_old_role::text,
    'new_role', v_new_role::text
  );
  
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid role enum value: ' || p_role,
      'error_code', 'INVALID_ENUM'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE,
      'detail', SQLERRM
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role(uuid, text) TO service_role;

-- Also ensure the trigger is properly set up
DROP TRIGGER IF EXISTS log_user_profile_changes ON public.user_profile;

CREATE TRIGGER log_user_profile_changes
  AFTER UPDATE OF role ON public.user_profile
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION log_user_profile_activity();

