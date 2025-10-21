# Deployment Instructions

## ✅ Local Backup Complete

**Backup File:** `/Users/robreich-storer/Desktop/Cursor New/cursorchanges/backup-20251020-180628.tar.gz`  
**Size:** 1.1GB  
**Created:** October 20, 2024 at 6:06 PM

This backup includes:
- All source code
- All configuration files
- All SQL migrations
- All documentation
- Excludes: node_modules, .git, dist folders

---

## 🚀 Deploy to Netlify (Manual Method)

Since the Netlify CLI is having issues, here's the easiest way to deploy:

### Option 1: Netlify Drop (Drag & Drop)

1. **Go to Netlify:**  
   Visit: https://app.netlify.com/drop

2. **Drag & Drop:**  
   Simply drag the `dist` folder from:  
   `/Users/robreich-storer/Desktop/Cursor New/cursorchanges/dist`  
   into the Netlify Drop zone

3. **Done!**  
   Netlify will give you a URL like: `https://random-name-123.netlify.app`

4. **Optional - Custom Domain:**  
   - Click "Site settings" → "Change site name"
   - Enter a custom name like: `kent-curriculum-designer`
   - Your URL becomes: `https://kent-curriculum-designer.netlify.app`

---

### Option 2: Netlify Dashboard (More Control)

1. **Login to Netlify:**  
   https://app.netlify.com

2. **Click "Add new site" → "Deploy manually"**

3. **Drag & drop the dist folder**

4. **Configure (optional):**
   - Set site name: `kent-curriculum-designer`
   - Add environment variables if needed
   - Configure custom domain

---

### Option 3: GitHub Auto-Deploy (Recommended for Continuous Updates)

1. **Push to GitHub first:**
   ```bash
   cd "/Users/robreich-storer/Desktop/Cursor New/cursorchanges"
   git push origin main
   ```

2. **In Netlify:**
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub"
   - Select repository: `rrs77/cursorchanges` or `rrs77/kentversion`
   - Configure build settings:
     - **Build command:** `npm run build`
     - **Publish directory:** `dist`
   - Click "Deploy"

3. **Benefits:**
   - Auto-deploys on every git push
   - Preview deployments for branches
   - Deploy previews for pull requests

---

## 📦 What's in the Build

The `dist` folder contains:
- Optimized production build (2.1MB main bundle)
- All assets and images
- Index.html entry point
- CSS and JavaScript bundles

**Build Stats:**
```
dist/index.html                   0.59 kB
dist/assets/index-Cz0_dWua.css   92.03 kB
dist/assets/index-CrkA8jjm.js  2,118.96 kB (main bundle)
```

---

## 🔧 Environment Variables

If you need to set environment variables in Netlify:

1. Go to: Site settings → Environment variables
2. Add these if needed:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

---

## ✅ Verification Steps

After deployment:

1. **Check the URL works**
2. **Test login functionality**
3. **Verify Supabase connection**
4. **Test lesson editing**
5. **Test stack creation and assignment**
6. **Test PDF export**
7. **Test custom objectives**

---

## 🎯 Quick Deploy Commands

If you want to try the CLI again later:

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist --message="Kent Curriculum Designer"
```

---

## 📍 Current Status

✅ **Project built successfully**  
✅ **Local backup created**  
⏳ **Awaiting Netlify deployment** (use manual method above)

---

## 🔗 Quick Links

- **Local Backup:** `/Users/robreich-storer/Desktop/Cursor New/cursorchanges/backup-20251020-180628.tar.gz`
- **Build Output:** `/Users/robreich-storer/Desktop/Cursor New/cursorchanges/dist`
- **Netlify Drop:** https://app.netlify.com/drop
- **Netlify Dashboard:** https://app.netlify.com
- **GitHub Repo:** https://github.com/rrs77/kentversion

---

**Recommendation:** Use **Netlify Drop** for the quickest deployment, then switch to **GitHub Auto-Deploy** for ongoing updates.

