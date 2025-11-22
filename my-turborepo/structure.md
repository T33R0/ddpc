# Project Structure and Guidelines

This document outlines the structure of the `my-turborepo` monorepo, explains how to use the shared packages, and provides guidelines for developing the micro-frontends (MFEs).

## 1. Monorepo Structure

The repository is a Turborepo-powered monorepo with the following structure:

```
my-turborepo/
|-- apps/
|   |-- docs/         # Documentation MFE (Next.js)
|   `-- web/          # Main Web Application MFE (Next.js)
|-- packages/
|   |-- eslint-config/      # Shared ESLint configuration
|   |-- prettier-config/    # Shared Prettier configuration
|   |-- tailwind-config/  # Shared Tailwind CSS preset
|   |-- tsconfig/         # Shared TypeScript configurations
|   `-- ui/               # Shared React component library (shadcn/ui based)
|-- package.json
|-- turbo.json
`-- structure.md
```

- **`apps/`**: Contains the individual micro-frontends (MFEs). Each MFE is a standalone application (e.g., a Next.js app).
- **`packages/`**: Contains shared code and configurations that can be used across all MFEs.

## 2. Shared Packages

### 2.1. UI Components (`@repo/ui`)

This package contains a set of shared, unstyled React components based on `shadcn/ui`. All MFEs should import these components to maintain a consistent look and feel.

**Available Components:**
- `Button`
- `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardDescription`, `CardContent`
- `Input`
- `Label`
- `Textarea`
- `Logo`
- `Header`
- `Footer`

**How to Use:**

Import components directly from the `@repo/ui` package within your MFE's components:

```tsx
// Example: apps/web/src/app/page.tsx

import { Button } from "@repo/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";

export default function Page() {
  return (
    <main>
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Shared UI Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" placeholder="Email" />
          </div>
          <Button className="mt-4">Click Me</Button>
        </CardContent>
      </Card>
    </main>
  );
}
```

### 2.2. Shared Configurations

To ensure consistency across the monorepo, we use shared configurations for ESLint, Prettier, Tailwind CSS, and TypeScript.

- **ESLint (`@repo/eslint-config`)**: Enforces a consistent coding style. Your MFE's `.eslintrc.js` should extend from this package.
- **Prettier (`@repo/prettier-config`)**: Enforces consistent code formatting. Your MFE's `prettier.config.js` should import this package.
- **Tailwind CSS (`@repo/tailwind-config`)**: Provides a shared Tailwind CSS preset with theme tokens (colors, border radius, etc.). Your MFE's `tailwind.config.ts` must use this preset.
- **TypeScript (`@repo/typescript-config`)**: Provides base `tsconfig.json` files for different types of projects (e.g., `nextjs.json`, `react-library.json`). Your MFE's `tsconfig.json` should extend from the appropriate file in this package.

### 2.3. Global Layout

The main application layout is constructed in each MFE's `app/layout.tsx` file. This file imports the shared `Header` and `Footer` components from the `@repo/ui` package to create a consistent frame for the entire application.

**Example (`apps/web/src/app/layout.tsx`):**

```tsx
import { Header } from "@repo/ui/header";
import { Footer } from "@repo/ui/footer";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
```

## 3. MFE Guidelines

### 3.1. Feature Slice Architecture (`apps/web`)

To ensure scalability and prepare for future growth, the `apps/web` application follows a "feature slice" architecture. This design organizes code by feature, making it easier to manage and eventually extract into a separate micro-frontend if needed.

```
apps/web/
└─ src/
   ├─ app/             # Routing layer (Next.js App Router)
   │   ├─ explore/
   │   ├─ garage/
   │   ├─ vehicle/
   │   ├─ community/
   │   ├─ account/
   │   └─ admin/
   │
   └─ features/        # Business logic and UI components
       ├─ explore/
       ├─ garage/
       ├─ community/
       ├─ account/
       └─ admin/
```

- **`src/app/`**: This directory is responsible for **routing**. Each folder inside `app` maps to a URL segment. The `page.tsx` file within each folder is the entry point for that route and is responsible for fetching data and composing the UI from components in the `features` directory.
- **`src/features/`**: This directory contains the actual implementation of each feature. This includes UI components, hooks, business logic, and API interactions related to a specific domain (e.g., everything related to the "garage" feature lives in `src/features/garage`).

This separation ensures that our routing is decoupled from our feature logic, which is critical for maintainability and future refactoring.

### 3.2. Development Workflow

1.  **Run all apps:** From the root of the `my-turborepo` directory, run `npm run dev` to start the development servers for all MFEs simultaneously.
2.  **Create new components:**
    - If a component is specific to a single feature, create it within that feature's directory (e.g., `apps/web/src/features/garage/components/`).
    - If a component is intended to be used by multiple MFEs, add it to the `@repo/ui` package.
3.  **Install dependencies:** When adding a new dependency, determine if it's specific to one MFE or should be shared. Install it in the appropriate `package.json` and run `npm install` from the root of the monorepo.

### 3.3. Styling

- **Use Tailwind CSS:** All styling should be done using Tailwind CSS utility classes.
- **Use shared components:** Whenever possible, use the components from the `@repo/ui` package.
- **No custom CSS files (unless necessary):** Avoid writing custom CSS files. If you must, keep them scoped to the component they are styling.

### 3.4. State Management

Each MFE is responsible for its own state management. If you need to share state between MFEs, consider using a global state management library (e.g., Zustand, Redux) or passing state via URL parameters or a shared parent application (if applicable).

### 3.5. API Endpoints

-   **`/api/explore/vehicles`**: Retrieves a paginated and filtered list of unique vehicles from the master `vehicle_data` catalog.
-   **`/api/garage/vehicles`**: Fetches all vehicles owned by the currently authenticated user.
-   **`/api/garage/add-vehicle`**: Adds a vehicle to a user's collection by cloning it from the `vehicle_data` catalog.
-   **`/api/garage/add-vehicle-by-vin`**: Adds a vehicle to a user's collection by decoding a VIN via an external API.
-   **`/api/garage/update-vehicle`**: Updates details (e.g., nickname, status) for a vehicle in a user's collection.
-   **`/api/scrutineer/message`**: AI-powered assistant for vehicle explore, maintenance planning, and performance suggestions.

### Supabase Edge Functions

-   **`check-maintenance-due`**: A function (designed to be run on a schedule) that checks all user vehicles against their service intervals and triggers reminders for overdue maintenance.

## Database Schema

The application uses Supabase with the following database schema:

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.fuel_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  user_vehicle_id uuid,
  event_date date NOT NULL,
  odometer integer NOT NULL CHECK (odometer > 0),
  gallons numeric NOT NULL CHECK (gallons > 0::numeric),
  price_per_gallon numeric NOT NULL,
  total_cost numeric,
  trip_miles numeric,
  mpg numeric,
  created_at timestamp with time zone DEFAULT now(),
  octane integer,
  CONSTRAINT fuel_log_pkey PRIMARY KEY (id),
  CONSTRAINT fuel_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT fuel_log_user_vehicle_id_fkey FOREIGN KEY (user_vehicle_id) REFERENCES public.user_vehicle(id)
);
CREATE TABLE public.job_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  maintenance_log_id uuid,
  mod_log_id uuid,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT job_plans_pkey PRIMARY KEY (id),
  CONSTRAINT job_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT job_plans_maintenance_log_id_fkey FOREIGN KEY (maintenance_log_id) REFERENCES public.maintenance_log(id),
  CONSTRAINT job_plans_mod_log_id_fkey FOREIGN KEY (mod_log_id) REFERENCES public.mods(id)
);
CREATE TABLE public.job_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_plan_id uuid NOT NULL,
  step_order integer NOT NULL,
  description text NOT NULL,
  notes text,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT job_steps_pkey PRIMARY KEY (id),
  CONSTRAINT job_steps_job_plan_id_fkey FOREIGN KEY (job_plan_id) REFERENCES public.job_plans(id)
);
CREATE TABLE public.job_template_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_template_id uuid NOT NULL,
  step_order integer NOT NULL,
  description text NOT NULL,
  notes text,
  CONSTRAINT job_template_steps_pkey PRIMARY KEY (id),
  CONSTRAINT job_template_steps_job_template_id_fkey FOREIGN KEY (job_template_id) REFERENCES public.job_templates(id)
);
CREATE TABLE public.job_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  service_item_id uuid,
  mod_item_id uuid,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT job_templates_pkey PRIMARY KEY (id),
  CONSTRAINT job_templates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT job_templates_service_item_id_fkey FOREIGN KEY (service_item_id) REFERENCES public.service_items(id),
  CONSTRAINT job_templates_mod_item_id_fkey FOREIGN KEY (mod_item_id) REFERENCES public.mod_items(id)
);
CREATE TABLE public.maintenance_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_vehicle_id uuid NOT NULL,
  service_interval_id uuid,
  cost numeric DEFAULT 0.00,
  odometer integer,
  event_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  service_provider text,
  service_item_id uuid,
  status text DEFAULT 'History'::text CHECK (status = ANY (ARRAY['History'::text, 'Plan'::text])),
  CONSTRAINT maintenance_log_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_log_user_vehicle_id_fkey FOREIGN KEY (user_vehicle_id) REFERENCES public.user_vehicle(id),
  CONSTRAINT maintenance_log_service_interval_id_fkey FOREIGN KEY (service_interval_id) REFERENCES public.service_intervals(id),
  CONSTRAINT maintenance_log_service_item_id_fkey FOREIGN KEY (service_item_id) REFERENCES public.service_items(id)
);
CREATE TABLE public.maintenance_parts (
  maintenance_log_id uuid NOT NULL,
  part_id uuid NOT NULL,
  quantity_used integer NOT NULL DEFAULT 1,
  CONSTRAINT maintenance_parts_pkey PRIMARY KEY (maintenance_log_id, part_id),
  CONSTRAINT maintenance_parts_maintenance_log_id_fkey FOREIGN KEY (maintenance_log_id) REFERENCES public.maintenance_log(id),
  CONSTRAINT maintenance_parts_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.part_inventory(id)
);
CREATE TABLE public.master_parts_list (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  part_number text,
  name text NOT NULL,
  description text,
  oem_or_aftermarket text CHECK (oem_or_aftermarket = ANY (ARRAY['oem'::text, 'aftermarket'::text])),
  vendor_name text,
  vendor_link text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT master_parts_list_pkey PRIMARY KEY (id)
);
CREATE TABLE public.mod_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  CONSTRAINT mod_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.mod_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  CONSTRAINT mod_items_pkey PRIMARY KEY (id),
  CONSTRAINT mod_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.mod_categories(id)
);
CREATE TABLE public.mod_outcome (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mod_id uuid NOT NULL UNIQUE,
  outcome_type USER-DEFINED NOT NULL,
  event_date timestamp with time zone NOT NULL DEFAULT now(),
  odometer integer,
  failure_mode USER-DEFINED,
  notes text,
  CONSTRAINT mod_outcome_pkey PRIMARY KEY (id),
  CONSTRAINT mod_outcome_mod_id_fkey FOREIGN KEY (mod_id) REFERENCES public.mods(id)
);
CREATE TABLE public.mod_parts (
  mod_id uuid NOT NULL,
  part_id uuid NOT NULL,
  quantity_used integer NOT NULL DEFAULT 1,
  CONSTRAINT mod_parts_pkey PRIMARY KEY (mod_id, part_id),
  CONSTRAINT mod_parts_mod_id_fkey FOREIGN KEY (mod_id) REFERENCES public.mods(id),
  CONSTRAINT mod_parts_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.part_inventory(id)
);
CREATE TABLE public.mods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_vehicle_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'planned'::text CHECK (status = ANY (ARRAY['planned'::text, 'ordered'::text, 'installed'::text, 'tuned'::text])),
  cost numeric DEFAULT 0.00,
  event_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  odometer integer,
  mod_item_id uuid,
  notes text,
  CONSTRAINT mods_pkey PRIMARY KEY (id),
  CONSTRAINT mods_user_vehicle_id_fkey FOREIGN KEY (user_vehicle_id) REFERENCES public.user_vehicle(id),
  CONSTRAINT mods_mod_item_id_fkey FOREIGN KEY (mod_item_id) REFERENCES public.mod_items(id)
);
CREATE TABLE public.odometer_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_vehicle_id uuid NOT NULL,
  reading_mi integer NOT NULL CHECK (reading_mi >= 0),
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  event_date timestamp with time zone,
  CONSTRAINT odometer_log_pkey PRIMARY KEY (id),
  CONSTRAINT odometer_log_user_vehicle_id_fkey FOREIGN KEY (user_vehicle_id) REFERENCES public.user_vehicle(id)
);
CREATE TABLE public.part_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  part_number text,
  name text NOT NULL,
  cost numeric,
  vendor_name text,
  vendor_link text,
  physical_location text,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  category text,
  CONSTRAINT part_inventory_pkey PRIMARY KEY (id),
  CONSTRAINT part_inventory_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.service_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  CONSTRAINT service_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.service_intervals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  interval_months integer,
  interval_miles integer,
  description text,
  user_vehicle_id uuid,
  due_date date,
  due_miles integer,
  CONSTRAINT service_intervals_pkey PRIMARY KEY (id),
  CONSTRAINT service_intervals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT service_intervals_user_vehicle_id_fkey FOREIGN KEY (user_vehicle_id) REFERENCES public.user_vehicle(id)
);
CREATE TABLE public.service_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  CONSTRAINT service_items_pkey PRIMARY KEY (id),
  CONSTRAINT service_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id)
);
CREATE TABLE public.user_profile (
  user_id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  display_name text,
  location text,
  website text,
  bio text,
  avatar_url text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  role USER-DEFINED NOT NULL DEFAULT 'user'::user_role CHECK (role = ANY (ARRAY['user'::user_role, 'helper'::user_role, 'admin'::user_role])),
  plan text NOT NULL DEFAULT 'free'::text CHECK (plan = ANY (ARRAY['free'::text, 'builder'::text, 'pro'::text])),
  banned boolean NOT NULL DEFAULT false,
  preferred_vehicle_id uuid,
  CONSTRAINT user_profile_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_profile_preferred_vehicle_id_fkey FOREIGN KEY (preferred_vehicle_id) REFERENCES public.user_vehicle(id)
);
CREATE TABLE public.user_vehicle (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vin text,
  year integer,
  make text NOT NULL,
  model text NOT NULL,
  trim text,
  nickname text,
  privacy text NOT NULL DEFAULT 'PRIVATE'::text CHECK (privacy = ANY (ARRAY['PUBLIC'::text, 'PRIVATE'::text])),
  photo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_event_at timestamp with time zone,
  stock_data_id text,
  title text,
  spec_snapshot jsonb,
  current_status text DEFAULT 'daily_driver'::text CHECK (current_status = ANY (ARRAY['daily_driver'::text, 'parked'::text, 'listed'::text, 'sold'::text, 'retired'::text])),
  owner_id uuid NOT NULL,
  odometer integer,
  horsepower_hp integer,
  torque_ft_lbs integer,
  engine_size_l numeric,
  cylinders text,
  fuel_type text,
  drive_type text,
  transmission text,
  length_in numeric,
  width_in numeric,
  height_in numeric,
  body_type text,
  colors_exterior text,
  epa_combined_mpg numeric,
  avg_mpg numeric,
  vehicle_image text,
  CONSTRAINT user_vehicle_pkey PRIMARY KEY (id),
  CONSTRAINT vehicle_stock_data_id_fkey FOREIGN KEY (stock_data_id) REFERENCES public.vehicle_data(id),
  CONSTRAINT user_vehicle_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.vehicle_data (
  id text NOT NULL,
  make text,
  model text,
  year text,
  trim text,
  trim_description text,
  base_msrp text,
  base_invoice text,
  colors_exterior text,
  colors_interior text,
  body_type text,
  doors text,
  total_seating text,
  length_in text,
  width_in text,
  height_in text,
  wheelbase_in text,
  front_track_in text,
  rear_track_in text,
  ground_clearance_in text,
  angle_of_approach_deg text,
  angle_of_departure_deg text,
  turning_circle_ft text,
  drag_coefficient_cd text,
  epa_interior_volume_cuft text,
  cargo_capacity_cuft text,
  max_cargo_capacity_cuft text,
  curb_weight_lbs text,
  gross_weight_lbs text,
  max_payload_lbs text,
  max_towing_capacity_lbs text,
  cylinders text,
  engine_size_l text,
  horsepower_hp integer,
  horsepower_rpm integer CHECK (horsepower_rpm IS NULL OR horsepower_rpm >= 0 AND horsepower_rpm <= 14000),
  torque_ft_lbs integer,
  torque_rpm integer,
  valves integer,
  valve_timing text,
  cam_type text,
  drive_type text,
  transmission text,
  engine_type text,
  fuel_type text,
  fuel_tank_capacity_gal text,
  epa_combined_mpg text,
  epa_city_highway_mpg text,
  range_miles_city_hwy text,
  epa_combined_mpge text,
  epa_city_highway_mpge text,
  epa_electric_range_mi text,
  epa_kwh_per_100mi text,
  epa_charge_time_240v_hr text,
  battery_capacity_kwh text,
  front_head_room_in text,
  front_hip_room_in text,
  front_leg_room_in text,
  front_shoulder_room_in text,
  rear_head_room_in text,
  rear_hip_room_in text,
  rear_leg_room_in text,
  rear_shoulder_room_in text,
  warranty_basic text,
  warranty_drivetrain text,
  warranty_roadside text,
  warranty_rust text,
  source_json text,
  source_url text,
  review text,
  pros text,
  cons text,
  whats_new text,
  nhtsa_overall_rating text,
  new_price_range text,
  used_price_range text,
  scorecard_overall text,
  scorecard_driving text,
  scorecard_confort text,
  scorecard_interior text,
  scorecard_utility text,
  scorecard_technology text,
  expert_verdict text,
  expert_performance text,
  expert_comfort text,
  expert_interior text,
  expert_technology text,
  expert_storage text,
  expert_fuel_economy text,
  expert_value text,
  expert_wildcard text,
  old_trim text,
  old_description text,
  images_url text,
  suspension text,
  front_seats text,
  rear_seats text,
  power_features text,
  instrumentation text,
  convenience text,
  comfort text,
  memorized_settings text,
  in_car_entertainment text,
  roof_and_glass text,
  body text,
  truck_features text,
  tires_and_wheels text,
  doors_features text,
  towing_and_hauling text,
  safety_features text,
  packages text,
  exterior_options text,
  interior_options text,
  mechanical_options text,
  country_of_origin text,
  car_classification text,
  platform_code_generation text,
  date_added text,
  new_make text,
  new_model text,
  new_year text,
  CONSTRAINT vehicle_data_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vehicle_image_archive (
  vehicle_id text NOT NULL,
  url text NOT NULL,
  source text DEFAULT 'import'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vehicle_image_archive_pkey PRIMARY KEY (vehicle_id, url),
  CONSTRAINT vehicle_image_archive_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicle_data(id)
);
CREATE TABLE public.vehicle_primary_image (
  vehicle_id text NOT NULL,
  url text,
  storage_path text,
  checksum text,
  width_px integer,
  height_px integer,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vehicle_primary_image_pkey PRIMARY KEY (vehicle_id),
  CONSTRAINT vehicle_primary_image_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicle_data(id)
);
CREATE TABLE public.vehicle_url_queue (
  id text NOT NULL,
  CONSTRAINT vehicle_url_queue_pkey PRIMARY KEY (id)
);

### Table Overview

#### Core Data Tables
- **`vehicle_data`**: Master catalog of vehicle specifications and details
- **`vehicle_primary_image`**: Primary image URLs for vehicles (linked to vehicle_data)
- **`vehicle_image_archive`**: Archive of additional vehicle images
- **`user_vehicle`**: User's personal vehicle collection
- **`user_profile`**: Extended user profile information with preferred_vehicle_id

#### Fuel & Maintenance Tracking
- **`fuel_log`**: User's fuel consumption and cost tracking
- **`maintenance_log`**: User's maintenance history with notes and service provider info (includes status: History/Plan)
- **`maintenance_parts`**: Junction table linking maintenance events to parts used

#### Job Planning & Templates
- **`job_templates`**: Reusable job templates linked to service items or mod items (can be public or private)
- **`job_template_steps`**: Steps that make up a job template
- **`job_plans`**: User's job plans linked to maintenance logs or mods
- **`job_steps`**: Steps that make up a job plan with completion tracking

#### Parts Management
- **`master_parts_list`**: Master catalog of available parts (OEM/Aftermarket)
- **`part_inventory`**: User's personal parts inventory
- **`service_intervals`**: User's customized maintenance intervals
- **`service_categories`**: Categories for service items
- **`service_items`**: Standardized service items linked to categories

#### Modifications & Outcomes
- **`mods`**: Vehicle modifications tracking with odometer and status, linked to mod items
- **`mod_outcome`**: Modification outcome tracking (success/failure modes)
- **`mod_parts`**: Junction table linking modifications to parts used
- **`mod_categories`**: Categories for modification items
- **`mod_items`**: Standardized modification items linked to categories

#### Tracking & Monitoring
- **`odometer_log`**: Historical odometer readings for vehicles

#### System Tables
- **`vehicle_url_queue`**: Queue for processing vehicle URLs

## Frontend Structure

The frontend is a Next.js application located in `apps/web`.

### Core Pages

-   **`/`**: Landing page.
-   **`/explore`**: Vehicle explore and browsing page.
-   **`/garage`**: Displays the authenticated user's vehicle collection.
-   **`/financials`**: A dashboard for viewing vehicle-related financial analytics.
-   **`/dashboard`**: The main user dashboard and navigation hub.

### Key Components (`features/`)

-   **`explore/`**: Components for the vehicle explore page, including filters (`vehicle-filters.tsx`) and the main gallery view (`vehicle-gallery.tsx`).
-   **`garage/`**: Components for the user's personal garage, including the gallery view (`garage-vehicle-gallery.tsx`), statistics (`garage-stats.tsx`), and the detailed vehicle modal (`garage-vehicle-details-modal.tsx`).
-   **`financials/`**: Components for the financials page, including the main dashboard (`financials-dashboard.tsx`).
-   **`build-thread/`**: The component responsible for rendering the chronological history of a vehicle (`build-thread.tsx`).
