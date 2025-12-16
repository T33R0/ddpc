CHANGELOG.md entry (append-only — do not modify existing content, only add new entries)
[2025-12-10] [agents.md] [ADD] Add AGENT OPERATIONAL DIRECTIVE // PROJECT: DDPC (initial operational directive and project agent rules)

Notes / Observations from repository scan
- Root-level package.json is a turborepo manifest (my-turborepo) with workspaces apps/* and packages/*.
- Identified Next.js apps at my-turborepo/apps/web and my-turborepo/apps/docs. Both target Next and React (versions present in their package.json files).
- Supabase configuration folder exists at supabase/ (no remote DB access; schema must be supplied or migrations created for changes).
- No existing CHANGELOG.md at repo root — the above entry is formatted for appending to a newly created file.
- Ensure all changelog additions are appended; agents must never edit prior changelog entries, only add new lines.

[2025-02-26] [Database] [FIX] Updated get_unique_vehicles_with_trims function to use a Functional GIN Index (IMMUTABLE wrapper) to resolve index expression immutability requirements and prevent dependency errors.
[2025-02-27] [Database] [OPTIMIZE] Refined explore search strategy: Reduced index scope to core attributes (Year, Make, Model, Engine, etc.) excluding bulk text (Pros/Cons) for better performance. Implemented new `get_vehicle_tsvector` IMMUTABLE function and GIN index. Added robust query parsing (handling dots, hyphens, and units like "2.0L").
