# DDPC Component Bible (The Gold Standard)

> **MANDATE:** Strict adherence to this guide is required. Deviations are considered technical debt.

## 1. The Core Philosophy
*   **Source of Truth:** All UI components MUST be imported from `@repo/ui`.
*   **Prohibited:** Local component definitions (e.g., `apps/web/src/components/ui/button.tsx`) are BANNED.
*   **Styling:** Use Tailwind Utility classes. No `style={{...}}`.
*   **Consistency:** Use Semantic Tokens (`bg-destructive`, `text-primary`) over hardcoded colors (`bg-red-500`).

---

## 2. Component Standards

### A. Buttons (`<Button>`)
**Import:** `import { Button } from '@repo/ui/button'`

| Use Case | Variant | Example |
| :--- | :--- | :--- |
| Primary Action | `default` | `<Button>Save Changes</Button>` |
| Secondary Action | `secondary` | `<Button variant="secondary">Cancel</Button>` |
| Destructive Action | `destructive` | `<Button variant="destructive">Delete Vehicle</Button>` |
| Navigation/Link | `ghost` or `link` | `<Button variant="ghost">View Details</Button>` |
| Icon Only | `icon` (size) | `<Button size="icon"><PlusIcon /></Button>` |

**DO NOT:**
*   Create custom button wrappers.
*   Manually apply `bg-blue-500` to a div to make it look like a button.

### B. Cards (`<Card>`)
**Import:** `import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/card'`

**Structure:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Vehicle Stats</CardTitle>
    <CardDescription>Performance metrics for this build.</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Body Content Here */}
  </CardContent>
  <CardFooter>
    <Button>Update</Button>
  </CardFooter>
</Card>
```

**DO NOT:**
*   Use `div` with `border shadow rounded-xl` to mimic a card. Use the primitive.

### C. Inputs (`<Input>`)
**Import:** `import { Input } from '@repo/ui/input'`

**Standard:**
```tsx
<div className="grid w-full max-w-sm items-center gap-1.5">
  <Label htmlFor="email">Email</Label>
  <Input type="email" id="email" placeholder="Email" />
</div>
```

### D. Badges (`<Badge>`)
**Import:** `import { Badge } from '@repo/ui/badge'`

| Status | Variant | Example |
| :--- | :--- | :--- |
| Neutral/Tag | `outline` | `<Badge variant="outline">Stock</Badge>` |
| Success/Active | `default` | `<Badge>Active</Badge>` |
| Warning | `secondary` | `<Badge variant="secondary">Pending</Badge>` |
| Critical/Error | `destructive` | `<Badge variant="destructive">Archived</Badge>` |

### E. Dialogs (`<Dialog>` / `<Modal>`)
**Import:** `import { Modal } from '@repo/ui/modal'` (Preferred wrapper) or `@repo/ui/dialog`

**Guideline:**
*   Use `Modal` for responsive behavior.
*   **Standard:** We use centered Dialogs for all devices.
*   **Prohibited:** Do not use Drawers (Bottom Sheets) for modals on mobile.
*   Avoid direct `Dialog` usage unless strictly necessary for complex flows.

---

## 3. The "Vibe Coding" Ban List
The following patterns are explicitly forbidden:
1.  **"Magic Numbers":** `w-[350px]`. Use standard spacing (`w-96`, `w-full`).
2.  **Hardcoded Colors:** `text-[#4ade80]`. Use `text-green-500` (if semantic) or `text-success` (if available).
3.  **Z-Index Wars:** `z-[99999]`. Use the defined stacking context.
4.  **Inline SVG:** Import icons from `lucide-react`.

---

**Authorized By:** Lead Software Architect
**Date:** 2025-05-24
