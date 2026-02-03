# New CC Designer Version: Vercel + Supabase (No Neon)

You keep **two separate setups**:

| Setup | GitHub repo | Hosting | Database | Purpose |
|-------|-------------|---------|----------|---------|
| **Current (backup)** | `rrs77/boston` | Netlify | Supabase | Stays exactly as-is; backup / fallback |
| **New version** | `rrs77/vercelccd` | Vercel | **Same Supabase** | New deployment; same data |

Nothing is deleted. The Vercel app **links to your existing Supabase project** — no Neon or other database.

---

## Step 1: Deploy to Vercel

1. **Connect the repo** at [vercel.com](https://vercel.com): **New Project** → Import **vercelccd** (or your repo).
2. **Build settings:** Framework Preset **Vite**, build command `npm run build`, output directory `dist`. Deploy.

The app already uses your current Supabase URL and anon key in code (with optional env overrides). No extra database setup.

---

## Step 2 (optional): Set Supabase env vars in Vercel

If you want the Vercel deployment to use env vars instead of defaults:

1. In Vercel: **Project** → **Settings** → **Environment Variables**.
2. Add (for Production/Preview/Development as needed):
   - **Name:** `VITE_SUPABASE_URL`  
     **Value:** `https://wiudrzdkbpyziaodqoog.supabase.co`
   - **Name:** `VITE_SUPABASE_ANON_KEY`  
     **Value:** your Supabase anon key (same as in `src/config/supabase.ts`)

If you don’t set these, the app still uses the built-in defaults and talks to the same Supabase project.

---

## Summary

- **Netlify + boston repo:** unchanged; backup.
- **Vercel + vercelccd repo:** same app, same Supabase — no Neon, no new database. Just link and deploy.
