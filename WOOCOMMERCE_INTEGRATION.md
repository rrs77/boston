# 🛒 WooCommerce Integration Guide

## Automated Customer Onboarding & Activity Pack Sales

With WooCommerce installed, you can create a **fully automated sales system** where:
- Customers purchase from your WordPress shop
- Account automatically created
- Activity packs automatically granted
- Customer can immediately log in and use content

---

## 🎯 What You Can Build

### Scenario 1: Basic Membership
**Product:** "Rhythm Stix Lesson Planner Access"
- Customer purchases subscription/one-time access
- WooCommerce creates WordPress account
- Customer can log in to your app
- Starts with empty workspace

### Scenario 2: Activity Pack Bundles
**Products:** 
- "Beginner Activity Pack" (50 activities)
- "Advanced Percussion Pack" (100 activities)
- "Complete Bundle" (all activities)

**Flow:**
1. Customer purchases activity pack
2. WooCommerce webhook fires
3. Your API copies activities to customer workspace
4. Customer logs in and sees new activities

### Scenario 3: Subscription Model
**Products:**
- "Monthly Access" - 10 new activities/month
- "Annual Access" - All activities + monthly updates
- "School License" - Unlimited teachers

**Flow:**
- Recurring payment via WooCommerce Subscriptions
- Monthly webhook grants new activity pack
- Failed payment = access suspended
- Renewed payment = access restored

---

## 🔧 Implementation Options

### Option A: Simple (No Code) - Manual Fulfillment
**Best for:** Starting out, low volume

1. Customer purchases product
2. You receive order notification
3. You manually grant activity pack via admin dashboard
4. Takes 2 minutes per order

### Option B: Semi-Automated - Webhook to Email
**Best for:** Growing business, moderate volume

1. Customer purchases
2. WooCommerce webhook sends email to you
3. Email includes customer ID and product purchased
4. You click link to auto-grant activities
5. Takes 30 seconds per order

### Option C: Fully Automated - Webhook to API
**Best for:** Scaling, high volume

1. Customer purchases
2. WooCommerce webhook hits your API
3. API automatically grants activity pack
4. Customer receives instant access
5. Zero manual work

---

## 🚀 Quick Start: Option A (Manual Fulfillment)

### Step 1: Set Up Products in WooCommerce

Create products for your offerings:

**Example Product 1: "Basic Access"**
- Type: Simple Product
- Price: $29.99/year
- Description: Access to Lesson Planner
- No activity pack included

**Example Product 2: "Welcome Activity Pack"**
- Type: Simple Product
- Price: $49.99
- Description: 50 beginner activities
- SKU: `PACK_WELCOME_50`

**Example Product 3: "Complete Bundle"**
- Type: Simple Product  
- Price: $199.99
- Description: All 500+ activities
- SKU: `PACK_COMPLETE_ALL`

### Step 2: Customer Purchase Flow

WooCommerce automatically:
1. ✅ Creates WordPress user account
2. ✅ Sends welcome email with credentials
3. ✅ Sends you order notification

### Step 3: Manual Fulfillment (For Now)

When you receive an order:

1. Note the customer's WordPress user ID
2. Note which activity pack they purchased
3. Run SQL in Supabase to grant activities:

```sql
-- Example: Copy "Welcome Pack" activities to customer
INSERT INTO activities (
  activity, description, time, category, 
  video_link, music_link, user_id
)
SELECT 
  activity, description, time, category,
  video_link, music_link, 
  '{{CUSTOMER_USER_ID}}' -- Replace with actual WordPress user ID
FROM activity_pack_templates
WHERE pack_id = 'PACK_WELCOME_50';
```

### Step 4: Notify Customer

Send customer an email:
```
Hi [Name],

Your activity pack has been added to your account!

Log in here: https://your-app.com
Email: [their email]
Password: [from WooCommerce welcome email]

Enjoy your new activities!
```

---

## 🤖 Advanced: Option C (Fully Automated)

### Architecture Overview

```
WooCommerce Order Completed
        ↓
WooCommerce Webhook
        ↓
Your API Endpoint
        ↓
Validate Order
        ↓
Copy Activities to User
        ↓
Send Confirmation Email
```

### Step 1: Create Activity Pack Templates Table

Run this SQL in Supabase:

```sql
-- Store master activity packs (your template content)
CREATE TABLE activity_pack_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_sku TEXT UNIQUE NOT NULL,  -- Matches WooCommerce SKU
  pack_name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  activities_count INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store the template activities
CREATE TABLE template_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_sku TEXT REFERENCES activity_pack_templates(pack_sku),
  activity TEXT NOT NULL,
  description TEXT,
  activity_text TEXT,
  time INTEGER,
  video_link TEXT,
  music_link TEXT,
  backing_link TEXT,
  resource_link TEXT,
  vocals_link TEXT,
  image_link TEXT,
  category TEXT,
  level TEXT,
  unit_name TEXT,
  lesson_number TEXT,
  eyfs_standards TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track what packs users have purchased
CREATE TABLE user_purchased_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  pack_sku TEXT NOT NULL,
  order_id TEXT,  -- WooCommerce order ID
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, pack_sku)
);

-- Indexes for performance
CREATE INDEX idx_template_activities_pack ON template_activities(pack_sku);
CREATE INDEX idx_user_purchased_user ON user_purchased_packs(user_id);
CREATE INDEX idx_user_purchased_order ON user_purchased_packs(order_id);

-- Enable RLS
ALTER TABLE activity_pack_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchased_packs ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can view templates (catalog), only system can insert
CREATE POLICY "Anyone can view pack templates" ON activity_pack_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view template activities" ON template_activities
  FOR SELECT USING (true);

CREATE POLICY "Users can view their purchases" ON user_purchased_packs
  FOR SELECT USING (user_id = current_setting('app.current_user_id', true)::TEXT);
```

### Step 2: Populate Template Activities

```sql
-- Example: Insert a template pack
INSERT INTO activity_pack_templates (pack_sku, pack_name, description, price, activities_count)
VALUES ('PACK_WELCOME_50', 'Welcome Activity Pack', '50 beginner activities perfect for starting out', 49.99, 50);

-- Insert template activities for this pack
INSERT INTO template_activities (
  pack_sku, activity, description, time, category, video_link, music_link
) VALUES
('PACK_WELCOME_50', 'Welcome Song', 'Start every class with this fun greeting', 5, 'Welcome', 'https://...', 'https://...'),
('PACK_WELCOME_50', 'Name Game', 'Learn everyone''s names with rhythm', 10, 'Action/Games Songs', '', ''),
-- ... add all 50 activities
('PACK_WELCOME_50', 'Goodbye Song', 'End class on a positive note', 5, 'Goodbye', 'https://...', 'https://...');
```

### Step 3: Create API Endpoint

Create `api/woocommerce-webhook.js`:

```javascript
// API endpoint to handle WooCommerce webhooks
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for admin access
);

export default async function handler(req, res) {
  // Verify webhook signature (important for security)
  const signature = req.headers['x-wc-webhook-signature'];
  const webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;
  
  // Validate signature here (implementation depends on your setup)
  // See: https://woocommerce.com/document/webhooks/
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const order = req.body;
    
    console.log('🛒 WooCommerce Order Received:', order.id);
    
    // Get customer WordPress user ID
    const customerId = order.customer_id.toString();
    
    // Process each line item
    for (const item of order.line_items) {
      const productSKU = item.sku;
      
      // Check if this is an activity pack
      const { data: pack } = await supabase
        .from('activity_pack_templates')
        .select('pack_sku, pack_name')
        .eq('pack_sku', productSKU)
        .single();
      
      if (pack) {
        console.log(`📦 Granting pack: ${pack.pack_name} to user ${customerId}`);
        
        // 1. Record the purchase
        await supabase.from('user_purchased_packs').insert({
          user_id: customerId,
          pack_sku: pack.pack_sku,
          order_id: order.id.toString()
        });
        
        // 2. Get all template activities for this pack
        const { data: templates } = await supabase
          .from('template_activities')
          .select('*')
          .eq('pack_sku', pack.pack_sku);
        
        if (templates && templates.length > 0) {
          // 3. Copy activities to user's workspace
          const userActivities = templates.map(template => ({
            activity: template.activity,
            description: template.description,
            activity_text: template.activity_text,
            time: template.time,
            video_link: template.video_link,
            music_link: template.music_link,
            backing_link: template.backing_link,
            resource_link: template.resource_link,
            link: template.link || '',
            vocals_link: template.vocals_link,
            image_link: template.image_link || '',
            teaching_unit: template.category,
            category: template.category,
            level: template.level || '',
            unit_name: template.unit_name || '',
            lesson_number: template.lesson_number || '',
            eyfs_standards: template.eyfs_standards || [],
            user_id: customerId
          }));
          
          // Insert all activities
          const { data: inserted, error: insertError } = await supabase
            .from('activities')
            .insert(userActivities);
          
          if (insertError) {
            console.error('❌ Error inserting activities:', insertError);
          } else {
            console.log(`✅ Granted ${templates.length} activities to user ${customerId}`);
          }
        }
      }
    }
    
    // Send success response to WooCommerce
    res.status(200).json({ 
      success: true, 
      message: 'Order processed successfully' 
    });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  }
}
```

### Step 4: Deploy API Endpoint

**Option 1: Netlify Functions**
1. Create `netlify/functions/woocommerce-webhook.js` with above code
2. Deploy: `netlify deploy`
3. Your endpoint: `https://your-app.netlify.app/.netlify/functions/woocommerce-webhook`

**Option 2: Vercel Functions**
1. Create `api/woocommerce-webhook.js` with above code
2. Deploy: `vercel deploy`
3. Your endpoint: `https://your-app.vercel.app/api/woocommerce-webhook`

### Step 5: Configure WooCommerce Webhook

In WordPress Admin:

1. Go to **WooCommerce → Settings → Advanced → Webhooks**
2. Click **Add Webhook**
3. Configure:
   - **Name:** Activity Pack Fulfillment
   - **Status:** Active
   - **Topic:** Order completed
   - **Delivery URL:** `https://your-app.netlify.app/.netlify/functions/woocommerce-webhook`
   - **Secret:** Generate a random string
   - **API Version:** WP REST API Integration v3
4. Save

5. Add webhook secret to your environment:
```env
WOOCOMMERCE_WEBHOOK_SECRET=your-secret-here
SUPABASE_SERVICE_KEY=your-service-key-here
```

### Step 6: Test the Flow

1. Create a test order in WooCommerce
2. Mark it as "Completed"
3. Check your API logs
4. Check Supabase - activities should be copied
5. Log in as test customer - should see activities!

---

## 💳 Recommended Product Structure

### For Maximum Revenue

**Tier 1: Free Trial** ($0)
- 14-day access
- 10 sample activities
- Convert to paid after trial

**Tier 2: Starter Pack** ($49)
- Access to lesson planner
- 50 beginner activities
- Email support

**Tier 3: Professional Pack** ($99)
- Access to lesson planner
- 200 activities across all levels
- Priority support
- Monthly updates

**Tier 4: Complete Bundle** ($199)
- Everything in Professional
- All 500+ activities
- Custom activity builder
- Video tutorials
- School license (5 teachers)

**Add-ons:**
- "Seasonal Pack - Christmas" ($19)
- "Seasonal Pack - Summer" ($19)
- "Advanced Percussion" ($29)
- "Movement & Dance" ($29)

---

## 📊 Analytics & Reporting

Track your sales and fulfillment:

```sql
-- Revenue by activity pack
SELECT 
  apt.pack_name,
  apt.price,
  COUNT(*) as total_sales,
  SUM(apt.price) as total_revenue
FROM user_purchased_packs upp
JOIN activity_pack_templates apt ON upp.pack_sku = apt.pack_sku
GROUP BY apt.pack_name, apt.price
ORDER BY total_revenue DESC;

-- Most popular packs
SELECT 
  pack_sku,
  COUNT(*) as purchase_count
FROM user_purchased_packs
GROUP BY pack_sku
ORDER BY purchase_count DESC;

-- Customer lifetime value
SELECT 
  user_id,
  COUNT(*) as packs_purchased,
  array_agg(pack_sku) as packs
FROM user_purchased_packs
GROUP BY user_id
ORDER BY packs_purchased DESC;

-- Recent purchases
SELECT 
  upp.user_id,
  upp.pack_sku,
  apt.pack_name,
  upp.purchased_at,
  upp.order_id
FROM user_purchased_packs upp
JOIN activity_pack_templates apt ON upp.pack_sku = apt.pack_sku
ORDER BY upp.purchased_at DESC
LIMIT 20;
```

---

## 🎁 Special Offers & Promotions

### Implement Coupon-Based Bonuses

```javascript
// In your webhook handler, check for coupon codes
if (order.coupon_lines && order.coupon_lines.length > 0) {
  for (const coupon of order.coupon_lines) {
    if (coupon.code === 'LAUNCH50') {
      // Grant bonus pack
      await grantActivityPack(customerId, 'PACK_BONUS_LAUNCH');
    }
  }
}
```

### Bundle Discounts

Create WooCommerce product bundles:
- Buy 2 packs, get 10% off
- Buy 3 packs, get 20% off
- Your webhook automatically processes all items

---

## 🔄 Subscription Management

### With WooCommerce Subscriptions Plugin

```javascript
// Handle subscription webhooks
// Endpoint: /api/woocommerce-subscription-webhook

export default async function handler(req, res) {
  const event = req.body;
  
  switch (event.status) {
    case 'active':
      // Grant access to monthly content
      await grantMonthlyPack(event.customer_id);
      break;
      
    case 'cancelled':
    case 'expired':
      // Revoke access (don't delete activities, just mark account)
      await revokeAccess(event.customer_id);
      break;
      
    case 'pending-cancel':
      // Send "We'll miss you" email with discount offer
      await sendRetentionEmail(event.customer_id);
      break;
  }
  
  res.status(200).json({ success: true });
}
```

---

## ✅ Implementation Checklist

### Phase 1: Manual Fulfillment (Start Here)
- [ ] Create activity pack products in WooCommerce
- [ ] Set up product SKUs
- [ ] Configure email notifications
- [ ] Create template activities in spreadsheet
- [ ] Test purchase flow
- [ ] Document fulfillment process

### Phase 2: Template System
- [ ] Run SQL to create template tables
- [ ] Import template activities to Supabase
- [ ] Create activity pack catalog
- [ ] Test manual SQL copy process

### Phase 3: API Automation
- [ ] Create API endpoint
- [ ] Deploy to Netlify/Vercel
- [ ] Configure WooCommerce webhook
- [ ] Add error logging
- [ ] Test with real order

### Phase 4: Advanced Features
- [ ] Add subscription support
- [ ] Implement coupon bonuses
- [ ] Create admin dashboard
- [ ] Add analytics
- [ ] Set up automated emails

---

## 🚀 Next Steps

**Start Simple (This Week):**
1. Create 1-2 products in WooCommerce
2. Test checkout flow
3. Manually grant activities using SQL
4. Validate customer experience

**Automate (Next Month):**
1. Create template activities table
2. Build API endpoint
3. Set up webhook
4. Test automated fulfillment

**Scale (Later):**
1. Add subscription tiers
2. Create seasonal packs
3. Build admin dashboard
4. Launch affiliate program

---

## 💡 Marketing Ideas

### Email Sequences
- Welcome email with getting started guide
- Day 3: "Here's how to create your first lesson"
- Day 7: "Need more activities? Check out these packs"
- Monthly: "New activities added to your account"

### Upsells
- After first purchase: "Complete your collection"
- Abandoned cart: 10% discount to complete purchase
- Yearly renewal: 2 months free

### Social Proof
- "Join 500+ teachers using Rhythm Stix"
- Display recent purchases on homepage
- Customer testimonials

---

## 📞 Support

Your WooCommerce integration is ready to implement! 

**Choose your starting point:**
- **Just testing?** → Start with manual fulfillment
- **Ready to scale?** → Jump to automated webhook
- **Enterprise?** → Contact for custom integration

All the code and SQL you need is in this guide! 🎉

