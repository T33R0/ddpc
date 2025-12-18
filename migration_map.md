# Phase 2 UI Migration Map (Ghost-Free Edition)

**Date:** 2025-05-24
**Status:** READY FOR DELETION
**Auditor:** Lead Software Architect

---

## 1. Import Analysis
An exhaustive scan of `apps/web` reveals **ZERO** files currently importing from the local `apps/web/src/components/ui/` directory.

All active components are already correctly importing from `@repo/ui`:
*   `import { Button } from '@repo/ui/button'` ✅
*   `import { Card } from '@repo/ui/card'` ✅
*   `import { Badge } from '@repo/ui/badge'` ✅

**Conclusion:** The local directory `apps/web/src/components/ui/` contains strictly dead code.

---

## 2. Integrity Check
Comparison of local "vibe coded" components vs `@repo/ui` standard:

| Component | Local Implementation | AI Logic? | Verdict |
| :--- | :--- | :--- | :--- |
| **Button** | Custom class string concatenation (inferior to `cva`) | NO | Safe to Delete |
| **Card** | Simple `div` wrappers with Tailwind classes | NO | Safe to Delete |
| **Badge** | Custom class string concatenation | NO | Safe to Delete |

**Note:** No "AI" or "Scrutineer" logic was found embedded in these UI primitives.

---

## 3. Next Session Instructions
Since no imports need mapping, the next session can proceed directly to file deletion.

**Command:**
```bash
rm -rf apps/web/src/components/ui
```
*Verification:* Run `npx turbo run build --filter=web` immediately after deletion to confirm.
