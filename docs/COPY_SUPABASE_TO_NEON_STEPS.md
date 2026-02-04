# Copy Supabase data into Neon (Vercel)

**You don’t need Neon.** The app uses **Supabase only** as its database. Deploy to Vercel and keep using your existing Supabase project; nothing else is required.

This document is **optional** — only follow it if you ever want a copy of your data in a Neon (or other Postgres) database on Vercel. Otherwise, ignore the steps below and use the **“Supabase isn’t showing” / Vercel deploy** section further down for connection troubleshooting.

---

The app currently **uses Supabase** as its database. Data is **not** copied to Neon automatically. To have the same data in a Neon database on Vercel (e.g. for a future switch or a second copy), follow these steps.

---

## 1. Export from Supabase (read-only; Supabase is not changed)

In your project folder, in Terminal:

```bash
cd "/Users/robreich-storer/Library/Mobile Documents/com~apple~CloudDocs/CC Designer/boston"
node scripts/export-supabase-data.js
```

- Creates a folder like `exports/2025-01-15T14-30-00/` with one JSON file per table.
- Note the **exact folder name** (with timestamp); you need it for step 4.

---

## 2. Add Neon Postgres to your Vercel project

1. Open [Vercel Dashboard](https://vercel.com) → your **vercelccd** project.
2. Go to **Storage** (or **Integrations**).
3. Click **Create Database** (or **Add Integration**) and choose **Postgres** (e.g. **Neon**).
4. Create the database and connect it to the project.
5. After creation, Vercel will add env vars such as:
   - `POSTGRES_URL`
   - `POSTGRES_URL_NON_POOLING` (Neon) — use this for running SQL if you have it.

---

## 3. Create tables in Neon

1. In Vercel, open your project → **Storage** → your Postgres/Neon database → **Query** (or open the Neon dashboard and use the SQL editor).
2. Open the file **`scripts/vercel-postgres-schema.sql`** from this repo.
3. Copy its full contents into the SQL editor and run it.  
   This creates all tables (activities, lessons, lesson_plans, etc.) empty.

---

## 4. Generate import SQL from your export

Still in your project folder, run (use **your** export folder name from step 1):

```bash
node scripts/import-to-vercel-postgres.js exports/2025-01-15T14-30-00
```

Replace `exports/2025-01-15T14-30-00` with your actual folder, e.g. `exports/2025-01-16T09-00-00`.

- This creates: **`exports/<your-folder>/import-into-vercel.sql`**.

---

## 5. Run the import SQL in Neon

1. Open the Neon SQL editor again (Vercel Storage → your DB → Query, or Neon dashboard).
2. Open the file **`exports/<your-folder>/import-into-vercel.sql`** in a text editor.
3. Copy all its contents, paste into the SQL editor, and run.

Your Supabase data will then be in Neon. Supabase is unchanged.

---

## Why the “database isn’t showing”

- The **app** (vercelccd) is still configured to use **Supabase**. So the “database” you see in the app is Supabase.
- **Neon** is only filled if you run the steps above. There is no automatic copy on deploy.
- To make the app use Neon instead of Supabase, the codebase would need to be updated to use the Postgres connection and queries instead of the Supabase client; that’s a separate change.

---

## “Supabase isn’t showing” / Status shows “Disconnected”

If in **Admin Settings** the **Supabase Status** shows **Disconnected** (or Supabase doesn’t seem to be there):

1. **Supabase project is paused (most common)**  
   Free-tier Supabase projects **pause after about 7 days of inactivity**. When paused, the app cannot reach the database.
   - Go to [Supabase Dashboard](https://supabase.com/dashboard) and open your project.
   - If you see **“Project is paused”**, click **Restore project**. Wait a minute, then refresh the app and check **Supabase Status** again.

2. **Vercel / build**  
   The app has built-in fallbacks for the Supabase URL and anon key, so it should still connect on Vercel. If you set **VITE_SUPABASE_URL** and **VITE_SUPABASE_ANON_KEY** in Vercel, ensure they match your project and **redeploy** after changing env vars.

3. **Where to check status**  
   In the app: open **Admin Settings** (or **Data Source Management**). The **“Supabase Status”** / **“Supabase Connection”** line shows **Connected** (green) or **Disconnected** (red). If it’s Disconnected, the connection test failed—usually because the project is paused.

4. **Vercel deploy – Supabase not opening**  
   - The app bakes in fallback Supabase URL and anon key. If you set **VITE_SUPABASE_URL** or **VITE_SUPABASE_ANON_KEY** in Vercel, they must match your Supabase project exactly; wrong values make the database fail.  
   - **Fix:** Vercel → Settings → Environment Variables: remove or correct those two, then Redeploy. The connection status now uses a lightweight check (one table).

---

## Quick checklist

| Step | What to do |
|------|------------|
| 1 | `node scripts/export-supabase-data.js` → note `exports/<timestamp>/` |
| 2 | Vercel → Storage → Add Postgres (Neon) → connect to project |
| 3 | Run `scripts/vercel-postgres-schema.sql` in Neon SQL editor |
| 4 | `node scripts/import-to-vercel-postgres.js exports/<timestamp>` |
| 5 | Run `exports/<timestamp>/import-into-vercel.sql` in Neon SQL editor |
