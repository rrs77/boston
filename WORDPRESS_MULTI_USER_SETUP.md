# WordPress Multi-User Integration Setup Guide

This guide will help you set up your app so WordPress customers can log in with their existing accounts and have their own private workspaces.

## 📋 Prerequisites

✅ WordPress site with JWT Authentication plugin installed  
✅ Supabase project (already configured)  
✅ Node.js environment  

---

## 🚀 Step 1: WordPress Configuration

### 1.1 Verify JWT Plugin

You mentioned JWT Authentication is already installed. Verify it's active:
- Go to WordPress Admin → Plugins
- Ensure "JWT Authentication for WP REST API" is activated

### 1.2 Add JWT Configuration to WordPress

Edit your WordPress `wp-config.php` file and add these lines **before** `/* That's all, stop editing! */`:

```php
// JWT Authentication Configuration
define('JWT_AUTH_SECRET_KEY', 'your-super-secret-key-here');
define('JWT_AUTH_CORS_ENABLE', true);
```

**Important:** Replace `'your-super-secret-key-here'` with a strong, unique secret key. You can generate one at https://api.wordpress.org/secret-key/1.1/salt/

### 1.3 Test JWT Endpoint

Test that JWT is working by visiting:
```
https://your-wordpress-site.com/wp-json/jwt-auth/v1/token
```

You should see a message like "JWT is not configurated properly" or a similar authentication error (this is normal - it means the endpoint is working).

---

## 🔧 Step 2: Environment Configuration

### 2.1 Create/Update .env File

In your project root (`/Users/robreich-storer/Desktop/Cursor New/cursorchanges/`), create or update the `.env` file:

```env
# WordPress Configuration
VITE_WORDPRESS_URL=https://your-actual-wordpress-site.com

# Supabase Configuration (already set)
VITE_SUPABASE_URL=https://wiudrzdkbpyziaodqoog.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Replace** `https://your-actual-wordpress-site.com` with your real WordPress URL (no trailing slash).

### 2.2 Update .env.production (for deployment)

Create `.env.production` with the same values for production builds:

```env
VITE_WORDPRESS_URL=https://your-actual-wordpress-site.com
VITE_SUPABASE_URL=https://wiudrzdkbpyziaodqoog.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 💾 Step 3: Database Migration

### 3.1 Run the Migration SQL in Supabase

1. Open your Supabase project: https://supabase.com/dashboard
2. Navigate to: **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/add_user_isolation.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Cmd/Ctrl + Enter)

### 3.2 Verify Migration Success

Check that the migration completed successfully:

```sql
-- Run this query to verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'activities' AND column_name = 'user_id';

-- Should return one row showing user_id column exists
```

### 3.3 Handle Existing Data (Important!)

If you have existing test data in your database, you need to decide:

**Option A: Delete test data** (recommended for clean start)
```sql
-- Delete all existing data to start fresh
TRUNCATE activities, lessons, lesson_plans, eyfs_statements, subjects, subject_categories CASCADE;
```

**Option B: Assign to admin user**
```sql
-- Assign all existing data to your admin account (user_id = '1')
UPDATE activities SET user_id = '1' WHERE user_id IS NULL;
UPDATE lessons SET user_id = '1' WHERE user_id IS NULL;
UPDATE lesson_plans SET user_id = '1' WHERE user_id IS NULL;
UPDATE eyfs_statements SET user_id = '1' WHERE user_id IS NULL;
UPDATE subjects SET user_id = '1' WHERE user_id IS NULL;
UPDATE subject_categories SET user_id = '1' WHERE user_id IS NULL;
```

---

## 🧪 Step 4: Testing

### 4.1 Test Local Admin Login

1. Start your development server:
```bash
cd /Users/robreich-storer/Desktop/Cursor\ New/cursorchanges
npm run dev
```

2. Open http://localhost:5173
3. Login with your local admin account:
   - Email: `rob.reichstorer@gmail.com`
   - Password: `mubqaZ-piske5-xecdur`

4. Verify you see an empty workspace (if you deleted test data)

### 4.2 Test WordPress Login

1. Create a test customer account in WordPress:
   - Go to WordPress Admin → Users → Add New
   - Username: `testcustomer`
   - Email: `test@example.com`
   - Role: Subscriber
   - Password: Set a test password

2. Try logging into your app with the WordPress credentials
3. Verify:
   - ✅ Login succeeds
   - ✅ Shows empty workspace
   - ✅ Can create activities/lessons
   - ✅ Logout and login again - data persists
   - ✅ Login as admin - admin doesn't see customer's data

### 4.3 Check Browser Console

Open browser DevTools (F12) and check the Console:
- Look for `✅ Supabase user context set:` messages
- Should see user ID being set on login
- No errors related to user_id

---

## 🚢 Step 5: Deployment

### 5.1 Build for Production

```bash
npm run build
```

### 5.2 Deploy to Netlify (Current Hosting)

Your app is already set up for Netlify. Just commit and push:

```bash
git add .
git commit -m "Add WordPress multi-user support"
git push origin main
```

Netlify will auto-deploy. Make sure environment variables are set in Netlify:
- Go to Netlify Dashboard → Site Settings → Environment Variables
- Add: `VITE_WORDPRESS_URL` = your WordPress URL

---

## 👥 Step 6: Customer Onboarding

### 6.1 Current Flow (Customers Create Accounts in WordPress)

1. Customer purchases from your WordPress site
2. WordPress creates user account (via WooCommerce or manual)
3. Customer receives login credentials
4. Customer logs into your app using WordPress credentials
5. Gets empty workspace to start creating content

### 6.2 Future Enhancement: Activity Pack Marketplace

When you're ready to sell activity packs, you'll need to add:

1. **Marketplace Table** (run this SQL when ready):
```sql
CREATE TABLE activity_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  activities_count INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_purchased_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  pack_id UUID REFERENCES activity_packs(id),
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, pack_id)
);
```

2. **Copy Activities Function** (JavaScript):
```typescript
// When customer purchases a pack
async function grantActivityPack(userId: string, packId: string) {
  // 1. Record the purchase
  await supabase.from('user_purchased_packs').insert({
    user_id: userId,
    pack_id: packId
  });
  
  // 2. Copy template activities to user's workspace
  const { data: packActivities } = await supabase
    .from('activity_pack_templates')  // Your template activities
    .select('*')
    .eq('pack_id', packId);
  
  const userActivities = packActivities.map(activity => ({
    ...activity,
    id: undefined,  // Let Supabase generate new IDs
    user_id: userId
  }));
  
  await supabase.from('activities').insert(userActivities);
}
```

---

## 🔐 Security Notes

### Row Level Security (RLS)

The migration enables RLS policies that ensure:
- ✅ Users can only see their own data
- ✅ Users cannot access other users' data
- ✅ All database operations are automatically filtered by user_id

### Testing RLS

Try this malicious query (should return empty):
```sql
-- Logged in as user '2', try to access user '1' data
-- This will return nothing due to RLS
SELECT * FROM activities WHERE user_id = '1';
```

---

## 📊 Monitoring

### Check User Activity

```sql
-- See all users and their activity counts
SELECT 
  user_id,
  COUNT(*) as activity_count
FROM activities
GROUP BY user_id;
```

### Check for Orphaned Data

```sql
-- Find data without user_id (shouldn't exist after migration)
SELECT 'activities' as table_name, COUNT(*) as orphaned_count
FROM activities WHERE user_id IS NULL
UNION ALL
SELECT 'lessons', COUNT(*) FROM lessons WHERE user_id IS NULL
UNION ALL
SELECT 'lesson_plans', COUNT(*) FROM lesson_plans WHERE user_id IS NULL;
```

---

## 🆘 Troubleshooting

### Issue: "User must be logged in" errors

**Cause:** User ID not being stored properly

**Fix:**
1. Check browser localStorage for `rhythmstix_user_id`
2. Clear browser cache and cookies
3. Login again
4. Check DevTools Console for RLS errors

### Issue: Can't see any data after login

**Possible causes:**
1. User ID from WordPress doesn't match database
2. RLS policies too restrictive
3. Data hasn't been migrated

**Debug:**
```sql
-- Check what user_id is being used
SELECT current_setting('app.current_user_id', true);

-- Temporarily disable RLS to see all data (TESTING ONLY)
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
-- Remember to re-enable: ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
```

### Issue: WordPress login fails

**Check:**
1. WordPress URL in .env is correct (no trailing slash)
2. JWT plugin is activated
3. JWT secret key is set in wp-config.php
4. Try visiting: `https://your-site.com/wp-json/jwt-auth/v1/token`

---

## ✅ Final Checklist

Before going live with customers:

- [ ] JWT configured in WordPress wp-config.php
- [ ] .env file has correct WordPress URL
- [ ] Database migration completed successfully
- [ ] Test data assigned to admin or deleted
- [ ] RLS policies working (users can't see each other's data)
- [ ] Local admin login works
- [ ] WordPress test customer login works
- [ ] Data persists across sessions
- [ ] Production environment variables set in Netlify
- [ ] Production build tested

---

## 🎉 Success!

Your app now supports multiple customers with private workspaces! Each WordPress customer:
- ✅ Logs in with their WordPress credentials
- ✅ Gets their own private workspace
- ✅ Starts with no activities (clean slate)
- ✅ Can create and save their own content
- ✅ Cannot see other users' data

Ready to sell activity packs? Follow the "Activity Pack Marketplace" section above!

---

## 📞 Support

If you run into issues:
1. Check the Troubleshooting section above
2. Review Supabase logs: https://supabase.com/dashboard → Logs
3. Check browser console for errors (F12)
4. Verify WordPress JWT endpoint is responding

Need help? The implementation is complete and ready to test!

