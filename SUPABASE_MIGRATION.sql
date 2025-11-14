-- ============================================
-- ACTIVITY PACKS & PURCHASES TABLES
-- Creative Curriculum Designer - Purchase System
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
-- VERIFICATION QUERIES (Run separately after migration)
-- ============================================

-- Verify tables were created
-- SELECT * FROM activity_packs;
-- SELECT * FROM user_purchases;

-- Test helper function
-- SELECT user_has_pack('rob.reichstorer@gmail.com', 'DRAMA_PACK');

-- View all user packs
-- SELECT * FROM get_user_packs('rob.reichstorer@gmail.com');

