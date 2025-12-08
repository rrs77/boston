# Supabase Storage Setup for PDF Sharing

This guide explains how to set up Supabase Storage to enable PDF sharing functionality.

## ⚠️ IMPORTANT: Manual Setup Required

**The storage bucket must be created manually** because bucket creation requires admin/service role permissions that the client-side app doesn't have. The app will attempt to create it automatically, but this will fail with a permissions error - this is expected and normal.

## Quick Setup (2 minutes)

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Storage:**
   - Click **Storage** in the left sidebar
   - Or go directly to: https://supabase.com/dashboard/project/_/storage/buckets

3. **Create the bucket:**
   - Click **New bucket** button
   - **Name:** `lesson-pdfs` (must be exact)
   - **Public bucket:** ✅ **Enable** (required for public URLs)
   - **File size limit:** 50 MB (recommended)
   - **Allowed MIME types:** `application/pdf` (optional, for security)
   - Click **Create bucket**

4. **Verify:**
   - You should see `lesson-pdfs` in your buckets list
   - The bucket should show as "Public"

That's it! The share feature will now work.

## Detailed Setup Steps

### Step 1: Create Storage Bucket

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name:** `lesson-pdfs` (must match exactly)
   - **Public bucket:** ✅ **Enable** (this allows public URLs)
   - **File size limit:** 50 MB (or your preferred limit)
   - **Allowed MIME types:** `application/pdf` (optional, for security)
5. Click **Create bucket**

### Step 2: Configure Bucket Policies (Optional but Recommended)

For better security, you can set up Row Level Security (RLS) policies:

1. Go to **Storage** → **Policies** → Select `lesson-pdfs` bucket
2. Create a policy for **INSERT** (upload):
   - Policy name: `Allow authenticated uploads`
   - Allowed operation: `INSERT`
   - Policy definition:
     ```sql
     (bucket_id = 'lesson-pdfs'::text)
     ```
   - Or use: `true` for public uploads (less secure)

3. Create a policy for **SELECT** (read/download):
   - Policy name: `Allow public reads`
   - Allowed operation: `SELECT`
   - Policy definition:
     ```sql
     (bucket_id = 'lesson-pdfs'::text)
     ```
   - Or use: `true` for public access

### Step 3: Test the Feature

1. Open your app and navigate to a lesson
2. Click **Print Preview**
3. Click **Share PDF** button
4. The PDF should upload and a shareable URL will be displayed
5. Copy the URL and test it in an incognito window

## How It Works

1. User clicks **Share PDF** in the print preview
2. PDF is generated using PDFBolt API (same as export)
3. PDF is uploaded to Supabase Storage bucket `lesson-pdfs`
4. A public URL is generated and displayed
5. User can:
   - Copy the URL to clipboard
   - Use native share dialog (on mobile devices)
   - Share the URL with others

## Storage Considerations

- **File naming:** Files are stored as `shared-pdfs/{timestamp}_{filename}.pdf`
- **Cleanup:** Consider implementing automatic cleanup of old PDFs (e.g., delete files older than 30 days)
- **Storage limits:** Monitor your Supabase Storage usage to avoid exceeding free tier limits

## Troubleshooting

### Error: "Failed to upload PDF: bucket not found"
- Ensure the bucket name is exactly `lesson-pdfs`
- Check that the bucket exists in your Supabase project

### Error: "Permission denied"
- Check bucket policies in Supabase dashboard
- Ensure the bucket is set to **Public** if you want public URLs
- Verify your Supabase API key has storage permissions

### URLs not accessible
- Ensure the bucket is set to **Public**
- Check that the file was uploaded successfully in Storage dashboard
- Verify the public URL format is correct

## Alternative: Using Netlify Functions

If you prefer not to use Supabase Storage, you could:
1. Create a Netlify Function to handle PDF uploads
2. Store PDFs in a different service (AWS S3, Cloudinary, etc.)
3. Generate signed URLs with expiration times

## Security Notes

- Public buckets allow anyone with the URL to access files
- Consider implementing:
  - Signed URLs with expiration times
  - Authentication checks before generating URLs
  - File access logging
  - Automatic cleanup of old files

