# 📱 PWA Installation Integration Guide

## ✨ Overview

The PWA Install Prompt provides a beautiful, branded way for users to install your app after purchase or on first visit.

---

## 🎯 Usage Examples

### **1. Show After Purchase (Recommended)**

In your purchase success flow (e.g., after PayPal payment):

```typescript
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

function PurchaseSuccess() {
  const [showInstall, setShowInstall] = useState(true);

  return (
    <>
      {/* Your purchase success content */}
      <div className="text-center">
        <h2>🎉 Purchase Complete!</h2>
        <p>Thank you for your purchase</p>
      </div>

      {/* Show install prompt */}
      <PWAInstallPrompt 
        isOpen={showInstall} 
        onClose={() => setShowInstall(false)} 
      />
    </>
  );
}
```

### **2. Manual Install Button**

Add an "Install App" button anywhere in your UI:

```typescript
import { useState } from 'react';
import { PWAInstallPrompt, usePWAInstall } from './components/PWAInstallPrompt';
import { Download } from 'lucide-react';

function SettingsPage() {
  const [showInstall, setShowInstall] = useState(false);
  const { canInstall, isInstalled } = usePWAInstall();

  if (isInstalled) {
    return <p>✅ App is installed!</p>;
  }

  if (!canInstall) {
    return null; // Don't show if can't install
  }

  return (
    <>
      <button onClick={() => setShowInstall(true)}>
        <Download className="h-4 w-4" />
        <span>Install App</span>
      </button>

      <PWAInstallPrompt 
        isOpen={showInstall} 
        onClose={() => setShowInstall(false)} 
      />
    </>
  );
}
```

### **3. Auto-Show on First Visit**

Show the prompt automatically after 3 seconds:

```typescript
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

function App() {
  return (
    <>
      {/* Your app content */}
      
      {/* Auto-show after 3 seconds on first visit */}
      <PWAInstallPrompt autoShow={true} />
    </>
  );
}
```

### **4. Show After Specific Action**

Trigger the prompt after completing onboarding or tutorial:

```typescript
function OnboardingComplete() {
  const [showInstall, setShowInstall] = useState(false);

  const handleComplete = () => {
    // User completed onboarding
    setShowInstall(true);
  };

  return (
    <>
      <button onClick={handleComplete}>Complete Setup</button>
      
      <PWAInstallPrompt 
        isOpen={showInstall} 
        onClose={() => setShowInstall(false)} 
      />
    </>
  );
}
```

---

## 🎨 Integration in User Settings (Purchases Tab)

Update `UserSettings.tsx` to show install prompt after purchase:

```typescript
// In UserSettings.tsx, add to the Purchases tab:

import { PWAInstallPrompt, usePWAInstall } from './PWAInstallPrompt';

// Inside component:
const [showInstallPrompt, setShowInstallPrompt] = useState(false);
const { canInstall, isInstalled } = usePWAInstall();

// After successful PayPal payment:
const handlePurchaseSuccess = () => {
  // Show success message
  toast.success('Purchase complete!');
  
  // Show install prompt
  if (canInstall && !isInstalled) {
    setTimeout(() => {
      setShowInstallPrompt(true);
    }, 1000); // Wait 1 second after purchase
  }
};

// In JSX:
{activeTab === 'purchases' && (
  <>
    {/* Existing purchase UI */}
    
    {/* Install prompt after purchase */}
    <PWAInstallPrompt 
      isOpen={showInstallPrompt} 
      onClose={() => setShowInstallPrompt(false)} 
    />
  </>
)}
```

---

## 📋 Props Reference

### **PWAInstallPrompt Props**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `autoShow` | `boolean` | `false` | Automatically show prompt after 3 seconds on first visit |
| `showAfterPurchase` | `boolean` | `false` | (Reserved for future use) |
| `isOpen` | `boolean` | `undefined` | Controlled visibility state |
| `onClose` | `() => void` | `undefined` | Callback when user dismisses prompt |

### **usePWAInstall Hook**

Returns:
- `canInstall`: `boolean` - Whether the app can be installed
- `isInstalled`: `boolean` - Whether the app is already installed

---

## 🌐 Platform Support

### **✅ Full Support:**
- Chrome (Android & Desktop)
- Edge (Windows & Desktop)
- Samsung Internet (Android)
- Firefox (Android, with limitations)

### **⚠️ Manual Install (Shows iOS instructions):**
- Safari (iOS/iPadOS)
  - User must manually tap Share → Add to Home Screen

### **❌ No Support:**
- Safari (macOS Desktop)
- Firefox (Desktop)
- Older browsers

---

## 🎯 Recommended Flow

### **Best Practice: Post-Purchase Install**

1. User completes purchase on website
2. Show success message
3. Automatically trigger install prompt
4. User clicks "Install"
5. App downloads and icon appears
6. User can access app offline

```typescript
// Complete example:
function PurchaseFlow() {
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [showInstall, setShowInstall] = useState(false);

  const handlePayPalSuccess = async () => {
    // Process payment
    setPurchaseComplete(true);
    
    // Wait for success animation, then show install
    setTimeout(() => {
      setShowInstall(true);
    }, 2000);
  };

  return (
    <>
      {purchaseComplete && (
        <div className="success-animation">
          <h2>🎉 Thank you for your purchase!</h2>
          <p>Setting up your account...</p>
        </div>
      )}

      <PWAInstallPrompt 
        isOpen={showInstall} 
        onClose={() => setShowInstall(false)} 
      />
    </>
  );
}
```

---

## 💡 Tips

### **Smart Timing:**
- ✅ Show after successful purchase
- ✅ Show after completing first lesson
- ✅ Show after 3-5 page views
- ❌ Don't show immediately on landing page
- ❌ Don't show during active work

### **Dismissal Logic:**
- Prompt is automatically hidden for 7 days if dismissed
- Won't show again if already installed
- Respects user's previous choice

### **Testing:**
1. Open DevTools → Application → Manifest
2. Check if manifest is valid
3. Use "Add to home screen" link to test
4. Clear localStorage to reset dismissal state

---

## 🚀 Deployment Checklist

- [ ] `manifest.json` is in `/public` folder
- [ ] `service-worker.js` is registered in `index.html`
- [ ] Icons (192px, 512px) are in `/public` folder
- [ ] HTTPS is enabled (required for PWA)
- [ ] Service worker is registered and active
- [ ] Install prompt component is imported
- [ ] Install trigger is added to purchase flow

---

## 🔧 Troubleshooting

### "Install prompt doesn't appear"
- Check if HTTPS is enabled
- Verify service worker is registered
- Check browser DevTools console for errors
- Ensure manifest.json is valid

### "Already installed but button still shows"
- Clear browser cache and localStorage
- Check `window.matchMedia('(display-mode: standalone)')`
- Verify app is actually in standalone mode

### "iOS doesn't auto-install"
- This is expected - iOS requires manual install
- The component shows iOS-specific instructions
- Users must use Share → Add to Home Screen

---

## 📖 Additional Resources

- [PWA README](./PWA_README.md) - Complete PWA documentation
- [Design System Status](./DESIGN_SYSTEM_IMPLEMENTATION_STATUS.md) - UI updates
- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

