# Handoff Prompt for Next Refactoring Chat

Copy-paste this into your next chat:

---

I just finished a repo analysis and partial cleanup of the DDPC codebase. Read `REPO_ANALYSIS.md` in the project root — it has the full findings and tracks what's done vs. deferred.

**Your job: complete the remaining refactoring items.**

## Priority 1: Supabase Client Consolidation (Tier 2, Item 9)

`lib/supabase.ts` exports a singleton browser client + 3 explore helper functions. 15 files import from it. The canonical client factory is at `lib/supabase/client.ts`.

**Steps:**
1. Move the 3 explore helpers (`getVehicleSummaries`, `getVehicleFilterOptions`, `getVehicleById`) to `features/explore/lib/api.ts`
2. Update the 3-4 files that use those helpers to import from the new location
3. For the ~12 files importing the `supabase` singleton: replace with `const supabase = createClient()` using `lib/supabase/client.ts`
4. Gut `lib/supabase.ts` with a deprecation stub
5. Run `tsc --noEmit --project apps/web/tsconfig.json` to verify

## Priority 2: T0-T3 Tier System Decision (Tier 3, Item 15)

`lib/plan-utils/index.ts` defines a T0-T3 tier system, but `getPlanForUser()` always returns T0. Two API routes (`api/odometer/route.ts` and `api/bot/message/route.ts`) gate on T1+ features, meaning they return 403 for ALL users.

**Decision needed from me:** Do we want real tier gating or should we remove the gates? I think we should remove the tier gates from those two routes for now (let all authenticated users access odometer updates and the bot), delete `lib/plan-utils/`, delete `lib/hooks/useTier.ts`, and remove the `Tier` type from `@repo/types`. The working tier system is free/pro/vanguard in `lib/auth.tsx`.

## Priority 3: @repo/ui Restructure (Tier 2, Item 11)

Auth components (`auth-context.tsx`, `auth-modal.tsx`, `user-account-dropdown.tsx`), landing components (`landing/`), and layout components (`header.tsx`, `footer.tsx`) are in `@repo/ui` but they're app-specific, not design system primitives. Move them to `apps/web/src/components/`. This will touch 30+ import paths.

## Priority 4: API Error Standardization (Tier 2, Item 10)

42+ API routes use 3 different error patterns. Create a `lib/api-utils.ts` with `apiError(message, status)` and `apiSuccess(data)` helpers. Migrate routes incrementally.

## Priority 5: Remaining Cleanup

- Delete `@repo/assets` package and remove references from `next.config.js` and `package.json` files
- `api/steward/route.ts` line 55 and `api/steward/cron/daily/route.ts` line 47 still have hardcoded emails — should use env vars
- Duplicate `getServiceRoleClient()` in `lib/public-profile.ts` and `lib/public-vehicle-utils.ts` — use `createAdminClient()` from `lib/supabase/admin.ts` instead

**Verify after each change:** `tsc --noEmit --project apps/web/tsconfig.json`
