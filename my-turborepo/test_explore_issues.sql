-- Check RLS status of vehicle_data
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'vehicle_data';

-- Test get_vehicle_filter_options
SELECT get_vehicle_filter_options();

-- Test get_unique_vehicles_with_trims with "2008 BMW"
SELECT * FROM get_unique_vehicles_with_trims(
  limit_param => 10,
  search_query => '2008 BMW'
);

-- Test get_unique_vehicles_with_trims with "BMW" (should work)
SELECT * FROM get_unique_vehicles_with_trims(
  limit_param => 10,
  search_query => 'BMW'
);
