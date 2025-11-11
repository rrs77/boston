-- Activity Packs System
-- This creates tables for managing purchasable activity packs

-- Table for activity packs (products)
CREATE TABLE IF NOT EXISTS activity_packs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pack_id TEXT UNIQUE NOT NULL, -- e.g., 'DRAMA_PACK'
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  icon TEXT, -- emoji or icon code
  category_ids TEXT[], -- Array of category IDs that belong to this pack
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table for user purchases
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_email TEXT NOT NULL,
  pack_id TEXT NOT NULL REFERENCES activity_packs(pack_id),
  purchase_date TIMESTAMP DEFAULT NOW(),
  paypal_transaction_id TEXT,
  amount DECIMAL(10,2),
  status TEXT DEFAULT 'active', -- active, refunded, expired
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_purchases_email ON user_purchases(user_email);
CREATE INDEX IF NOT EXISTS idx_user_purchases_pack_id ON user_purchases(pack_id);
CREATE INDEX IF NOT EXISTS idx_activity_packs_pack_id ON activity_packs(pack_id);

-- Insert Drama Pack (first product)
INSERT INTO activity_packs (pack_id, name, description, price, icon, category_ids, is_active)
VALUES (
  'DRAMA_PACK',
  'Drama Games Activity Pack',
  '50+ Professional Drama Activities including warm-up games, improvisation exercises, character development, and group performances.',
  24.99,
  '🎭',
  ARRAY[]::TEXT[], -- Will be populated by admin
  true
)
ON CONFLICT (pack_id) DO NOTHING;

-- Function to check if user has purchased a pack
CREATE OR REPLACE FUNCTION user_has_pack(
  p_user_email TEXT,
  p_pack_id TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_purchases 
    WHERE user_email = p_user_email 
      AND pack_id = p_pack_id 
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get all packs owned by a user
CREATE OR REPLACE FUNCTION get_user_packs(p_user_email TEXT)
RETURNS TABLE(pack_id TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT up.pack_id
  FROM user_purchases up
  WHERE up.user_email = p_user_email
    AND up.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE activity_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

-- Everyone can view active packs
CREATE POLICY "Anyone can view active packs"
  ON activity_packs FOR SELECT
  USING (is_active = true);

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases"
  ON user_purchases FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Admins can do everything
CREATE POLICY "Admins can manage packs"
  ON activity_packs FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'email' = 'rob.reichstorer@gmail.com');

CREATE POLICY "Admins can manage purchases"
  ON user_purchases FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'email' = 'rob.reichstorer@gmail.com');

