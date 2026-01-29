# Database Table & Column Usage Audit

This document provides a comprehensive audit of how the schema defined in `schema_relationships.md` is currently used within the `apps/web` codebase.

## 1. Job & Service Management

### **job_plans**
**Status:** Active
**Key Usage:** `features/service/actions.ts`, `JobPlanBuilder.tsx`
*   `id`: **Read/Write**. Primary key, used for fetching and updates.
*   `user_id`: **Read/Write**. Used for RLS and ownership checks.
*   `maintenance_log_id`: **Read/Write**. Links plan to the underlying log entry. Used in `duplicateJobPlan`, `archiveJobPlan`.
*   `name`: **Read/Write**. Displayed in UI, updated via `updateJobTitle`.
*   `created_at`: **Read**. Used for sorting.

### **job_steps**
**Status:** Active
**Key Usage:** `features/service/actions.ts`, `JobPlanBuilder.tsx`
*   `id`: **Read/Write**. Used for updates/deletes (`updateJobStep`, `deleteJobStep`).
*   `job_plan_id`: **Read/Write**. Foreign key.
*   `step_order`: **Read/Write**. Critical for ordering items in the checklist (`reorderJobSteps`).
*   `description`: **Read/Write**. The main text content of the step.
*   `notes`: **Read/Write**. Additional details involved in duplication logic.
*   `is_completed`: **Read/Write**. Toggled via UI.
*   `is_completed_reassembly`: **Read/Write**. Logic exists to toggle this specifically in `updateJobStep`.

### **maintenance_log**
**Status:** Critical / Heavily Used
**Key Usage:** `features/service/actions.ts`, `getVehicleServiceData.ts`
*   `id`: **Read/Write**. Primary key.
*   `user_vehicle_id`: **Read/Write**. Filtering logs by vehicle (`getVehicleServiceData`).
*   `service_item_id`: **Read/Write**. Links to standard service operations.
*   `event_date`: **Read/Write**. Displayed in history, used for sorting.
*   `odometer`: **Read/Write**. Tracked for maintenance history.
*   `cost`: **Read/Write**. Updated when parts are added/removed (`addPartToJob`).
*   `service_provider`: **Read/Write**. Text field for shop/mechanic name.
*   `notes`: **Read/Write**. User notes.
*   `status`: **Read/Write**. Controls visibility ('Plan', 'Archive', 'History').

### **service_categories**
**Status:** Active (Read-Only Dictionary)
**Key Usage:** `features/service/actions.ts`
*   `id`: **Read**. Used to filter `service_items`.
*   `name`: **Read**. Displayed in selection dropdowns (`getServiceCategories`).

### **service_intervals**
**Status:** Active
**Key Usage:** `getVehicleServiceData.ts`
*   `id`: **Read**.
*   `name`: **Read**. Displayed in "Upcoming Services" dashboard.
*   `interval_months`: **Read**. Used to calculate `is_overdue` status.
*   `interval_miles`: **Read**. Used to calculate `is_overdue` status against current odometer.
*   `user_vehicle_id`: *Implicitly used for filtering*.

### **service_items**
**Status:** Active (Read-Only Dictionary)
**Key Usage:** `features/service/actions.ts`
*   `id`: **Read**. Selected during service creation.
*   `name`: **Read**. Displayed in UI.
*   `description`: **Read**. Displayed in UI.
*   `category_id`: **Read**. Used for grouping/filtering.

### **wishlist_items**
**Status:** Active
**Key Usage:** `features/wishlist/actions.ts`
*   `id`: **Read/Write**.
*   `user_vehicle_id`: **Read/Write**. Fetching items for a vehicle (`getWishlistItems`).
*   `user_id`: **Write**. Set on creation for ownership.
*   `name`: **Read/Write**.
*   `url`: **Read/Write**. Vendor link.
*   `price`: **Read/Write**.
*   `priority`: **Read/Write**.
*   `type`: **Read/Write**.
*   `status`: **Read/Write**. 'purchased' logic triggers inventory addition (`purchaseWishlistItem`).

---

## 2. Parts & Inventory

### **maintenance_parts**
**Status:** Active
**Key Usage:** `features/service/actions/parts.ts`
*   `maintenance_log_id`: **Read/Write**. Links use of a part to a job (`addPartToJob`).
*   `part_id`: **Read/Write**. Foreign key to inventory.
*   `quantity_used`: **Read/Write**. Deducted from inventory, used for cost calculation.

### **part_inventory**
**Status:** Active
**Key Usage:** `features/service/actions/parts.ts`, `features/wishlist/actions.ts`
*   `id`: **Read/Write**.
*   `user_id`: **Read/Write**.
*   `part_number`: **Read/Write**. Searchable field.
*   `name`: **Read/Write**. Searchable field.
*   `cost`: **Read/Write**. Used to calculate job costs.
*   `vendor_name`: **Read/Write**.
*   `vendor_link`: **Read/Write**.
*   `physical_location`: **Unused**. (Not observed in searched action files).
*   `quantity`: **Read/Write**. Decremented when used in jobs (`addPartToJob`).
*   `category`: **Read/Write**. Validated in `purchaseWishlistItem`.
*   `created_at`: **Read**.

### **master_parts_list**
**Status:** Active
**Key Usage:** `features/parts/actions.ts`
*   `id`: **Read/Write**.
*   `part_number`: **Read/Write**. Used for lookup/deduplication in `addPartToVehicle`.
*   `name`: **Read/Write**. Used for lookup.
*   `manufacturer`: **Unused**. (Not observed in `addPartToVehicle` logic).
*   `description`: **Unused**.
*   `vendor_link`: **Read/Write**.

### **vehicle_bom**
**Status:** Passive / Indirect
**Key Usage:** `features/parts/types.ts`
*   **Audit Note:** Code references `bom_id` in other tables (`vehicle_installed_components`), but direct querying of `vehicle_bom` was not observed in the core action files inspected. It may be used in identifying structure but logic seems to rely more on `component_types`.

### **vehicle_installed_components**
**Status:** Active
**Key Usage:** `features/parts/actions.ts`
*   `id`: **Read/Write**.
*   `user_vehicle_id`: **Read**. Filtering.
*   `bom_id`: **Write**. Recorded during installation if available.
*   `specs`: **Read/Write**. JSONB field for storing specific attributes (`updatePartInstallation`).
*   `notes`: **Unused**. (Not observed in actions).
*   `current_part_id`: **Read/Write**. Links to `master_parts_list`.
*   `installed_date`: **Read/Write**.
*   `installed_mileage`: **Read/Write**.
*   `status`: **Read/Write**.

---

## 3. Modification System

### **mods**
**Status:** Active
**Key Usage:** `features/mods/lib/getVehicleModsData.ts`, `features/mods/actions.ts`
*   `id`: **Read/Write**.
*   `user_vehicle_id`: **Read**. Filtering.
*   `mod_item_id`: **Read/Write**. Links to standard mod dictionary.
*   `notes`: **Read/Write**. Parsed for title/description in `getVehicleModsData`.
*   `status`: **Read/Write**. ('planned' -> 'installed').
*   `cost`: **Read/Write**. Summed for summaries.
*   `odometer`: **Read/Write**.
*   `event_date`: **Read**. Used for sorting timeline.

### **mod_categories**
**Status:** Active (Read-Only Dictionary)
**Key Usage:** `features/wishlist/actions.ts` (used for lookup)
*   `id`: **Read**.
*   `name`: **Read**. Fetched in `getModCategories`.
*   `description`: **Unused**.

### **mod_items**
**Status:** Active
**Key Usage:** `getVehicleModsData.ts`
*   `id`: **Read**.
*   `name`: **Read**. Used as Mod Title.
*   `category_id`: **Unused** in read path.
*   `description`: **Read**. Displayed via `mod` notes fallback.

### **mod_outcome**
**Status:** Active (Read)
**Key Usage:** `getVehicleModsData.ts`
*   `id`: **Read**.
*   `mod_id`: **Read**. Join key.
*   `description`: **Unused**? (Code uses `notes` column on `mod_outcome`).
*   `performance_change`: **Unused**. (Not observed in transformation logic).
*   *Note*: The code selects `outcome_type`, `notes`, `event_date`. `outcome_type` is checked for "success".

### **mod_parts**
**Status:** Active
**Key Usage:** `getVehicleModsData.ts`
*   `id`: **Read**.
*   `mod_id`: **Read**. Join key.
*   `part_inventory_id`: **Read**. Links to part details.
*   `quantity`: **Read**. (Mapped as `quantity_used`).

### **mod_plans**
**Status:** Active
**Key Usage:** `features/mods/actions.ts`
*   `id`: **Read/Write**.
*   `user_id`: **Read/Write**. RLS.
*   `mod_log_id`: **Read/Write**. Links to `mods` table entry.
*   `name`: **Read/Write**.

### **mod_steps**
**Status:** Active
**Key Usage:** `features/mods/actions.ts`
*   `id`: **Read/Write**.
*   `mod_plan_id`: **Read/Write**.
*   `step_order`: **Read/Write**. Reordering logic similar to jobs.
*   `description`: **Read/Write**.
*   `notes`: **Read/Write**.
*   `is_completed`: **Read/Write**.
*   `is_completed_reassembly`: **Read/Write**.
