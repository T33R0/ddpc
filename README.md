# ddpc // Daily Driven Project Car

**The Operating System for the Garage.**

ddpc is a tactical project management platform for automotive enthusiasts, converting the chaos of paper receipts and mental notes into a structured command center. It treats vehicle builds like software projects—managing lifecycle, logistics, and execution.

![Status](https://img.shields.io/badge/Status-Active_Beta-success)
![Stack](https://img.shields.io/badge/Stack-Next.js_|_Supabase_|_Vercel-black)

---

## ⚡ Mission

To replace the "Digital Glovebox" (passive record keeping) with **Mission Control** (active build execution). We enable users to plan complex repairs, track component health, and execute jobs with military precision.

## 🏗 Architecture

This project is built as a monorepo using [Turborepo](https://turbo.build/repo).

### The Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **Deployment:** [Vercel](https://vercel.com)
- **AI Intelligence:** Vercel AI SDK + Anthropic Claude 3.7 Sonnet
- **UI System:** Tailwind CSS + Shadcn/ui

### Repository Structure

.
├── apps
│ └── web # The core ddpc PWA (Main Application)
│ └── docs # (Optional) Documentation site
├── packages
│ ├── ui # Shared React component library
│ ├── eslint-config # Shared linting rules
│ └── typescript-config # Shared TS configuration

---

## 🛠 Core Capabilities

### 1. The Maintainer (Fleet Log)

- **Digital Service History:** Immutable logs for maintenance and repairs.
- **Energy Intelligence:** Agnostic tracking for ICE (MPG/Oil), EV (mi/kWh / Battery Health), and Hybrid.
- **VIN Decoding:** Instant chassis validation via NHTSA API.

### 2. The Workshop (Project Management)

- **Kanban Logistics:** A 4-stage board tracking parts from _Wishlist_ -> _Ordered_ -> _Planned_ -> _Installed_.
- **Smart Tracking:** Universal shipment tracking via smart-links.
- **Health Bars:** Component lifespan tracking (Miles/Months) with visual decay indicators.

### 3. AI Mission Planner (Pro)

- **Generator:** Ingests Vehicle Context + Job Title + Parts List.
- **Output:** Structured JSON execution plans including:
- **Loadout:** Required tools list.
- **HUD:** Torque specs and fluid capacities.
- **Execution:** Imperative, step-by-step teardown and assembly instructions.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm / pnpm
- A Supabase project (for local env)

### 1. Environment Setup

Create a `.env.local` file in `apps/web`:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
OPENAI_API_KEY=your_key (or Vercel AI Gateway Config)

### 2. Install Dependencies

Run from the root directory:

npm install

# or

pnpm install

### 3. Development Server

Start the entire monorepo in dev mode:

npx turbo dev

> The application will launch at `http://localhost:3000`

### 4. Build for Production

To build all apps and packages:

npx turbo build

---

## 📦 Database Schema

The core logic relies on a condensed schema design (~7 core tables):

- **`jobs`**: The event header (Who, What, When).
- **`inventory`**: Polymorphic table using `JSONB` for part specs (Tires vs. Oil).
- **`job_parts`**: Link table for parts consumed during a job.
- **`job_tools`** & **`job_specs`**: Static reference data for execution plans.

---

## 🤝 Contribution

This is a proprietary codebase.

- **Branching:** Feature branches should use the format `feature/feature-name`.
- **Commits:** Follow conventional commits (e.g., `feat: add AI planner`).

---

_© 2026 ddpc. Built for the silent operators._
