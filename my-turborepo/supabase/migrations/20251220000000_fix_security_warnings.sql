-- Fix security_definer_view error for v_vehicle_data_typed
-- Make the view use the invoker's permissions (RLS)
CREATE OR REPLACE VIEW v_vehicle_data_typed WITH (security_invoker = true) AS
SELECT
    *,
    CAST(NULLIF(regexp_replace(year::text, '[^0-9]', '', 'g'), '') AS INTEGER) as year_num,
    CAST(NULLIF(regexp_replace(horsepower_hp::text, '[^0-9]', '', 'g'), '') AS INTEGER) as horsepower_hp_num,
    CAST(NULLIF(regexp_replace(torque_ft_lbs::text, '[^0-9]', '', 'g'), '') AS INTEGER) as torque_ft_lbs_num,
    CAST(NULLIF(regexp_replace(doors::text, '[^0-9]', '', 'g'), '') AS INTEGER) as doors_num,
    CAST(NULLIF(regexp_replace(total_seating::text, '[^0-9]', '', 'g'), '') AS INTEGER) as total_seating_num,
    CAST(NULLIF(regexp_replace(cylinders::text, '[^0-9]', '', 'g'), '') AS INTEGER) as cylinders_num,
    CAST(NULLIF(regexp_replace(length_in::text, '[^0-9.]', '', 'g'), '') AS FLOAT) as length_in_num,
    CAST(NULLIF(regexp_replace(width_in::text, '[^0-9.]', '', 'g'), '') AS FLOAT) as width_in_num,
    CAST(NULLIF(regexp_replace(height_in::text, '[^0-9.]', '', 'g'), '') AS FLOAT) as height_in_num
FROM vehicle_data;

-- Fix function_search_path_mutable for get_vehicle_countries
-- It was already SECURITY DEFINER, just adding search_path
CREATE OR REPLACE FUNCTION get_vehicle_countries()
RETURNS TABLE (country text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT country_of_origin
  FROM vehicle_data
  WHERE country_of_origin IS NOT NULL
  ORDER BY country_of_origin;
$$;

-- Fix function_search_path_mutable for enable_admin_notifications
CREATE OR REPLACE FUNCTION enable_admin_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin' AND (OLD.role IS NULL OR OLD.role != 'admin') THEN
    NEW.notify_on_new_user := true;
    NEW.notify_on_issue_report := true;
  END IF;
  RETURN NEW;
END;
$$;
