# Yaad Doctor

Doctor finder for self-employed Jamaicans. Next.js (App Router), static data in `data/listings.json`, deploys to Vercel.

- `npm install && npm run dev`
- Data: `scripts/build_data.py` merges OpenStreetMap (ODbL), the UK FCDO list of medical facilities in Jamaica (OGL v3) and the Maritime Authority of Jamaica recognized practitioners list, and records sources per listing.
- Online visits link out to MDLink (https://themdlink.com/see-a-doctor). No API or partnership yet.
- `supabase/schema.sql` is the table for moving listings into Supabase when practices start claiming listings.

## Insurance marketplace and Brokers HQ

- `/insurance`: marketplace; quote requests go to up to 3 verified brokers (`app/insurance/actions.ts`).
- `/hq`: Brokers HQ (Supabase auth): leads, clients, private document vault (`client-docs` bucket), e-signatures (`/sign/[token]`, `app/api/sign/[token]/route.ts`), admin (`/hq/admin`, for `ADMIN_EMAILS`).
- Database: `supabase/migrations/*.sql` run automatically on every build by `scripts/migrate.mjs` when `POSTGRES_URL_NON_POOLING` is set. Row level security isolates each broker's data.
- Env vars (set by the Vercel Supabase integration): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `POSTGRES_URL_NON_POOLING`. Optional: `ADMIN_EMAILS`, `RESEND_API_KEY` + `EMAIL_FROM` (email notifications), `SALES_EMAIL`.
- Without the database, the public site still works and the new forms show "switching on shortly".
