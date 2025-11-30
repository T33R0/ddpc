# Vehicle Status/Privacy Update Persistence Fix

## Issues Fixed

### 1. ✅ Build Error - Static Rendering Warning
**Problem**: Vercel build error about `/garage` route using cookies and not being statically renderable.

**Fix**: Added dynamic rendering configuration to the garage page:
```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

**Justification**: The garage page uses cookies for authentication (via `createClient()`), so it must be dynamically rendered. This is expected behavior and not an error - we're just explicitly telling Next.js to handle it as dynamic.

---

### 2. ✅ Vehicle Status/Privacy Updates Not Persisting
**Problem**: Changes to vehicle status (via drag-and-drop or dropdown) and privacy settings weren't persisting after page reload.

**Root Causes**:
1. **RLS Policy Missing WITH CHECK**: The `user_vehicle_update_self` policy was missing the `WITH CHECK` clause (already fixed with SQL migration)
2. **Insufficient Refresh Logic**: Updates were happening but UI wasn't refreshing properly
3. **Missing Error Handling**: Failures were silent, making debugging difficult

**Fixes Applied**:

#### A. Garage Page - Drag and Drop Updates
- Added better error handling with user-facing alerts
- Added delayed page reload after successful update to ensure persistence
- Added response parsing to log success/failure

#### B. Vehicle Detail Page - Status/Privacy Dropdowns
- Added `router.refresh()` before reload to update server state
- Added delayed page reload for both status and privacy updates
- Added error handling with user-facing alerts
- Added `useRouter` hook to StatusBadge and PrivacyBadge components

**Files Modified**:
- `apps/web/src/app/garage/page.tsx` - Added dynamic rendering config
- `apps/web/src/features/garage/GarageContent.tsx` - Improved update handling
- `apps/web/src/features/vehicle/VehicleDetailPageClient.tsx` - Improved update handling

---

## Important: Database Migration Still Required

**CRITICAL**: You must run the SQL migration file `fix_user_vehicle_update_rls.sql` in your Supabase database. Without this, the RLS policy will still block UPDATE operations.

The migration adds the missing `WITH CHECK` clause:
```sql
ALTER POLICY "user_vehicle_update_self" ON public.user_vehicle
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);
```

---

## Testing Checklist

After applying these fixes AND running the SQL migration:

1. **Garage Page - Drag and Drop**:
   - [ ] Drag vehicle from Active to Stored gallery
   - [ ] Changes persist after page reload
   - [ ] Drag vehicle from Stored to Active gallery
   - [ ] Changes persist after page reload

2. **Vehicle Detail Page - Status Dropdown**:
   - [ ] Change status via dropdown
   - [ ] Changes persist after page reload
   - [ ] Status reflects correctly in garage page

3. **Vehicle Detail Page - Privacy Dropdown**:
   - [ ] Change privacy from Public to Private
   - [ ] Changes persist after page reload
   - [ ] Change privacy from Private to Public
   - [ ] Changes persist after page reload

4. **Error Handling**:
   - [ ] If update fails, user sees error message
   - [ ] Console shows detailed error information

---

## Why the Delayed Reload?

The delayed reload (`setTimeout(() => window.location.reload(), 500-1000ms)`) ensures:
1. The API request completes
2. The database transaction commits
3. The server-side cache is invalidated via `revalidatePath()`
4. The page reloads with fresh data from the database

This is a temporary solution. In a production app, you might use:
- Real-time subscriptions (Supabase Realtime)
- Optimistic updates with rollback on error
- Server Actions instead of API routes

