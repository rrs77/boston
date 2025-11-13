# 🗄️ Supabase Migration Instructions

## Creating Activity Packs & Purchases Tables

This migration will create the database structure needed for the purchase system.

### ⚠️ IMPORTANT: Run this ONCE in your Supabase SQL Editor

---

## 📋 Step-by-Step Instructions

### 1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: "Creative Curriculum Designer"

### 2. **Open SQL Editor**
   - Click on **"SQL Editor"** in the left sidebar
   - Click **"New query"** button

### 3. **Copy & Paste This SQL**

```sql
-- ============================================
-- ACTIVITY PACKS & PURCHASES TABLES
-- Run this migration ONCE in Supabase SQL Editor
-- ============================================

-- Create activity_packs table
CREATE TABLE IF NOT EXISTS activity_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id TEXT UNIQUE NOT NULL, -- e.g., 'DRAMA_PACK', 'MUSIC_PACK'
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  icon TEXT, -- e.g., '🎭', '🎵'
  category_ids TEXT[], -- Array of category IDs linked to this pack
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_purchases table
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL, -- User's email from Auth
  pack_id TEXT REFERENCES activity_packs(pack_id) ON DELETE CASCADE,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paypal_transaction_id TEXT UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'active' -- 'active', 'refunded', 'cancelled'
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable Row Level Security
ALTER TABLE activity_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Admins can manage activity packs" ON activity_packs;
DROP POLICY IF EXISTS "Authenticated users can view active packs" ON activity_packs;
DROP POLICY IF EXISTS "Admins can manage user purchases" ON user_purchases;
DROP POLICY IF EXISTS "Users can view their own purchases" ON user_purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON user_purchases;

-- RLS Policies for activity_packs
-- Admins can do anything
CREATE POLICY "Admins can manage activity packs" ON activity_packs
  FOR ALL 
  USING (
    auth.email() = 'rob.reichstorer@gmail.com' OR 
    auth.jwt() ->> 'role' = 'admin'
  ) 
  WITH CHECK (
    auth.email() = 'rob.reichstorer@gmail.com' OR 
    auth.jwt() ->> 'role' = 'admin'
  );

-- Authenticated users can view active packs
CREATE POLICY "Authenticated users can view active packs" ON activity_packs
  FOR SELECT 
  USING (
    auth.role() = 'authenticated' AND 
    is_active = TRUE
  );

-- RLS Policies for user_purchases
-- Admins can do anything
CREATE POLICY "Admins can manage user purchases" ON user_purchases
  FOR ALL 
  USING (
    auth.email() = 'rob.reichstorer@gmail.com' OR 
    auth.jwt() ->> 'role' = 'admin'
  ) 
  WITH CHECK (
    auth.email() = 'rob.reichstorer@gmail.com' OR 
    auth.jwt() ->> 'role' = 'admin'
  );

-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases" ON user_purchases
  FOR SELECT 
  USING (auth.email() = user_email);

-- Users can insert their own purchases (e.g., via webhook)
CREATE POLICY "Users can insert their own purchases" ON user_purchases
  FOR INSERT 
  WITH CHECK (auth.email() = user_email);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS user_has_pack(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_user_packs(TEXT);

-- Helper function to check if a user has purchased a specific pack
CREATE OR REPLACE FUNCTION user_has_pack(p_user_email TEXT, p_pack_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_purchases
    WHERE user_email = p_user_email
      AND pack_id = p_pack_id
      AND status = 'active'
  );
END;
$$;

-- Helper function to get all pack_ids a user owns
CREATE OR REPLACE FUNCTION get_user_packs(p_user_email TEXT)
RETURNS SETOF TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT pack_id
  FROM user_purchases
  WHERE user_email = p_user_email
    AND status = 'active';
END;
$$;

-- ============================================
-- SEED DATA (Optional - Drama Pack Example)
-- ============================================

-- Insert Drama Games Pack as the first available pack
INSERT INTO activity_packs (pack_id, name, description, price, icon, category_ids, is_active)
VALUES (
  'DRAMA_PACK',
  'Drama Games Activity Pack',
  '50+ drama activities including warm-ups, games, and performance exercises for KS1 and KS2',
  24.99,
  '🎭',
  ARRAY[]::TEXT[], -- Empty for now, you'll assign categories via admin panel
  TRUE
)
ON CONFLICT (pack_id) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these after migration to verify:
-- SELECT * FROM activity_packs;
-- SELECT * FROM user_purchases;
-- SELECT user_has_pack('rob.reichstorer@gmail.com', 'DRAMA_PACK');
```

### 4. **Run the Migration**
   - Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
   - You should see: **"Success. No rows returned"**

### 5. **Verify Tables Were Created**
   - Go to **"Table Editor"** in the left sidebar
   - You should see two new tables:
     - `activity_packs`
     - `user_purchases`

### 6. **Check Seed Data**
   - Click on `activity_packs` table
   - You should see 1 row: **"Drama Games Activity Pack"** with price £24.99

---

## ✅ What This Migration Does

### Creates Two Tables:

**`activity_packs`**
- Stores all available packs (Drama, Music, PE, etc.)
- Includes: name, price, description, icon, linked categories
- Admin-managed

**`user_purchases`**
- Records who bought what
- Includes: user email, pack ID, transaction ID, purchase date
- Links users to their owned packs

### Security (RLS):
- ✅ Only admins can create/edit/delete packs
- ✅ Only admins can see all purchases
- ✅ Users can only see their own purchases
- ✅ All data is protected by Row Level Security

### Helper Functions:
- `user_has_pack(email, pack_id)` - Check if user owns a pack
- `get_user_packs(email)` - Get all packs a user owns

---

## 🔍 Troubleshooting

### Error: "relation already exists"
**Solution:** Tables already created! You're good to go. Just verify they exist in Table Editor.

### Error: "permission denied"
**Solution:** Make sure you're logged in as the project owner with admin access.

### Error: "function already exists"
**Solution:** The migration will drop and recreate functions automatically. This is safe.

---

## 📊 After Migration

You'll be able to:
1. ✅ Create/edit packs in Settings → Manage Packs
2. ✅ Record purchases manually
3. ✅ Filter activities by pack ownership
4. ✅ Track all purchases in the database

---

## 🚀 Next Steps

Once migration is complete:
1. Go to Settings → Manage Packs (admin only)
2. Edit the Drama Pack to link categories
3. Test recording a purchase
4. Verify activity filtering works

---

**Questions?** Check Supabase logs in: Dashboard → Database → Logs

