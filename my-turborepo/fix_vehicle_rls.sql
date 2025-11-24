-- Fix RLS policies for user_vehicle and service_intervals to ensure users can add vehicles
-- and seeing the seeding process work.

-- ==========================================
-- 1. user_vehicle POLICIES
-- ==========================================

-- Drop potentially conflicting policies
DROP POLICY IF EXISTS "Users can manage their own vehicles" ON public.user_vehicle;
DROP POLICY IF EXISTS "Users can view their own vehicles" ON public.user_vehicle;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_vehicle;
DROP POLICY IF EXISTS "Enable read for authenticated users only" ON public.user_vehicle;
DROP POLICY IF EXISTS "user_vehicle_insert_self" ON public.user_vehicle;
DROP POLICY IF EXISTS "user_vehicle_select_combined" ON public.user_vehicle;
DROP POLICY IF EXISTS "user_vehicle_update_self" ON public.user_vehicle;
DROP POLICY IF EXISTS "user_vehicle_delete_self" ON public.user_vehicle;

-- Enable RLS
ALTER TABLE public.user_vehicle ENABLE ROW LEVEL SECURITY;

-- Allow users to INSERT a vehicle if they are the owner
CREATE POLICY "user_vehicle_insert_self" ON public.user_vehicle
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Allow users to SELECT their own vehicles
CREATE POLICY "user_vehicle_select_self" ON public.user_vehicle
    FOR SELECT
    USING (auth.uid() = owner_id);

-- Allow users to UPDATE their own vehicles
CREATE POLICY "user_vehicle_update_self" ON public.user_vehicle
    FOR UPDATE
    USING (auth.uid() = owner_id);

-- Allow users to DELETE their own vehicles
CREATE POLICY "user_vehicle_delete_self" ON public.user_vehicle
    FOR DELETE
    USING (auth.uid() = owner_id);


-- ==========================================
-- 2. service_intervals POLICIES
-- ==========================================

-- Drop potentially conflicting policies
DROP POLICY IF EXISTS "Users can manage their own service intervals" ON public.service_intervals;
DROP POLICY IF EXISTS "service_intervals_insert_self" ON public.service_intervals;
DROP POLICY IF EXISTS "service_intervals_select_self" ON public.service_intervals;

-- Enable RLS
ALTER TABLE public.service_intervals ENABLE ROW LEVEL SECURITY;

-- Allow users to INSERT intervals if they own the vehicle
-- Note: This requires a join check or a subquery.
CREATE POLICY "service_intervals_insert_self" ON public.service_intervals
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_vehicle uv
            WHERE uv.id = user_vehicle_id
            AND uv.owner_id = auth.uid()
        )
    );

-- Allow users to SELECT intervals if they own the vehicle
CREATE POLICY "service_intervals_select_self" ON public.service_intervals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_vehicle uv
            WHERE uv.id = user_vehicle_id
            AND uv.owner_id = auth.uid()
        )
    );

-- Allow users to UPDATE intervals if they own the vehicle
CREATE POLICY "service_intervals_update_self" ON public.service_intervals
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_vehicle uv
            WHERE uv.id = user_vehicle_id
            AND uv.owner_id = auth.uid()
        )
    );

-- ==========================================
-- 3. maintenance_log POLICIES (Fixing Service History)
-- ==========================================

DROP POLICY IF EXISTS "maintenance_log_select_self" ON public.maintenance_log;
DROP POLICY IF EXISTS "maintenance_log_insert_self" ON public.maintenance_log;

ALTER TABLE public.maintenance_log ENABLE ROW LEVEL SECURITY;

-- Allow users to SELECT logs if they own the vehicle
CREATE POLICY "maintenance_log_select_self" ON public.maintenance_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_vehicle uv
            WHERE uv.id = user_vehicle_id
            AND uv.owner_id = auth.uid()
        )
    );

-- Allow users to INSERT logs if they own the vehicle
CREATE POLICY "maintenance_log_insert_self" ON public.maintenance_log
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_vehicle uv
            WHERE uv.id = user_vehicle_id
            AND uv.owner_id = auth.uid()
        )
    );
