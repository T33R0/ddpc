-- Phase 1: Parts Delivery Breakdown & Batch Install
-- Adds columns to inventory for replacement tracking, batch install grouping, and hardware reusability.
-- Also adds 'replaced' status to inventory for parts that have been swapped out.

-- 1. install_batch_id: Groups parts installed together in a single session
-- This is a generated UUID shared by all parts installed at the same time (not a FK).
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS install_batch_id UUID;

-- 2. replacement_reason: Why a part was replaced
-- Used when installing a new part that replaces an existing one.
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS replacement_reason TEXT
CHECK (replacement_reason IN ('wear', 'upgrade', 'failure', 'scheduled'));

-- 3. replaced_part_id: Links the new part to the old part it replaced
-- Self-referential FK. SET NULL if old part record is deleted.
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS replaced_part_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL;

-- 4. is_reusable: For hardware items — distinguishes reusable (bolts you keep) vs consumable (gaskets, seals)
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS is_reusable BOOLEAN DEFAULT false;

-- 5. Update status check constraint to include 'replaced'
-- First drop the existing constraint, then re-add with the new value.
-- The inventory table uses a check constraint on status.
DO $$
BEGIN
    -- Try to drop existing constraint (name may vary)
    BEGIN
        ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS inventory_status_check;
    EXCEPTION WHEN undefined_object THEN
        -- Constraint doesn't exist, that's fine
        NULL;
    END;

    -- Also try the common auto-generated name
    BEGIN
        ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS inventory_status_check1;
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;
END $$;

-- Re-add with 'replaced' included
ALTER TABLE public.inventory
ADD CONSTRAINT inventory_status_check
CHECK (status IN ('installed', 'planned', 'wishlist', 'in_stock', 'ordered', 'replaced'));

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_inventory_install_batch_id ON public.inventory(install_batch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_replaced_part_id ON public.inventory(replaced_part_id);
