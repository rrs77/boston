-- Fix custom_categories table schema to match the app's expectations
-- Run this in the Supabase SQL Editor

-- 1. Check current table structure
SELECT 'Current custom_categories table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'custom_categories' 
ORDER BY ordinal_position;

-- 2. Check if the yearGroups column exists and its type
SELECT 'Checking yearGroups column:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'custom_categories' AND column_name = 'yearGroups';

-- 3. Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add yearGroups column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_categories' AND column_name = 'yearGroups'
    ) THEN
        ALTER TABLE custom_categories ADD COLUMN "yearGroups" jsonb DEFAULT '{"LKG": true, "UKG": true, "Reception": true}';
        RAISE NOTICE 'Added yearGroups column';
    ELSE
        RAISE NOTICE 'yearGroups column already exists';
    END IF;

    -- Add groups column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_categories' AND column_name = 'groups'
    ) THEN
        ALTER TABLE custom_categories ADD COLUMN groups text[] DEFAULT ARRAY[]::text[];
        RAISE NOTICE 'Added groups column';
    ELSE
        RAISE NOTICE 'groups column already exists';
    END IF;

    -- Add group column if it doesn't exist (for backward compatibility)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'custom_categories' AND column_name = 'group'
    ) THEN
        ALTER TABLE custom_categories ADD COLUMN "group" text;
        RAISE NOTICE 'Added group column';
    ELSE
        RAISE NOTICE 'group column already exists';
    END IF;
END $$;

-- 4. Update existing rows to have proper default values
UPDATE custom_categories 
SET "yearGroups" = '{"LKG": true, "UKG": true, "Reception": true}' 
WHERE "yearGroups" IS NULL;

UPDATE custom_categories 
SET groups = ARRAY[]::text[] 
WHERE groups IS NULL;

-- 5. Verify the updated structure
SELECT 'Updated custom_categories table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'custom_categories' 
ORDER BY ordinal_position;

-- 6. Check sample data
SELECT 'Sample data from custom_categories:' as info;
SELECT name, color, position, "group", groups, "yearGroups" 
FROM custom_categories 
LIMIT 5;
