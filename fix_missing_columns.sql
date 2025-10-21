-- CRITICAL FIX: Add missing columns to custom_categories table
-- This is likely the root cause of the save failures

-- 1. Add missing columns to custom_categories
ALTER TABLE custom_categories 
ADD COLUMN IF NOT EXISTS "group" text,
ADD COLUMN IF NOT EXISTS "groups" text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "yearGroups" jsonb DEFAULT '{}';

-- 2. Update existing data to have proper structure
UPDATE custom_categories 
SET "group" = COALESCE("group", ''),
    "groups" = COALESCE("groups", '{}'),
    "yearGroups" = COALESCE("yearGroups", '{}'::jsonb)
WHERE "group" IS NULL OR "groups" IS NULL OR "yearGroups" IS NULL;

-- 3. Verify the changes
SELECT 'Updated custom_categories structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'custom_categories' 
ORDER BY ordinal_position;

-- 4. Check current data structure
SELECT 'Current custom_categories data:' as info;
SELECT name, "group", "groups", "yearGroups" 
FROM custom_categories 
LIMIT 5;

-- 5. Test insert to verify it works
INSERT INTO custom_categories (name, color, position, "group", "groups", "yearGroups")
VALUES ('TEST_CATEGORY', '#FF0000', 999, 'Test Group', ARRAY['Test Group'], '{"LKG": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 6. Clean up test data
DELETE FROM custom_categories WHERE name = 'TEST_CATEGORY';
