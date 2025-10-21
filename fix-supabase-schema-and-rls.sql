-- Fix Supabase schema and RLS policies for lessons and half_terms tables
-- Run this in your Supabase SQL Editor

-- 1. Check and fix lessons table schema
-- First, let's see what columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lessons' 
ORDER BY ordinal_position;

-- 2. Check and fix half_terms table schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'half_terms' 
ORDER BY ordinal_position;

-- 3. Add missing columns to lessons table if they don't exist
DO $$ 
BEGIN
    -- Add academic_year column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'academic_year') THEN
        ALTER TABLE lessons ADD COLUMN academic_year text DEFAULT '2025-2026';
        RAISE NOTICE 'Added academic_year column to lessons table';
    END IF;
    
    -- Add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'data') THEN
        ALTER TABLE lessons ADD COLUMN data jsonb DEFAULT '{}';
        RAISE NOTICE 'Added data column to lessons table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'lesson_numbers') THEN
        ALTER TABLE lessons ADD COLUMN lesson_numbers text[] DEFAULT '{}';
        RAISE NOTICE 'Added lesson_numbers column to lessons table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'teaching_units') THEN
        ALTER TABLE lessons ADD COLUMN teaching_units text[] DEFAULT '{}';
        RAISE NOTICE 'Added teaching_units column to lessons table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'eyfs_statements_map') THEN
        ALTER TABLE lessons ADD COLUMN eyfs_statements_map jsonb DEFAULT '{}';
        RAISE NOTICE 'Added eyfs_statements_map column to lessons table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'notes') THEN
        ALTER TABLE lessons ADD COLUMN notes text DEFAULT '';
        RAISE NOTICE 'Added notes column to lessons table';
    END IF;
END $$;

-- 4. Add missing columns to half_terms table if they don't exist
DO $$ 
BEGIN
    -- Add academic_year column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'half_terms' AND column_name = 'academic_year') THEN
        ALTER TABLE half_terms ADD COLUMN academic_year text DEFAULT '2025-2026';
        RAISE NOTICE 'Added academic_year column to half_terms table';
    END IF;
    
    -- Add months column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'half_terms' AND column_name = 'months') THEN
        ALTER TABLE half_terms ADD COLUMN months text;
        RAISE NOTICE 'Added months column to half_terms table';
    END IF;
END $$;

-- 5. Fix RLS policies for lessons table
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage lessons" ON lessons;
DROP POLICY IF EXISTS "Allow anonymous access to lessons" ON lessons;

-- Create new policy for anonymous access
CREATE POLICY "Allow anonymous access to lessons"
  ON lessons
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 6. Fix RLS policies for half_terms table
ALTER TABLE half_terms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage half-terms" ON half_terms;
DROP POLICY IF EXISTS "Allow anonymous access to half_terms" ON half_terms;

-- Create new policy for anonymous access
CREATE POLICY "Allow anonymous access to half_terms"
  ON half_terms
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 7. Create unique constraints if they don't exist
DO $$
BEGIN
    -- Add unique constraint for lessons table
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lessons_sheet_academic_year_key') THEN
        ALTER TABLE lessons ADD CONSTRAINT lessons_sheet_academic_year_key UNIQUE (sheet_name, academic_year);
        RAISE NOTICE 'Added unique constraint for lessons table';
    END IF;
    
    -- Add unique constraint for half_terms table
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'half_terms_id_sheet_academic_year_key') THEN
        ALTER TABLE half_terms ADD CONSTRAINT half_terms_id_sheet_academic_year_key UNIQUE (id, sheet_name, academic_year);
        RAISE NOTICE 'Added unique constraint for half_terms table';
    END IF;
END $$;

-- 8. Verify the fixes
SELECT 'lessons table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'lessons' 
ORDER BY ordinal_position;

SELECT 'half_terms table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'half_terms' 
ORDER BY ordinal_position;

SELECT 'RLS policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('lessons', 'half_terms');

SELECT 'Schema fixes completed successfully!' as status;
