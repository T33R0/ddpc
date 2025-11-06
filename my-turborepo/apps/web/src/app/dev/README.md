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

The feature expects two tables:

1. **`cul_cars`** - Your cars
2. **`cul_build_items`** - Wishlist items linked to cars

### Required Schema

```sql
-- Cars table
CREATE TABLE public.cul_cars (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cul_cars_pkey PRIMARY KEY (id)
);

-- Build items table
CREATE TABLE public.cul_build_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  car_id uuid NOT NULL REFERENCES cul_cars(id),
  description text NOT NULL,
  status text NOT NULL CHECK (status IN ('planned', 'completed')),
  cost_planned numeric NOT NULL,
  cost_actual numeric,
  date_completed date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cul_build_items_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.cul_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cul_build_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own cars" ON public.cul_cars
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their own items" ON public.cul_build_items
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
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

1. Create the database tables (SQL above)
2. Add at least one car to `cul_cars` table:
   ```sql
   INSERT INTO cul_cars (user_id, name) 
   VALUES ('your-user-id', 'My Project Car');
   ```
3. Navigate to: `http://localhost:3000/dev/wishlist`
4. Select a car and add a planned item with description and cost
5. Click "Mark Complete" on any item
6. Fill in actual cost and completion date
7. Verify item moves to "Build Log (Completed)"

## Design Philosophy

This is intentionally "ugly" and simple:
- No fancy UI components
- Basic Tailwind styling
- Direct Supabase queries
- Minimal abstraction
- Focus on **function over form**

The goal is to prove the core loop works in isolation before integrating with the main application.


