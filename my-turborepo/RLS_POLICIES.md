# Current RLS Policies

**Last Updated**: Most current database state - simplified direct ownership system

## user_profile
- `up_insert_self` (INSERT): `((auth.uid() = user_id) AND (role = 'user'::user_role) AND (plan = 'free'::text) AND (NOT is_user_banned(auth.uid())))`
- `up_read_public` (SELECT): `(is_public = true)`
- `up_read_self` (SELECT): `(auth.uid() = user_id)`
- `up_update_admin` (UPDATE): `(((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR (EXISTS ( SELECT 1 FROM user_profile user_profile_1 WHERE ((user_profile_1.user_id = auth.uid()) AND (user_profile_1.role = 'admin'::user_role)))))`
- `up_update_self` (UPDATE): `((auth.uid() = user_id) AND (NOT is_user_banned(auth.uid())))`
- `zz_combined_select` (SELECT): `((( SELECT auth.uid() AS uid) = user_id) OR (is_public = true))`

## user_vehicle
- `Users can manage their own vehicles` (ALL): `(owner_id = auth.uid())`
- `Users can view their own vehicles` (SELECT): `(owner_id = auth.uid())`
- `public read vehicles with privacy=public` (SELECT): `(privacy = 'public'::text)`
- `vehicle_select_public` (SELECT): `(privacy = 'public'::text)`

## vehicle_data
- `read vehicle_data` (SELECT): `true`
- `vd_read` (SELECT): `true`

## Notes
- **FINAL STATE**: Complete rebuild with direct user-to-vehicle ownership
- **REMOVED**: All garage/garage_member/event/event_part/part tables and policies
- **SIMPLIFIED**: Direct `owner_id` checks eliminate all recursion issues
- **PERFECT FLOW**: Clean, working vehicle collection system
