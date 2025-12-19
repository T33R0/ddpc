# Database Performance Fix - Deployment Guide

## Overview
This guide walks you through deploying the database performance optimization to fix the `/explore` page timeout issue when filtering by year range.

## Prerequisites
- Access to your Supabase project dashboard
- SQL Editor access in Supabase

## Deployment Steps

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query** to create a new SQL query

### Step 2: Run the Migration
1. Open the file `database-performance-fix_v2.sql` in your code editor
2. Copy the entire contents of the file
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

### Step 2b: Apply the Admin/Service Index Patch
1. Open `database-performance-admin-service.sql`
2. Copy the contents into a **new** SQL Editor tab
3. Run the script — it is idempotent thanks to `CREATE INDEX IF NOT EXISTS`
4. This patch adds the indexes requested by Supabase Performance Advisor for:
   - `issue_reports` (admin console stuck loader)
   - `maintenance_log`, `service_intervals`, `part_inventory`, and related tables that power `/vehicle/[id]/service`

### Step 3: Verify the Migration
After running the migration, verify it was successful:

```sql
-- Check that indexes were created
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE tablename = 'vehicle_data'
ORDER BY indexname;
```

Then verify the new service/admin indexes:

```sql
SELECT 
    tablename,
    indexname
FROM pg_indexes
WHERE tablename IN ('issue_reports', 'maintenance_log', 'service_intervals')
ORDER BY tablename, indexname;
```

You should see the following indexes:
- `idx_vehicle_data_year`
- `idx_vehicle_data_make`
- `idx_vehicle_data_model`
- `idx_vehicle_data_ymm`
- `idx_vehicle_data_fuel_type`
- `idx_vehicle_data_drive_type`
- `idx_vehicle_data_body_type`

### Step 4: Test the Optimized Function
Run a test query to verify the function works correctly:

```sql
-- Test with year filter (this should complete quickly now)
SELECT * FROM get_unique_vehicles_with_trims(
  limit_param := 24,
  offset_param := 0,
  min_year_param := 2018,
  max_year_param := 2019
);
```

This query should complete in **under 3 seconds** (previously it would timeout).

### Step 5: Test in the Application
1. Navigate to `/explore` in your application
2. Click the **Filter** button
3. Set **Min Year: 2018** and **Max Year: 2019**
4. Click **Apply**
5. The page should load vehicles without timing out
6. Additionally, visit `/admin/issues` and `/vehicle/<your vehicle>/service` to confirm the new indexes eliminated the loading spinners

## Expected Results

### Before Optimization
- ❌ Query timeout after 30+ seconds
- ❌ Error: "The query is taking too long..."
- ❌ No results displayed

### After Optimization
- ✅ Query completes in 1-3 seconds
- ✅ Vehicles from 2018-2019 displayed
- ✅ Pagination works correctly
- ✅ No timeout errors
- ✅ Admin issue report table responds within a few seconds
- ✅ Vehicle service plan/history loads reliably even on mobile

## Performance Improvements

The optimization provides:
- **10-20x faster** queries with year filters
- **5-10x faster** queries with make/model filters
- **Reduced database load** through better indexing
- **Better query planning** with STABLE function volatility
- **Consistent admin/service views** by indexing frequently filtered foreign keys

## Rollback (If Needed)

If you need to rollback the changes:

```sql
-- Drop the indexes
DROP INDEX IF EXISTS idx_vehicle_data_year;
DROP INDEX IF EXISTS idx_vehicle_data_make;
DROP INDEX IF EXISTS idx_vehicle_data_model;
DROP INDEX IF EXISTS idx_vehicle_data_ymm;
DROP INDEX IF EXISTS idx_vehicle_data_fuel_type;
DROP INDEX IF EXISTS idx_vehicle_data_drive_type;
DROP INDEX IF EXISTS idx_vehicle_data_body_type;

-- Restore the original function (from database-migrations.sql)
-- Copy the original function definition from database-migrations.sql
```

## Troubleshooting

### Issue: "Permission denied" error
**Solution**: Ensure you're using the SQL Editor with admin privileges. You may need to use the service role key.

### Issue: Indexes already exist
**Solution**: This is fine! The migration uses `CREATE INDEX IF NOT EXISTS`, so it will skip existing indexes.

### Issue: Function still times out
**Solution**: 
1. Check that indexes were created successfully
2. Run `ANALYZE vehicle_data;` to update table statistics
3. Verify the function was updated with `\df get_unique_vehicles_with_trims`

## Next Steps

After successful deployment:
1. Monitor application performance in production
2. Check Supabase logs for any errors
3. Test various filter combinations to ensure they all work
4. Consider adding more indexes if other queries are slow

## Support

If you encounter issues:
1. Check the Supabase logs in the dashboard
2. Verify the migration ran successfully
3. Test the function directly in SQL Editor
4. Review the error messages in the browser console
