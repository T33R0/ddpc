# DDPC Repo Audit Report
**Date:** 2025-05-24
**Auditor:** Lead Software Architect
**Scope:** UI Standardization, Dead Code Elimination, Architecture Hygiene

---

## 1. Executive Summary
The codebase is currently in a "Hybrid" state. While a robust `packages/ui` library (based on Shadcn/ui) exists, substantial technical debt has accumulated in `apps/web` due to "vibe coding" (ad-hoc component creation) and abandoned AI features.

**Strategic Decision:**
*   **Selected UI Standard:** Shadcn/ui (via `@repo/ui`).
*   **Action Plan:** "Search & Destroy" methodology to eliminate redundancy and dead code.

---

## 2. Redundancy Audit (UI Components)
The following components are **DUPLICATES** and must be removed. They often lack the full features (like `cva` support) of the `@repo/ui` versions.

| Component | Duplicate Location | Canonical Source | Action |
| :--- | :--- | :--- | :--- |
| **Button** | `apps/web/src/components/ui/button.tsx` | `@repo/ui/button` | 🗑️ DELETE |
| **Card** | `apps/web/src/components/ui/card.tsx` | `@repo/ui/card` | 🗑️ DELETE |
| **Badge** | `apps/web/src/components/ui/badge.tsx` | `@repo/ui/badge` | 🗑️ DELETE |
| **VehicleCard** | `apps/web/src/components/vehicle-card.tsx` | N/A (Feature Component) | 🛠️ REFACTOR (Use `<Card>`) |

**Impact:**
*   Eliminates inconsistent styling.
*   Reduces bundle size.
*   Enforces the "Component Bible" standards.

---

## 3. "Mysterious" & Dead Code Audit
The following artifacts are identified as unused, broken, or legacy debt.

### A. The "Scrutineer" & AI Ghosts
The AI feature "Scrutineer" was removed, but left footprints.

| Item | Location | Issue | Action |
| :--- | :--- | :--- | :--- |
| **Dependency** | `package.json` (root & web) | `openai` dependency is unused. | 🗑️ UNINSTALL |
| **Broken Export** | `packages/ui/src/index.ts` | Exports `scrutineer-popup` (File does not exist). | ✏️ REMOVE EXPORT |
| **Legacy Route** | `apps/web/src/lib/user-routing.ts` | Includes `'scrutineer'` in `USERNAME_SCOPED_SEGMENTS`. | ✏️ REMOVE STRING |
| **Docs** | `discovertoexplore.md` | References non-existent `scrutineer` files. | 🗑️ DELETE / ARCHIVE |

### B. Other Findings
*   `apps/web/src/components/ui/` folder itself is a violation of the Monorepo structure.

---

## 4. Immediate Action Plan (Next Session)
The following commands should be executed to cleanse the repo:

### Phase 1: Dependencies
```bash
npm uninstall openai
# Check apps/web/package.json for removal as well
```

### Phase 2: Code Cleanup
1.  **Edit `packages/ui/src/index.ts`**: Remove line `export * from './scrutineer-popup';`.
2.  **Edit `apps/web/src/lib/user-routing.ts`**: Remove `'scrutineer',`.
3.  **Delete `apps/web/src/components/ui/`**: Remove the entire folder.
    *   *Note:* This will break builds until imports are updated.
4.  **Refactor Imports**:
    *   Find all `import ... from "@/components/ui/button"`
    *   Replace with `import { Button } from "@repo/ui/button"`

### Phase 3: Component Refactor
1.  **Refactor `VehicleCard`**: Update to use `@repo/ui/card` primitives instead of `div` classes.

---

**Status:** AWAITING EXECUTION

## 5. Phase 2 Audit Findings (UI Compliance)
**Date:** 2025-05-24
**Focus:** Hardcoded Colors, Magic Numbers, and Component Primitive Usage.

### High-Impact Violations
The following components require immediate refactoring to meet the Gold Standard:

1.  **`apps/web/src/features/mods/components/ModCard.tsx`**
    *   **Violations:**
        *   Hardcoded colors: `text-green-500`, `text-blue-500`, `text-destructive`.
        *   Redundant styles: `bg-card` (already handled by Primitive).
        *   Magic classes: `rounded-2xl` (should use Primitive defaults).
    *   **Remediation:** Refactor to use `<Card>` properly, replace colors with `text-muted-foreground` or Badge variants.

2.  **`apps/web/src/features/financials/financials-dashboard.tsx`**
    *   **Violations:**
        *   **Severe Theme Breaking:** Uses hardcoded Dark Mode colors (`bg-gray-900/50`, `text-white`, `text-gray-300`), making it illegible in Light Mode.
        *   **Chart Colors:** Inline hex codes (`#10B981`) instead of CSS variables.
        *   **Primitives:** Uses raw HTML `<table>` instead of `@repo/ui/table`.
    *   **Remediation:** Full refactor to use Semantic Tokens (`bg-card`, `text-foreground`), `@repo/ui/table`, and Recharts CSS variable integration.

3.  **`apps/web/src/features/admin/AdminUserTable.tsx`**
    *   **Violations:** Hardcoded colors and custom table implementation.
    *   **Remediation:** Migrate to `@repo/ui/table`.

### Action Plan
1.  **Immediate:** Refactor `ModCard.tsx` (Low effort, high consistency gain).
2.  **Next:** Refactor `financials-dashboard.tsx` (High effort, critical for theming).
