-- Clear the default category groups from Supabase
-- Run this in the Supabase SQL Editor

-- 1. Check current category groups
SELECT 'Current category groups:' as info;
SELECT * FROM category_groups ORDER BY sort_order;

-- 2. Delete the default category groups
DELETE FROM category_groups 
WHERE name IN ('Core Activities', 'Kodaly Method', 'Instruments', 'Movement & Drama');

-- 3. Verify they were deleted
SELECT 'Remaining category groups:' as info;
SELECT * FROM category_groups ORDER BY sort_order;

-- 4. Show count
SELECT 'Total category groups remaining:' as info;
SELECT COUNT(*) as remaining_groups FROM category_groups;
