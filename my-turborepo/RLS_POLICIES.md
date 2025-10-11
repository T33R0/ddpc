# Current RLS Policies

Based on the database query results provided, here are the **CURRENTLY ACTIVE** RLS policies:

## event
- `Users can manage events for their vehicles` (ALL): `(vehicle_id IN ( SELECT user_vehicle.id FROM user_vehicle WHERE (user_vehicle.garage_id IN ( SELECT garage.id FROM garage WHERE (garage.owner_id = auth.uid())))))`
- `event_select_public` (SELECT): `(EXISTS ( SELECT 1 FROM user_vehicle v WHERE ((v.id = event.vehicle_id) AND (v.privacy = 'public'::text))))`

## event_part
- `Users can manage event parts for their vehicles` (ALL): `(event_id IN ( SELECT event.id FROM event WHERE (event.vehicle_id IN ( SELECT user_vehicle.id FROM user_vehicle WHERE (user_vehicle.garage_id IN ( SELECT garage.id FROM garage WHERE (garage.owner_id = auth.uid())))))))`

## garage
- `Users can manage their own garages` (ALL): `(owner_id = auth.uid())`

## part
- `part_insert` (INSERT): `null` (true)
- `part_read` (SELECT): `true`

## user_profile
- `up_insert_self` (INSERT): `null` ((auth.uid() = user_id) AND (role = 'user'::user_role) AND (plan = 'free'::text) AND (NOT is_user_banned(auth.uid())))
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
- **MAJOR CHANGE**: Garage table removed entirely - direct user-to-vehicle ownership
- `user_vehicle.owner_id` now references `auth.users.id` directly
- No more garage_member table or multi-user sharing functionality
- Simplified RLS policies with direct ownership checks
- No recursion issues - clean, direct permission model
