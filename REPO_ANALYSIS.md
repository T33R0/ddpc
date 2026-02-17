# DDPC Repository Analysis

**Date:** February 16, 2026
**Scope:** Full codebase scan — features, lib, actions, API routes, migrations, shared packages, configs
**Focus:** Evolution of thinking, action items

---

## Repo Profile

| Metric | Value |
|--------|-------|
| Source files | ~675 (excluding node_modules, .next, .git) |
| File types | 219 TSX, 187 TS, 70 SQL, 37 MD, 27 JSON |
| Migration span | May 2024 → Feb 2026 (~22 months) |
| Feature modules | 20 directories (18 active + 2 stubs) |
| API routes | 42 route files |
| Shared packages | 8 (ui, types, services, tailwind-config, eslint-config, prettier-config, typescript-config, assets) |

---

## Evolution Narrative: Four Phases

### Phase 1 — Foundation (May 2024 – Jan 2025)
Core tables, basic auth, free/pro plan model. RLS was added iteratively and broke multiple times. Three separate migrations fix `user_profile` RLS (permissions → recursion → final consolidation). The pattern: build fast, fix permissions after.

### Phase 2 — Feature Sprint (Jan – Nov 2025)
Ogma AI system built out (most sophisticated module: 32 files, Trinity Protocol, sensors, scheduler). Fuel, service, and mods matured into clean feature modules. The T0-T3 tier abstraction was attempted but never completed — `getPlanForUser()` always returns T0.

### Phase 3 — Stability Crisis (Nov – Dec 2025)
Performance audit revealed zombie functions, materialized view needs, and 13 redundant RLS policies on `user_profile` alone. Major cleanup migration dropped stale functions, consolidated policies, fixed `security_definer` warnings. Beta launch audit documented critical blockers.

### Phase 4 — Structured Expansion (Jan – Feb 2026)
Parts lifecycle built in deliberate 4-phase migration pattern (parts → planning → fluids → inspections). Vector embeddings added for vehicle search (HNSW → IVFFlat optimization). Component system restructured. This phase shows the most disciplined approach.

**Key insight:** The codebase matured from "ship and fix" to "plan then ship" — but artifacts from earlier phases remain embedded throughout.

---

## Pattern 1: Repeated Auth Firefighting

### What happened
RLS on `user_profile` was fixed three times across three separate migrations. The app layer mirrors this: `actions/admin.ts` repeats the same 5-line admin auth check 8 times (fetch user → check hardcoded breakglass email → check role).

### Evidence
- Migration `fix_user_profile_permissions` (Jan 2025) — first attempt
- Migration `fix_user_profile_rls` (Feb 2025) — drops recursive policies
- Migration `fix_user_profile_rls_final` (Dec 2025) — comprehensive rewrite
- Migration `fix_rls_recursion` (Feb 2025) — recursive evaluation fix
- `actions/admin.ts` lines 8, 38, 156, 198, 292, 382 — `BREAKGLASS_EMAIL = 'myddpc@gmail.com'` repeated 6 times
- `api/ogma/route.ts` lines 55-56 — hardcoded `verifiedEmails` and `verifiedIds` arrays

### Action items
- [x] Extract `requireAdmin()` utility (single auth check, env-based breakglass email) — **DONE (Session 1)**
- [x] Move `BREAKGLASS_EMAIL` to environment variable — **DONE (Session 1)**
- [x] Move `verifiedEmails` / `verifiedIds` from Ogma route to env vars — **DONE (Session 2)**: Now reads `OGMA_VERIFIED_EMAILS` and `OGMA_VERIFIED_IDS` env vars
- [x] Move Ogma cron recipients to env var — **DONE (Session 2)**: Now reads `OGMA_CRON_RECIPIENTS`
- [ ] Consider adding RLS regression tests to prevent future policy breakage

---

## Pattern 2: Premature Abstraction → Hollow Packages

### What happened
Monorepo structure was built for scale (good instinct) but some packages were created speculatively and never filled in. Meanwhile, real shared logic lives duplicated inside `lib/`.

### Evidence
- `@repo/services` — exports 1 function (`predictUpcomingNeeds`), **zero imports anywhere**. References a `analytics.survival_miles` table that may not exist. A duplicate lives at `lib/services/analytics/predict.ts`.
- `@repo/assets` — 3 image files, no exports in package.json. Web app uses `/public/branding/` instead. Cannot be imported as `@repo/assets/...`.
- `@repo/ui` — 47 components, but includes auth logic (`AuthProvider`, `AuthModal`), landing page components (`Hero`, `Pricing`, `Testimonials`), and `user-account-dropdown.tsx` with hardcoded routes. `auth-modal.tsx` imports `react-hot-toast` which is **not in `@repo/ui` package.json** — a broken dependency.

### Action items
- [x] ~~Delete `@repo/services` package entirely~~ — **DONE (Session 1)**: Marked deprecated.
- [x] ~~Delete `@repo/assets` package~~ — **DONE (Session 2)**: Removed from `next.config.js` (web + docs) and `docs/package.json`. Package stubbed as deprecated.
- [x] Move auth components (`auth-context.tsx`, `auth-modal.tsx`, `user-account-dropdown.tsx`) from `@repo/ui` to `apps/web/src/components/auth/` — **DONE (Session 2)**
- [x] Move landing components (`landing/`) from `@repo/ui` to `apps/web/src/components/landing/` — **DONE (Session 2)**
- [x] Move `header.tsx`, `footer.tsx` from `@repo/ui` to `apps/web/src/components/layout/` — **DONE (Session 2)**
- [ ] Add `react-hot-toast` to `@repo/ui/package.json` as interim fix (or audit now that auth-modal moved to web app)

---

## Pattern 3: Dual Identity Systems

### What happened
Two incompatible tier models exist simultaneously. The T0-T3 system was an attempt to formalize tiers but was never completed. The free/pro/vanguard system won by default.

### Evidence
- `lib/plan-utils/index.ts` defines `Tier = 'T0' | 'T1' | 'T2' | 'T3'` with `mapPlanToTier()` and `getTierFeatures()` — but `getPlanForUser()` always returns `Promise.resolve('T0')` (hardcoded placeholder)
- `lib/hooks/useTier.ts` calls the stubbed tier system
- `lib/auth.tsx` and `@repo/types` use the working `'free' | 'pro' | 'vanguard'` model
- `usePaywall()` only checks `isPro` boolean — no awareness of T0-T3
- `api/odometer/route.ts` checks T1 features but tier always resolves to T0
- `lib/types.ts` header: "Local types for Vercel deployment - copied from @repo/types" — manual copy that's already stale (missing `vanguard` from User.plan)

### Action items
- [x] Delete `lib/plan-utils/index.ts` (T0-T3 system — dead code) — **DONE (Session 2)**: Stubbed as deprecated.
- [x] Delete `lib/hooks/useTier.ts` (consumer of dead code) — **DONE (Session 2)**: Stubbed as deprecated.
- [x] Remove T1 feature check in `api/odometer/route.ts` — **DONE (Session 2)**: Route now allows all authenticated users.
- [x] Remove tier gates in `api/bot/message/route.ts` — **DONE (Session 2)**: Route now allows all authenticated users.
- [x] Delete `Tier` and `UpgradeRequiredError` types from `@repo/types` — **DONE (Session 2)**
- [x] ~~Delete `lib/types.ts`~~ — **DONE (Session 1)**: Stubbed as deprecated, imports redirected.
- [x] Audit all imports of `lib/types.ts` and redirect to `@repo/types` — **DONE (Session 1)**

---

## Pattern 4: Feature Modules at Different Maturity Levels

### What happened
Features were built depth-first. Core modules (ogma, parts, workshop, service, fuel) are production-ready with clean patterns. Others are stubs with a single `actions.ts` and no UI.

### Evidence

**Production-ready:**
| Feature | Files | Pattern |
|---------|-------|---------|
| ogma | 32 | Core/sensors/tools/scheduler architecture, Trinity Protocol |
| parts | 16 | Type-specific forms, health tracking, 4-phase migration |
| workshop | 17 | Job/order management, complex workflows |
| service | 15 | Job planning, duplication, reordering |
| mods | 11 | Mod planning builder |
| fuel | 10 | Schema + actions + components + lib, barrel exports |

**Stubs:**
| Feature | Files | State |
|---------|-------|-------|
| issues | 1 | `actions.ts` only — no components, no types |
| preferences | 1 | `actions.ts` only |
| user | 1 | `actions.ts` only (theme switching) |
| financials | 1 | Single dashboard component |
| inspections | 3 | Form + actions, no business logic |

### Action items
- [ ] Decide: keep stubs as intentional placeholders or remove to reduce noise
- [ ] If keeping: add `README.md` or `STATUS.md` to each stub marking it as planned
- [ ] If removing: delete stub directories, move any useful actions to parent feature or `lib/`
- [ ] Document feature maturity levels in architecture docs

---

## Pattern 5: Duplication as a Coping Mechanism

### What happened
During fast iteration, copy-paste was faster than extraction. Now multiple files define the same utilities.

### Evidence
- **Supabase client:** `lib/supabase.ts` (browser singleton + explore helpers), `lib/supabase/client.ts` (browser factory), `lib/supabase/server.ts` (server factory), `lib/supabase/admin.ts` (admin factory). The `lib/supabase.ts` file mixes client export with API wrapper functions.
- **`getServiceRoleClient()`** defined identically in both `lib/public-profile.ts` and `lib/public-vehicle-utils.ts`
- **Admin auth check** — same pattern repeated 8 times in `actions/admin.ts`
- **Error handling** — API routes use three different patterns: throw errors, return `{ error }` objects, or return `NextResponse.json({ error }, { status })` with inconsistent status codes
- **Auth in API routes** — three approaches: bearer token from header, session-based, and inline client creation. 37 routes use server factory, 1 uses bearer, 1 creates client inline.
- **`revalidatePath()`** — 118 instances across codebase with inconsistent specificity

### Action items
- [x] Delete `lib/supabase.ts` — **DONE (Session 2)**: Explore helpers moved to `features/explore/lib/api.ts` (unused, preserved for future). 17 consumer files migrated to `createClient()` from `lib/supabase/client`. File stubbed as deprecated.
- [x] Extract `getServiceRoleClient()` to use `createAdminClient` from `lib/supabase/admin.ts` — **DONE (Session 2)**: Replaced duplicate in `lib/public-profile.ts` and `lib/public-vehicle-utils.ts`.
- [x] Create `requireAdmin()` utility — **DONE (Session 1)**
- [x] Standardize API error responses: created `lib/api-utils.ts` with `apiError()`, `apiSuccess()`, and semantic shortcuts — **DONE (Session 2)**: 4 routes migrated as proof of pattern. Remaining ~38 routes can be migrated incrementally.
- [ ] Standardize API auth: document when to use server factory vs. bearer vs. inline
- [ ] Audit Stripe checkout route — likely should use server factory, not direct `@supabase/supabase-js` import
- [ ] Address `revalidatePath()` inconsistency (118 instances)

---

## Additional Findings

### Config Issues
- ~~`turbo.json` has `STRIPE_MCP_KEY` listed twice (duplicate env var)~~ — **DONE (Session 1)**
- Root `package.json` has dependencies that belong in `apps/web` (`dotenv`, `@supabase/auth-helpers-nextjs`, `vaul`, `vercel`)
- `apps/web/src/lib/database.types.ts` is an empty file (placeholder for generated Supabase types, never populated)

### Migration Debt
- **Squash candidates:** Embedding trilogy (3 migrations for one feature: add → drop → recreate), three RLS fix migrations
- **Orphaned scripts:** `/database/scripts/` has 8 one-off SQL files not in the formal migration pipeline. Should be audited — move to migrations/ or delete if already applied.
- **Edge function:** `check-maintenance-due` has notification insertion **commented out**. Either complete or remove.

### Documentation Health
- CHANGELOG.md last entry: Dec 2025 (gap in Jan-Feb 2026 despite heavy migration activity)
- Ogma constitution effective date says 2025-01-27 but references Next.js 16 (released later)
- BETA_LAUNCH_AUDIT.md has open items (animation library duplication, middleware optimization) not tracked anywhere

---

## Prioritized Action Plan

### Tier 1: Safe Surgical Wins (no behavioral change, pure cleanup)
1. ~~Delete `lib/plan-utils/index.ts` and `lib/hooks/useTier.ts` (dead T0-T3 system)~~ — ✅ **DONE (Session 2)**: Stubbed as deprecated. Tier gates removed from API routes.
2. ✅ ~~Delete `lib/types.ts` and redirect imports to `@repo/types`~~ — **DONE (Session 1)**: Redirected 4 imports. File stubbed.
3. ✅ ~~Delete `@repo/services` package~~ — **DONE (Session 1)**: Marked deprecated.
4. ✅ ~~Delete `@repo/assets` package~~ — **DONE (Session 2)**: Refs removed from configs. Package stubbed.
5. ✅ ~~Remove duplicate `STRIPE_MCP_KEY` from `turbo.json`~~ — **DONE (Session 1)**.
6. ✅ ~~Delete empty `lib/database.types.ts`~~ — **DONE (Session 1)**: Stubbed.

### Tier 2: Consolidation (same behavior, cleaner architecture)
7. ✅ ~~Extract `requireAdmin()` utility from `actions/admin.ts`~~ — **DONE (Session 1)**
8. ✅ ~~Move breakglass email to env var~~ — **DONE (Session 1)**
9. ✅ ~~Delete `lib/supabase.ts`, consolidate to `lib/supabase/` directory~~ — **DONE (Session 2)**: 17 files migrated. Explore helpers relocated. Duplicate `getServiceRoleClient()` eliminated.
10. ✅ ~~Standardize API error response helper~~ — **DONE (Session 2)**: `lib/api-utils.ts` created. 4 routes migrated. Remaining routes can be migrated incrementally using same pattern.
11. ✅ ~~Move auth/landing/layout components from `@repo/ui` to `apps/web`~~ — **DONE (Session 2)**: 14 files moved to `components/auth/`, `components/layout/`, `components/landing/`. 12 consumer files updated.

### Tier 3: Decisions Required (product/architecture choices)
12. Decide fate of stub features (issues, preferences, user, financials)
13. Complete or remove `check-maintenance-due` edge function
14. Squash migration history (if desired for cleaner schema evolution)
15. ✅ ~~Decide whether to resurrect T0-T3 tier system or commit to free/pro/vanguard~~ — **DONE (Session 2)**: Decision = commit to free/pro/vanguard. T0-T3 system removed. Odometer and bot routes ungated for all authenticated users.
16. Address beta audit open items (animation library duplication, middleware optimization)

---

## Changes Made

### Session 1 (Feb 16, 2026 — Analysis & Initial Cleanup)

**New Files:**
- `apps/web/src/lib/require-admin.ts` — Centralized admin auth utility

**Modified Files:**
- `apps/web/src/actions/admin.ts` — Replaced 6 inline auth blocks with `requireAdmin()`/`requireBreakglass()`
- `apps/web/src/app/hub/page.tsx` — Use `isBreakglassEmail()` instead of hardcoded email
- `apps/web/src/app/admin/layout.tsx` — Use `isBreakglassEmail()` instead of hardcoded email
- `apps/web/src/features/admin/AdminUserTable.tsx` — Use env var for breakglass email
- `apps/web/src/features/garage/add-vehicle-modal.tsx` — Import from `@repo/types` instead of `lib/types`
- `apps/web/src/features/explore/vehicle-gallery.tsx` — Import from `@repo/types` instead of `lib/types`
- `apps/web/src/lib/embeddings.ts` — Import from `@repo/types` instead of `lib/types`
- `apps/web/src/lib/public-profile.ts` — Import from `@repo/types` instead of `lib/types`
- `apps/web/src/lib/types.ts` — Gutted, marked deprecated
- `apps/web/src/lib/database.types.ts` — Marked deprecated
- `packages/services/src/index.ts` — Marked deprecated
- `turbo.json` — Removed duplicate `STRIPE_MCP_KEY`

### Session 2 (Feb 16, 2026 — Refactoring Completion)

**New Files:**
- `apps/web/src/features/explore/lib/api.ts` — Explore helpers relocated from `lib/supabase.ts`
- `apps/web/src/lib/api-utils.ts` — Standardized API error/success response helpers
- `apps/web/src/components/auth/auth-context.tsx` — Auth provider (moved from `@repo/ui`)
- `apps/web/src/components/auth/auth-modal.tsx` — Auth modal (moved from `@repo/ui`)
- `apps/web/src/components/auth/user-account-dropdown.tsx` — User dropdown (moved from `@repo/ui`)
- `apps/web/src/components/auth/use-click-outside.ts` — Hook (moved from `@repo/ui`)
- `apps/web/src/components/layout/header.tsx` — Site header (moved from `@repo/ui`)
- `apps/web/src/components/layout/footer.tsx` — Site footer (moved from `@repo/ui`)
- `apps/web/src/components/landing/*` — 8 landing components (moved from `@repo/ui`)

**Modified Files (Supabase Client Migration — 17 files):**
- `apps/web/src/lib/hooks/useMeters.ts`
- `apps/web/src/features/garage/GarageContent.tsx`
- `apps/web/src/features/service/components/ServiceHistoryList.tsx`
- `apps/web/src/features/service/components/AddServiceDialog.tsx`
- `apps/web/src/features/service/components/JobPlanBuilder.tsx`
- `apps/web/src/features/mods/components/ModPlanBuilder.tsx`
- `apps/web/src/app/api/garage/share/route.ts`
- `apps/web/src/app/api/garage/privacy/route.ts`
- `apps/web/src/app/account/page.tsx`
- `apps/web/src/app/admin/email/page.tsx`
- `apps/web/src/app/community/page.tsx`
- `apps/web/src/app/explore/page.tsx`
- `apps/web/src/app/financials/page.tsx`
- `apps/web/src/components/IssueReportForm.tsx`
- `apps/web/src/features/financials/financials-dashboard.tsx`
- `apps/web/src/lib/auth.tsx`
- `apps/web/src/lib/theme-context.tsx`

**Modified Files (Tier System Removal):**
- `apps/web/src/app/api/odometer/route.ts` — Removed T0-T3 tier gate, migrated to `apiError`/`apiSuccess`
- `apps/web/src/app/api/bot/message/route.ts` — Removed tier/rate-limit/budget gates, migrated to `apiError`/`apiSuccess`
- `apps/web/src/lib/plan-utils/index.ts` — Gutted, marked deprecated
- `apps/web/src/lib/hooks/useTier.ts` — Gutted, marked deprecated
- `packages/types/index.ts` — Removed `Tier` type and `UpgradeRequiredError` interface

**Modified Files (@repo/ui Restructure — 12 consumer files):**
- `apps/web/src/features/financials/financials-dashboard.tsx`
- `apps/web/src/app/financials/page.tsx`
- `apps/web/src/app/explore/page.tsx`
- `apps/web/src/app/community/page.tsx`
- `apps/web/src/features/garage/GarageContent.tsx`
- `apps/web/src/lib/component-registry.ts`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/pricing/page.tsx`
- `apps/web/src/app/account/page.tsx`
- `apps/web/src/app/more/page.tsx`
- `apps/web/src/components/HeaderWithAuth.tsx`
- `apps/web/src/components/FooterWrapper.tsx`

**Modified Files (Remaining Cleanup):**
- `apps/web/src/app/api/ogma/route.ts` — Hardcoded emails → `OGMA_VERIFIED_EMAILS` / `OGMA_VERIFIED_IDS` env vars
- `apps/web/src/app/api/ogma/cron/daily/route.ts` — Hardcoded recipients → `OGMA_CRON_RECIPIENTS` env var
- `apps/web/src/lib/public-profile.ts` — Replaced `getServiceRoleClient()` with `createAdminClient()`
- `apps/web/src/lib/public-vehicle-utils.ts` — Replaced `getServiceRoleClient()` with `createAdminClient()`
- `apps/web/next.config.js` — Removed `@repo/assets` from transpilePackages
- `apps/docs/next.config.js` — Removed `@repo/assets` from transpilePackages
- `apps/docs/package.json` — Removed `@repo/assets` dependency
- `packages/assets/package.json` — Added deprecation note
- `packages/ui/package.json` — Removed explicit `auth-context` and `landing` exports
- `turbo.json` — Added `OGMA_VERIFIED_EMAILS`, `OGMA_VERIFIED_IDS`, `OGMA_CRON_RECIPIENTS`, `BREAKGLASS_EMAIL`, `NEXT_PUBLIC_BREAKGLASS_EMAIL`
- `apps/web/src/lib/supabase.ts` — Gutted, marked deprecated
- `apps/web/src/app/api/garage/share/route.ts` — Migrated to `apiError`/`apiSuccess`
- `apps/web/src/app/api/garage/privacy/route.ts` — Migrated to `apiError`/`apiSuccess`

### Verification
- `tsc --noEmit` passes with zero errors (both sessions)
- Dev server builds and runs successfully (Session 2)

---

## Remaining Work

### Quick wins (no architectural decisions needed)
- [ ] Migrate remaining ~38 API routes to `apiError`/`apiSuccess` helpers (incremental, low risk)
- [ ] Add `react-hot-toast` to web app deps (broken import in moved `auth-modal.tsx`)
- [ ] Clean up root `package.json` — move `dotenv`, `@supabase/auth-helpers-nextjs`, `vaul`, `vercel` to `apps/web`

### Decisions needed
- [ ] Stub features: keep or remove? (issues, preferences, user, financials, inspections)
- [ ] Edge function `check-maintenance-due`: complete or remove?
- [ ] Migration squash: yes/no?
- [ ] Beta audit items: prioritize or defer?
- [ ] Standardize API auth approach (server factory vs. bearer) and document

---

*Generated by repo analysis sessions (Feb 16, 2026). Two-session refactor covering Tiers 1-2 and select Tier 3 items.*
