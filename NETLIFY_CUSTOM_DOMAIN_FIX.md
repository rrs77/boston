# Netlify Custom Domain SSL Fix

## Problem
POST requests to Netlify Functions fail on custom domains (`ccdesigner.rhythmstix.co.uk`) with `ERR_SSL_PROTOCOL_ERROR`, but work correctly on the Netlify subdomain (`*.netlify.app`).

## Solution
All Netlify Function calls now route through the Netlify subdomain when accessed via a custom domain. This bypasses the SSL/TLS edge layer issue.

## Configuration

### Required Environment Variable
Set `VITE_NETLIFY_SUBDOMAIN` in Netlify's environment variables:

1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add new variable:
   - **Key:** `VITE_NETLIFY_SUBDOMAIN`
   - **Value:** Your Netlify subdomain (e.g., `ccdesigner-xxxxx.netlify.app` or `https://ccdesigner-xxxxx.netlify.app`)

### Finding Your Netlify Subdomain
1. Go to Netlify Dashboard → Your Site
2. Look at the site URL (e.g., `https://ccdesigner-xxxxx.netlify.app`)
3. Use this as the value for `VITE_NETLIFY_SUBDOMAIN`

## How It Works

The `getNetlifyFunctionUrl()` helper function:
- **On localhost:** Uses relative paths (dev mode)
- **On `*.netlify.app`:** Uses relative paths (same origin)
- **On custom domain:** Uses Netlify subdomain from `VITE_NETLIFY_SUBDOMAIN` env var

## Files Updated

- `src/utils/netlifyFunctions.ts` - New utility function
- `src/hooks/useShareLesson.ts` - Updated to use helper
- `src/hooks/useShareTimetable.ts` - Updated to use helper
- `src/components/LessonPrintModal.tsx` - Updated to use helper
- `src/components/LessonExporter.tsx` - Updated to use helper

## Testing

After setting the environment variable:
1. Deploy to Netlify
2. Test PDF generation on custom domain
3. Check browser console for log: `📡 Using Netlify subdomain from env: https://...`
4. Verify PDF generation succeeds

## Troubleshooting

If functions still fail:
1. Verify `VITE_NETLIFY_SUBDOMAIN` is set correctly in Netlify
2. Check browser console for error messages
3. Ensure the Netlify subdomain URL is correct (should end with `.netlify.app`)
4. Redeploy after setting environment variable

