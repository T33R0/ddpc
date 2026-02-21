-- Scanner Infrastructure: receipts bucket + scanner_records audit table
-- Enables OCR receipt scanning for fuel, service, and parts logging

-- 1. Create receipts storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('receipts', 'receipts', true, 10485760) -- 10MB limit
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload to their own folder
CREATE POLICY "Users upload own receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users view own receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public can view receipts"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'receipts');

CREATE POLICY "Users delete own receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. Create scanner_records table (audit trail for all scans)
CREATE TABLE scanner_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES user_vehicle(id) ON DELETE SET NULL,

  -- Receipt image
  receipt_image_path TEXT NOT NULL,
  receipt_image_url TEXT,

  -- Detection
  detected_type TEXT CHECK (detected_type IN ('fuel', 'service', 'parts', 'order', 'unknown')),
  user_override_type TEXT CHECK (user_override_type IN ('fuel', 'service', 'parts', 'order')),

  -- Raw OCR output
  ocr_raw JSONB,

  -- Extracted common fields
  event_date DATE,
  vendor_name TEXT,
  total_cost NUMERIC(10, 2),

  -- Status
  status TEXT CHECK (status IN ('pending', 'saved', 'discarded')) DEFAULT 'pending',

  -- Links to created records
  fuel_log_id UUID REFERENCES fuel_log(id) ON DELETE SET NULL,
  maintenance_log_id UUID REFERENCES maintenance_log(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE scanner_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own scanner records"
  ON scanner_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own scanner records"
  ON scanner_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own scanner records"
  ON scanner_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_scanner_records_user_id ON scanner_records(user_id);
CREATE INDEX idx_scanner_records_vehicle_id ON scanner_records(vehicle_id);
CREATE INDEX idx_scanner_records_status ON scanner_records(status);
