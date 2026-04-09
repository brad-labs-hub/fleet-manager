# Fleet Manager

A full-stack fleet management application for high net worth families. Manage vehicles, maintenance records, receipts, insurance, registrations, key inventory, tire pressure, and more.

## Features

- **Driver Interface** (mobile-first): Add receipts, log maintenance, request cars, view vehicles
- **Admin Dashboard**: Full CRUD for vehicles, receipts, car request approval, exports
- **Exports**: Excel and QuickBooks CSV
- **Cloud Import**: OneDrive and Google Drive (OAuth)
- **Document Vault**: Upload insurance and registration documents
- **Key Inventory**: Track keys per vehicle
- **Tire/Fluid Tracking**: Seasonal swaps, pressure, fluid levels
- **Maintenance Alerts**: Create and dismiss alerts

## Tech Stack

- Next.js 14 (App Router)
- Supabase (PostgreSQL, Auth, Storage)
- Tailwind CSS, shadcn/ui

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run migrations**:
   ```bash
   npx supabase link  # Link to your project
   npx supabase db push  # Apply migrations
   npx supabase db seed  # Seed locations
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your Supabase URL and anon key.

4. **Install and run**:
   ```bash
   npm install
   npm run dev
   ```

5. **Create an account** at `/signup`. New users get the `driver` role by default.

6. **Promote a user to controller** (run in Supabase SQL editor):
   ```sql
   UPDATE user_profiles SET role = 'controller' WHERE email = 'your@email.com';
   ```

7. **Assign driver to locations** (for RLS):
   ```sql
   INSERT INTO driver_locations (user_id, location_id)
   SELECT 'user-uuid', id FROM locations WHERE code = '858';
   ```

## Client demo (Crown Fleet)

For a separate Vercel deployment (`crownfleet.vercel.app`) with preloaded luxury fleet data, run [`supabase/seed-demo-crownfleet.sql`](supabase/seed-demo-crownfleet.sql) after migrations and follow [docs/demo-crownfleet.md](docs/demo-crownfleet.md).

## Locations (Seed Data)

| Code | Name | Address |
|------|------|---------|
| 858 | New Canaan, CT | New Canaan, CT |
| 432 | 432 Park Avenue | 432 Park Ave, NYC |
| Four Chaise | Four Chaise | 163 S Main St, Southampton, NY |
| Pink Chimneys | Pink Chimneys | Bermuda |
| Chipper | Chipper | New Canaan, CT |

## Cloud Import (Optional)

Set these in `.env.local` to enable OneDrive/Google Drive import:

- `NEXT_PUBLIC_ONEDRIVE_CLIENT_ID` / `ONEDRIVE_CLIENT_SECRET`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000`)

## Password Reset

For "Forgot password?" to work, add your app URL to Supabase redirect URLs:

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**: `http://localhost:3000/reset-password` (and your production URL when deployed)

## Email Delivery (Resend)

This app relies on **Supabase Auth** to send emails for:
- Sign ups / email confirmations
- Password resets
- Magic links (where used)
- Controller invites / re-invites

To use **Resend** instead of your current SMTP provider (e.g. Vercel Email), configure the email provider in the **Supabase Dashboard**:

1. Supabase Dashboard → **Authentication** → **Email** (or **Providers** → **SMTP**)
2. Select **SMTP** and enter:
   - Host: `smtp.resend.com`
   - Port: `587`
   - Username: `resend`
   - Password: your Resend API key
3. Set the “From” email and sender name to what you want users to see.
4. Trigger a test email (create a test user or use “Forgot password”) and verify delivery.

For local Supabase (`supabase start`), the repo includes a Resend SMTP example in:
- `supabase/config.toml` (see the `auth.email.smtp` section). Uncomment and set `RESEND_API_KEY` in your local env.

## Roles

- **driver**: Add receipts, log maintenance, request cars. Sees vehicles at assigned locations.
- **employee**: Same as driver + approve car requests, full read access.
- **controller**: Full access, exports, imports, user management.

## Production Readiness (Vercel Essentials)

### Deploy Checklist

1. Set production env vars in Vercel:
   - Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - App URL: `NEXT_PUBLIC_APP_URL`
   - Integrations: `ANTHROPIC_API_KEY`, optional OneDrive/Google OAuth keys
   - Ops: optional `HEALTHCHECK_TOKEN`, optional `ALERT_WEBHOOK_URL`
2. Ensure Supabase redirect URLs include production callback routes:
   - `/api/auth/google/callback`
   - `/api/auth/onedrive/callback`
   - `/auth/callback` and `/reset-password`
3. Apply database migrations before release:
   ```bash
   npm run db:push
   ```
4. Confirm CI passes (`lint`, `typecheck`, `test`) before shipping.

### Security and Auth Notes

- OAuth connects now start from server endpoints:
  - `/api/auth/google/start`
  - `/api/auth/onedrive/start`
- OAuth callbacks validate `state` and no longer return access tokens in URL params.
- Receipts storage bucket is hardened to private access by migration and read access stays behind authenticated policies.
- Document opens are proxied through `/api/storage/open`, require an authenticated app session, and return `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex`.
- `robots.txt` disallows crawlers from `/admin`, `/driver`, `/api/storage/open`, and `/api/export`.
- Supabase `.../object/sign/...` URLs are bearer tokens. Do not share them externally.
- If a signed URL is leaked, rotate the Storage URL signing key in Supabase immediately to invalidate previously issued tokens.

### Health and Alerting

- Health endpoint: `GET /api/health`
  - Returns `200` when app + Supabase are healthy.
  - Returns `503` with `status: degraded` if Supabase connectivity/config fails.
- If `ALERT_WEBHOOK_URL` is set, degraded checks send a webhook alert payload.
- Vercel Cron is configured to hit `/api/health` every 10 minutes.

### Reliability Guardrails

- Sensitive mutation routes and receipt scanning have app-level rate limiting.
- API responses on key admin routes include request IDs for easier issue tracking.
- Server routes emit structured JSON logs for high-value actions and failures.

### Backup and Restore

For a 5-user production setup, target:
- **RPO**: 24 hours (at most 1 day of potential data loss)
- **RTO**: 4 hours (time to recover service)

Suggested operating cadence:
1. Daily managed Supabase backup (project setting).
2. Weekly restore verification to a non-production Supabase project.
3. Monthly migration rollback rehearsal for the latest migration batch.

Restore verification runbook:
1. Create/refresh a staging Supabase project.
2. Restore latest backup into staging.
3. Run app smoke checks:
   - Sign in
   - Load admin vehicles list
   - Create one test receipt
   - Export one report
4. Record restore duration and failures in an ops log.

### Rollback Procedure

1. In Vercel, roll back to the previous successful deployment.
2. If migration-related, run Supabase migration repair only if needed and reviewed:
   - Check status:
     ```bash
     npm run db:status
     ```
3. Re-run smoke checks and monitor `/api/health`.
