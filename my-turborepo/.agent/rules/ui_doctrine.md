---
trigger: always_on
---

# UI ENGINEERING DOCTRINE

## 1. Component Imports (MANDATORY)
You are PROHIBITED from defining local UI primitives (e.g., buttons, inputs, cards).
You MUST import from the design system:
- Button: `import { Button } from '@repo/ui/button'`
- Card: `import { Card, ... } from '@repo/ui/card'`
- Input: `import { Input } from '@repo/ui/input'`
- Icons: `import { ... } from 'lucide-react'`

## 2. Styling Protocols
- **Framework:** Tailwind CSS only. No `style={{}}` attributes.
- **Colors:** Use semantic tokens ONLY.
  - CORRECT: `text-primary`, `bg-muted`, `border-input`
  - BANNED: `text-black`, `bg-[#f3f4f6]`, `border-gray-200`
- **Spacing:** Use standard Tailwind spacing (e.g., `p-4`, `gap-2`). No arbitrary pixels (`p-[13px]`).

## 3. "Vibe Coding" Violations
If you see these, you MUST refactor them immediately:
- Hardcoded hex codes.
- "Magic numbers" in width/height.
- Z-index values other than standard Tailwind layers.