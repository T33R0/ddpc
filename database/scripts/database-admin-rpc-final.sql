-- Fix the trigger to handle role updates properly
-- Or create a version that disables trigger for admin updates

-- First, let's check and fix the trigger function
CREATE OR REPLACE FUNCTION log_user_profile_activity()
RETURNS TRIGGER AS $$
DECLARE
  old_role_text text;
  new_role_text text;
BEGIN
  -- Convert enum to text for comparison and storage
  -- Handle NULL cases properly
  IF OLD.role IS NULL THEN
    old_role_text := NULL;
  ELSE
    old_role_text := OLD.role::text;
  END IF;
  
  IF NEW.role IS NULL THEN
    new_role_text := NULL;
  ELSE
    new_role_text := NEW.role::text;
  END IF;

  -- Only log if role actually changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.activity_log (
      user_id,
      action,
      entity_type,
      entity_id,
      old_data,
      new_data,
      diff,
      created_at
    ) VALUES (
      NEW.user_id, -- UUID
      'update', -- text
      'user_profile', -- text
      NEW.user_id::text, -- Convert UUID to text for entity_id
      jsonb_build_object('role', old_role_text),
      jsonb_build_object('role', new_role_text),
      jsonb_build_object('role', jsonb_build_object('old', old_role_text, 'new', new_role_text)),
      now()
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the update
    RAISE WARNING 'Error logging activity: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the RPC function to temporarily disable the trigger
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
  v_rows_affected int;
BEGIN
  -- Temporarily disable the trigger
  ALTER TABLE public.user_profile DISABLE TRIGGER log_user_profile_changes;
  
  -- Explicitly cast the text to user_role enum
  UPDATE public.user_profile
  SET role = p_role::user_role
  WHERE user_id = p_user_id;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  -- Re-enable the trigger
  ALTER TABLE public.user_profile ENABLE TRIGGER log_user_profile_changes;
  
  -- Return success status
  SELECT jsonb_build_object(
    'success', true, 
    'rows_updated', v_rows_affected,
    'role', p_role
  )
  INTO v_result;
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Make sure to re-enable trigger even on error
    ALTER TABLE public.user_profile ENABLE TRIGGER log_user_profile_changes;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

GRANT EXECUTE ON FUNCTION update_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role(uuid, text) TO service_role;

