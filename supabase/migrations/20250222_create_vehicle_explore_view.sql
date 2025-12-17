-- Create a view that casts text columns to appropriate numeric types for reliable filtering
CREATE OR REPLACE VIEW v_vehicle_data_typed AS
SELECT
    *,
    CAST(NULLIF(regexp_replace(year, '[^0-9]', '', 'g'), '') AS INTEGER) as year_num,
    CAST(NULLIF(regexp_replace(horsepower_hp, '[^0-9]', '', 'g'), '') AS INTEGER) as horsepower_hp_num,
    CAST(NULLIF(regexp_replace(torque_ft_lbs, '[^0-9]', '', 'g'), '') AS INTEGER) as torque_ft_lbs_num,
    CAST(NULLIF(regexp_replace(doors, '[^0-9]', '', 'g'), '') AS INTEGER) as doors_num,
    CAST(NULLIF(regexp_replace(total_seating, '[^0-9]', '', 'g'), '') AS INTEGER) as total_seating_num,
    CAST(NULLIF(regexp_replace(cylinders, '[^0-9]', '', 'g'), '') AS INTEGER) as cylinders_num,
    CAST(NULLIF(regexp_replace(length_in, '[^0-9.]', '', 'g'), '') AS FLOAT) as length_in_num,
    CAST(NULLIF(regexp_replace(width_in, '[^0-9.]', '', 'g'), '') AS FLOAT) as width_in_num,
    CAST(NULLIF(regexp_replace(height_in, '[^0-9.]', '', 'g'), '') AS FLOAT) as height_in_num
FROM vehicle_data;

-- Function to get distinct countries
CREATE OR REPLACE FUNCTION get_vehicle_countries()
RETURNS TABLE (country text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT DISTINCT country_of_origin
  FROM vehicle_data
  WHERE country_of_origin IS NOT NULL
  ORDER BY country_of_origin;
$$;
