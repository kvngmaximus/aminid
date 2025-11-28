# Backend Setup — Supabase & Flutterwave

This guide configures Supabase (Auth, Postgres, Storage, Policies) and Flutterwave (payments) for the Aminid platform.

## Prerequisites
- Supabase project (free tier is fine for development)
- Flutterwave account (Sandbox)
- Node environment (Express/Netlify functions available)

## Environment Variables
Create `.env` in project root.

Client (exposed via Vite):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_FLW_PUBLIC_KEY=your_flutterwave_public_key
```

Server-only:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

FLW_SECRET_KEY=your_flutterwave_secret_key
FLW_WEBHOOK_SECRET=your_webhook_signature_secret # optional (only if using webhooks)
```

## Supabase Setup Steps
1. Create a Supabase project.
2. Open the SQL editor and run `supabase.sql` from the repo root:
   - This creates tables (`profiles`, `authors`, `articles`, `courses`, `course_modules`, `course_lessons`, `course_enrollments`), payments (`plans`, `subscriptions`, `payments`), RLS policies, helpers, and seeds NGN plans.
   - It also creates `author_follows` with RLS so Readers can follow/unfollow Authors.
3. Verify policies:
   - Readers can view published content.
   - Authors can CRUD their own content.
   - Admin operations require service role.
4. Storage:
   - Create a bucket named `images` in Supabase Storage (Dashboard → Storage → New bucket).
   - Choose public for simple avatars/covers, or private + signed URLs for stricter access.

## Flutterwave Setup (No-Webhooks Mode — MVP)
This keeps the flow simple and avoids webhook setup.

1. Enable Sandbox and get `VITE_FLW_PUBLIC_KEY` (client) and `FLW_SECRET_KEY` (server).
2. Payment Initialization happens client-side with `payWithFlutterwave` in `client/lib/payments.ts`.
   - The inline modal opens with a `tx_ref`.
   - On success callback, the client calls `POST /api/payments/verify`.
3. Server-side `verify` confirms and writes state:
   - Inserts a `payments` row (NGN stored as cents).
   - Upserts `subscriptions` and toggles `authors.premium` when applicable.
   - Inserts `course_enrollments` on course purchase.

Optional Later — Webhooks for Extra Resilience
- Endpoints exist: `POST /api/payments/webhook` and `/flw/webhook`. They are optional.
- If enabled, set `FLW_WEBHOOK_SECRET` and configure a URL in Flutterwave.
- Useful for reconciliation and asynchronous events, but not required for MVP.

## Integration Notes
- Auth
  - Client uses `@supabase/supabase-js` with anon key.
  - Server uses service role key for privileged operations.
- RLS
  - Ensure policies match business rules. Admin actions are done server-side using service role.
- Storage
  - Prefer signed URLs for Premium content imagery; use public for avatars/covers if desired.
- Payments
  - Premium Reader → subscription plan (monthly).
  - Premium Author → monthly fee plan.
  - Toggle `authors.premium` and reader premium status via `subscriptions`.

## Reference Implementation
- Supabase admin client: `server/supabase.ts`
- Primary flow: `server/routes/flw.ts` → `POST /api/payments/verify` (no webhook needed)
- Optional webhooks: `server/routes/flw.ts` → `POST /api/payments/webhook` and `/flw/webhook`
- Client checkout helper: `client/lib/payments.ts` → `payWithFlutterwave`

## Verification Checklist
- Supabase tables exist and RLS enabled (including `author_follows`).
- Storage bucket `images` created; test upload and URL retrieval.
- Flutterwave sandbox payment initializes via inline modal.
- Verify route responds OK and updates `subscriptions`/`payments`.
- Reader paywall hides on active subscription; Author premium toggles.

---
Owner: Engineering
Last updated: This revision