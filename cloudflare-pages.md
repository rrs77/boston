# Cloudflare Pages Deployment Guide

## Prerequisites
1. A Cloudflare account (free tier works)
2. Your GitHub repository connected to Cloudflare

## Deployment Steps

### Option 1: Deploy via Cloudflare Dashboard (Recommended)

1. **Go to Cloudflare Dashboard**
   - Visit https://dash.cloudflare.com
   - Navigate to **Workers & Pages** → **Pages**

2. **Create a New Project**
   - Click **Create a project**
   - Connect your GitHub repository (`rrs77/boston`)
   - Select the repository

3. **Configure Build Settings**
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty)

4. **Set Environment Variables**
   Add these in the **Environment variables** section:
   - `SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_URL` - Same as above (for Vite)
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (if needed for functions)
   - `NODE_VERSION` - `18` (or your preferred version)

5. **Deploy**
   - Click **Save and Deploy**
   - Cloudflare will build and deploy your site

### Option 2: Deploy via Wrangler CLI

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Deploy**
   ```bash
   wrangler pages deploy dist --project-name=cc-designer
   ```

## Custom Domain Setup

1. In Cloudflare Pages dashboard, go to your project
2. Click **Custom domains**
3. Add your domain: `ccdesigner.rhythmstix.co.uk`
4. Cloudflare will automatically configure DNS and SSL

## Important Notes

### Netlify Functions Migration
Your Netlify Functions (`netlify/functions/*`) need to be migrated to Cloudflare Workers/Pages Functions:

- **Location**: Create `functions/` directory in your project root
- **Format**: Cloudflare uses a different format than Netlify
- **Example**: `functions/api/generate-pdf.ts` instead of `netlify/functions/generate-pdf.js`

If you need help migrating the functions, let me know!

### SPA Routing
The `public/_redirects` file handles client-side routing. Cloudflare Pages will automatically use this file.

### Build Output
Make sure your `dist` folder contains:
- `index.html`
- All static assets (JS, CSS, images)
- The `_redirects` file (copied to dist during build)

## Troubleshooting

- **Build fails**: Check Node version (set NODE_VERSION=18 in environment variables)
- **404 errors on routes**: Ensure `_redirects` file is in `public/` and gets copied to `dist/`
- **Environment variables not working**: Make sure Vite variables start with `VITE_` prefix

