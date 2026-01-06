# User Creation & Subscription Workflow Rundown

This document outlines the technical workflow for user account creation, subscription to the Pro plan, and handling of edge cases such as payment failures.

## 1. Account Creation (Free Tier)
1.  **User Sign Up:** The user signs up via email/password or OAuth (Google).
2.  **Auth Callback (`/api/auth/callback`):**
    *   Supabase Auth verifies the user.
    *   **Profile Check:** The system checks if a `user_profile` exists for the user ID.
    *   **Profile Creation:** If no profile exists, a new record is inserted into `user_profile` with:
        *   `role`: 'user'
        *   `plan`: 'free' (Default)
        *   `username`: Derived from email (sanitized).
    *   **Notification:** If configured, admins receive an email notification about the new user.
3.  **Access:** The user is redirected to the Hub (`/hub`) with 'maintainer' (Free) access.

## 2. Subscription Upgrade (Free -> Pro)
1.  **Initiation:**
    *   User navigates to `/account` (Billing tab) or clicks an upgrade prompt.
    *   Frontend calls `/api/stripe/checkout`.
2.  **Checkout Session:**
    *   The API creates a Stripe Checkout Session for the "Pro" price ID.
    *   If the user lacks a `stripe_customer_id` in `user_profile`, a new Stripe Customer is created and linked.
    *   User is redirected to the Stripe hosted checkout page.
3.  **Payment Success:**
    *   User completes payment on Stripe.
    *   Stripe redirects user back to `/account?billing_status=success`.

## 3. Subscription Fulfillment
This process happens asynchronously via two parallel paths:

### Path A: Webhook (The Source of Truth)
1.  **Event:** Stripe sends a `customer.subscription.updated` (or `created`) webhook to `/api/webhooks/stripe`.
2.  **Processing:**
    *   The system validates the Stripe signature.
    *   It looks up the user via `stripe_customer_id`.
    *   **Verification:** It checks the subscription status:
        *   If `active` or `trialing`: The system identifies the product price ID.
        *   If the price matches the configured `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO`, the user's `plan` in `user_profile` is updated to `'pro'`.

### Path B: Client-Side Polling (The UI Experience)
1.  **Return:** User arrives at `/account?billing_status=success`.
2.  **Polling:**
    *   The UI detects the success flag.
    *   It immediately enters a "Finalizing..." state (loading indicator).
    *   It polls the user profile API every 2 seconds.
3.  **Confirmation:**
    *   Once Path A (Webhook) completes the DB update, the polling detects `plan: 'pro'`.
    *   The UI shows a "You are now a Pro member!" success message.
    *   The app context refreshes to unlock Pro features immediately.

## 4. Payment Failure & Downgrades
If a recurring payment fails or the subscription is canceled:

1.  **Event:** Stripe sends a `customer.subscription.updated` webhook with status `past_due`, `unpaid`, or `canceled`.
    *   *Note: `past_due` indicates payment failed but Stripe may retry. We strictly downgrade on this status to enforce payment.*
2.  **Downgrade:**
    *   The system immediately updates the user's `plan` to `'free'` in `user_profile`.
    *   The user loses access to Pro features (e.g., creating new plans) but retains read access to existing data where applicable.
3.  **Notification:**
    *   The system fetches the user's email address from the Auth provider.
    *   An email is sent to the user with the subject "Payment Failed - Subscription Downgraded", explaining the reason and providing a link to update payment methods.

## 5. Cancellation (End of Cycle)
If a user cancels their subscription:
1.  **Stripe Logic:** The subscription remains `active` until the end of the billing period (`cancel_at_period_end = true`).
2.  **System Handling:**
    *   The webhook receives an update. Since the status is still `active`, the user **retains Pro access**.
3.  **Finalization:**
    *   At the end of the cycle, Stripe sends a final update with status `canceled` (or `deleted`).
    *   The system processes this as a **Downgrade** (see Step 4), revoking access and notifying the user.
