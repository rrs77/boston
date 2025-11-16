# 🛒 WooCommerce Integration Guide

## Overview

Your app already has activity pack management built-in! This guide explains how to integrate it with WordPress + WooCommerce for a professional e-commerce solution.

---

## ✅ Current System (Already Built)

### **Admin Features:**
- **Manage Packs** tab in User Settings (Admin only)
- Create new activity packs
- Set prices, descriptions, icons
- Link categories to packs
- Track purchases
- Manually grant purchases to users

### **User Features:**
- View available packs in "Purchases" tab
- See purchased packs
- Access activities based on owned packs

---

## 🎯 Recommended Architecture: WordPress + WooCommerce

### **Why WooCommerce?**

✅ **Professional payment processing** (Stripe, PayPal, Apple Pay, Google Pay)
✅ **Automatic user account creation**
✅ **Tax calculations** for different countries
✅ **Subscription support** (recurring revenue)
✅ **Email marketing** integration
✅ **Order management** and refunds
✅ **Security and PCI compliance** handled by WooCommerce
✅ **SEO-friendly** product pages

---

## 📐 System Architecture

```
┌─────────────────────────────────────────┐
│  WordPress/WooCommerce                  │
│  (rhythmstix.co.uk)                     │
│                                         │
│  ✓ User Login/Registration              │
│  ✓ Payment Processing                   │
│  ✓ Product Catalog                      │
│  ✓ Order Management                     │
└────────────┬────────────────────────────┘
             │
             │ After Purchase
             │ (Webhook/REST API)
             ↓
┌─────────────────────────────────────────┐
│  Supabase Database                      │
│                                         │
│  Tables:                                │
│  - user_purchases                       │
│  - activity_packs                       │
│  - activities                           │
└────────────┬────────────────────────────┘
             │
             │ Check Ownership
             ↓
┌─────────────────────────────────────────┐
│  React App (boston)                     │
│  (creativecd.netlify.app)               │
│                                         │
│  ✓ Activity Library                     │
│  ✓ Lesson Builder                       │
│  ✓ Shows only purchased activities      │
└─────────────────────────────────────────┘
```

---

## 🚀 Implementation Steps

### **Phase 1: WordPress/WooCommerce Setup**

#### **1.1 Install WooCommerce** (if not already)
```bash
WordPress Dashboard → Plugins → Add New → Search "WooCommerce"
```

#### **1.2 Create Products for Each Pack**

In WordPress Admin:
1. Go to **Products → Add New**
2. Create a product for each activity pack:

**Example: Drama Games Pack**
- **Product Name:** Drama Games Activity Pack
- **Price:** £24.99
- **Short Description:** 
  > Unlock 50+ drama games and activities for your Creative Curriculum
- **Description:** Full details about what's included
- **Product Image:** Upload pack icon/image
- **SKU:** `drama-games-pack` (matches your app's `pack_id`)
- **Categories:** Educational Resources
- **Tags:** Drama, Games, EYFS, KS1

Repeat for all packs:
- Music Activities Pack (`music-pack`)
- Dance Activities Pack (`dance-pack`)
- Movement Activities Pack (`movement-pack`)
- Etc.

#### **1.3 Configure Payment Gateways**

Go to **WooCommerce → Settings → Payments**:
- ✅ Enable Stripe (credit/debit cards, Apple Pay, Google Pay)
- ✅ Enable PayPal
- ✅ Configure test mode first, then live mode

---

### **Phase 2: Authentication Integration**

#### **Option A: WordPress REST API (Recommended)**

**Install JWT Authentication Plugin:**
```bash
WordPress → Plugins → Add New
Search: "JWT Authentication for WP REST API"
Install and Activate
```

**Configure in wp-config.php:**
```php
define('JWT_AUTH_SECRET_KEY', 'your-secure-secret-key-here');
define('JWT_AUTH_CORS_ENABLE', true);
```

**Login Flow in React App:**
```typescript
// src/services/wordpressAuth.ts
export const loginWithWordPress = async (username: string, password: string) => {
  const response = await fetch('https://rhythmstix.co.uk/wp-json/jwt-auth/v1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  
  if (data.token) {
    // Store token
    localStorage.setItem('wp_token', data.token);
    localStorage.setItem('user_email', data.user_email);
    localStorage.setItem('user_name', data.user_display_name);
    
    // Sync purchases from WooCommerce to Supabase
    await syncPurchasesFromWordPress(data.user_email);
    
    return data;
  }
  
  throw new Error(data.message || 'Login failed');
};
```

#### **Option B: Supabase Auth with WordPress Sync**

Keep Supabase Auth, but sync purchases from WordPress:

```typescript
// After user logs into Supabase
// Check WooCommerce for purchases by email
const syncPurchases = async (userEmail: string) => {
  const response = await fetch(
    `https://rhythmstix.net/wp-json/wc/v3/orders?customer=${userEmail}`,
    {
      headers: {
        'Authorization': 'Basic ' + btoa('consumer_key:consumer_secret')
      }
    }
  );
  
  const orders = await response.json();
  
  // For each completed order, add to Supabase
  for (const order of orders) {
    if (order.status === 'completed') {
      // Extract pack_id from SKU
      for (const item of order.line_items) {
        await activityPacksApi.grantPurchase({
          user_email: userEmail,
          pack_id: item.sku,
          woocommerce_order_id: order.id,
          amount: order.total
        });
      }
    }
  }
};
```

---

### **Phase 3: WooCommerce Webhooks**

#### **3.1 Create Webhook in WooCommerce**

Go to **WooCommerce → Settings → Advanced → Webhooks → Add Webhook**:

- **Name:** Supabase Purchase Sync
- **Status:** Active
- **Topic:** Order completed
- **Delivery URL:** `https://your-server.com/api/woocommerce-webhook`
- **Secret:** Generate a secure secret
- **API Version:** WP REST API Integration v3

#### **3.2 Create Webhook Handler**

You'll need a simple server endpoint (Node.js, Cloudflare Worker, or Supabase Edge Function):

```typescript
// Supabase Edge Function: woocommerce-webhook
export async function handler(req: Request) {
  const signature = req.headers.get('x-wc-webhook-signature');
  const body = await req.json();
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WC_WEBHOOK_SECRET!)
    .update(JSON.stringify(body))
    .digest('base64');
  
  if (signature !== expectedSignature) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  // Process order
  if (body.status === 'completed') {
    const userEmail = body.billing.email;
    
    for (const item of body.line_items) {
      // Grant access to pack
      await supabase.from('user_purchases').insert({
        user_email: userEmail,
        pack_id: item.sku,
        woocommerce_order_id: body.id,
        purchase_date: new Date().toISOString(),
        amount: body.total,
        currency: body.currency
      });
    }
  }
  
  return new Response('OK', { status: 200 });
}
```

---

### **Phase 4: App Changes**

#### **4.1 Update Login Screen**

```typescript
// src/components/Login.tsx
const handleLogin = async () => {
  setLoading(true);
  try {
    // Login with WordPress
    const wpUser = await loginWithWordPress(email, password);
    
    // Also authenticate with Supabase
    // (or keep WordPress as single source of truth)
    
    // Load user's purchases
    const purchases = await activityPacksApi.getUserPurchases(email);
    
    // Redirect to dashboard
    navigate('/dashboard');
  } catch (error) {
    toast.error('Login failed: ' + error.message);
  }
  setLoading(false);
};
```

#### **4.2 Update Purchase Flow**

Change "Purchases" tab to show:

```typescript
// Instead of manual PayPal button
<a 
  href="https://rhythmstix.net/shop/drama-games-pack"
  className="..."
>
  Purchase on Our Store →
</a>

// Or embed WooCommerce directly
<iframe 
  src="https://rhythmstix.net/product/drama-games-pack?embedded=true"
  className="w-full h-96"
/>
```

---

### **Phase 5: Admin Workflow**

#### **How to Create New Pack:**

1. **In Your App (Admin → Manage Packs):**
   - Click "Create Pack"
   - Fill in details:
     - Pack ID: `new-pack-id`
     - Name: "New Activity Pack"
     - Price: £24.99
     - Icon: 🎨
     - Link categories
   - Click "Save"

2. **In WordPress WooCommerce:**
   - Products → Add New
   - Set **SKU** to match your `pack_id` (e.g., `new-pack-id`)
   - Add price, images, description
   - Publish product

3. **Link is Automatic:**
   - When user purchases product with SKU `new-pack-id`
   - Webhook grants access to pack `new-pack-id` in Supabase
   - User sees activities in app

---

## 💰 Pricing & Revenue

### **Payment Processing Fees:**

**WooCommerce (Free) + Stripe:**
- 1.4% + 20p per transaction (UK)
- 2.9% + 30¢ per transaction (US)

**WooCommerce (Free) + PayPal:**
- 2.9% + 30p per transaction (UK)
- 3.49% + 49p per transaction (international)

**No monthly fees** - only pay per transaction!

### **Revenue Comparison:**

**Current PayPal Button:**
- Manual order fulfillment
- No automatic account creation
- Higher error rate
- No upsells/cross-sells

**WooCommerce:**
- Automatic order fulfillment
- Professional checkout
- Automatic email sequences
- Upsell related packs
- Subscription options

---

## 🔐 Security Considerations

1. **Use HTTPS** for all endpoints
2. **Verify webhook signatures** to prevent fraud
3. **Store WordPress secrets** in environment variables
4. **Rate limit** webhook endpoints
5. **Log all transactions** for audit trail
6. **PCI compliance** handled by Stripe/PayPal (not you!)

---

## 🧪 Testing Plan

### **1. Test Mode Setup:**
- Enable Stripe/PayPal test mode
- Create test products
- Make test purchases

### **2. Test Scenarios:**
- ✅ New user purchase → account created
- ✅ Existing user purchase → pack granted
- ✅ Webhook failure → retry mechanism
- ✅ Refund → revoke access
- ✅ Multiple packs purchase

### **3. Go Live Checklist:**
- [ ] Switch payment gateways to live mode
- [ ] Test with real payment (small amount)
- [ ] Verify webhook is working
- [ ] Set up monitoring/alerts
- [ ] Create refund policy page
- [ ] Add customer support email

---

## 📊 Analytics & Tracking

### **WooCommerce Analytics:**
- Revenue reports
- Best-selling packs
- Customer lifetime value
- Conversion rates

### **Google Analytics:**
```javascript
// Track purchase completion
gtag('event', 'purchase', {
  transaction_id: order.id,
  value: order.total,
  currency: 'GBP',
  items: [{
    item_id: pack.pack_id,
    item_name: pack.name,
    price: pack.price
  }]
});
```

---

## 🚀 Next Steps

### **Immediate (Week 1):**
1. ✅ Set up WooCommerce on rhythmstix.net
2. ✅ Create products for existing packs
3. ✅ Install JWT Auth plugin
4. ✅ Test authentication flow

### **Short-term (Week 2-3):**
1. ✅ Implement webhook handler
2. ✅ Update app login to use WordPress
3. ✅ Test purchase flow end-to-end
4. ✅ Launch in test mode

### **Long-term (Month 2+):**
1. ✅ Email marketing automation
2. ✅ Subscription packs (monthly/yearly)
3. ✅ Bundle discounts
4. ✅ Affiliate program
5. ✅ Free trial system

---

## 💡 Pro Tips

### **1. Start Simple:**
- Begin with manual sync (admin grants purchases)
- Add automation later
- Don't over-engineer initially

### **2. Customer Experience:**
- Clear product descriptions
- Screenshots of activities
- Video demos
- Money-back guarantee

### **3. Marketing:**
- Offer first pack at discount
- Bundle pricing (3 packs for £60)
- Seasonal promotions
- Teacher testimonials

### **4. Support:**
- FAQ page in WordPress
- Live chat widget
- Quick response to issues
- Refund policy clearly stated

---

## ❓ FAQ

**Q: Do I need to rebuild my app?**
**A:** No! Just add WordPress authentication and purchase checking. Core app stays the same.

**Q: Can users still use Supabase auth?**
**A:** Yes! You can support both. Check WordPress for purchases, but allow Supabase login.

**Q: What if webhook fails?**
**A:** Add a "Sync Purchases" button in app, or admin can manually grant access.

**Q: Subscription vs. one-time purchase?**
**A:** Start with one-time. Add subscriptions later using WooCommerce Subscriptions extension.

**Q: Refund handling?**
**A:** WooCommerce refund → Webhook → Revoke pack access in Supabase.

---

## 📞 Need Help?

**Resources:**
- WooCommerce Docs: https://docs.woocommerce.com/
- REST API Docs: https://woocommerce.github.io/woocommerce-rest-api-docs/
- JWT Auth: https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/

**My Recommendation:**
1. Set up WooCommerce products this week
2. I'll help build the webhook handler
3. Test with one pack first
4. Roll out to all packs after testing

---

## ✅ Summary

**Best Approach:**
- ✅ Use WooCommerce for ALL purchases
- ✅ WordPress handles user accounts
- ✅ Supabase stores purchases and app data
- ✅ Your app checks Supabase for pack ownership
- ✅ Automatic sync via webhooks

**This gives you:**
- 🎯 Professional e-commerce
- 💳 Multiple payment methods
- 📧 Automatic email marketing
- 📊 Sales analytics
- 🔄 Automatic fulfillment
- 💰 Lower fees than marketplace
- 🚀 Scalable solution

**Ready to implement? I can help with any step!**

