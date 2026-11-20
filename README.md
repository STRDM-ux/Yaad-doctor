# Yaad Doctor

Doctor finder for self-employed Jamaicans. Next.js (App Router), static data in `data/listings.json`, deploys to Vercel.

- `npm install && npm run dev`
- Data: `scripts/build_data.py` merges OpenStreetMap (ODbL), the UK FCDO list of medical facilities in Jamaica (OGL v3) and the Maritime Authority of Jamaica recognized practitioners list, and records sources per listing.
- Online visits link out to MDLink (https://themdlink.com/see-a-doctor). No API or partnership yet.
- `supabase/schema.sql` is the table for moving listings into Supabase when practices start claiming listings.
