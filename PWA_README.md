# 📱 PWA (Progressive Web App) Version

This branch contains the **offline-capable PWA version** of Creative Curriculum Designer.

---

## ✅ WHAT'S BEEN ADDED

### 1. **PWA Manifest** (`public/manifest.json`)
- App name, colors, icons
- Installable on desktop & mobile
- Shortcuts to key features

### 2. **Service Worker** (`public/service-worker.js`)
- **Offline caching** - works without internet!
- **Smart caching strategies:**
  - Static assets (JS, CSS, images) → Cache-first
  - API calls to Supabase → Network-first (with offline fallback)
  - Pages → Network-first with cache fallback
- **Auto-updates** - users get new versions automatically

### 3. **Offline Page** (`public/offline.html`)
- Beautiful fallback when completely offline
- Shows what's cached and available
- Auto-reloads when connection restored

### 4. **Updated index.html**
- Manifest link
- Service worker registration
- Apple PWA meta tags
- Update notifications

---

## 🎯 WHAT WORKS OFFLINE

### ✅ Fully Functional Offline:
- Previously viewed lessons
- Recently accessed activities
- Lesson builder interface
- Navigation and UI
- Local data (localStorage)

### ⚠️ Requires Internet:
- Supabase database calls (new data)
- Creating new activities
- Syncing across devices
- Downloading images

### 💡 Smart Behavior:
- **When online:** Everything works normally
- **When offline:** Uses cached data, shows graceful error messages
- **When reconnected:** Auto-syncs and updates

---

## 📋 TODO: App Icons

The PWA needs proper app icons. Currently using SVG logo as placeholder.

### **Required Icons:**

1. **icon-192.png** (192x192px)
2. **icon-512.png** (512x512px)

### **How to Create:**

#### **Option 1: Use Online Tool** (Easiest)
1. Go to https://realfavicongenerator.net/
2. Upload your logo/icon
3. Download PWA icon pack
4. Place in `public/` folder

#### **Option 2: Manual Creation**
1. Open logo in design tool (Figma, Photoshop, etc.)
2. Export as PNG:
   - 192x192px → `icon-192.png`
   - 512x512px → `icon-512.png`
3. Place in `public/` folder

#### **Icon Guidelines:**
- Square format (1:1 ratio)
- Simple, recognizable design
- High contrast
- Looks good small (192px) and large (512px)
- Transparent or solid background
- Centered icon

---

## 🚀 HOW TO TEST

### **Test Installation:**

1. **Build for production:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Open in Chrome:**
   - Go to `http://localhost:4173`
   - Look for ⊕ install icon in address bar
   - Click "Install Creative Curriculum Designer"

3. **Test offline:**
   - Open DevTools (F12)
   - Go to "Network" tab
   - Check "Offline" checkbox
   - Reload page
   - Should still work!

### **Test on Mobile:**

1. **Deploy to Netlify** (main deployment works)
2. **Visit on phone** (iOS Safari or Android Chrome)
3. **Add to Home Screen:**
   - **iOS:** Share → Add to Home Screen
   - **Android:** Menu → Install app
4. **Test offline:**
   - Turn on Airplane mode
   - Open app from home screen
   - Should show cached content

---

## 🔧 SERVICE WORKER CACHING STRATEGY

### **Cache-First** (Fast!)
- JavaScript files
- CSS stylesheets
- Images
- Fonts

### **Network-First** (Fresh data!)
- HTML pages
- API calls
- Dynamic content

### **Cache Management:**
- Cache name: `ccd-v1.0.0`
- Old caches auto-deleted on update
- Critical assets pre-cached

---

## 📊 PWA FEATURES

### ✅ Implemented:
- ✅ Installable (desktop & mobile)
- ✅ Offline support
- ✅ Smart caching
- ✅ Auto-updates
- ✅ Splash screen (via manifest)
- ✅ App shortcuts
- ✅ Theme color
- ✅ Standalone mode (no browser UI)

### 🔄 Future Enhancements:
- Background sync (sync offline changes when reconnected)
- Push notifications (lesson reminders)
- Share target (share content to app)
- File handling (open .lesson files)

---

## 🐛 DEBUGGING

### **Check Service Worker Status:**

1. Open DevTools → Application tab
2. Click "Service Workers"
3. Should show: `✓ Activated and is running`

### **View Cached Content:**

1. DevTools → Application → Cache Storage
2. Expand `ccd-v1.0.0`
3. See all cached files

### **Clear Cache (for testing):**

```javascript
// Run in console:
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### **Unregister Service Worker:**

```javascript
// Run in console:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

---

## 🔀 BRANCH INFO

- **Branch:** `pwa-offline`
- **Base:** `main` branch
- **Status:** PWA functional, needs icons
- **Safe:** Main branch untouched

### **Merge to Main:**

```bash
# When ready to deploy PWA to production:
git checkout main
git merge pwa-offline
git push origin main
```

---

## 📱 INSTALLATION EXPERIENCE

### **Desktop (Chrome/Edge):**
1. Visit site
2. See install prompt in address bar
3. Click "Install"
4. App opens in standalone window
5. Icon added to Applications/Programs

### **iOS (Safari):**
1. Visit site
2. Tap Share button
3. Tap "Add to Home Screen"
4. Icon appears on home screen
5. Opens like native app

### **Android (Chrome):**
1. Visit site
2. See "Add to Home Screen" banner
3. Tap "Install"
4. Icon appears on home screen
5. Opens in standalone mode

---

## ✨ USER BENEFITS

### **Teachers Get:**
- ✅ Desktop app icon (feels professional)
- ✅ Works in areas with poor WiFi
- ✅ Faster loading (cached assets)
- ✅ No typing URLs
- ✅ Automatic updates
- ✅ Distraction-free (no browser tabs)

### **You Get:**
- ✅ Better user engagement
- ✅ Lower bounce rate
- ✅ Higher retention
- ✅ More "app-like" experience
- ✅ Works everywhere (Windows, Mac, Linux, Chrome OS)

---

## 📄 FILES ADDED/MODIFIED

### **New Files:**
- `public/manifest.json` - PWA configuration
- `public/service-worker.js` - Offline caching logic
- `public/offline.html` - Offline fallback page
- `PWA_README.md` - This file

### **Modified Files:**
- `index.html` - Added manifest link & service worker registration

### **TODO:**
- `public/icon-192.png` - Need to create
- `public/icon-512.png` - Need to create

---

## 🎯 NEXT STEPS

1. **Create app icons** (192px & 512px)
2. **Test offline functionality**
3. **Test installation on multiple devices**
4. **Merge to main when ready**
5. **Deploy to Netlify**
6. **Promote PWA to users!**

---

## 📞 SUPPORT

**Questions? Issues?**
- Check DevTools console for errors
- Test in Chrome first (best PWA support)
- Ensure HTTPS (required for service workers)
- Netlify deployment auto-enables HTTPS ✓

---

**Your app is now a PWA!** 🎉

