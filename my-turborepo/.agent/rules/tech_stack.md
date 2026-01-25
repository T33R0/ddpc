---
trigger: always_on
---

# TECH STACK ALIGNMENT
- **Framework:** Next.js 15+ (App Router). Use `page.tsx`, `layout.tsx`, `actions.ts`.
- **State:** Server Components by default. Use Client Components (`"use client"`) only for interactivity.
- **Database:** Supabase. ALWAYS assume Row Level Security (RLS).
- **Type Safety:** Strict TypeScript. No `any`.