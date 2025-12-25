# Access Control Documentation

## Overview
The application distinguishes between two primary user tiers: **Free** and **Pro**.
Historically, a "Builder" tier existed but has been deprecated and merged into the Free/Pro model.

## User Tiers

### Free Tier
- **Access:**
  - `/hub`: Full access.
  - `/explore`: Full access.
  - `/community`: Full access.
  - `/u/{username}`: Full access to public profiles.
  - `/account`: Full access.
  - `/garage`: Full access (List vehicles).
  - `/garage` sub-features:
    - **History:** Full access (Log Service, Fuel, Mods).
    - **Service:** Can view existing plans. Can log performed services.
    - **Fuel:** Full access.
    - **Mods:** Can view existing plans. Can log installed mods.

- **Limitations:**
  - **Console:** No access. Users see a "Teaser" view prompting an upgrade.
  - **Service Planning:** Cannot *create* new Service Plans. Cannot *duplicate* jobs. (Can view/edit existing if previously Pro).
  - **Mod Planning:** Cannot *create* new Mod Plans. Cannot *duplicate* plans. (Can view/edit existing if previously Pro).

### Pro Tier
- **Access:**
  - All Free tier features.
  - **Console:** Full access (`/console`).
  - **Service Planning:** Full access (Create/Duplicate plans).
  - **Mod Planning:** Full access (Create/Duplicate plans).

## Implementation Details

### Database
- Table: `user_profile`
- Column: `plan` (text/enum)
  - Values: `'free'`, `'pro'`.

### Stripe Integration
- Subscriptions update the `plan` column via Webhooks.
- `builder` plan references are mapped to `free` or removed.

### Codebase
- **Hook:** `usePaywall()` provides `isPro` boolean and `triggerPaywall()` method.
- **Component:** `ProGate` wraps content to restrict access.
- **Component:** `PaywallModal` handles the upgrade UI.

## Admin Capabilities
- Admins can manually toggle a user's plan to `'pro'` via the Admin Dashboard.
- The Admin User Management page relies on the `get_admin_users_stats` RPC function, which MUST return the `plan` column to correctly display and toggle user status.
