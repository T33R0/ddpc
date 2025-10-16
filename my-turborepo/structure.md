# Project Structure and Guidelines

This document outlines the structure of the `my-turborepo` monorepo, explains how to use the shared packages, and provides guidelines for developing the micro-frontends (MFEs).

## 1. Monorepo Structure

The repository is a Turborepo-powered monorepo with the following structure:

```
my-turborepo/
|-- apps/
|   |-- docs/         # Documentation MFE (Next.js)
|   `-- web/          # Main Web Application MFE (Next.js)
|-- packages/
|   |-- eslint-config/      # Shared ESLint configuration
|   |-- prettier-config/    # Shared Prettier configuration
|   |-- tailwind-config/  # Shared Tailwind CSS preset
|   |-- tsconfig/         # Shared TypeScript configurations
|   `-- ui/               # Shared React component library (shadcn/ui based)
|-- package.json
|-- turbo.json
`-- structure.md
```

- **`apps/`**: Contains the individual micro-frontends (MFEs). Each MFE is a standalone application (e.g., a Next.js app).
- **`packages/`**: Contains shared code and configurations that can be used across all MFEs.

## 2. Shared Packages

### 2.1. UI Components (`@repo/ui`)

This package contains a set of shared, unstyled React components based on `shadcn/ui`. All MFEs should import these components to maintain a consistent look and feel.

**Available Components:**
- `Button`
- `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardDescription`, `CardContent`
- `Input`
- `Label`
- `Textarea`
- `Logo`
- `Header`
- `Footer`

**How to Use:**

Import components directly from the `@repo/ui` package within your MFE's components:

```tsx
// Example: apps/web/src/app/page.tsx

import { Button } from "@repo/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";

export default function Page() {
  return (
    <main>
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Shared UI Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" placeholder="Email" />
          </div>
          <Button className="mt-4">Click Me</Button>
        </CardContent>
      </Card>
    </main>
  );
}
```

### 2.2. Shared Configurations

To ensure consistency across the monorepo, we use shared configurations for ESLint, Prettier, Tailwind CSS, and TypeScript.

- **ESLint (`@repo/eslint-config`)**: Enforces a consistent coding style. Your MFE's `.eslintrc.js` should extend from this package.
- **Prettier (`@repo/prettier-config`)**: Enforces consistent code formatting. Your MFE's `prettier.config.js` should import this package.
- **Tailwind CSS (`@repo/tailwind-config`)**: Provides a shared Tailwind CSS preset with theme tokens (colors, border radius, etc.). Your MFE's `tailwind.config.ts` must use this preset.
- **TypeScript (`@repo/typescript-config`)**: Provides base `tsconfig.json` files for different types of projects (e.g., `nextjs.json`, `react-library.json`). Your MFE's `tsconfig.json` should extend from the appropriate file in this package.

### 2.3. Global Layout

The main application layout is constructed in each MFE's `app/layout.tsx` file. This file imports the shared `Header` and `Footer` components from the `@repo/ui` package to create a consistent frame for the entire application.

**Example (`apps/web/src/app/layout.tsx`):**

```tsx
import { Header } from "@repo/ui/header";
import { Footer } from "@repo/ui/footer";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
```

## 3. MFE Guidelines

### 3.1. Feature Slice Architecture (`apps/web`)

To ensure scalability and prepare for future growth, the `apps/web` application follows a "feature slice" architecture. This design organizes code by feature, making it easier to manage and eventually extract into a separate micro-frontend if needed.

```
apps/web/
└─ src/
   ├─ app/             # Routing layer (Next.js App Router)
   │   ├─ discover/
   │   ├─ garage/
   │   ├─ vehicle/
   │   ├─ community/
   │   ├─ account/
   │   └─ admin/
   │
   └─ features/        # Business logic and UI components
       ├─ discover/
       ├─ garage/
       ├─ community/
       ├─ account/
       └─ admin/
```

- **`src/app/`**: This directory is responsible for **routing**. Each folder inside `app` maps to a URL segment. The `page.tsx` file within each folder is the entry point for that route and is responsible for fetching data and composing the UI from components in the `features` directory.
- **`src/features/`**: This directory contains the actual implementation of each feature. This includes UI components, hooks, business logic, and API interactions related to a specific domain (e.g., everything related to the "garage" feature lives in `src/features/garage`).

This separation ensures that our routing is decoupled from our feature logic, which is critical for maintainability and future refactoring.

### 3.2. Development Workflow

1.  **Run all apps:** From the root of the `my-turborepo` directory, run `npm run dev` to start the development servers for all MFEs simultaneously.
2.  **Create new components:**
    - If a component is specific to a single feature, create it within that feature's directory (e.g., `apps/web/src/features/garage/components/`).
    - If a component is intended to be used by multiple MFEs, add it to the `@repo/ui` package.
3.  **Install dependencies:** When adding a new dependency, determine if it's specific to one MFE or should be shared. Install it in the appropriate `package.json` and run `npm install` from the root of the monorepo.

### 3.3. Styling

- **Use Tailwind CSS:** All styling should be done using Tailwind CSS utility classes.
- **Use shared components:** Whenever possible, use the components from the `@repo/ui` package.
- **No custom CSS files (unless necessary):** Avoid writing custom CSS files. If you must, keep them scoped to the component they are styling.

### 3.4. State Management

Each MFE is responsible for its own state management. If you need to share state between MFEs, consider using a global state management library (e.g., Zustand, Redux) or passing state via URL parameters or a shared parent application (if applicable).

### 3.5. API Endpoints

-   **`/api/discover/vehicles`**: Retrieves a paginated and filtered list of unique vehicles from the master `vehicle_data` catalog.
-   **`/api/garage/vehicles`**: Fetches all vehicles owned by the currently authenticated user.
-   **`/api/garage/add-vehicle`**: Adds a vehicle to a user's collection by cloning it from the `vehicle_data` catalog.
-   **`/api/garage/add-vehicle-by-vin`**: Adds a vehicle to a user's collection by decoding a VIN via an external API.
-   **`/api/garage/update-vehicle`**: Updates details (e.g., nickname, status) for a vehicle in a user's collection.

### Supabase Edge Functions

-   **`check-maintenance-due`**: A function (designed to be run on a schedule) that checks all user vehicles against their service intervals and triggers reminders for overdue maintenance.

## Frontend Structure

The frontend is a Next.js application located in `apps/web`.

### Core Pages

-   **`/`**: Landing page.
-   **`/discover`**: Vehicle discovery and browsing page.
-   **`/garage`**: Displays the authenticated user's vehicle collection.
-   **`/financials`**: A dashboard for viewing vehicle-related financial analytics.
-   **`/dashboard`**: The main user dashboard and navigation hub.

### Key Components (`features/`)

-   **`discover/`**: Components for the vehicle discovery page, including filters (`vehicle-filters.tsx`) and the main gallery view (`vehicle-gallery.tsx`).
-   **`garage/`**: Components for the user's personal garage, including the gallery view (`garage-vehicle-gallery.tsx`), statistics (`garage-stats.tsx`), and the detailed vehicle modal (`garage-vehicle-details-modal.tsx`).
-   **`financials/`**: Components for the financials page, including the main dashboard (`financials-dashboard.tsx`).
-   **`build-thread/`**: The component responsible for rendering the chronological history of a vehicle (`build-thread.tsx`).
