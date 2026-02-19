-- Migration: Rename ogma tables to steward
-- Generated: 2026-02-19
-- Purpose: Rename all ogma-prefixed tables to steward-prefixed tables

-- Rename tables
ALTER TABLE IF EXISTS public.ogma_chat_sessions RENAME TO steward_chat_sessions;
ALTER TABLE IF EXISTS public.ogma_chat_messages RENAME TO steward_chat_messages;
ALTER TABLE IF EXISTS public.ogma_improvements RENAME TO steward_improvements;

-- Rename indexes (Postgres does not cascade index renames)
ALTER INDEX IF EXISTS idx_ogma_messages_session_id RENAME TO idx_steward_messages_session_id;
ALTER INDEX IF EXISTS idx_ogma_improvements_confidence_created RENAME TO idx_steward_improvements_confidence_created;
