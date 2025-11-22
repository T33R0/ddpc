-- Migration to rename the discovery view to explore view
-- Run this in your Supabase SQL Editor to update the database view name match the codebase changes.

ALTER VIEW IF EXISTS v_vehicle_discovery RENAME TO v_vehicle_explore;

