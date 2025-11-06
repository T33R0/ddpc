# DEV Directory - Sterile Core Utility Loop (CUL)

## Overview
This directory contains isolated, experimental features that are completely quarantined from the main application codebase.

## Current Features

### Plan-to-Log Wishlist (`/dev/wishlist`)
A sterile implementation of a "Plan-to-Log" workflow where users can:
1. Add planned build items to a wishlist
2. Mark items as complete with actual cost and date
3. View a build log of completed items

**URL:** `/dev/wishlist`

## Sterile Cordon Rules

### FIREWALL #1: Component Isolation
- All components in `/app/dev/components/` are **FORBIDDEN** from importing from:
  - `/app/components/`
  - `/src/features/`
  - Any other existing app directories
- Only base UI elements (native HTML, Tailwind CSS) are allowed

### FIREWALL #2: Page Isolation
- Pages in `/app/dev/` must be built from scratch
- No imports of existing layouts, dashboards, or complex components
- Direct use of Tailwind CSS and base primitives only

## Database Setup Required

Before using the wishlist feature, create the following table in Supabase:

```sql
CREATE TABLE public.cul_build_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  description text NOT NULL,
  status text NOT NULL CHECK (status IN ('planned', 'completed')),
  cost_planned numeric NOT NULL,
  cost_actual numeric,
  date_completed date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cul_build_items_pkey PRIMARY KEY (id)
);

-- Optional: Add RLS policies if needed
ALTER TABLE public.cul_build_items ENABLE ROW LEVEL SECURITY;

-- Example policy for authenticated users (adjust as needed)
CREATE POLICY "Users can manage their own items" ON public.cul_build_items
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## Files Created

### Server Actions
- `wishlist/actions.ts` - Server-side data operations

### Components (Sterile Zone)
- `components/CulInputForm.tsx` - Form to add planned items
- `components/CulPlannedList.tsx` - List of planned items
- `components/CulCompletedList.tsx` - List of completed items
- `components/CulCompleteModal.tsx` - Modal to mark items complete

### Pages
- `wishlist/page.tsx` - Main wishlist page

## Testing the Feature

1. Create the database table (SQL above)
2. Navigate to: `http://localhost:3000/dev/wishlist`
3. Add a planned item with description and cost
4. Click "Mark Complete" on any item
5. Fill in actual cost and completion date
6. Verify item moves to "Build Log (Completed)"

## Design Philosophy

This is intentionally "ugly" and simple:
- No fancy UI components
- Basic Tailwind styling
- Direct Supabase queries
- Minimal abstraction
- Focus on **function over form**

The goal is to prove the core loop works in isolation before integrating with the main application.


