-- Fix for Security Definer warning on v_garage_recent_activity
-- The view was defined with SECURITY DEFINER which bypasses RLS.
-- This migration changes it to SECURITY INVOKER (the default) to respect RLS policies.

ALTER VIEW public.v_garage_recent_activity SET (security_invoker = true);
