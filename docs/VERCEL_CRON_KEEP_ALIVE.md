# Vercel cron: Supabase keep-alive (every 6 days)

This keeps your **Supabase project from pausing** (free tier pauses after ~7 days of inactivity) by having Vercel call an API that queries Supabase every 6 days.

## What’s in place

1. **API route:** `api/keep-alive.js`  
   - **GET** `/api/keep-alive`  
   - If `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel: calls `auth.admin.listUsers()` (queries user data).  
   - Otherwise: runs a small read on the `activities` table.  
   - Both options “ping” Supabase so the project stays active.

2. **Cron in `vercel.json`**  
   - Runs at **02:00 UTC** on days **1, 7, 13, 19, 25** of each month (about every 6 days).  
   - Vercel sends a GET request to your **production** URL:  
     `https://<your-vercel-domain>/api/keep-alive`

## What you need to do

1. **Deploy to Vercel**  
   Push the repo (with `api/keep-alive.js` and `vercel.json`) and deploy. Cron only runs on **production** deployments.

2. **Optional – use auth “user” query**  
   In Vercel: **Project → Settings → Environment Variables** add:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`  
   - **Value:** your Supabase **service_role** key (Supabase Dashboard → Project Settings → API).  
   Then the cron will use `auth.admin.listUsers()` (user table).  
   If you don’t set this, the function still pings Supabase using the anon key and the `activities` table.

3. **Test the endpoint**  
   After deploy, open in a browser or with curl:
   ```bash
   curl https://<your-vercel-app>.vercel.app/api/keep-alive
   ```
   You should get JSON like:
   ```json
   { "success": true, "message": "Supabase database pinged", "timestamp": "..." }
   ```

## Summary

| Item        | Details                                              |
|------------|------------------------------------------------------|
| Endpoint   | `GET /api/keep-alive`                                |
| Schedule   | 02:00 UTC on days 1, 7, 13, 19, 25 (~ every 6 days)  |
| Purpose    | Prevent Supabase free tier from auto-pausing         |
| Optional   | Set `SUPABASE_SERVICE_ROLE_KEY` to query auth users  |

No Neon or other database is involved; this only talks to your existing Supabase project.
