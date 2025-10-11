# Supabase RLS Policy Breakdown

This document outlines the Row Level Security policies for the public schema, grouped by table. Each entry explains the rule's purpose, what actions it applies to, and the specific conditions for access and modification.

## Table: event

This table manages event records associated with specific vehicles.

### event_mutate_member

- **Applies To**: ALL (SELECT, INSERT, UPDATE, DELETE)
- **Rule**: A user can perform any action on an event if they are a member of the garage that the event's vehicle belongs to. This applies to both checking for access (USING) and validating new/updated data (WITH CHECK).
- **SQL**:
  ```sql
  -- USING and WITH CHECK
  EXISTS (
      SELECT 1
      FROM user_vehicle v
      JOIN garage_member gm ON gm.garage_id = v.garage_id
      WHERE v.id = event.vehicle_id AND gm.user_id = auth.uid()
  )
  ```

### event_select_member

- **Applies To**: SELECT
- **Rule**: A user can read an event if they are a member of the garage that the event's vehicle belongs to.
- **SQL**:
  ```sql
  -- USING
  EXISTS (
      SELECT 1
      FROM user_vehicle v
      JOIN garage_member gm ON gm.garage_id = v.garage_id
      WHERE v.id = event.vehicle_id AND gm.user_id = auth.uid()
  )
  ```

### event_select_public

- **Applies To**: SELECT
- **Rule**: Anyone can read an event if the associated vehicle's privacy is set to 'public'.
- **SQL**:
  ```sql
  -- USING
  EXISTS (
      SELECT 1
      FROM user_vehicle v
      WHERE v.id = event.vehicle_id AND v.privacy = 'public'::text
  )
  ```

---

## Table: event_part

This table links parts to specific events.

### eventpart_mutate_member

- **Applies To**: ALL
- **Rule**: A user can perform any action on an event part if they are a member of the garage associated with the parent event's vehicle.
- **SQL**:
  ```sql
  -- USING and WITH CHECK
  EXISTS (
      SELECT 1
      FROM event e
      JOIN user_vehicle v ON v.id = e.vehicle_id
      JOIN garage_member gm ON gm.garage_id = v.garage_id
      WHERE e.id = event_part.event_id AND gm.user_id = auth.uid()
  )
  ```

### eventpart_select_member

- **Applies To**: SELECT
- **Rule**: A user can read an event part if they are a member of the garage associated with the parent event's vehicle.
- **SQL**:
  ```sql
  -- USING
  EXISTS (
      SELECT 1
      FROM event e
      JOIN user_vehicle v ON v.id = e.vehicle_id
      JOIN garage_member gm ON gm.garage_id = v.garage_id
      WHERE e.id = event_part.event_id AND gm.user_id = auth.uid()
  )
  ```

---

## Table: garage

This table defines garages, which act as containers for vehicles and members.

### **[CORRECTED]** Garages are visible to members and owners

- **Applies To**: SELECT
- **Rule**: A user can read a garage's details if they are not banned AND they are either the owner or a member of that garage. This policy replaces the previous `garage members can select` and `garage_select` policies to resolve an infinite recursion issue.
- **SQL**:
  ```sql
  -- USING
  (
    (
      SELECT
        (NOT is_user_banned (auth.uid ()))
    )
    AND (
      (owner_id = auth.uid ())
      OR (
        EXISTS (
          SELECT
            1
          FROM
            garage_member gm
          WHERE
            ((gm.garage_id = garage.id) AND (gm.user_id = auth.uid ()))
        )
      )
    )
  )
  ```

### **[DEPRECATED]** garage members can select

- **Applies To**: SELECT
- **Rule**: A user can read a garage's details if they are a member of that garage. **This policy should be removed.**
- **SQL**:
  ```sql
  -- USING
  EXISTS (
      SELECT 1
      FROM garage_member gm
      WHERE gm.garage_id = garage.id AND gm.user_id = auth.uid()
  )
  ```

### garage_insert

- **Applies To**: INSERT
- **Rule**: A user can create a new garage provided they are not banned and they set themselves as the owner_id.
- **SQL**:
  ```sql
  -- WITH CHECK
  (NOT is_user_banned(auth.uid())) AND (owner_id = auth.uid())
  ```

### **[DEPRECATED]** garage_select

- **Applies To**: SELECT
- **Rule**: A user can read a garage's details if they are not banned AND they are either the owner or a member of that garage. **This policy should be removed.**
- **SQL**:
  ```sql
  -- USING
  (NOT is_user_banned(auth.uid())) AND (
      (owner_id = auth.uid()) OR
      (id IN (SELECT gm.garage_id FROM garage_member gm WHERE gm.user_id = auth.uid()))
  )
  ```

### garage_update

- **Applies To**: UPDATE
- **Rule**: A user can update a garage if they are the owner.
- **SQL**:
  ```sql
  -- USING and WITH CHECK
  (owner_id = auth.uid())
  ```

---

## Table: garage_member

This table manages user roles within a garage.

### members_can_view_garage_members

- **Applies To**: SELECT
- **Rule**: A user can read the list of members for a garage if they are the owner of that garage or a fellow member.
- **SQL**:
  ```sql
  -- USING
  garage_id IN (
      SELECT garage.id FROM garage WHERE garage.owner_id = auth.uid()
      UNION
      SELECT garage_member_1.garage_id FROM garage_member garage_member_1 WHERE garage_member_1.user_id = auth.uid()
  )
  ```

### owners_can_add_members

- **Applies To**: INSERT
- **Rule**: A user can add a new member to a garage if they are the owner of that garage.
- **SQL**:
  ```sql
  -- WITH CHECK
  garage_id IN (SELECT garage.id FROM garage WHERE garage.owner_id = auth.uid())
  ```

### owners_can_remove_members

- **Applies To**: DELETE
- **Rule**: A user can remove a member from a garage if they are the owner of that garage.
- **SQL**:
  ```sql
  -- USING
  garage_id IN (SELECT garage.id FROM garage WHERE garage.owner_id = auth.uid())
  ```

### owners_can_update_members

- **Applies To**: UPDATE
- **Rule**: A user can update a member's details (e.g., role) if they are the owner of that garage.
- **SQL**:
  ```sql
  -- USING
  garage_id IN (SELECT garage.id FROM garage WHERE garage.owner_id = auth.uid())
  ```

**Note**: There appear to be some duplicate or overlapping policies on this table (e.g., `gm delete by owner`, `gm_insert`). Consolidating them could simplify the ruleset.

---

## Table: part

This table contains a general list of parts.

### part_insert & part_read

- **Applies To**: INSERT and SELECT
- **Rule**: These policies are set to `true`, meaning any authenticated user can read from or add to the parts list.
- **SQL**:
  ```sql
  -- USING (for SELECT) and WITH CHECK (for INSERT)
  true
  ```

---

## Table: user_profile

This table stores user-specific information.

### up_insert_self

- **Applies To**: INSERT
- **Rule**: A new, non-banned user can create their own profile, but it must be created with the default user role and free plan.
- **SQL**:
  ```sql
  -- WITH CHECK
  (auth.uid() = user_id) AND
  (role = 'user'::user_role) AND
  (plan = 'free'::text) AND
  (NOT is_user_banned(auth.uid()))
  ```

### zz_combined_select (and up_read_public, up_read_self)

- **Applies To**: SELECT
- **Rule**: A user can read a profile if it is their own profile OR if the profile has `is_public = true`.
- **SQL**:
  ```sql
  -- USING
  ((SELECT auth.uid() AS uid) = user_id) OR (is_public = true)
  ```

### up_update_self

- **Applies To**: UPDATE
- **Rule**: A non-banned user can update their own profile, but this policy prevents them from changing their own role or plan.
- **SQL**:
  ```sql
  -- USING and WITH CHECK
  (auth.uid() = user_id) AND
  (NOT is_user_banned(auth.uid())) AND
  (role = (SELECT user_profile_1.role FROM user_profile user_profile_1 WHERE user_profile_1.user_id = auth.uid())) AND
  (plan = (SELECT user_profile_1.plan FROM user_profile user_profile_1 WHERE user_profile_1.user_id = auth.uid()))
  ```

### up_update_admin

- **Applies To**: UPDATE
- **Rule**: A user with the `service_role` key or a user whose profile role is `admin` can update any user's profile.
- **SQL**:
  ```sql
  -- USING and WITH CHECK
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR
  (EXISTS (
      SELECT 1
      FROM user_profile user_profile_1
      WHERE user_profile_1.user_id = auth.uid() AND user_profile_1.role = 'admin'::user_role
  ))
  ```

---

## Table: user_vehicle

This table contains vehicles owned by users and associated with garages.

### zz_combined_select (and other select policies)

- **Applies To**: SELECT
- **Rule**: A user can read a vehicle's details if any of these are true:
  - The vehicle's privacy is set to `PUBLIC`.
  - The user is a member of the vehicle's garage.
  - The user is the owner of the vehicle's garage.
  This policy also checks that the user is not banned.
- **SQL**:
  ```sql
  -- USING (Simplified Logic)
  (NOT is_user_banned(auth.uid())) AND (
      (privacy = 'PUBLIC'::text) OR
      (garage_id IN (SELECT garage_member.garage_id FROM garage_member WHERE garage_member.user_id = auth.uid())) OR
      (EXISTS (SELECT 1 FROM garage g WHERE g.id = user_vehicle.garage_id AND g.owner_id = auth.uid()))
  )
  ```

### vehicle_crud & vehicle_owner_can_modify

- **Applies To**: ALL
- **Rule**: A non-banned user can perform any action on a vehicle if they are a member or owner of the vehicle's garage. The `WITH CHECK` condition simply ensures the acting user is not banned.
- **SQL**:
  ```sql
  -- USING
  (NOT is_user_banned(auth.uid())) AND (
      (garage_id IN (SELECT garage_member.garage_id FROM garage_member WHERE garage_member.user_id = auth.uid())) OR
      (EXISTS (SELECT 1 FROM garage g WHERE g.id = user_vehicle.garage_id AND g.owner_id = auth.uid()))
  )
  -- WITH CHECK
  (NOT is_user_banned(auth.uid()))
  ```

---

## Table: vehicle_data

This table appears to hold static or public vehicle model information.

### read vehicle_data & vd_read

- **Applies To**: SELECT
- **Rule**: Set to `true`, meaning any authenticated user can read from this table.
- **SQL**:
  ```sql
  -- USING
  true
  ```
