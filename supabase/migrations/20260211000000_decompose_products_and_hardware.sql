-- Add columns to inventory table to support product splitting and hardware attachment

-- 1. parent_id: Links "Hardware" (e.g. bolts) to a "Parent Part" (e.g. Control Arm)
-- This allows hardware to be associated but effectively hidden/grouped with the main part.
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE;

-- 2. install_group_id: Links related parts together (e.g. Left and Right Struts from the same Kit)
-- This is a generated UUID that all sibling parts share. It's not a FK to another table.
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS install_group_id UUID;

-- 3. inventory_source_id: Links the installed parts back to the original "Kit" inventory item
-- This creates a lineage: Original Kit (Source) -> Installed Parts.
-- If the Kit is deleted, we keep the installed parts (SET NULL), or we could CASCADE. 
-- Keeping record seems safer for history preservation if the user deletes the "Kit" record later? 
-- Actually, if they delete the Kit from history, maybe parts should remain? Let's use SET NULL for safety.
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS inventory_source_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL;

-- 4. visibility: Controls where the part is shown in the UI
-- 'public': Standard part, shown in The Build list
-- 'hardware': Attached hardware, hidden from top level, shown in Part Detail
-- 'history_only': The original Kit item that was installed. It exists for the Logbook/Orders but is "consumed" and split, so not shown on The Build.
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS visibility TEXT CHECK (visibility IN ('public', 'hardware', 'history_only')) DEFAULT 'public';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_parent_id ON public.inventory(parent_id);
CREATE INDEX IF NOT EXISTS idx_inventory_install_group_id ON public.inventory(install_group_id);
CREATE INDEX IF NOT EXISTS idx_inventory_inventory_source_id ON public.inventory(inventory_source_id);
CREATE INDEX IF NOT EXISTS idx_inventory_visibility ON public.inventory(visibility);
