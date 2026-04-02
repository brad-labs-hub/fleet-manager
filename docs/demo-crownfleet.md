# Crown Fleet — client demo (Vercel + Supabase)

This runbook matches the **Crown Fleet** demo dataset in [`supabase/seed-demo-crownfleet.sql`](../supabase/seed-demo-crownfleet.sql). Use a **separate Supabase project** from production so prospect data never mixes with real fleets.

## 1. Supabase (demo project)

1. Create a new project (e.g. “Crown Fleet Demo”).
2. Link and push migrations from this repo:
   ```bash
   npx supabase link --project-ref <your-demo-ref>
   npx supabase db push
   ```
3. In the **SQL Editor**, run `supabase/seed-demo-crownfleet.sql` (postgres role bypasses RLS).
4. Confirm buckets exist after migrations (**Storage**): `receipts`, `vehicle-previews`, and any document buckets your migrations define.

## 2. Authentication URLs

In Supabase **Authentication → URL configuration**:

- **Site URL:** `https://crownfleet.vercel.app` (or your custom demo domain).
- **Redirect URLs:** include  
  `https://crownfleet.vercel.app/**`  
  and, if you use Vercel previews, your preview URLs (e.g. `https://crownfleet-*.vercel.app/**`).

Align with the general notes in the root [README.md](../README.md) for password reset and OAuth callbacks.

## 3. Vercel

1. Create a Vercel project named **`crownfleet`** so the default hostname is **https://crownfleet.vercel.app**.
2. Connect the same Git repository as production (or a dedicated branch if you prefer).
3. Set **Production** environment variables for the **demo** Supabase project, for example:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (required for admin invite/reset APIs used by the app)
   - `NEXT_PUBLIC_APP_URL` = `https://crownfleet.vercel.app`
4. Redeploy after changing env vars.

## 4. Bootstrap the first admin (controller)

The app creates `user_profiles` with role `driver` on signup (see migrations).

**Option A — sign up in the app**

1. Open `https://crownfleet.vercel.app/signup` and create an account.
2. In Supabase **SQL Editor**:
   ```sql
   UPDATE user_profiles
   SET role = 'controller'
   WHERE email = 'you@example.com';
   ```

**Option B — create the user in Supabase Auth**

1. **Authentication → Users → Add user** (with a known password or magic link).
2. Ensure a row exists in `user_profiles` for that user’s `id` (the signup trigger normally creates it; if not, insert matching `id` and `email` with `role = 'controller'`).

## 5. Driver view across all demo locations (optional)

If you log in as a **driver** and need to see every Crown hub under RLS, assign locations:

```sql
INSERT INTO driver_locations (user_id, location_id)
SELECT '<auth-user-uuid>'::uuid, id
FROM locations
WHERE code LIKE 'CROWN-%'
ON CONFLICT DO NOTHING;
```

Replace `<auth-user-uuid>` with the user’s id from **Authentication → Users**.

## 6. Verification

Signed in as **controller**, confirm:

- **Vehicles:** 10 demo units (VINs like `1DEMFLEET00000001` … `10`).
- **Locations:** `CROWN-CT`, `CROWN-CA`, `CROWN-FL`, `CROWN-SC`, `CROWN-NYC`.
- **Receipts, registrations, insurance, warranties, maintenance** populate dashboards and **Expiring soon** where dates are near-term.

## 7. Reset demo data only

To wipe demo vehicles and all dependent rows (CASCADE):

```sql
DELETE FROM vehicles WHERE vin LIKE '1DEMFLEET%';
```

Then re-run `seed-demo-crownfleet.sql`.
