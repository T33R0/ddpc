# Database and UI Pipeline Fixes Summary

## Issues Identified and Fixed

### 1. ✅ Mods Table Schema Mismatch
**Problem**: The `mods` table doesn't have `title` or `description` columns, but the code was trying to insert/select them.

**Root Cause**: The database schema uses:
- `notes` (text) - for storing modification description
- `mod_item_id` (uuid, FK to `mod_items`) - for linking to predefined mod items

**Fixes Applied**:
- Updated `/api/garage/add-mod/route.ts` to use `notes` instead of `title`/`description`
- Updated `/api/garage/log-mod/route.ts` to use `notes` instead of `title`/`description`
- Updated `AddModDialog.tsx` to combine title and description into `notes` field
- Updated `getVehicleModsData.ts` to:
  - Select `mod_item` (joined) and `notes` instead of `title`/`description`
  - Parse `notes` or use `mod_item.name` as title when displaying

**Justification**: The database schema is the source of truth. The code must match the actual table structure. Using `mod_item_id` allows linking to predefined mod items, while `notes` provides flexibility for free-text entries.

---

### 2. ✅ Vehicle Status/Privacy Update Persistence
**Problem**: Vehicle status and privacy changes weren't persisting after page reload.

**Root Cause**: The RLS policy for `user_vehicle` UPDATE operations was missing the `WITH CHECK` clause, which is required for UPDATE operations in PostgreSQL RLS.

**Fixes Applied**:
- Created `fix_user_vehicle_update_rls.sql` migration file to add `WITH CHECK` clause
- Fixed syntax error in `/api/garage/update-vehicle/route.ts` (missing brace)

**Justification**: PostgreSQL RLS requires both `USING` (to check if you can see the row) and `WITH CHECK` (to check if you can update it to new values) for UPDATE operations. Without `WITH CHECK`, the policy allows seeing the row but blocks the actual update.

**Action Required**: Run the SQL migration file `fix_user_vehicle_update_rls.sql` in your Supabase database.

---

### 3. ✅ Service Modal Hanging
**Problem**: The "Add Service Entry" modal was hanging on "Loading categories...".

**Root Cause**: The modal was trying to fetch service categories client-side, but the data was already available from the server component.

**Fixes Applied**:
- Updated `AddServiceDialog.tsx` to accept `initialCategories` and `initialItems` as props
- Updated `ServicePageClient.tsx` to pass pre-loaded categories and items to the dialog
- Modified the fetch logic to use props first, only fetching if not provided

**Justification**: Server-side data fetching is more reliable and avoids client-side authentication issues. The categories are already fetched in the server component, so passing them as props eliminates unnecessary client-side requests.

---

### 4. ✅ Service History Tab Blank
**Problem**: The service history tab was showing blank even when history entries existed.

**Root Cause**: The query was filtering by `lte('event_date', new Date().toISOString())` but should filter by `status = 'History'` instead.

**Fixes Applied**:
- Updated `/app/vehicle/[id]/service/page.tsx` to filter by `status = 'History'` instead of date

**Justification**: The `maintenance_log` table uses a `status` field ('History' or 'Plan') to distinguish between completed services and planned services. Filtering by date alone doesn't account for entries that might have future dates but are marked as 'History'.

---

## Files Modified

### API Routes
- `apps/web/src/app/api/garage/add-mod/route.ts`
- `apps/web/src/app/api/garage/log-mod/route.ts`
- `apps/web/src/app/api/garage/update-vehicle/route.ts`

### Components
- `apps/web/src/features/mods/components/AddModDialog.tsx`
- `apps/web/src/features/mods/lib/getVehicleModsData.ts`
- `apps/web/src/features/service/components/AddServiceDialog.tsx`
- `apps/web/src/features/service/ServicePageClient.tsx`

### Server Components
- `apps/web/src/app/vehicle/[id]/service/page.tsx`

### Database Migrations
- `fix_user_vehicle_update_rls.sql` (NEW - needs to be run)

---

## Testing Checklist

After applying these fixes:

1. **Mods Page**:
   - [ ] Can add a new mod entry
   - [ ] Mod entries display correctly with title and description
   - [ ] No errors about missing 'title' column

2. **Garage Page**:
   - [ ] Drag and drop vehicle between Active/Stored galleries persists after reload
   - [ ] Vehicle status changes persist in database
   - [ ] Privacy changes (public/private) persist

3. **Service Page**:
   - [ ] "Add Service" modal opens without hanging
   - [ ] Service categories load correctly
   - [ ] Service history tab shows entries
   - [ ] Can add new service entries

---

## Database Migration Required

**IMPORTANT**: You must run the SQL migration file to fix the vehicle update issue:

```bash
# Run this SQL in your Supabase SQL editor or via migration
psql -f fix_user_vehicle_update_rls.sql
```

Or execute the contents of `fix_user_vehicle_update_rls.sql` directly in Supabase SQL editor.

