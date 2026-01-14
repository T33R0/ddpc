# AGENT OPERATIONAL DIRECTIVE // PROJECT: DDPC

> **MISSION:** Build a lean, reliable, and scalable automotive lifecycle platform.
> **MINDSET:** Silent Producer. Execute with precision. No fluff. High impact.

---

## 1. GLOBAL THEMES & STANDARDS
All generated code and architectural decisions must align with these six pillars:

1.  **SPEED:**
    * Frontend: Target <100ms interaction latency. Optimize render cycles.
    * Backend: Efficient query paths. Minimal overhead.
2.  **SECURITY:**
    * Row Level Security (RLS) is mandatory on all Supabase tables.
    * Zero trust on inputs. Sanitize everything.
    * Never hardcode secrets.
3.  **QUALITY:**
    * Type-safety is non-negotiable (Strict TypeScript).
    * Components must be modular and reusable.
    * Error handling must be graceful and user-informative.
4.  **SUSTAINABILITY:**
    * Code must be readable and self-documenting.
    * Avoid technical debt; refactor as you build.
5.  **EFFICIENCY:**
    * Don't over-engineer. Solve the immediate problem with the simplest robust solution.
    * Minimize dependencies.
6.  **SCALABILITY:**
    * Build for 10x growth, but deploy for today.
    * Database schema must support future feature expansion without breaking changes.

---

## 2. RULES OF ENGAGEMENT (ROEs)

### A. Database & SQL Protocol
* **READ-ONLY EXECUTION:** You are **prohibited** from executing `INSERT`, `UPDATE`, `DELETE`, or `DROP` statements directly against the production or development database.
* **MIGRATION GENERATION:**
    * Create SQL files for all schema changes.
    * Present SQL to the user for review and manual execution.
    * Format: `[YYYYMMDD_HHMM]_description.sql`.

### B. Documentation & Change Logging
* **MANDATORY LOGGING:** Every significant file modification must be recorded.
* **FORMAT:** Update `apps/docs/content/general/CHANGELOG.md` (or creating it if missing) with:
    * `[DATE]` `[COMPONENT]` `[CHANGE TYPE]` Description of change.
* **INLINE DOCS:** Complex logic requires concise comments explaining *why*, not just *what*.

### C. Tech Stack Alignment
* **Framework:** Next.js (App Router)
* **Database:** Supabase (PostgreSQL)
* **Deployment:** Vercel
* **Language:** TypeScript

---

## 3. DYNAMIC CONTEXT (AUTO-GENERATED)
*Instructions to Agent: Upon first reading this file, scan the current directory structure, `package.json`, and database schema. Summarize the current state below. Update this section as the project evolves.*

**[AGENT: INSERT PROJECT TOPOGRAPHY BELOW]**

* **Current Architecture State:**
  - Monorepo (Turborepo) layout under my-turborepo.
  - Apps: my-turborepo/apps/web (Next.js app), my-turborepo/apps/docs (Next.js docs).
  - TypeScript-based projects (TypeScript 5.9.2 referenced).
  - Supabase integration present (supabase/ directory).
  - Vercel-related packages and hints (e.g., @vercel/* deps).

* **Key Directories:**
  - my-turborepo/
    - apps/web/
    - apps/docs/
  - supabase/
  - branding/
  - root-level docs: README.md, ddpc_audit.md, discovertoexplore.md

* **Active Integrations:**
  - Supabase (client libs present: @supabase/supabase-js, @supabase/ssr).
  - Vercel ecosystem packages present (@vercel/analytics, @vercel/kv, @vercel/speed-insights).
  - OpenAI referenced in web app dependencies.
  - Radix UI and other frontend libs in web app.

* **Known Technical Debt / Notes:**
  - CHANGELOG.md is located at `apps/docs/content/general/CHANGELOG.md`.
  - Internal workspace packages use broad "*" versions (my-turborepo pattern) — review for reproducibility.
  - Next and React versions are recent/alpha (Next ^15, React ^19) — ensure compatibility with tooling.
  - Supabase directory exists but remote DB schema not available for scan here — any DB actions must follow ROEs.
  - Large audit file present: ddpc_audit.md (potentially useful for historical context).

---

## 4. EXECUTION PROTOCOL
1.  **Analyze** the request against the Global Themes.
2.  **Plan** the changes (step-by-step reasoning).
3.  **Generate** the code/SQL.
4.  **Verify** against Security and Quality standards.
5.  **Document** the change in the log.

---
