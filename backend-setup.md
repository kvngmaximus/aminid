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
```

Server-only:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

FLW_PUBLIC_KEY=your_flutterwave_public_key
FLW_SECRET_KEY=your_flutterwave_secret_key
FLW_WEBHOOK_SECRET=your_webhook_signature_secret
```

## Supabase Setup Steps
1. Create a Supabase project.
2. Open the SQL editor and run `supabase.sql` from the repo root:
   - This creates tables (`profiles`, `authors`, `articles`, `courses`, etc.), RLS policies, and an `images` storage bucket.
3. Verify policies:
   - Readers can view published content.
   - Authors can CRUD their own content.
   - Admin operations require service role.
4. Storage:
   - `images` bucket is created. Use public access for simple cases or private with signed URLs for stricter access.

## Flutterwave Setup Steps
1. Enable Sandbox and get `FLW_PUBLIC_KEY` and `FLW_SECRET_KEY`.
2. Create a webhook endpoint in your server (Express or Netlify function):
   - `POST /api/payments/webhook`
   - Validate signatures with `FLW_WEBHOOK_SECRET`.
3. Payment Initialization:
   - `POST /api/payments/subscribe` calls Flutterwave to initialize a payment (checkout link or inline) for a chosen plan.
4. On webhook `charge.completed` (or equivalent event):
   - Insert a `payments` row.
   - Activate or renew `subscriptions` for the user; set `renews_at` according to interval.

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

## Example Server Stubs
- Supabase client (server): `server/supabase.ts`
```
import { createClient } from '@supabase/supabase-js';
export const supabaseServer = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
```

- Flutterwave subscribe (pseudo):
```
// POST /api/payments/subscribe
// body: { userId, planId }
// call Flutterwave API to create payment; return checkout link
```

- Flutterwave webhook (pseudo):
```
// POST /api/payments/webhook
// verify signature
// upsert payments; update subscriptions where applicable
```

## Verification Checklist
- Supabase tables exist and policies enabled.
- Storage bucket created; test upload and public/signed URL retrieval.
- Flutterwave sandbox payment initialized successfully.
- Webhook receives events and updates subscription status.

---
Owner: Engineering
Last updated: This revision