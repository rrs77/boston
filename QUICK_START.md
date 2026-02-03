# 🚀 Quick Start - WordPress Multi-User Integration

## Local dev server won't open?

1. **Test if the server is running**  
   Open in your browser: **http://localhost:5173/test.html**  
   If you see "Server is running", the server is fine. Then open **http://localhost:5173/** for the app.

2. **Try 127.0.0.1 instead of localhost**  
   Use **http://127.0.0.1:5173/** (some networks/VPNs break `localhost`).

3. **Start the server from Terminal (not from Cursor)**  
   ```bash
   cd "/Users/robreich-storer/Library/Mobile Documents/com~apple~CloudDocs/CC Designer/boston"
   npm run dev
   ```  
   Wait for "ready", then open **http://localhost:5173/** or run `npm run open-app` in another terminal.

4. **Project in iCloud can be slow**  
   If the project lives in iCloud Drive, copy it to a local folder (e.g. `~/Projects/boston`) and run `npm run dev` from there—often fixes hangs and "can't open".

---

## Ready to Test in 5 Minutes!

Your app is **fully coded and ready**. Just need to configure and test.

---

## ⚡ Step 1: Update .env (30 seconds)

Open `.env` in your project root and add/update:

```env
VITE_WORDPRESS_URL=https://your-actual-wordpress-site.com
```

Replace with your real WordPress URL (no trailing slash).

---

## ⚡ Step 2: WordPress Config (2 minutes)

Edit your WordPress `wp-config.php` and add before `/* That's all, stop editing! */`:

```php
define('JWT_AUTH_SECRET_KEY', 'your-super-secret-key-generate-one');
define('JWT_AUTH_CORS_ENABLE', true);
```

Get a secret key from: https://api.wordpress.org/secret-key/1.1/salt/

---

## ⚡ Step 3: Run Database Migration (2 minutes)

1. Go to https://supabase.com/dashboard
2. Open SQL Editor
3. Copy/paste contents of `supabase/migrations/add_user_isolation.sql`
4. Click Run

Optional - Clear test data:
```sql
TRUNCATE activities, lessons, lesson_plans, eyfs_statements CASCADE;
```

---

## ⚡ Step 4: Test It! (5 minutes)

```bash
npm run dev
```

### Test 1: Admin Login
- Email: `rob.reichstorer@gmail.com`
- Password: `mubqaZ-piske5-xecdur`
- ✅ Should see empty workspace

### Test 2: Create WordPress Test User
1. WordPress Admin → Users → Add New
2. Username: `testcustomer`
3. Email: `test@yourdomain.com`
4. Role: Subscriber
5. Set password

### Test 3: Login with WordPress Account
- Login with test customer credentials
- ✅ Should see empty workspace
- Create an activity
- Logout and login again
- ✅ Activity should still be there

### Test 4: Verify Data Isolation
- Login as admin
- ✅ Shouldn't see customer's activity
- Login as customer
- ✅ Shouldn't see admin's activities

---

## 🎉 Done!

If all 4 tests pass, you're ready to go! 

**Deploy:**
```bash
git add .
git commit -m "Add WordPress multi-user support"
git push
```

Don't forget: Add `VITE_WORDPRESS_URL` to Netlify environment variables.

---

## 📚 Need More Details?

- **Full Setup Guide:** `WORDPRESS_MULTI_USER_SETUP.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`
- **Database Migration:** `supabase/migrations/add_user_isolation.sql`

---

## 🆘 Troubleshooting

### Login fails?
- Check WordPress URL in .env (no trailing slash)
- Verify JWT secret in wp-config.php
- Test: `https://your-site.com/wp-json/jwt-auth/v1/token`

### Can't see data?
- Check browser console for errors
- Look for `rhythmstix_user_id` in localStorage (F12 → Application → Local Storage)
- Check Supabase logs

### Migration errors?
- Make sure you're using your project's SQL editor
- Copy entire migration file
- Check for existing user_id columns (run migration again is safe - it uses IF NOT EXISTS)

---

**That's it! Your multi-user system is ready!** 🎊

