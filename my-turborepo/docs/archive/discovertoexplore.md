# Change Log: Discover -> Explore

This document records all changes made to replace "discover" with "explore" throughout the codebase.

## Summary
- **Term Replacement**: Replaced "discover" with "explore" (case-insensitive) in all text, code, and file paths.
- **Directory Renames**: 
  - `apps/web/src/app/discover` -> `apps/web/src/app/explore`
  - `apps/web/src/app/api/discover` -> `apps/web/src/app/api/explore`
  - `apps/web/src/features/discover` -> `apps/web/src/features/explore`
  - `media/.../scrutineer_(discovery)` -> `media/.../scrutineer_(explore)`
- **File Renames**:
  - `discover-action-buttons.tsx` -> `explore-action-buttons.tsx`
- **Database View**: Updated code to use `v_vehicle_explore` instead of `v_vehicle_discovery`. A SQL migration file `my-turborepo/rename_discovery_view.sql` has been created to rename the view in the database.

## Detailed Changes

### Directories & Files Renamed
1.  `my-turborepo/apps/web/src/app/discover` -> `.../explore`
2.  `my-turborepo/apps/web/src/app/api/discover` -> `.../explore`
3.  `my-turborepo/apps/web/src/features/discover` -> `.../explore`
4.  `my-turborepo/apps/web/src/features/explore/discover-action-buttons.tsx` -> `.../explore-action-buttons.tsx`
5.  `my-turborepo/media/images/stitch_ddpc_console_tactical_layout/stitch_ddpc_console_tactical_layout/scrutineer_(discovery)` -> `.../scrutineer_(explore)`

### Code & Content Updates

#### Frontend Components & Pages
- **`apps/web/src/features/garage/add-vehicle-modal.tsx`**:
    - Updated API calls from `/api/discover/*` to `/api/explore/*`.
    - Renamed `handleDiscoverClick` to `handleExploreClick`.
    - Updated router push to `/explore`.
- **`apps/web/src/app/details/[year]/[make]/[model]/page.tsx`**:
    - Updated back link to `/explore`.
- **`apps/web/src/app/explore/page.tsx`** (formerly `app/discover/page.tsx`):
    - Renamed component `Discover` to `Explore`.
    - Updated imports to point to `explore` feature folder.
    - Updated page title to "Explore".
- **`apps/web/src/features/explore/explore-action-buttons.tsx`**:
    - Renamed component `DiscoverActionButtons` to `ExploreActionButtons`.
- **`apps/web/src/features/explore/vehicle-gallery.tsx`**:
    - Updated comments.
- **`apps/web/src/features/explore/scrutineer-modal.tsx`**:
    - Updated text "discover vehicles" to "explore vehicles".
- **`packages/ui/src/footer.tsx`**:
    - Changed link "Vehicle Discovery" to "Vehicle Explore" pointing to `/explore`.
- **`packages/ui/src/header.tsx`**:
    - Updated navigation link to `/explore`.
- **`packages/ui/src/landing/Testimonials.tsx`**:
    - Updated testimonial text ("vehicle discovery feature" -> "vehicle explore feature").
- **`packages/ui/src/landing/Features.tsx`**:
    - Updated feature title and description ("Vehicle Discovery" -> "Vehicle Explore").
- **`apps/web/src/app/dashboard/page.tsx`**:
    - Updated dashboard card "Vehicle Discovery" to "Vehicle Explore" and route to `/explore`.

#### Backend & API
- **`apps/web/src/app/api/explore/filters/route.ts`** (formerly `api/discover/filters/route.ts`):
    - Updated cache headers `X-Discover-Filters-Cache` to `X-Explore-Filters-Cache`.
- **`apps/web/src/lib/supabase.ts`**:
    - Updated `getVehicleSummaries` to call `/api/explore/vehicles`.
    - Updated `getVehicleFilterOptions` to call `/api/explore/filters`.
    - Updated table reference `v_vehicle_discovery` to `v_vehicle_explore`.
- **`apps/web/src/app/api/garage/decode-vin/route.ts`**:
    - Updated table reference `v_vehicle_discovery` to `v_vehicle_explore`.

#### AI / Scrutineer
- **`apps/web/src/app/api/scrutineer/message/route.ts`**:
    - Renamed `Discover` tool object to `Explore`.
    - Updated tool name `discover.searchVehicles` to `explore.searchVehicles`.
    - Updated skill handling logic (`skill === 'explore'`).
    - Updated assistant reply text.
- **`apps/web/src/features/scrutineer/scrutineer-admin.tsx`**:
    - Updated skill type definition.
- **`packages/scrutineer/src/tools.ts`**:
    - Renamed `Discover` export to `Explore`.
    - Updated `SkillTools` mapping.
- **`packages/scrutineer/src/memory.ts`**:
    - Updated `skillHint` type definition.
- **`packages/scrutineer/README.md`**:
    - Updated documentation for "Explore" skill.
- **`packages/ui/src/chat-window.tsx`**:
    - Updated `skill` prop type and default value.
    - Updated welcome message and suggestion buttons.

#### Documentation & SQL
- **`my-turborepo/database-migrations.sql`**: Updated comments.
- **`my-turborepo/structure.md`**: Updated directory structure and API endpoint documentation.
- **`my-turborepo/DATABASE_DEPLOYMENT_GUIDE.md`**: Updated URLs and instructions.
- **`my-turborepo/database-performance-fix.sql`**: Updated comments.
- **`ddpc_audit.md`**: Updated system audit documentation to reflect new paths and terms.
- **`my-turborepo/apps/docs/app/database/schema-reference.md`**: Updated reference text.
- **`my-turborepo/apps/docs/app/about/page.tsx`**: Updated text.
- **`my-turborepo/branding.md`**: Updated branding copy.

#### Media Assets
- Updated HTML code in `media/images/stitch_ddpc_console_tactical_layout/...` to replace "Discovery" with "Explore".

## Required Actions
1.  Run the SQL migration `my-turborepo/rename_discovery_view.sql` in your Supabase project to rename the database view.

