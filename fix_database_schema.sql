-- Complete Database Schema Fix for Settings Save Issues
-- Run this in your Supabase SQL Editor to fix all schema issues

-- 1. Check current table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('custom_categories', 'category_groups', 'year_groups')
ORDER BY table_name, ordinal_position;

-- 2. Add missing columns to custom_categories table
-- Add 'groups' column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_categories' 
        AND column_name = 'groups'
    ) THEN
        ALTER TABLE custom_categories ADD COLUMN groups text[];
        RAISE NOTICE 'Added groups column to custom_categories';
    ELSE
        RAISE NOTICE 'groups column already exists in custom_categories';
    END IF;
END $$;

-- 3. Add missing columns to custom_categories table
-- Add 'yearGroups' column if it doesn't exist (correct field name)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_categories' 
        AND column_name = 'yearGroups'
    ) THEN
        ALTER TABLE custom_categories ADD COLUMN "yearGroups" jsonb;
        RAISE NOTICE 'Added yearGroups column to custom_categories';
    ELSE
        RAISE NOTICE 'yearGroups column already exists in custom_categories';
    END IF;
END $$;

-- 4. Update existing data to have proper yearGroups structure
UPDATE custom_categories 
SET "yearGroups" = '{"LKG": true, "UKG": true, "Reception": true}'::jsonb
WHERE "yearGroups" IS NULL;

-- 5. Set default values for new columns
ALTER TABLE custom_categories ALTER COLUMN groups SET DEFAULT '{}';
ALTER TABLE custom_categories ALTER COLUMN "yearGroups" SET DEFAULT '{"LKG": true, "UKG": true, "Reception": true}'::jsonb;

-- 6. Verify the updated schema
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'custom_categories'
ORDER BY ordinal_position;

-- 7. Test data insertion
INSERT INTO custom_categories (name, color, position, "group", groups, "yearGroups")
VALUES (
    'Test Category', 
    '#ff0000', 
    999, 
    'Test Group',
    ARRAY['Test Group', 'Another Group'],
    '{"LKG": true, "UKG": false, "Reception": true}'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- 8. Verify the test data
SELECT name, color, position, "group", groups, "yearGroups" 
FROM custom_categories 
WHERE name = 'Test Category';

-- 9. Clean up test data
DELETE FROM custom_categories WHERE name = 'Test Category';

-- 10. Final verification
SELECT 'Schema fix completed successfully' as status;
