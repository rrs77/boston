# WooCommerce Integration Setup Guide

## Overview
The Creative Curriculum Designer now has a **Purchases** section in Settings where users can buy additional activity card sets (starting with Drama Games). This guide explains how to complete the integration with your rhythmstiix.co.uk WooCommerce site.

## What's Been Implemented

✅ Purchases UI in Settings → Purchases tab
✅ Drama Games Activity Pack card with description
✅ User email display (linked to rhythmstiix.co.uk accounts)
✅ Purchase buttons for WooCommerce and PayPal
✅ Coming soon placeholders for Music and PE packs

## What You Need to Configure on rhythmstiix.co.uk

### 1. Create WooCommerce Product

1. Log into your WordPress admin at `https://rhythmstiix.co.uk/wp-admin`
2. Go to **Products → Add New**
3. Create a product with these details:
   - **Product Name**: Drama Games Activity Pack
   - **Regular Price**: £39.99
   - **Sale Price**: £24.99
   - **Product SKU**: `DRAMA_PACK`
   - **Description**: Use the description from the app UI
   - **Product Type**: Simple Product or Digital Download

4. **Important**: Note the Product ID after saving

### 2. Update Purchase Links

Once you have the Product ID, update the links in `src/components/UserSettings.tsx`:

**Current placeholder** (line ~1427):
```javascript
href="https://rhythmstiix.co.uk/product/drama-games-activity-pack/?add-to-cart=DRAMA_PACK"
```

**Should be** (replace `YOUR_PRODUCT_ID` with actual ID):
```javascript
href="https://rhythmstiix.co.uk/checkout/?add-to-cart=YOUR_PRODUCT_ID"
```

### 3. Set Up PayPal Integration

#### Option A: WooCommerce PayPal Checkout
1. In WordPress, go to **WooCommerce → Settings → Payments**
2. Enable **PayPal Checkout**
3. Configure your PayPal Business account
4. The PayPal button in the app can link directly to the product page

#### Option B: PayPal Buy Now Button
1. Create a PayPal Buy Now button at paypal.com
2. Get the button link
3. Update the PayPal link in `UserSettings.tsx` (line ~1435)

### 4. Set Up Purchase Verification (IMPORTANT)

To unlock the activities after purchase, you need to set up a webhook:

#### Step 1: Create a Webhook Endpoint

Create a new API endpoint in your app that listens for purchase confirmations:

```typescript
// Example: src/api/webhook/woocommerce.ts
export async function POST(request: Request) {
  const payload = await request.json();
  
  // Verify WooCommerce signature
  // Extract user email and product SKU
  // Update Supabase with purchased content
  
  if (payload.status === 'completed' && payload.line_items) {
    const userEmail = payload.billing.email;
    const productSku = payload.line_items[0].sku;
    
    if (productSku === 'DRAMA_PACK') {
      // Grant access to drama activities
      await unlockDramaPackForUser(userEmail);
    }
  }
  
  return new Response('OK', { status: 200 });
}
```

#### Step 2: Configure WooCommerce Webhook

1. In WordPress, go to **WooCommerce → Settings → Advanced → Webhooks**
2. Click **Add Webhook**
3. Configure:
   - **Name**: Creative Curriculum Purchase Notification
   - **Status**: Active
   - **Topic**: Order completed
   - **Delivery URL**: `https://your-app-url.com/api/webhook/woocommerce`
   - **Secret**: Generate a strong secret key
   - **API Version**: WP REST API Integration v3

### 5. Create Supabase Schema for Purchases

Add a `user_purchases` table in Supabase:

```sql
CREATE TABLE user_purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_email TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  purchase_date TIMESTAMP DEFAULT NOW(),
  order_id TEXT,
  amount DECIMAL(10,2),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_user_purchases_email ON user_purchases(user_email);
CREATE INDEX idx_user_purchases_sku ON user_purchases(product_sku);
```

### 6. Implement Activity Unlocking

Create functions to check and unlock purchased content:

```typescript
// src/utils/purchases.ts
export async function checkUserPurchases(userEmail: string) {
  const { data, error } = await supabase
    .from('user_purchases')
    .select('product_sku')
    .eq('user_email', userEmail)
    .eq('status', 'active');
  
  if (error) throw error;
  return data.map(p => p.product_sku);
}

export async function unlockDramaPackForUser(userEmail: string) {
  // 1. Add purchase record
  await supabase
    .from('user_purchases')
    .insert({
      user_email: userEmail,
      product_sku: 'DRAMA_PACK'
    });
  
  // 2. Import drama activities to user's library
  // Load drama activities from a template/seed file
  // Add them to the user's activities table
}
```

### 7. Filter Activity Library by Purchases

Modify the Activity Library to only show purchased content:

```typescript
// In DataContext or ActivityLibrary component
const userPurchases = await checkUserPurchases(user.email);
const availableActivities = allActivities.filter(activity => {
  // If activity requires DRAMA_PACK, check if user has purchased it
  if (activity.requiredPack === 'DRAMA_PACK') {
    return userPurchases.includes('DRAMA_PACK');
  }
  return true; // Default activities are always available
});
```

## Testing the Integration

1. **Test Purchase Flow**:
   - Click "Purchase Now" button
   - Complete checkout on rhythmstiix.co.uk
   - Verify webhook is received
   - Check Supabase `user_purchases` table
   - Verify activities appear in Activity Library

2. **Test PayPal Flow**:
   - Click PayPal button
   - Complete payment
   - Verify purchase is registered

## Security Considerations

1. ✅ **Verify Webhook Signatures**: Always validate that webhooks are actually from WooCommerce
2. ✅ **Use HTTPS**: Ensure all transactions are over HTTPS
3. ✅ **Validate User Emails**: Match purchase emails with registered user emails
4. ✅ **Prevent Duplicate Purchases**: Check if user already owns the pack before processing
5. ✅ **Log All Transactions**: Keep audit logs of all purchase events

## Support Email

The app directs users to: `support@rhythmstiix.co.uk`

Make sure this email is monitored for purchase support requests.

## Future Enhancements

- [ ] Add "My Purchases" section showing owned packs
- [ ] Implement automatic activity unlocking (currently manual within 24h)
- [ ] Add purchase history/receipts
- [ ] Bundle discounts for multiple packs
- [ ] Subscription model for unlimited packs
- [ ] Gift cards/vouchers

## Questions?

If you need help with any part of this integration, the key files to review are:
- `src/components/UserSettings.tsx` (line 1371-1494) - Purchases UI
- You'll need to create the webhook endpoint
- You'll need to create the purchase verification system in Supabase

Let me know if you need help with any specific part of the implementation!

