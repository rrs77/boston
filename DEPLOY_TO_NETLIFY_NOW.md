# 🚀 Deploy to Netlify - Quick Guide

## ✅ Your Deployment Package is Ready!

**File:** `boston-deployment-20251021-144150.zip` (786 KB)  
**Location:** `/Users/robreich-storer/Desktop/Cursor New/cursorchanges/`

---

## 🎯 Easiest Deployment Method (2 Minutes)

### Option 1: Netlify Drop (Recommended - No Account Needed for Testing)

1. **Open this link:** https://app.netlify.com/drop

2. **Drag & Drop:**
   - Find the `dist` folder in your project:  
     `/Users/robreich-storer/Desktop/Cursor New/cursorchanges/dist`
   - Drag the entire `dist` folder to the Netlify Drop zone

3. **Get your URL immediately!**
   - Netlify will give you a URL like: `https://random-name-123.netlify.app`
   - Your site is LIVE! 🎉

4. **Optional - Customize:**
   - Click "Site settings"
   - Click "Change site name"
   - Enter: `boston-curriculum` (or any name you want)
   - Your URL becomes: `https://boston-curriculum.netlify.app`

---

## 🔧 Option 2: Connect to GitHub (Best for Long-term)

This will auto-deploy whenever you push to GitHub!

1. **Go to:** https://app.netlify.com

2. **Click:** "Add new site" → "Import an existing project"

3. **Choose:** GitHub

4. **Select:** `rrs77/boston` repository

5. **Configure Build Settings:**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

6. **Add Environment Variables (Important!):**
   - Go to: Site settings → Environment variables
   - Add these (get values from your `.env` file):
     ```
     VITE_SUPABASE_URL = your_supabase_url
     VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
     ```

7. **Click:** "Deploy site"

8. **Done!** 
   - Every `git push` will auto-deploy
   - Get preview URLs for branches
   - Easy rollbacks

---

## 🎨 Option 3: Use the Zip File

If drag & drop doesn't work:

1. **Go to:** https://app.netlify.com
2. **Click:** "Add new site" → "Deploy manually"
3. **Upload:** `boston-deployment-20251021-144150.zip`
4. **Done!**

---

## ⚙️ Important: Add Environment Variables

After deployment, you MUST add your Supabase credentials:

1. **In Netlify Dashboard:**
   - Go to: Site settings → Environment variables
   - Click: "Add a variable"

2. **Add these two variables:**

   **Variable 1:**
   ```
   Key: VITE_SUPABASE_URL
   Value: [Your Supabase URL from .env file]
   ```

   **Variable 2:**
   ```
   Key: VITE_SUPABASE_ANON_KEY
   Value: [Your Supabase anon key from .env file]
   ```

3. **Trigger a redeploy:**
   - Go to: Deploys
   - Click: "Trigger deploy" → "Deploy site"

---

## 🔍 Check Your .env File

To get your Supabase credentials:

```bash
cat .env
```

You should see:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Copy these values to Netlify!

---

## ✅ Verification Checklist

After deployment:

- [ ] Site loads successfully
- [ ] Login page appears
- [ ] Can log in with credentials
- [ ] Lessons load from Supabase
- [ ] Activities load correctly
- [ ] PDF export works
- [ ] Lesson editing works
- [ ] Stacks can be created

---

## 🎯 Your Files Ready for Deployment

1. **Pre-built package:** `boston-deployment-20251021-144150.zip` (786 KB)
2. **Dist folder:** `/Users/robreich-storer/Desktop/Cursor New/cursorchanges/dist`
3. **GitHub repo:** https://github.com/rrs77/boston

---

## 🚀 Quick Start Command

Or use this one-liner to open Netlify Drop in your browser:

```bash
open https://app.netlify.com/drop
```

Then drag your `dist` folder!

---

## 💡 Pro Tips

1. **Test first:** Use Netlify Drop to test quickly before connecting GitHub
2. **Custom domain:** After deploying, you can add your own domain in Site settings
3. **HTTPS:** Netlify automatically provides free SSL certificates
4. **Analytics:** Enable Netlify Analytics to see site traffic
5. **Forms:** Netlify Forms work automatically (no backend needed!)

---

## 📞 If You Need Help

- **Netlify Docs:** https://docs.netlify.com
- **Netlify Support:** https://www.netlify.com/support/
- **Community:** https://answers.netlify.com

---

## 🎊 Ready to Deploy!

**Choose your method:**
- 🎯 **Fastest:** Drag `dist` folder to https://app.netlify.com/drop
- 🔗 **Best long-term:** Connect GitHub at https://app.netlify.com
- 📦 **Alternative:** Upload `boston-deployment-20251021-144150.zip`

**Your site will be live in under 2 minutes!** 🚀

