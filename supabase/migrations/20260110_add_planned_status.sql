-- Add status column to vehicle_installed_components
ALTER TABLE vehicle_installed_components 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'installed' CHECK (status IN ('installed', 'planned'));

-- Allow installed_date and installed_mileage to be null (if not already)
ALTER TABLE vehicle_installed_components 
ALTER COLUMN installed_date DROP NOT NULL;

ALTER TABLE vehicle_installed_components 
ALTER COLUMN installed_mileage DROP NOT NULL;
