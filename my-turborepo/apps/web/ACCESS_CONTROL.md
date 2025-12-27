# Access Control Documentation

## Overview
The application distinguishes between two primary user tiers: **Free** and **Pro**.
Historically, a "Builder" tier existed but has been deprecated and merged into the Free/Pro model.

**Note:** Users with `role = 'admin'` are automatically granted Pro access regardless of their `plan` value.

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
  - **Console:** No access. Users see a paywall modal prompting an upgrade.
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
- **Table:** `user_profile`
- **Column:** `plan` (text/enum)
  - **Allowed Values:** `'free'`, `'builder'` (deprecated), `'pro'`
  - **Default:** `'free'`
  - **Note:** The `'builder'` value is deprecated and treated as `'free'` in application logic

### Plan Determination Logic
The application determines Pro status using the following logic (in `apps/web/src/lib/auth.tsx`):
```typescript
const plan: 'free' | 'pro' = (row.role === 'admin' || row.plan?.toLowerCase() === 'pro') ? 'pro' : 'free';
```

**Key Points:**
- If `role === 'admin'` → automatically `'pro'` (regardless of plan value)
- If `plan === 'pro'` (case-insensitive) → `'pro'`
- Otherwise (including `'builder'` or `'free'`) → `'free'`

### Stripe Integration
- Subscriptions update the `plan` column via Webhooks.
- `builder` plan references are mapped to `'free'` or removed.

### Codebase Architecture

#### Data Flow
```
SSR (layout.tsx)
  → initialSession passed to AuthProvider
  → AuthProvider sets session on client
  → fetchProfile() queries user_profile table
  → mapProfileRow() transforms plan value
  → usePaywall() checks profile.plan === 'pro'
  → ProGate component enforces access
```

#### Key Components

**`apps/web/src/lib/auth.tsx`**
- `AuthProvider`: Manages authentication state and profile fetching
- `fetchProfile()`: Queries `user_profile` table for plan and role
- `mapProfileRow()`: Transforms database values to application types
  - Maps `'admin'` role → `'pro'` plan
  - Maps `'pro'` plan (case-insensitive) → `'pro'`
  - Maps all other values → `'free'`

**`apps/web/src/lib/hooks/usePaywall.tsx`**
- `PaywallProvider`: Provides `isPro` boolean based on `profile.plan`
- `usePaywall()`: Hook to access paywall state
  - `isPro`: `true` if `profile?.plan === 'pro'`
  - `isLoading`: `true` while profile is being fetched
  - `triggerPaywall()`: Opens upgrade modal

**`apps/web/src/components/paywall/ProGate.tsx`**
- Wraps protected content
- Shows loading spinner while `isLoading === true`
- Shows paywall modal if `isPro === false`
- Renders children if `isPro === true`

#### Session Management
- **SSR:** Session is fetched server-side and passed as `initialSession` prop
- **Client:** Session is set via `supabase.auth.setSession()` and polled until ready (max 1.5s)
- **Profile Fetch:** Only executed once when using `initialSession` to prevent duplicate calls
- **Auth State Changes:** `onAuthStateChange` events are filtered to prevent duplicate profile fetches

#### Performance Considerations
- Profile fetch includes 10-second timeout to prevent hanging
- Session readiness is polled (100ms intervals, max 1.5s) before querying
- Duplicate `fetchProfile` calls are prevented when using `initialSession`
- Brief paywall flash may occur during initial load (expected behavior)

### RLS Policies
- **Required:** Users must be able to SELECT their own `user_profile` row including the `plan` column
- **Policy:** `user_profile_select_own` allows `user_id = auth.uid()`
- **Verification:** Ensure RLS policies allow authenticated users to read their own `plan` column

## Admin Capabilities
- Admins can manually toggle a user's plan to `'pro'` via the Admin Dashboard (`/admin/users`)
- The Admin User Management page relies on the `get_admin_users_stats` RPC function, which MUST return the `plan` column to correctly display and toggle user status
- **Important:** Admin role automatically grants Pro access, so admins will have Pro features regardless of their `plan` value

## Troubleshooting

### Pro User Cannot Access Pro Features
1. **Check Database:**
   ```sql
   SELECT user_id, username, role, plan 
   FROM user_profile 
   WHERE user_id = '<user-id>';
   ```
   - Should show `plan = 'pro'` OR `role = 'admin'`

2. **Check Profile Loading:**
   - Open browser DevTools → Network tab
   - Look for `user_profile` request
   - Should return 200 with `plan: "pro"` in response

3. **Check RLS Policies:**
   - Ensure `user_profile_select_own` policy exists and allows reading `plan` column
   - Verify user can SELECT their own profile row

### Brief Paywall Flash
- **Expected Behavior:** A brief paywall flash during initial page load is normal
- **Cause:** Profile loads asynchronously, so `isPro` starts as `false` until profile is fetched
- **Mitigation:** `ProGate` shows loading spinner while `isLoading === true` to minimize flash

### Profile Not Loading
- Check browser console for errors
- Verify session is properly set (should happen automatically via SSR)
- Ensure RLS policies allow profile access
- Check network tab for failed `user_profile` requests
