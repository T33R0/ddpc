-- Phase 3: Fluids Tracking
-- New tables for tracking vehicle fluids (oil, coolant, diff fluid, etc.)
-- and their change history, with health tracking via lifespan.

-- 1. vehicle_fluids: Tracks current fluid state per vehicle
CREATE TABLE IF NOT EXISTS public.vehicle_fluids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.user_vehicle(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    fluid_type TEXT NOT NULL CHECK (fluid_type IN (
        'engine_oil', 'coolant', 'brake_fluid', 'transmission',
        'differential', 'power_steering', 'transfer_case', 'custom'
    )),
    specification TEXT, -- e.g. "75W-90 GL-5", "5W-30 Full Synthetic"
    capacity TEXT, -- e.g. "2.75 quarts", "4.5 liters"

    last_changed_at TIMESTAMPTZ,
    last_changed_miles INTEGER,

    lifespan_months INTEGER,
    lifespan_miles INTEGER,

    status TEXT CHECK (status IN ('active', 'due', 'overdue')) DEFAULT 'active',
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. fluid_changes: History log of fluid changes
CREATE TABLE IF NOT EXISTS public.fluid_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fluid_id UUID NOT NULL REFERENCES public.vehicle_fluids(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL, -- optional link to the job that performed the change

    changed_at TIMESTAMPTZ NOT NULL,
    odometer INTEGER,

    old_specification TEXT,
    new_specification TEXT NOT NULL,
    change_reason TEXT CHECK (change_reason IN ('scheduled', 'repair', 'flush', 'top_off')) DEFAULT 'scheduled',

    cost NUMERIC(10, 2),
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for vehicle_fluids
ALTER TABLE public.vehicle_fluids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vehicle fluids"
    ON public.vehicle_fluids FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vehicle fluids"
    ON public.vehicle_fluids FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicle fluids"
    ON public.vehicle_fluids FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicle fluids"
    ON public.vehicle_fluids FOR DELETE
    USING (auth.uid() = user_id);

-- RLS for fluid_changes (via join to vehicle_fluids)
ALTER TABLE public.fluid_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own fluid changes"
    ON public.fluid_changes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.vehicle_fluids vf
            WHERE vf.id = fluid_changes.fluid_id
            AND vf.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own fluid changes"
    ON public.fluid_changes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.vehicle_fluids vf
            WHERE vf.id = fluid_changes.fluid_id
            AND vf.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own fluid changes"
    ON public.fluid_changes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.vehicle_fluids vf
            WHERE vf.id = fluid_changes.fluid_id
            AND vf.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own fluid changes"
    ON public.fluid_changes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.vehicle_fluids vf
            WHERE vf.id = fluid_changes.fluid_id
            AND vf.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_fluids_vehicle_id ON public.vehicle_fluids(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_fluids_user_id ON public.vehicle_fluids(user_id);
CREATE INDEX IF NOT EXISTS idx_fluid_changes_fluid_id ON public.fluid_changes(fluid_id);
CREATE INDEX IF NOT EXISTS idx_fluid_changes_job_id ON public.fluid_changes(job_id);
