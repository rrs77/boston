# 🖥️ Terminal Commands to Create Storage Bucket

## Quick One-Liner (Bash/Curl)

**Get your Service Role Key first:**
- Go to: https://supabase.com/dashboard/project/wiudrzdkbpyziaodqoog/settings/api
- Copy the **service_role** key

**Then run this command (replace YOUR_KEY_HERE):**

```bash
curl -X POST "https://wiudrzdkbpyziaodqoog.supabase.co/storage/v1/bucket" \
  -H "Authorization: Bearer YOUR_KEY_HERE" \
  -H "apikey: YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"lesson-pdfs","public":true,"file_size_limit":52428800,"allowed_mime_types":["application/pdf"]}'
```

## Using the Script (Easier)

**Option 1: Bash Script**
```bash
./create-bucket.sh YOUR_SERVICE_ROLE_KEY
```

**Option 2: Node.js Script**
```bash
SUPABASE_SERVICE_ROLE_KEY=YOUR_KEY_HERE node scripts/create-storage-bucket.js
```

## Using Supabase CLI (If Installed)

```bash
# Install Supabase CLI first (if not installed)
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref wiudrzdkbpyziaodqoog

# Create bucket
supabase storage create lesson-pdfs --public --file-size-limit 52428800
```

## Verify It Worked

```bash
curl -X GET "https://wiudrzdkbpyziaodqoog.supabase.co/storage/v1/bucket" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" | grep lesson-pdfs
```

If you see `"name":"lesson-pdfs"` in the output, it worked! ✅

