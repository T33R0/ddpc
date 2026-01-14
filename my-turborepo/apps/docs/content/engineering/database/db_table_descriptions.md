# Database Table Descriptions

This document provides a detailed overview of the database tables, views, and their structures as used in the DDPC application.

## 1. activity_log
**Description:** Intended for tracking user activity history.
**Status:** **Unused** in the current web application.
**Columns:**
- No column usage found in codebase.

## 2. app_structure
**Description:** Likely intended for defining dynamic application navigation or hierarchy.
**Status:** **Unused** in the current web application.
**Columns:**
- No column usage found in codebase.

## 3. fuel_log
**Description:** Stores user-entered fuel-up records for vehicles.
**Status:** Active
**Columns:**
- `id` (uuid): Primary Key.
- `user_vehicle_id` (uuid): Foreign Key to `user_vehicle`.
- `event_date` (date/timestamp): Date of the fuel-up.
- `odometer` (numeric): Odometer reading at time of fuel-up.
- `gallons` (numeric): Amount of fuel purchased.
- `price_per_gallon` (numeric): Price paid per gallon.
- `trip_miles` (numeric): Distance driven since last fuel-up (optional).
- `octane` (numeric): Fuel octane rating (optional).
- `created_at` (timestamp): Record creation timestamp.

## 4. issue_reports
**Description:** Tracks user-submitted bug reports and feedback.
**Status:** Active
**Columns:**
- `id` (uuid): Primary Key.
- `user_email` (text): Email of the reporter.
- `page_url` (text): URL where the issue occurred.
- `description` (text): Detailed description of the issue.
- `screenshot_url` (text): URL to the uploaded screenshot (in `issue-attachments` bucket).
- `resolved` (boolean): Status of the issue (true if resolved).
- `admin_notes` (text): Internal notes for administrators.
- `created_at` (timestamp): Record creation timestamp.

## 5. job_plans
**Description:** Represents a planned service job, grouping multiple steps.
**Status:** Active
**Columns:**
- `id` (uuid): Primary Key.
- `user_id` (uuid): ID of the user creating the plan.
- `maintenance_log_id` (uuid): Foreign Key to `maintenance_log` (links the plan to a vehicle and service item).
- `name` (text): Title of the job plan.
- `created_at` (timestamp): Record creation timestamp.

## 6. job_steps
**Description:** Individual steps belonging to a `job_plan`.
**Status:** Active
**Columns:**
- `id` (uuid): Primary Key.
- `job_plan_id` (uuid): Foreign Key to `job_plans`.
- `step_order` (integer): Sequence number of the step.
- `description` (text): Main instruction for the step.
- `notes` (text): Additional details or warnings.
- `is_completed` (boolean): Completion status.
- `is_completed_reassembly` (boolean): Completion status for reassembly phase.
- `created_at` (timestamp): Record creation timestamp.

## 9. maintenance_log
**Description:** Core table for vehicle service history, including planned, completed, and archived records.
**Status:** Active
**Columns:**
- `id` (uuid): Primary Key.
- `user_vehicle_id` (uuid): Foreign Key to `user_vehicle`.
- `service_item_id` (uuid): Foreign Key to `service_items` (classifies the service).
- `service_interval_id` (uuid): Foreign Key to `service_intervals` (links to a scheduled interval, if applicable).
- `event_date` (timestamp): Date of the service (or planned date).
- `odometer` (numeric): Mileage at time of service.
- `cost` (numeric): Total cost of the service.
- `service_provider` (text): Who performed the service.
- `notes` (text): User notes.
- `status` (text/enum): Status of the record ('Plan', 'History', 'Archive').
- `created_at` (timestamp): Record creation timestamp.

## 10. maintenance_parts
**Description:** Links parts from inventory to a maintenance log entry (parts used in a service).
**Status:** Active
**Columns:**
- `id` (uuid): Primary Key.
- `maintenance_log_id` (uuid): Foreign Key to `maintenance_log`.
- `part_id` (uuid): Foreign Key to `part_inventory`.
- `quantity_used` (numeric): Quantity of the part consumed.

## 11. master_parts_list
**Description:** Master catalog of OEM and aftermarket parts (reference data).
**Status:** **Unused** in web application (likely reference or future feature).
**Columns:**
- No column usage found in codebase.

## 12. mod_categories
**Description:** Categories for classifying vehicle modifications.
**Status:** **Unused** in web application code (likely usage in direct SQL or future feature).
**Columns:**
- No column usage found in codebase.

## 13. mod_items
**Description:** Specific modification items or types (analogous to `service_items` for mods).
**Status:** Active
**Columns:**
- `id` (uuid): Primary Key.
- `name` (text): Name of the modification item.
- `description` (text): Description of the mod.
- `category_id` (uuid): Foreign Key to `mod_categories` (inferred).

## 14. mod_outcome
**Description:** Records the result/success of a modification.
**Status:** Active
**Columns:**
- `id` (uuid): Primary Key.
- `mod_id` (uuid): Foreign Key to `mods` (Inferred).
- `outcome_type` (text): Result classification (e.g., 'success').
- `notes` (text): Details about the outcome.
- `event_date` (timestamp): Date of the outcome.

## 15. mod_parts
**Description:** Links parts from inventory to a modification record.
**Status:** Active
**Columns:**
- `id` (uuid): Primary Key.
- `mod_id` (uuid): Foreign Key to `mods` (Inferred).
- `part_id` (uuid): Foreign Key to `part_inventory` (Inferred from code structure).
- `quantity_used` (numeric): Quantity consumed.

## 16. mod_plans
**Description:** Represents a plan for a vehicle modification (duplicate of `job_plans` structure).
**Status:** New / Planned
**Columns:**
- `id` (uuid): Primary Key.
- `user_id` (uuid): ID of the user creating the plan.
- `mod_id` (uuid): Foreign Key to `mods` (Analogous to `job_plans.maintenance_log_id`).
- `name` (text): Title of the mod plan.
- `created_at` (timestamp): Record creation timestamp.

## 17. mod_steps
**Description:** Individual steps belonging to a `mod_plan` (duplicate of `job_steps` structure).
**Status:** New / Planned
**Columns:**
- `id` (uuid): Primary Key.
- `mod_plan_id` (uuid): Foreign Key to `mod_plans`.
- `step_order` (integer): Sequence number.
- `description` (text): Step instruction.
- `notes` (text): Additional details.
- `is_completed` (boolean): Completion status.
- `is_completed_reassembly` (boolean): Reassembly status.
- `created_at` (timestamp): Record creation timestamp.

## 18. mods
**Description:** Core table for vehicle modifications history and planning.
**Status:** Active
**Columns:**
- `id` (uuid): Primary Key.
- `user_vehicle_id` (uuid): Foreign Key to `user_vehicle`.
- `mod_item_id` (uuid): Foreign Key to `mod_items`.
- `event_date` (timestamp): Date of the mod.
- `odometer` (numeric): Mileage at time of mod.
- `cost` (numeric): Total cost.
- `status` (text/enum): Status ('planned', 'ordered', 'installed', 'tuned', 'archived').
- `notes` (text): User notes (often used as title/description in UI).
- `created_at` (timestamp): Record creation timestamp.

## 19. mv_vehicle_filter_options
**Description:** Materialized view caching distinct, aggregated values for vehicle filters (years, makes, models) to optimize Explore queries.
**Status:** Active (Accessed via RPC `get_vehicle_filter_options`)
**Columns:**
- `years` (jsonb/array): List of available years.
- `makes` (jsonb/array): List of available makes.
- `models` (jsonb/array): List of available models.
- `engineTypes` (jsonb/array): List of engine types.
- `fuelTypes` (jsonb/array): List of fuel types.
- `drivetrains` (jsonb/array): List of drivetrains.
- `bodyTypes` (jsonb/array): List of body types.

## 20. odometer_log
**Description:** Historical record of odometer readings for vehicles.
**Status:** Active
**Columns:**
- `id` (uuid): Primary Key.
- `user_vehicle_id` (uuid): Foreign Key to `user_vehicle`.
- `reading_mi` (numeric): Odometer reading in miles.
- `recorded_at` (timestamp): Date/time of the reading.

## 21. part_inventory
**Description:** User's inventory of vehicle parts.
**Status:** Active
**Columns:**
- `id` (uuid): Primary Key.
- `user_id` (uuid): Owner of the part.
- `name` (text): Name of the part.
- `part_number` (text): Manufacturer part number.
- `cost` (numeric): Unit cost.
- `quantity` (numeric): Current quantity on hand.
- `vendor_name` (text): Supplier name.
- `vendor_link` (text): URL to supplier/part.
- `physical_location` (text): Storage location.
- `category` (text): Part category.
- `created_at` (timestamp): Record creation timestamp.

## 22. service_categories
**Description:** Lookup table for high-level service categories (e.g., "Maintenance", "Repair").
**Status:** Active
**Columns:**
- `id` (uuid): Primary Key.
- `name` (text): Category name.

## 23. service_intervals
**Description:** Defines custom service schedules/intervals for a vehicle (e.g., "Oil Change every 5k miles").
**Status:** Active
**Columns:**
- `id` (uuid): Primary Key.
- `user_vehicle_id` (uuid): Foreign Key to `user_vehicle`.
- `name` (text): Name of the scheduled service.
- `description` (text): Description of the service.
- `interval_months` (integer): Time interval in months.
- `interval_miles` (integer): Mileage interval.
- `due_date` (date): Next due date.
- `due_miles` (numeric): Next due mileage.

## 24. service_items
**Description:** Standardized list of service types available for selection (linked to categories).
**Status:** Active
**Columns:**
- `id` (uuid): Primary Key.
- `category_id` (uuid): Foreign Key to `service_categories`.
- `name` (text): Name of the service item.
- `description` (text): Default description.

## 25. testimonials
**Description:** Stores user testimonials and feedback for the platform.
**Status:** Active
**Columns:**
- `id` (uuid): Primary Key.
- `user_id` (uuid): Foreign Key to `user_profile`.
- `display_name` (text): Name to display.
- `role` (text): User's role/title (e.g., "Beta Tester").
- `content` (text): The testimonial text.
- `avatar_url` (text): URL to user avatar (optional).
- `is_approved` (boolean): Moderation status.
- `created_at` (timestamp): Record creation timestamp.

## 26. user_profile
**Description:** Extended user profile information, keyed by Supabase Auth ID.
**Status:** Active
**Columns:**
- `user_id` (uuid): Primary Key (matches `auth.users.id`).
- `username` (text): Unique username.
- `email` (text): User email.
- `role` (text): User role ('user', 'admin', 'helper').
- `plan` (text): Subscription plan ('free', 'builder', 'pro').
- `stripe_customer_id` (text): Stripe customer reference.
- `theme` (text): UI theme preference ('light', 'dark', 'auto').
- `is_public` (boolean): Profile visibility.
- `notify_on_new_user` (boolean): Admin notification preference.
- `notify_on_issue_report` (boolean): Admin notification preference.
- `bio` (text): User biography.
- `website` (text): User website URL.
- `location` (text): User location.
- `banned` (boolean): Ban status.
- `created_at` (timestamp): Record creation timestamp.
- `updated_at` (timestamp): Last update timestamp.

## 27. user_vehicle
**Description:** The core entity representing a user's specific vehicle (cloned from templates or created manually).
**Status:** Active
**Columns:**
- `id` (uuid): Primary Key.
- `owner_id` (uuid): Foreign Key to `user_profile` (or auth).
- `nickname` (text): User-defined name.
- `year` (integer): Model year.
- `make` (text): Vehicle make.
- `model` (text): Vehicle model.
- `trim` (text): Vehicle trim.
- `odometer` (numeric): Current cached odometer reading.
- `current_status` (text/enum): Status ('inactive', 'active', 'project', etc.).
- `photo_url` (text): Primary image URL (often mapped to `image_url` or `vehicle_image` in code).
- `acquisition_date` (date): Date acquired.
- `ownership_end_date` (date): Date archived/retired.
- `acquisition_cost` (numeric): Purchase price.
- `acquisition_type` (text): Method of acquisition (Dealer, Private, etc.).
- `is_onboarding_completed` (boolean): Flag for onboarding flow.
- `vehicle_data_id` (uuid): Link to source `vehicle_data` (if applicable).

## 28. v_garage_recent_activity
**Description:** View that unions `mods` and `maintenance_log` to provide a unified feed of vehicle history events.
**Status:** Active
**Columns:**
- `event_id` (uuid): ID from source table.
- `user_id` (uuid): Owner ID.
- `user_vehicle_id` (uuid): Vehicle ID.
- `date` (timestamp): Event date.
- `title` (text): Event title (from `mod_items` or `service_items`).
- `description` (text): Event description/notes.
- `type` (text): Source type ('mod' or 'service').

## 29. v_vehicle_data_typed
**Description:** View casting `vehicle_data` columns to strict numeric types to support reliable range filtering (gt/lt).
**Status:** Active (Used in Explore API).
**Columns:** Excluded from detailed list.

## 30. v_vehicle_explore
**Description:** Optimized view for the Explore/Discover feature, providing a flattened structure of vehicle data and primary images.
**Status:** Active (Used in `getVehicleById`).
**Columns:** Excluded from detailed list.

## 31. vehicle_data
**Description:** Massive read-only catalog of vehicle specifications (Year/Make/Model/Trim data).
**Status:** Active
**Columns:** Excluded from detailed list.

## 32. vehicle_image_archive
**Description:** Archive of vehicle images, possibly from scraping or old datasets.
**Status:** **Unused** in web application.
**Columns:**
- No column usage found in codebase.

## 33. vehicle_primary_image
**Description:** Links a `vehicle_data` record to its primary display image path/URL.
**Status:** Active (Used in Explore/Vehicle Card queries).
**Columns:**
- `vehicle_id` (uuid): Foreign Key to `vehicle_data`.
- `storage_path` (text): Path in storage bucket.
- `url` (text): Public URL.
- `source` (text): Source of the image (inferred).

## 34. vehicle_url_queue
**Description:** Queue for vehicle data/image processing or crawling.
**Status:** **Unused** in web application.
**Columns:**
- No column usage found in codebase.
