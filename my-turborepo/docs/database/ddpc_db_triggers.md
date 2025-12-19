| table_name   | trigger_name                            | event  | timing | function_call                                          |
| ------------ | --------------------------------------- | ------ | ------ | ------------------------------------------------------ |
| user_profile | trg_enforce_preferred_vehicle_ownership | INSERT | BEFORE | EXECUTE FUNCTION enforce_preferred_vehicle_ownership() |
| user_profile | validate_plan_insert_trigger            | INSERT | BEFORE | EXECUTE FUNCTION validate_plan_insert()                |
| user_profile | log_user_profile_changes                | UPDATE | AFTER  | EXECUTE FUNCTION log_user_profile_activity()           |
| user_profile | prevent_admin_self_demotion_trigger     | UPDATE | BEFORE | EXECUTE FUNCTION prevent_admin_self_demotion()         |
| user_profile | trg_enforce_preferred_vehicle_ownership | UPDATE | BEFORE | EXECUTE FUNCTION enforce_preferred_vehicle_ownership() |
| user_profile | validate_plan_transition_trigger        | UPDATE | BEFORE | EXECUTE FUNCTION validate_plan_transition()            |
