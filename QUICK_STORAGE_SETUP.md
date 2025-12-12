# 🚀 Quick Storage Bucket Setup

## Option 1: Automated Script (Recommended)

If you have your Supabase Service Role Key:

1. **Get your Service Role Key:**
   - Go to: https://supabase.com/dashboard/project/wiudrzdkbpyziaodqoog/settings/api
   - Copy the **service_role** key (NOT the anon key)
   - ⚠️ Keep this secret! Never commit it to git.

2. **Run the script:**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here node scripts/create-storage-bucket.js
   ```

That's it! The bucket will be created automatically.

---

## Option 2: Manual Setup (2 minutes)

1. **Go directly to your Storage page:**
   - https://supabase.com/dashboard/project/wiudrzdkbpyziaodqoog/storage/buckets

2. **Click "New bucket"**

3. **Configure:**
   - **Name:** `lesson-pdfs` (must be exact)
   - **Public bucket:** ✅ Enable
   - **File size limit:** 50 MB
   - **Allowed MIME types:** `application/pdf` (optional)

4. **Click "Create bucket"**

Done! ✅

---

## Verify It Works

After creating the bucket, test the share feature:
1. Open any lesson in your app
2. Click "Print Preview"
3. Click "Share Lesson Plan Link"
4. You should get a shareable URL!

---

## Need Help?

See `SUPABASE_STORAGE_SETUP.md` for detailed instructions and troubleshooting.

