-- Fix Supabase half_terms table constraints
-- Run this in your Supabase SQL Editor

-- First, let's check the current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'half_terms'
ORDER BY ordinal_position;

-- Add the missing primary key constraint if it doesn't exist
DO $$
BEGIN
    -- Check if the primary key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'half_terms' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        -- Add the primary key constraint
        ALTER TABLE half_terms ADD CONSTRAINT half_terms_pkey PRIMARY KEY (id, sheet_name);
        RAISE NOTICE 'Primary key constraint added successfully';
    ELSE
        RAISE NOTICE 'Primary key constraint already exists';
    END IF;
END $$;

-- Verify the constraint was added
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'half_terms'
AND tc.constraint_type = 'PRIMARY KEY';

-- Test the upsert functionality
INSERT INTO half_terms (id, sheet_name, name, lessons, is_complete)
VALUES ('TEST', 'TEST', 'Test Half Term', ARRAY['1', '2'], false)
ON CONFLICT (id, sheet_name) 
DO UPDATE SET 
    name = EXCLUDED.name,
    lessons = EXCLUDED.lessons,
    is_complete = EXCLUDED.is_complete,
    updated_at = now();

-- Clean up test data
DELETE FROM half_terms WHERE id = 'TEST' AND sheet_name = 'TEST';

RAISE NOTICE 'Table structure fixed successfully!';
