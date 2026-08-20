# Supabase setup for QR Work

1. Open the Supabase project used by QR Work.
2. Open **SQL Editor**.
3. Open `supabase-schema.sql` from this repository and run the whole file.
4. Open the **Storage** section and confirm the `qr-tasks` bucket exists and is public.
5. Deploy the GitHub Pages site again after the schema is created.

## What is connected

- Admin site can switch the global site between ONLINE/OFFLINE.
- Users can submit QR-work requests.
- Admin can approve/reject requests.
- Admin can upload a QR photo and publish a task.
- Published QR tasks are read from Supabase by the main user site on other devices.
- QR images are stored in Supabase Storage.

## Important

The repository contains the Supabase **publishable** key only. Never add a `service_role` or `sb_secret_...` key to the repository.

The included SQL policies are deliberately permissive so the prototype can be tested from GitHub Pages. Before a real public launch, replace them with strict policies tied to Supabase Auth and role claims, and move payout/admin actions to a trusted server/Edge Function.
