-- ============================================
-- VERIFICATION QUERIES
-- Run these AFTER the migration to verify everything works
-- ============================================

-- 1. Check if activity_packs table was created
SELECT * FROM activity_packs;

-- 2. Check if user_purchases table was created
SELECT * FROM user_purchases;

-- 3. Test if Drama Pack was inserted
SELECT pack_id, name, price, is_active FROM activity_packs WHERE pack_id = 'DRAMA_PACK';

-- 4. Test helper function - Check if a user has a specific pack
SELECT user_has_pack('rob.reichstorer@gmail.com', 'DRAMA_PACK');

-- 5. Get all packs owned by a user
SELECT * FROM get_user_packs('rob.reichstorer@gmail.com');

-- 6. Check RLS policies were created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('activity_packs', 'user_purchases');

-- 7. View table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'activity_packs'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_purchases'
ORDER BY ordinal_position;

