# Export Supabase → Import into Vercel (Postgres)

This guide exports your **Supabase** database (read-only; Supabase stays intact) and imports the data into **Vercel’s Postgres** (or a Postgres you connect via Vercel, e.g. Neon).

---

## Part 1: Export from Supabase (no changes to Supabase)

1. **Run the export script** (reads data only; does not delete or alter Supabase):

   ```bash
   cd "/Users/robreich-storer/Library/Mobile Documents/com~apple~CloudDocs/CC Designer/boston"
   node scripts/export-supabase-data.js
   ```

2. **Output:** A timestamped folder under `exports/` containing:
   - One JSON file per table (e.g. `activities.json`, `lessons.json`, `lesson_plans.json`, …)
   - `_manifest.json` (export date and summary)
   - Optional: `storage/` with bucket file lists (metadata only)

3. **Note:** Supabase is not modified. You can run this anytime as a backup.

---

## Part 2: Create Postgres on Vercel and get connection URL

1. In the **Vercel** project for your app (e.g. vercelccd):
   - Open the project → **Storage** (or **Integrations**).
   - Add a **Postgres** database (e.g. **Neon** or another Postgres from the Marketplace).
   - Create the database and connect it to the project.

2. **Environment variables** will be added, e.g.:
   - `POSTGRES_URL` (or `DATABASE_URL`)
   - Sometimes `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING` for Neon.

3. **For the import script:** you need a **direct connection URL** (non-pooled is often best for one-off scripts), e.g.:
   - `POSTGRES_URL_NON_POOLING` (Neon), or  
   - `POSTGRES_URL` if that’s the only one.

---

## Part 3: Create tables in Vercel Postgres

1. In Vercel: open your Postgres (e.g. Neon dashboard) and use the **SQL editor**, or run the schema file (see below) using `psql` or any Postgres client with the same connection URL.

2. **Schema file:** Use the SQL in `scripts/vercel-postgres-schema.sql` to create all tables. It mirrors the Supabase tables the app expects.

   - If your provider uses a specific schema (e.g. `public`), the script uses standard `public`; adjust if needed.
   - Run the full script once before importing data.

---

## Part 4: Generate and run import SQL

1. **Generate the import SQL** (point the script at your export folder from Part 1):

   ```bash
   node scripts/import-to-vercel-postgres.js exports/2025-01-15T12-00-00
   ```

   Replace `exports/2025-01-15T12-00-00` with the actual timestamped folder name (e.g. `exports/2025-01-15T14-30-00`).

2. **Output:** The script creates a file **inside that export folder**:  
   `exports/<timestamp>/import-into-vercel.sql`  
   It contains one `INSERT` per row for every table that had a JSON file.

3. **Run the SQL in Postgres:**  
   Open your Vercel/Neon Postgres **SQL editor**, paste or upload the contents of `import-into-vercel.sql`, and run it.  
   (If you re-run, either use a fresh database or truncate the tables first to avoid duplicate-key errors.)

---

## Summary

| Step | Action | Where |
|------|--------|--------|
| 1 | Export data (read-only) | `node scripts/export-supabase-data.js` → `exports/[timestamp]/` |
| 2 | Add Postgres to Vercel project | Vercel Dashboard → Storage / Integrations |
| 3 | Create tables | Run `scripts/vercel-postgres-schema.sql` in Postgres SQL editor |
| 4 | Import data | `POSTGRES_URL=... node scripts/import-to-vercel-postgres.js exports/[timestamp]` |

Supabase remains unchanged and can keep serving the existing app while you switch the Vercel app to use the new Postgres.
