-- Fix seating data in vehicle_data table
-- Corrects values like "50" to "5", "20" to "2", etc.
-- This assumes the data was incorrectly multiplied by 10 or formatted with a trailing zero.

UPDATE vehicle_data
SET total_seating = (total_seating::numeric / 10)::int::text
WHERE total_seating IS NOT NULL
  AND total_seating ~ '^[0-9]+0$';
