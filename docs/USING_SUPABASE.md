# Using Supabase (current setup)

The app uses **Supabase only** as its database. There is no Neon or other database in use.

- **Netlify** and **Vercel** deployments both talk to the same Supabase project.
- Your data lives in Supabase. Keep the project **active** (free tier projects pause after inactivity — restore from the [Supabase Dashboard](https://supabase.com/dashboard) if needed).
- In the app, **Data Source Management** (Admin Settings) shows **Supabase Status**. If it says Connected, you’re good.

If Supabase doesn’t show as connected or data doesn’t load, see the **“Supabase isn’t showing” / Status shows “Disconnected”** and **Vercel deploy** sections in `COPY_SUPABASE_TO_NEON_STEPS.md` — that doc also has optional steps for copying data to Neon, which you can ignore if you’re only using Supabase.
