# Diagnostic Guide: Vehicle Updates Not Persisting

## Symptoms
- ✅ API calls return 200/204 (success)
- ✅ No console errors
- ❌ Changes don't persist after page reload
- ❌ Database shows no changes

## Root Cause
This is a **classic RLS policy issue**. When PostgreSQL RLS blocks an UPDATE due to a missing `WITH CHECK` clause, it can return success (200) but silently fail to update the row.

## Diagnostic Steps

### Step 1: Verify RLS Policy Structure

Run this query in your Supabase SQL Editor:

```sql
-- Check if WITH CHECK clause exists
SELECT 
    schemaname,
    tablename,
    policyname,
    qual AS using_clause,
    with_check AS with_check_clause,
    CASE 
        WHEN with_check IS NULL THEN '❌ MISSING - Updates will fail!'
        WHEN qual = with_check THEN '✅ CORRECT'
        ELSE '⚠️ WARNING - Clauses differ'
    END AS status
FROM pg_policies
WHERE tablename = 'user_vehicle' 
  AND policyname = 'user_vehicle_update_self';
```

**Expected Result**: Should show `✅ CORRECT` with both `using_clause` and `with_check_clause` populated.

**If Missing**: You'll see `❌ MISSING - Updates will fail!` - this confirms the issue.

### Step 2: Test Update Directly in Database

Run this query (replace `YOUR_VEHICLE_ID` and `YOUR_USER_ID`):

```sql
-- Test if you can update directly (bypasses RLS if run as service_role)
-- This helps confirm if it's an RLS issue or something else
UPDATE user_vehicle 
SET current_status = 'parked' 
WHERE id = 'YOUR_VEHICLE_ID' 
  AND owner_id = 'YOUR_USER_ID'
RETURNING id, current_status;
```

If this works but the API doesn't, it confirms RLS is blocking.

### Step 3: Check API Response Details

After making an update attempt, check the browser console for:
- The API response object
- Any `updatedVehicle` data
- Whether `result.success` is true
- Whether `result.vehicle.current_status` matches what you tried to set

The improved error handling will now show:
- If RLS is blocking (403 error with hint)
- If update returned no data (500 error)
- If values don't match (500 error)

## Solution

**Run the SQL migration** `fix_user_vehicle_update_rls.sql` in your Supabase SQL Editor.

This will:
1. Add the missing `WITH CHECK` clause
2. Verify the policy was updated correctly

## After Running Migration

1. **Verify the policy** using `verify_rls_policy.sql`
2. **Test an update** - it should now persist
3. **Check console logs** - you should see "✅ Vehicle updated successfully"

## Why This Happens

PostgreSQL RLS requires **both** clauses for UPDATE:
- **USING**: Checks if you can see the row (old values)
- **WITH CHECK**: Checks if you can update to new values

Without `WITH CHECK`, PostgreSQL can:
- Return success (200)
- But silently block the actual UPDATE
- This is why you see 200 responses but no persistence

## Alternative: Use Service Role (Not Recommended)

If you can't run the migration immediately, you could temporarily use service_role for updates, but this bypasses RLS security and is NOT recommended for production.

