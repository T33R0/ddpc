-- Add stripe_customer_id to user_profile table
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
