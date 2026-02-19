# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DDPC (Daily Driven Project Car) is a vehicle build management platform ("Mission Control" for project cars). Users track maintenance, fuel, mods, parts inventory, and service plans for their vehicles. It has a tiered subscription model (free/pro/vanguard) via Stripe.

## Commands

```bash
# Development
npm run dev              # Run all apps (web on :3000, docs on :3001)
npx turbo run dev --filter=web   # Run only the web app

# Build
npm run build            # Build all apps/packages
npx turbo run build --filter=web  # Build only web app

# Type checking & Linting
npm run check-types      # TypeScript check across all packages
npm run lint             # ESLint across all packages (--max-warnings 0)
npm run format           # Prettier format all TS/TSX/MD files

# Testing (web app)
cd apps/web && npx vitest         # Run all tests
cd apps/web && npx vitest run src/lib/odometer-service.test.ts  # Single test file
```

Note: Dev uses `--turbopack`, build uses `--webpack`.

## Monorepo Structure (Turborepo)

```
apps/
  web/         # Main Next.js 16 app (App Router, React 19)
  docs/        # Documentation site (Next.js, port 3001)
packages/
  ui/          # Shared component library (@repo/ui) — Radix + Tailwind
  types/       # Shared TypeScript interfaces (@repo/types)
  services/    # Shared service utilities (@repo/services)
  tailwind-config/   # Shared Tailwind with semantic color tokens
  eslint-config/     # Shared ESLint (base, next-js, react-internal)
  prettier-config/   # Shared Prettier rules
  typescript-config/ # Shared TS configs
  assets/            # Branding assets
supabase/
  migrations/  # Database migration files
  functions/   # Supabase Edge Functions
```

## Architecture & Patterns

### Web App (`apps/web/src/`)

- **`app/`** — Next.js App Router pages and layouts. Routes include `/hub`, `/garage`, `/vehicle/[id]/*`, `/account`, `/console` (admin).
- **`features/`** — Feature modules (18 dirs: admin, auth, fuel, garage, mods, steward, parts, service, timeline, vehicle, workshop, etc.). Each feature contains its own components, actions, and lib code.
- **`lib/`** — Shared utilities, hooks, and services. Key files:
  - `lib/supabase/` — Supabase clients: `client.ts` (browser), `server.ts` (server w/ cookies), `admin.ts` (service role), `middleware.ts`
  - `lib/auth.tsx` — Auth context provider with signUp/signIn/signOut/OAuth, profile management, plan tier detection
  - `lib/steward/` — AI agent system (Trinity Protocol: Architect, Visionary, Engineer)
- **`actions/`** — Server actions
- **`app/api/`** — 50+ API routes: auth callbacks, Stripe checkout/webhooks, garage CRUD, Steward AI, community features

### Path Alias

In `apps/web`, `@/*` maps to `./src/*`:
```typescript
import { something } from '@/lib/utils'
import { FeatureComponent } from '@/features/vehicle/VehicleDashboard'
```

### Database (Supabase PostgreSQL)

- RLS enabled on all user-facing tables — always assume RLS is active
- Core tables: `user_profile`, `user_vehicle`, `maintenance_log`, `fuel_log`, `mods`, `part_inventory`, `job_plans`, `job_steps`, `service_items`, `service_intervals`, `issue_reports`, `compute_ledger`, `steward_chat_messages`
- Auth: Supabase Auth with email/password + Google OAuth, JWT sessions in cookies
- Detailed DB docs in `apps/docs/content/engineering/database/`

### Auth & Access Control

- Three tiers: `free`, `pro`, `vanguard` (admin = vanguard gets auto-pro access)
- Auth context in `lib/auth.tsx` provides user state, profile, and plan info
- Middleware in `apps/web/middleware.ts` handles session refresh and route protection
- Paywall context gates pro-only features (Console, service/mod planning)

### Payments

- Stripe for subscriptions. Checkout via `/api/stripe/checkout`, fulfillment via webhook at `/api/webhooks/stripe`

## Mandatory Coding Rules

### UI Components

- **NEVER** define local UI primitives. Import from `@repo/ui`:
  ```typescript
  import { Button } from '@repo/ui/button'
  import { Card, CardContent, CardHeader } from '@repo/ui/card'
  import { Input } from '@repo/ui/input'
  ```
- Icons: `import { IconName } from 'lucide-react'`

### Styling

- Tailwind CSS only. No `style={{}}` attributes.
- **Semantic tokens only** — use `text-primary`, `bg-muted`, `border-input`. Never use `text-black`, `bg-[#f3f4f6]`, or hardcoded hex colors.
- Standard Tailwind spacing only — no arbitrary values like `p-[13px]`.
- No magic numbers for width/height. No non-standard z-index values.

### TypeScript & React

- Strict TypeScript. No `any`.
- Server Components by default. Use `"use client"` only when interactivity is needed.
- Framework: Next.js App Router — use `page.tsx`, `layout.tsx`, `actions.ts` conventions.

## Key External Services

| Service | Purpose | Env Vars |
|---------|---------|----------|
| Supabase | DB, Auth, Storage | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Stripe | Payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_ID_*` |
| Resend | Email | `RESEND_API_KEY` |
| AI Gateway | AI models (Steward) | `AI_GATEWAY_API_KEY` |

## Deployment

- **Platform**: Vercel (auto-deploys on push)
- **Build**: `turbo run build --filter=web` (configured in `vercel.json`)
- **Remote caching**: Turborepo + Vercel
