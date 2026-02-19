# Architecture Documentation

This document provides a comprehensive overview of the DDPC (Digital Driver Performance Console) application architecture, including the tech stack, database schema, and key workflows.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Monorepo Structure](#monorepo-structure)
- [Database Architecture](#database-architecture)
- [Key Workflows](#key-workflows)
- [Deployment](#deployment)
- [References](#references)

---

## Tech Stack

### Core Framework & Runtime
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5.9** - Type safety
- **Node.js** - Runtime (>=18)

### Monorepo & Build Tools
- **Turborepo** - Monorepo build system with remote caching
- **Vercel** - Build platform, deployment, and remote caching
- **GitHub** - Source control and repository management

### Database & Backend Services
- **Supabase** - PostgreSQL database, authentication, and storage
  - Row Level Security (RLS) enabled on all user-facing tables
  - Real-time subscriptions
  - Server-side rendering (SSR) support via `@supabase/ssr`

### Authentication & Authorization
- **Supabase Auth** - Email/password and OAuth (Google) authentication
- **JWT-based sessions** - Cookie-based session management
- **Role-based access control** - Free/Pro tier system with admin roles

### Payment Processing
- **Stripe** - Subscription management and payment processing
  - Checkout Sessions for upgrades
  - Webhook-based subscription fulfillment
  - Customer management

### Email Services
- **Resend** - Transactional email delivery
  - User notifications
  - Admin alerts

### AI & Machine Learning
- **Vercel AI SDK** - AI model integration
- **AI Gateway** - Unified gateway for multiple AI providers
- **Steward Agent System** - Multi-persona AI agent (Architect, Visionary, Engineer)

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Framer Motion** - Animation library
- **GSAP** - Advanced animations

### Additional Libraries
- **Zod** - Schema validation
- **date-fns** - Date manipulation
- **Recharts** - Data visualization
- **React Hot Toast** - Toast notifications
- **PWA Support** - Progressive Web App capabilities via `@ducanh2912/next-pwa`

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Testing framework
- **TypeScript** - Static type checking

---

## Monorepo Structure

The project follows a Turborepo monorepo structure:

```
my-turborepo/
├── apps/
│   ├── web/          # Main Next.js application
│   └── docs/          # Documentation site (Next.js)
├── packages/
│   ├── ui/            # Shared React component library
│   ├── types/         # Shared TypeScript types
│   ├── eslint-config/ # Shared ESLint configuration
│   ├── prettier-config/# Shared Prettier configuration
│   ├── tailwind-config/# Shared Tailwind configuration
│   ├── typescript-config/# Shared TypeScript configuration
│   └── services/     # Shared service utilities
├── database/
│   └── scripts/      # Database migration scripts
├── supabase/
│   ├── migrations/   # Supabase migration files
│   └── functions/    # Edge functions
└── docs/             # Documentation files
```

### Key Packages

- **`@repo/ui`** - Shared UI component library (mandatory for UI development)
- **`@repo/types`** - Shared TypeScript type definitions
- **`@repo/eslint-config`** - Shared linting rules
- **`@repo/tailwind-config`** - Shared Tailwind configuration

---

## Database Architecture

### Database Provider
- **Supabase PostgreSQL** - Managed PostgreSQL database
- **Row Level Security (RLS)** - Enabled on all user-facing tables
- **Database Functions** - Custom RPC functions for complex operations
- **Triggers** - Automated database triggers for data consistency

### Core Tables

The database schema includes the following key tables:

#### User & Authentication
- **`auth.users`** - Supabase Auth user accounts
- **`user_profile`** - Extended user profile data (plan, username, role)
- **`user_vehicle`** - User-owned vehicles

#### Vehicle Management
- **`user_vehicle`** - Vehicle ownership and metadata
- **`fuel_log`** - Fuel consumption tracking
- **`maintenance_log`** - Service history records
- **`mods`** - Vehicle modifications
- **`part_inventory`** - User's parts inventory

#### Service Planning
- **`job_plans`** - Planned service jobs
- **`job_steps`** - Individual steps within a job plan
- **`maintenance_parts`** - Parts used in maintenance services
- **`service_items`** - Service type catalog
- **`service_intervals`** - Scheduled service intervals

#### Other Features
- **`issue_reports`** - User-submitted bug reports
- **`compute_ledger`** - AI compute cost tracking
- **`steward_chat_messages`** - AI chat session history

### Database Documentation

For detailed database schema information, refer to:

- **[Database Table Descriptions](./database/db_table_descriptions.md)** - Comprehensive table documentation
- **[Database Definitions](./database/ddpc_db_definitions.md)** - View definitions
- **[Database Functions](./database/ddpc_db_functions.md)** - RPC function documentation
- **[Database Indices](./database/ddpc_db_indices.md)** - Index definitions
- **[RLS Policies](./database/ddpc_db_rls_policies.md)** - Row Level Security policies
- **[Database Triggers](./database/ddpc_db_triggers.md)** - Trigger definitions
- **[Database Deployment Guide](./DATABASE_DEPLOYMENT_GUIDE.md)** - Deployment procedures

---

## Key Workflows

### 1. Authentication & User Onboarding

**Flow:**
1. User signs up via email/password or OAuth (Google)
2. Supabase Auth verifies and creates user account
3. Auth callback (`/api/auth/callback`) creates `user_profile` record
4. Default profile: `plan: 'free'`, `role: 'user'`
5. User redirected to `/hub` (main dashboard)

**Implementation:**
- **Auth Provider:** `apps/web/src/lib/auth.tsx`
- **Callback Handler:** `apps/web/src/app/api/auth/callback/route.ts`
- **Middleware:** `apps/web/middleware.ts` - Handles session refresh and routing

### 2. Subscription & Payment Workflow

**Free → Pro Upgrade:**
1. User navigates to `/account` (Billing tab)
2. Frontend calls `/api/stripe/checkout`
3. Stripe Checkout Session created
4. User completes payment on Stripe
5. Webhook (`/api/webhooks/stripe`) receives `customer.subscription.updated`
6. Database updated: `user_profile.plan = 'pro'`
7. User gains access to Pro features (Console, Service/Mod Planning)

**Implementation:**
- **Checkout:** `apps/web/src/app/api/stripe/checkout/route.ts`
- **Webhook:** `apps/web/src/app/api/webhooks/stripe/route.ts`
- **Access Control:** `apps/web/ACCESS_CONTROL.md`

### 3. Vehicle Management

**Vehicle Creation:**
1. User navigates to `/garage`
2. Creates new vehicle entry
3. Data stored in `user_vehicle` table
4. RLS policy ensures ownership: `user_vehicle.owner_id = auth.uid()`

**Service Logging:**
1. User logs service in `/garage/[id]/history`
2. Creates `maintenance_log` entry
3. Links to `service_items` and `service_intervals`
4. Optional: Links parts from `part_inventory` via `maintenance_parts`

**Fuel Tracking:**
1. User logs fuel-up in `/garage/[id]/fuel`
2. Creates `fuel_log` entry
3. Calculates MPG and trip miles automatically

### 4. Service & Mod Planning

**Service Plan Creation (Pro Only):**
1. User creates job plan in `/garage/[id]/service`
2. Creates `job_plans` entry
3. Adds `job_steps` with step order and descriptions
4. Links to `maintenance_log` for execution tracking

**Mod Plan Creation (Pro Only):**
1. User creates mod plan in `/garage/[id]/mods`
2. Creates `mods` entry with status 'Plan'
3. Links parts from `part_inventory`
4. Updates status to 'Installed' when completed

### 5. AI Agent Workflow (Steward)

**Trinity Protocol:**
1. User submits query to `/api/steward`
2. Three agents run in parallel:
   - **Architect** - Structural analysis
   - **Visionary** - Creative solutions
   - **Engineer** - Practical execution (with codebase access via tools)
3. Engineer uses `get_repo_structure` and `read_file_content` tools
4. All perspectives synthesized by Steward (Synthesis voice)
5. Response streamed to user
6. Costs logged to `compute_ledger`

**Implementation:**
- **Route:** `apps/web/src/app/api/steward/route.ts`
- **Tools:** `apps/web/src/lib/steward/tools.ts`
- **Cost Tracking:** `apps/web/src/lib/steward/compute-costs.ts`

### 6. Access Control & Authorization

**Tier System:**
- **Free Tier:** Basic features, no Console access, no plan creation
- **Pro Tier:** Full access including Console and planning features
- **Admin Role:** Automatic Pro access regardless of plan

**Implementation:**
- **Plan Detection:** `apps/web/src/lib/auth.tsx`
- **Access Control:** `apps/web/ACCESS_CONTROL.md`
- **Middleware:** Route protection via `middleware.ts`

### 7. Issue Reporting

**Flow:**
1. User submits issue report via UI
2. Screenshot uploaded to Supabase Storage (`issue-attachments` bucket)
3. `issue_reports` entry created
4. Admin can review and mark as resolved

---

## Deployment

### Build & Deployment Platform
- **Vercel** - Primary deployment platform
  - Automatic builds on Git push
  - Remote caching via Turborepo
  - Edge functions support
  - Environment variable management

### Build Configuration
- **Turborepo** - Monorepo build orchestration
  - Parallel task execution
  - Dependency graph optimization
  - Remote cache sharing

### Environment Variables

Key environment variables (see `turbo.json` for full list):

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Stripe:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO`
- `NEXT_PUBLIC_STRIPE_PRICE_ID_BUILDER`

**Email:**
- `RESEND_API_KEY`

**AI:**
- `AI_GATEWAY_API_KEY`

**GitHub (for Steward tools):**
- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`

### Database Migrations
- **Supabase Migrations** - Stored in `supabase/migrations/`
- **Manual Scripts** - Additional scripts in `database/scripts/`
- **Deployment:** See [Database Deployment Guide](./DATABASE_DEPLOYMENT_GUIDE.md)

---

## References

### Documentation Files
- **[Repository Guide](./REPO_GUIDE.md)** - Overview of all markdown files
- **[Database Table Descriptions](./database/db_table_descriptions.md)** - Complete table documentation
- **[Access Control](./apps/web/ACCESS_CONTROL.md)** - Tier system details
- **[Branding Guide](./branding.md)** - Design system and brand identity
- **[System Audit](./ddpc_audit.md)** - Comprehensive technical audit

### External Services
- **Vercel:** https://vercel.com
- **Supabase:** https://supabase.com
- **Stripe:** https://stripe.com
- **Resend:** https://resend.com
- **GitHub:** Source of truth repository

### Key Code Locations
- **Auth System:** `apps/web/src/lib/auth.tsx`
- **API Routes:** `apps/web/src/app/api/`
- **Database Client:** `apps/web/src/lib/supabase/`
- **UI Components:** `packages/ui/src/`
- **Steward AI System:** `apps/web/src/lib/steward/`

---

## Architecture Principles

1. **Monorepo First** - All code in a single repository for consistency
2. **Type Safety** - TypeScript throughout the codebase
3. **Security First** - RLS on all database tables, server-side validation
4. **Component Reusability** - Shared UI library (`@repo/ui`) mandatory for UI development
5. **Performance** - Turborepo caching, Next.js optimizations, PWA support
6. **Scalability** - Supabase for database scaling, Vercel for compute scaling
7. **Developer Experience** - Shared configs, consistent tooling, comprehensive documentation

---

*Last Updated: 2025-01-27*
*For questions or updates, refer to the [Repository Guide](./REPO_GUIDE.md)*

