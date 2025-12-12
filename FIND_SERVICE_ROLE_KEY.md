# 🔑 How to Find Your Supabase Service Role Key

## Method 1: Direct Link (Easiest)

**Click this link to go directly to your API keys page:**
https://supabase.com/dashboard/project/wiudrzdkbpyziaodqoog/settings/api

You should see two keys:
- **anon** key (public) - This is what you're already using
- **service_role** key (secret) - This is what you need

Click "Reveal" or "Show" next to the service_role key to see it.

---

## Method 2: Manual Navigation

1. Go to: https://supabase.com/dashboard
2. Select your project (should be "rrs77's Project" or similar)
3. In the left sidebar, click **Settings** (gear icon)
4. Click **API** (under Project Settings)
5. Scroll down to find **service_role** key
6. Click "Reveal" to show it

---

## Method 3: If You Can't Find It

If the service_role key isn't visible, you might need to:

1. **Check if you're the project owner** - Only project owners can see service_role keys
2. **Try a different browser** - Sometimes browser extensions hide elements
3. **Use manual setup instead** - Just create the bucket manually (see below)

---

## Alternative: Manual Setup (No Key Needed)

If you can't find the service_role key, just create the bucket manually:

1. **Go to Storage:**
   https://supabase.com/dashboard/project/wiudrzdkbpyziaodqoog/storage/buckets

2. **Click "New bucket"**

3. **Fill in:**
   - Name: `lesson-pdfs`
   - Public bucket: ✅ Enable
   - File size limit: 50 MB
   - Allowed MIME types: `application/pdf`

4. **Click "Create bucket"**

Done! This takes about 30 seconds and doesn't require any keys.

---

## Still Having Issues?

The service_role key might be:
- Hidden for security reasons
- Only visible to project owners
- Located in a different section

**Recommendation:** Use the manual setup method above - it's faster and doesn't require finding the key!

