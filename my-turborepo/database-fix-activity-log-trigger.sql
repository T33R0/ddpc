-- Fix for activity_log trigger type mismatch
-- The error "CASE types uuid and text cannot be matched" suggests a trigger
-- is trying to compare UUID with text incorrectly

-- First, let's check if there are any triggers on user_profile that log to activity_log
-- and fix them to handle types correctly

-- Drop any existing problematic triggers (we'll recreate them properly)
DROP TRIGGER IF EXISTS log_user_profile_changes ON public.user_profile;
DROP TRIGGER IF EXISTS audit_user_profile ON public.user_profile;

-- Create a proper trigger function that handles type casting correctly
CREATE OR REPLACE FUNCTION log_user_profile_activity()
RETURNS TRIGGER AS $$
DECLARE
  old_role_text text;
  new_role_text text;
BEGIN
  -- Convert enum to text for comparison and storage
  old_role_text := CASE 
    WHEN OLD.role IS NULL THEN NULL::text
    ELSE OLD.role::text
  END;
  
  new_role_text := CASE 
    WHEN NEW.role IS NULL THEN NULL::text
    ELSE NEW.role::text
  END;

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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER log_user_profile_changes
  AFTER UPDATE ON public.user_profile
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION log_user_profile_activity();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_user_profile_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_profile_activity() TO service_role;

