# Supabase Keep-Alive Setup Guide

This guide explains how to automatically keep your Supabase database active to prevent auto-pause.

## Problem

Supabase free tier projects automatically pause after 7 days of inactivity. When paused, the database needs to be manually woken up, which can cause downtime.

## Solution

We've created a Netlify Function that pings your Supabase database. By calling this function daily via a cron job, your database will stay active.

## Setup Steps

### Step 1: Deploy the Function

The function is already included in your codebase at `netlify/functions/keep-alive.js`. After deploying to Netlify, it will be available at:

```
https://kaleidoscopic-selkie-30292c.netlify.app/.netlify/functions/keep-alive
```

### Step 2: Set Up a Daily Cron Job

We recommend using **cron-job.org** (free and reliable):

1. **Sign up** at https://cron-job.org (free account)

2. **Create a new cron job:**
   - **Title:** Supabase Keep-Alive
   - **URL:** `https://kaleidoscopic-selkie-30292c.netlify.app/.netlify/functions/keep-alive`
   - **Schedule:** Daily at a time of your choice (e.g., 2:00 AM UTC)
   - **Request Method:** GET
   - **Save** the cron job

3. **Test it:**
   - Click "Run now" to test
   - You should see a JSON response: `{"success": true, "message": "Supabase database pinged successfully", ...}`

### Alternative Cron Services

If you prefer other services:

- **EasyCron:** https://www.easycron.com
- **Cronitor:** https://cronitor.io (free tier available)
- **GitHub Actions:** You can also set up a GitHub Actions workflow (see below)

## GitHub Actions Alternative

If you prefer using GitHub Actions instead of an external cron service, create `.github/workflows/keep-alive.yml`:

```yaml
name: Supabase Keep-Alive

on:
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Allows manual trigger

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase
        run: |
          curl -X GET "https://kaleidoscopic-selkie-30292c.netlify.app/.netlify/functions/keep-alive"
```

## How It Works

1. The cron job calls the Netlify Function endpoint daily
2. The function makes a lightweight query to Supabase (selecting 1 row from activities table)
3. This query keeps the database connection active, preventing auto-pause
4. The function returns a success response

## Monitoring

You can monitor the keep-alive function:

1. **Check cron job logs** in your cron service dashboard
2. **Check Netlify Function logs:**
   - Go to Netlify Dashboard → Functions → keep-alive → Logs
3. **Test manually:**
   ```bash
   curl https://kaleidoscopic-selkie-30292c.netlify.app/.netlify/functions/keep-alive
   ```

## Troubleshooting

### Function returns 500 error
- Check Netlify Function logs
- Verify Supabase credentials are correct in `netlify/functions/keep-alive.js`

### Cron job not running
- Verify the cron job is enabled in your cron service dashboard
- Check the cron job logs for errors
- Ensure the URL is correct

### Database still pausing
- Make sure the cron job is running daily (check logs)
- Verify the function is accessible (test manually)
- Consider running twice daily if once isn't enough

## Additional Notes

- The function uses a lightweight query, so it won't impact performance
- Running daily is sufficient to prevent auto-pause
- You can run it more frequently if needed (e.g., every 12 hours)
- The function is publicly accessible but only makes read-only queries

