-- Add notification preference columns to user_profile
ALTER TABLE user_profile
ADD COLUMN IF NOT EXISTS notify_on_new_user BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notify_on_issue_report BOOLEAN DEFAULT FALSE;

-- Function to auto-enable notifications for admins
CREATE OR REPLACE FUNCTION enable_admin_notifications()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' AND (OLD.role IS NULL OR OLD.role != 'admin') THEN
    NEW.notify_on_new_user := true;
    NEW.notify_on_issue_report := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run the function on role change
DROP TRIGGER IF EXISTS on_role_change_enable_notifications ON user_profile;
CREATE TRIGGER on_role_change_enable_notifications
BEFORE UPDATE ON user_profile
FOR EACH ROW
EXECUTE FUNCTION enable_admin_notifications();
