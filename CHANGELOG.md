CHANGELOG.md entry (append-only — do not modify existing content, only add new entries)
[2025-12-10] [agents.md] [ADD] Add AGENT OPERATIONAL DIRECTIVE // PROJECT: DDPC (initial operational directive and project agent rules)

Notes / Observations from repository scan
- Root-level package.json is a turborepo manifest (my-turborepo) with workspaces apps/* and packages/*.
- Identified Next.js apps at my-turborepo/apps/web and my-turborepo/apps/docs. Both target Next and React (versions present in their package.json files).
- Supabase configuration folder exists at supabase/ (no remote DB access; schema must be supplied or migrations created for changes).
- No existing CHANGELOG.md at repo root — the above entry is formatted for appending to a newly created file.
- Ensure all changelog additions are appended; agents must never edit prior changelog entries, only add new lines.

[2025-05-24] [docs] [ADD] Added packages/ui/COMPONENT_BIBLE.md (UI standardization guide)
[2025-05-24] [docs] [ADD] Added ddpc_audit_report.md (Repo audit for dead code and redundancy)
[2025-05-24] [maintenance] [REMOVE] Removed openai dependency, Scrutineer ghosts, and cleaned up broken UI exports.
[2025-05-24] [ui] [REFACTOR] Deleted duplicate apps/web/src/components/ui and refactored VehicleCard to Gold Standard.
[2025-05-24] [docs] [AUDIT] Added Phase 2 UI Compliance findings (financials-dashboard and ModCard) to ddpc_audit_report.md
[2025-05-24] [ui] [REFACTOR] Sector Clear: Standardized ModCard and FinancialsDashboard (removed hardcoded themes, migrated to primitives).
[2025-12-20] [database] [SECURITY] Resolves security_definer_view and function_search_path_mutable warnings by adding security_invoker to v_vehicle_data_typed and setting search_path on get_vehicle_countries and enable_admin_notifications.
