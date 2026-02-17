-- Phase 4: Inspections & Findings Tracking
-- New tables for recording vehicle inspections and their findings,
-- linking findings to parts/fluids and to the jobs that resolve them.

-- 1. inspections: Records a vehicle inspection event
CREATE TABLE IF NOT EXISTS public.inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.user_vehicle(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    inspection_date TIMESTAMPTZ NOT NULL,
    odometer INTEGER,

    inspection_type TEXT NOT NULL CHECK (inspection_type IN (
        'routine', 'pre_trip', 'issue_investigation', 'post_repair'
    )),

    summary TEXT,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. inspection_findings: Individual findings from an inspection
CREATE TABLE IF NOT EXISTS public.inspection_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,

    -- Optional links to what the finding is about
    inventory_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL,
    fluid_id UUID REFERENCES public.vehicle_fluids(id) ON DELETE SET NULL,

    finding TEXT NOT NULL, -- e.g. "Rear diff seal leaking"
    severity TEXT NOT NULL CHECK (severity IN ('info', 'monitor', 'action_needed', 'critical')) DEFAULT 'info',

    action_taken TEXT, -- e.g. "Scheduled seal replacement"
    resolved_job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('open', 'monitoring', 'resolved')) DEFAULT 'open',

    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add inspection_finding_id to inventory (links part replacement to the finding that triggered it)
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS inspection_finding_id UUID REFERENCES public.inspection_findings(id) ON DELETE SET NULL;

-- RLS for inspections
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own inspections"
    ON public.inspections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inspections"
    ON public.inspections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inspections"
    ON public.inspections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inspections"
    ON public.inspections FOR DELETE
    USING (auth.uid() = user_id);

-- RLS for inspection_findings (via join to inspections)
ALTER TABLE public.inspection_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own inspection findings"
    ON public.inspection_findings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.inspections i
            WHERE i.id = inspection_findings.inspection_id
            AND i.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own inspection findings"
    ON public.inspection_findings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.inspections i
            WHERE i.id = inspection_findings.inspection_id
            AND i.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own inspection findings"
    ON public.inspection_findings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.inspections i
            WHERE i.id = inspection_findings.inspection_id
            AND i.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own inspection findings"
    ON public.inspection_findings FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.inspections i
            WHERE i.id = inspection_findings.inspection_id
            AND i.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_id ON public.inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_inspections_user_id ON public.inspections(user_id);
CREATE INDEX IF NOT EXISTS idx_inspection_findings_inspection_id ON public.inspection_findings(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_findings_inventory_id ON public.inspection_findings(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inspection_findings_fluid_id ON public.inspection_findings(fluid_id);
CREATE INDEX IF NOT EXISTS idx_inspection_findings_resolved_job_id ON public.inspection_findings(resolved_job_id);
CREATE INDEX IF NOT EXISTS idx_inventory_inspection_finding_id ON public.inventory(inspection_finding_id);
