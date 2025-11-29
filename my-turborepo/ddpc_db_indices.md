updated: 29 nov 2025
# Indices Dump SQL

```
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```
# Supabase DB Indices
```
| tablename             | indexname                                     | indexdef                                                                                                                                    |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| activity_log          | activity_log_pkey                             | CREATE UNIQUE INDEX activity_log_pkey ON public.activity_log USING btree (id)                                                               |
| activity_log          | activity_log_user_id_idx                      | CREATE INDEX activity_log_user_id_idx ON public.activity_log USING btree (user_id)                                                          |
| fuel_log              | fuel_log_pkey                                 | CREATE UNIQUE INDEX fuel_log_pkey ON public.fuel_log USING btree (id)                                                                       |
| fuel_log              | fuel_log_user_id_idx                          | CREATE INDEX fuel_log_user_id_idx ON public.fuel_log USING btree (user_id)                                                                  |
| fuel_log              | fuel_log_user_vehicle_id_idx                  | CREATE INDEX fuel_log_user_vehicle_id_idx ON public.fuel_log USING btree (user_vehicle_id)                                                  |
| fuel_log              | idx_fuel_log_vehicle_odometer                 | CREATE INDEX idx_fuel_log_vehicle_odometer ON public.fuel_log USING btree (user_vehicle_id, odometer DESC)                                  |
| issue_reports         | issue_reports_created_at_idx                  | CREATE INDEX issue_reports_created_at_idx ON public.issue_reports USING btree (created_at DESC)                                             |
| issue_reports         | issue_reports_pkey                            | CREATE UNIQUE INDEX issue_reports_pkey ON public.issue_reports USING btree (id)                                                             |
| issue_reports         | issue_reports_resolved_created_at_idx         | CREATE INDEX issue_reports_resolved_created_at_idx ON public.issue_reports USING btree (resolved, created_at DESC)                          |
| job_plans             | job_plans_maintenance_log_id_idx              | CREATE INDEX job_plans_maintenance_log_id_idx ON public.job_plans USING btree (maintenance_log_id)                                          |
| job_plans             | job_plans_mod_log_id_idx                      | CREATE INDEX job_plans_mod_log_id_idx ON public.job_plans USING btree (mod_log_id)                                                          |
| job_plans             | job_plans_pkey                                | CREATE UNIQUE INDEX job_plans_pkey ON public.job_plans USING btree (id)                                                                     |
| job_plans             | job_plans_user_id_idx                         | CREATE INDEX job_plans_user_id_idx ON public.job_plans USING btree (user_id)                                                                |
| job_steps             | job_steps_job_plan_id_idx                     | CREATE INDEX job_steps_job_plan_id_idx ON public.job_steps USING btree (job_plan_id)                                                        |
| job_steps             | job_steps_pkey                                | CREATE UNIQUE INDEX job_steps_pkey ON public.job_steps USING btree (id)                                                                     |
| job_template_steps    | job_template_steps_pkey                       | CREATE UNIQUE INDEX job_template_steps_pkey ON public.job_template_steps USING btree (id)                                                   |
| job_template_steps    | job_template_steps_template_id_idx            | CREATE INDEX job_template_steps_template_id_idx ON public.job_template_steps USING btree (job_template_id)                                  |
| job_templates         | job_templates_mod_item_id_idx                 | CREATE INDEX job_templates_mod_item_id_idx ON public.job_templates USING btree (mod_item_id)                                                |
| job_templates         | job_templates_pkey                            | CREATE UNIQUE INDEX job_templates_pkey ON public.job_templates USING btree (id)                                                             |
| job_templates         | job_templates_service_item_id_idx             | CREATE INDEX job_templates_service_item_id_idx ON public.job_templates USING btree (service_item_id)                                        |
| job_templates         | job_templates_user_id_idx                     | CREATE INDEX job_templates_user_id_idx ON public.job_templates USING btree (user_id)                                                        |
| maintenance_log       | maintenance_log_pkey                          | CREATE UNIQUE INDEX maintenance_log_pkey ON public.maintenance_log USING btree (id)                                                         |
| maintenance_log       | maintenance_log_service_interval_id_idx       | CREATE INDEX maintenance_log_service_interval_id_idx ON public.maintenance_log USING btree (service_interval_id)                            |
| maintenance_log       | maintenance_log_service_item_id_idx           | CREATE INDEX maintenance_log_service_item_id_idx ON public.maintenance_log USING btree (service_item_id)                                    |
| maintenance_log       | maintenance_log_user_vehicle_status_event_idx | CREATE INDEX maintenance_log_user_vehicle_status_event_idx ON public.maintenance_log USING btree (user_vehicle_id, status, event_date DESC) |
| maintenance_parts     | maintenance_parts_log_id_idx                  | CREATE INDEX maintenance_parts_log_id_idx ON public.maintenance_parts USING btree (maintenance_log_id)                                      |
| maintenance_parts     | maintenance_parts_part_id_idx                 | CREATE INDEX maintenance_parts_part_id_idx ON public.maintenance_parts USING btree (part_id)                                                |
| maintenance_parts     | maintenance_parts_pkey                        | CREATE UNIQUE INDEX maintenance_parts_pkey ON public.maintenance_parts USING btree (maintenance_log_id, part_id)                            |
| master_parts_list     | master_parts_list_pkey                        | CREATE UNIQUE INDEX master_parts_list_pkey ON public.master_parts_list USING btree (id)                                                     |
| master_parts_list     | unique_part_number                            | CREATE UNIQUE INDEX unique_part_number ON public.master_parts_list USING btree (part_number, name)                                          |
| mod_categories        | mod_categories_name_key                       | CREATE UNIQUE INDEX mod_categories_name_key ON public.mod_categories USING btree (name)                                                     |
| mod_categories        | mod_categories_pkey                           | CREATE UNIQUE INDEX mod_categories_pkey ON public.mod_categories USING btree (id)                                                           |
| mod_items             | mod_items_category_id_name_key                | CREATE UNIQUE INDEX mod_items_category_id_name_key ON public.mod_items USING btree (category_id, name)                                      |
| mod_items             | mod_items_pkey                                | CREATE UNIQUE INDEX mod_items_pkey ON public.mod_items USING btree (id)                                                                     |
| mod_outcome           | mod_outcome_mod_id_key                        | CREATE UNIQUE INDEX mod_outcome_mod_id_key ON public.mod_outcome USING btree (mod_id)                                                       |
| mod_outcome           | mod_outcome_pkey                              | CREATE UNIQUE INDEX mod_outcome_pkey ON public.mod_outcome USING btree (id)                                                                 |
| mod_parts             | mod_parts_part_id_idx                         | CREATE INDEX mod_parts_part_id_idx ON public.mod_parts USING btree (part_id)                                                                |
| mod_parts             | mod_parts_pkey                                | CREATE UNIQUE INDEX mod_parts_pkey ON public.mod_parts USING btree (mod_id, part_id)                                                        |
| mods                  | mods_mod_item_id_idx                          | CREATE INDEX mods_mod_item_id_idx ON public.mods USING btree (mod_item_id)                                                                  |
| mods                  | mods_pkey                                     | CREATE UNIQUE INDEX mods_pkey ON public.mods USING btree (id)                                                                               |
| mods                  | mods_user_vehicle_id_idx                      | CREATE INDEX mods_user_vehicle_id_idx ON public.mods USING btree (user_vehicle_id)                                                          |
| odometer_log          | odometer_log_pkey                             | CREATE UNIQUE INDEX odometer_log_pkey ON public.odometer_log USING btree (id)                                                               |
| odometer_log          | odometer_log_user_vehicle_id_idx              | CREATE INDEX odometer_log_user_vehicle_id_idx ON public.odometer_log USING btree (user_vehicle_id)                                          |
| part_inventory        | part_inventory_pkey                           | CREATE UNIQUE INDEX part_inventory_pkey ON public.part_inventory USING btree (id)                                                           |
| part_inventory        | part_inventory_user_id_idx                    | CREATE INDEX part_inventory_user_id_idx ON public.part_inventory USING btree (user_id)                                                      |
| service_categories    | service_categories_name_key                   | CREATE UNIQUE INDEX service_categories_name_key ON public.service_categories USING btree (name)                                             |
| service_categories    | service_categories_pkey                       | CREATE UNIQUE INDEX service_categories_pkey ON public.service_categories USING btree (id)                                                   |
| service_intervals     | service_intervals_pkey                        | CREATE UNIQUE INDEX service_intervals_pkey ON public.service_intervals USING btree (id)                                                     |
| service_intervals     | service_intervals_user_id_idx                 | CREATE INDEX service_intervals_user_id_idx ON public.service_intervals USING btree (user_id)                                                |
| service_intervals     | service_intervals_user_vehicle_id_idx         | CREATE INDEX service_intervals_user_vehicle_id_idx ON public.service_intervals USING btree (user_vehicle_id)                                |
| service_items         | service_items_category_id_name_key            | CREATE UNIQUE INDEX service_items_category_id_name_key ON public.service_items USING btree (category_id, name)                              |
| service_items         | service_items_pkey                            | CREATE UNIQUE INDEX service_items_pkey ON public.service_items USING btree (id)                                                             |
| user_profile          | idx_user_profile_banned                       | CREATE INDEX idx_user_profile_banned ON public.user_profile USING btree (banned)                                                            |
| user_profile          | idx_user_profile_plan                         | CREATE INDEX idx_user_profile_plan ON public.user_profile USING btree (plan)                                                                |
| user_profile          | idx_user_profile_preferred_vehicle_id         | CREATE INDEX idx_user_profile_preferred_vehicle_id ON public.user_profile USING btree (preferred_vehicle_id)                                |
| user_profile          | idx_user_profile_role                         | CREATE INDEX idx_user_profile_role ON public.user_profile USING btree (role)                                                                |
| user_profile          | user_profile_pkey                             | CREATE UNIQUE INDEX user_profile_pkey ON public.user_profile USING btree (user_id)                                                          |
| user_profile          | user_profile_username_key                     | CREATE UNIQUE INDEX user_profile_username_key ON public.user_profile USING btree (username)                                                 |
| user_vehicle          | idx_user_vehicle_owner_id                     | CREATE INDEX idx_user_vehicle_owner_id ON public.user_vehicle USING btree (owner_id)                                                        |
| user_vehicle          | idx_vehicle_created_at                        | CREATE INDEX idx_vehicle_created_at ON public.user_vehicle USING btree (created_at DESC)                                                    |
| user_vehicle          | idx_vehicle_privacy                           | CREATE INDEX idx_vehicle_privacy ON public.user_vehicle USING btree (privacy)                                                               |
| user_vehicle          | vehicle_pkey                                  | CREATE UNIQUE INDEX vehicle_pkey ON public.user_vehicle USING btree (id)                                                                    |
| user_vehicle          | vehicle_public_idx                            | CREATE INDEX vehicle_public_idx ON public.user_vehicle USING btree (privacy) WHERE (privacy = 'public'::text)                               |
| user_vehicle          | vehicle_template_idx                          | CREATE INDEX vehicle_template_idx ON public.user_vehicle USING btree (stock_data_id)                                                        |
| vehicle_data          | idx_vehicle_data_body_type                    | CREATE INDEX idx_vehicle_data_body_type ON public.vehicle_data USING btree (body_type)                                                      |
| vehicle_data          | idx_vehicle_data_cylinders                    | CREATE INDEX idx_vehicle_data_cylinders ON public.vehicle_data USING btree (cylinders)                                                      |
| vehicle_data          | idx_vehicle_data_drive_type                   | CREATE INDEX idx_vehicle_data_drive_type ON public.vehicle_data USING btree (drive_type)                                                    |
| vehicle_data          | idx_vehicle_data_fuel_type                    | CREATE INDEX idx_vehicle_data_fuel_type ON public.vehicle_data USING btree (fuel_type)                                                      |
| vehicle_data          | idx_vehicle_data_make                         | CREATE INDEX idx_vehicle_data_make ON public.vehicle_data USING btree (make)                                                                |
| vehicle_data          | idx_vehicle_data_make_year                    | CREATE INDEX idx_vehicle_data_make_year ON public.vehicle_data USING btree (make, year DESC) WHERE (make IS NOT NULL)                       |
| vehicle_data          | idx_vehicle_data_model                        | CREATE INDEX idx_vehicle_data_model ON public.vehicle_data USING btree (model)                                                              |
| vehicle_data          | idx_vehicle_data_model_year                   | CREATE INDEX idx_vehicle_data_model_year ON public.vehicle_data USING btree (model, year DESC) WHERE (model IS NOT NULL)                    |
| vehicle_data          | idx_vehicle_data_transmission                 | CREATE INDEX idx_vehicle_data_transmission ON public.vehicle_data USING btree (transmission)                                                |
| vehicle_data          | idx_vehicle_data_year                         | CREATE INDEX idx_vehicle_data_year ON public.vehicle_data USING btree (year)                                                                |
| vehicle_data          | idx_vehicle_data_year_int                     | CREATE INDEX idx_vehicle_data_year_int ON public.vehicle_data USING btree (((year)::integer))                                               |
| vehicle_data          | idx_vehicle_data_year_make                    | CREATE INDEX idx_vehicle_data_year_make ON public.vehicle_data USING btree (year, make)                                                     |
| vehicle_data          | idx_vehicle_data_year_make_model              | CREATE INDEX idx_vehicle_data_year_make_model ON public.vehicle_data USING btree (year DESC, make, model)                                   |
| vehicle_data          | idx_vehicle_data_ymm                          | CREATE INDEX idx_vehicle_data_ymm ON public.vehicle_data USING btree (year, make, model)                                                    |
| vehicle_data          | vehicle_data_pkey                             | CREATE UNIQUE INDEX vehicle_data_pkey ON public.vehicle_data USING btree (id)                                                               |
| vehicle_image_archive | vehicle_image_archive_pkey                    | CREATE UNIQUE INDEX vehicle_image_archive_pkey ON public.vehicle_image_archive USING btree (vehicle_id, url)                                |
| vehicle_primary_image | vehicle_primary_image_pkey                    | CREATE UNIQUE INDEX vehicle_primary_image_pkey ON public.vehicle_primary_image USING btree (vehicle_id)                                     |
| vehicle_url_queue     | vehicle_url_queue_pkey                        | CREATE UNIQUE INDEX vehicle_url_queue_pkey ON public.vehicle_url_queue USING btree (id)                                                     |
```