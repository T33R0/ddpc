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
