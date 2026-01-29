# Database Schema & Relationships

This document outlines the detailed schema for the specific tables related to Jobs, Maintenance, Mods, and Parts as requested.

## 1. Job & Service Management
Tables related to planning and executing service jobs.

### **job_plans**
**Description:** Represents a planned maintenance task or modification project. It groups steps and links to a maintenance log when active.
*   `id`
*   `user_id`
*   `maintenance_log_id`
*   `name`
*   `created_at`

### **job_steps**
**Description:** Individual checklist items within a `job_plan`, tracking progress and completion.
*   `id`
*   `job_plan_id`
*   `step_order`
*   `description`
*   `notes`
*   `is_completed`
*   `is_completed_reassembly`

### **maintenance_log**
**Description:** Central record for performed service events (e.g., oil changes, repairs) or active jobs in progress.
*   `id`
*   `user_vehicle_id`
*   `service_item_id`
*   `event_date`
*   `odometer`
*   `cost`
*   `service_provider`
*   `notes`
*   `status` (e.g., 'Plan', 'History', 'Archive')

### **service_categories**
**Description:** Classification groups for service items (e.g., "Engine", "Suspension").
*   `id`
*   `name`

### **service_intervals**
**Description:** logic defining when specific services are due based on mileage or time.
*   `id`
*   `name`
*   `interval_months`
*   `interval_miles`

### **service_items**
**Description:** A dictionary of standard service operations (e.g., "Oil Change", "Tire Rotation").
*   `id`
*   `name`
*   `description`
*   `category_id`

### **wishlist_items**
**Description:** Proposed mods or services the user wants to perform in the future.
*   `id`
*   `user_vehicle_id`
*   `user_id`
*   `name`
*   `url`
*   `price`
*   `priority`
*   `type`
*   `status`

---

## 2. Parts & Inventory
Tables for managing stock parts, inventory, and parts used in jobs.

### **maintenance_parts**
**Description:** Link table tracking which parts from inventory were used in a specific maintenance log/job.
*   `maintenance_log_id`
*   `part_id`
*   `quantity_used`

### **part_inventory**
**Description:** The user's personal inventory of parts they own or have in stock.
*   `id`
*   `user_id`
*   `part_number`
*   `name`
*   `cost`
*   `vendor_name`
*   `vendor_link`
*   `physical_location`
*   `quantity`
*   `category`
*   `created_at`

### **master_parts_list**
**Description:** Global catalog of known parts (shared or system-defined) to speed up inventory creation.
*   `id`
*   `part_number`
*   `name`
*   `manufacturer`
*   `description`

### **vehicle_bom**
**Description:** Bill of Materials. Defines the hierarchical structure of stock parts for a vehicle type.
*   `id`
*   `component_type_id`
*   `parent_component_id`
*   `location_on_vehicle`
*   `quantity`
*   `notes`

### **vehicle_installed_components**
**Description:** Represents specific parts installed on a user's vehicle, linking to the BOM.
*   `id`
*   `user_vehicle_id`
*   `bom_id`
*   `specs` (jsonb)
*   `notes`

---

## 3. Modification System
Tables tracking the complex workflow of vehicle modifications.

### **mods**
**Description:** The high-level record of a modification project (e.g., "Turbo Install").
*   `id`
*   `user_vehicle_id`
*   `mod_item_id`
*   `notes`
*   `status` (e.g., 'planned', 'in_progress', 'completed')
*   `cost`

### **mod_categories**
**Description:** Classification for types of modifications (e.g., "Performance", "Aesthetics").
*   `id`
*   `name`
*   `description`

### **mod_items**
**Description:** Standard dictionary of common modifications.
*   `id`
*   `name`
*   `category_id`
*   `description`

### **mod_outcome**
**Description:** Tracks the results or performance changes after a mod is installed (e.g., "Dyno results").
*   `id`
*   `mod_id`
*   `description`
*   `performance_change` (jsonb)

### **mod_parts**
**Description:** Parts specifically purchased or used for a modification project.
*   `id`
*   `mod_id`
*   `part_inventory_id`
*   `quantity`

### **mod_plans**
**Description:** The planning wrapper for a modification, similar to `job_plans`.
*   `id`
*   `user_id`
*   `mod_log_id`
*   `name`

### **mod_steps**
**Description:** Granular steps to complete a modification plan.
*   `id`
*   `mod_plan_id`
*   `step_order`
*   `description`
*   `notes`
*   `is_completed`
*   `is_completed_reassembly`
