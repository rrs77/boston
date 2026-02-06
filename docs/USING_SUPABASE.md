# Using Supabase (current setup)

The app uses **Supabase only** as its database. There is no Neon or other database in use.

- **Netlify** and **Vercel** deployments both talk to the same Supabase project.
- Your data lives in Supabase. Keep the project **active** (free tier projects pause after inactivity — restore from the [Supabase Dashboard](https://supabase.com/dashboard) if needed).
- In the app, **Data Source Management** (Admin Settings) shows **Supabase Status**. If it says Connected, you’re good.

**Category year group assignments** (Settings → Categories → Assign Year Groups) are stored in the `custom_categories.year_groups` column. If assignments don’t persist after Save, ensure the column exists: in Supabase SQL Editor run the migration `supabase_migrations/add_custom_categories_year_groups.sql` (adds `year_groups JSONB` if missing).

**Copy Link (shareable lesson PDF link)** needs the server to upload the PDF to Supabase. Set **SUPABASE_SERVICE_ROLE_KEY** in your host’s environment variables: in **Vercel** → Project → Settings → Environment Variables, add `SUPABASE_SERVICE_ROLE_KEY` with the value from Supabase Dashboard → Project Settings → API (Service role key). Then redeploy. Same for Netlify (Site settings → Environment variables).

If Supabase doesn’t show as connected or data doesn’t load, see the **“Supabase isn’t showing” / Status shows “Disconnected”** and **Vercel deploy** sections in `COPY_SUPABASE_TO_NEON_STEPS.md` — that doc also has optional steps for copying data to Neon, which you can ignore if you’re only using Supabase.
