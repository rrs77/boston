# PDF link export on Vercel – setup

## Why you see “SUPABASE_SERVICE_ROLE_KEY is set in your host…”

The **PDF link export** (Copy link / share lesson) works like this:

1. The **browser** builds the lesson HTML and sends it to your **Vercel** server (`/api/generate-pdf`).
2. The **Vercel function** uses **PDFBolt** to turn that HTML into a PDF.
3. The same function **uploads the PDF file** into **Supabase Storage** (bucket `lesson-pdfs`).
4. It returns the **public URL** of that file; the app copies that URL and can store it in the browser (localStorage) for reuse.

The link is **not** “from the database” – the **file** is stored in **Supabase Storage** (file store). The service needs the **service role key** so the server can upload files to that bucket. If `SUPABASE_SERVICE_ROLE_KEY` is not set in **Vercel**, the server can’t upload and you get the error you’re seeing.

## Fix: set environment variables in Vercel

1. Open **[Vercel Dashboard](https://vercel.com)** → your project (e.g. **vercelccd**).
2. Go to **Settings → Environment Variables**.
3. Add these for **Production** (and optionally Preview/Development if you use them):

| Name | Value | Notes |
|------|--------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase **service_role** key | Required for PDF upload to Storage. Get it: Supabase Dashboard → Project Settings → API → “service_role” (secret). |
| `SUPABASE_URL` or `VITE_SUPABASE_URL` | Your Supabase project URL | e.g. `https://xxxxx.supabase.co` |
| `PDFBOLT_API_KEY` or `VITE_PDFBOLT_API_KEY` | Your PDFBolt API key | Required for generating the PDF. |

4. **Redeploy** the project (Deployments → … on latest → Redeploy) so the serverless function sees the new variables.

## After this

- **Copy link** / PDF link export will call `/api/generate-pdf` on Vercel.
- That function will use PDFBolt and Supabase Storage; the public URL will be copied and (in the app) stored in localStorage for reuse.
- No database table is used for these links; the “link” is just the public URL of the file in the `lesson-pdfs` bucket.

## Supabase Storage

- Ensure the **`lesson-pdfs`** bucket exists in Supabase (Storage) and is **public**, so the generated links work when opened.
