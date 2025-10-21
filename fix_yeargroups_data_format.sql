-- Fix yearGroups data format in activities table
-- Run this in the Supabase SQL Editor

-- 1. Check current yearGroups data format in activities table
SELECT 'Current yearGroups data in activities:' as info;
SELECT id, activity, yearGroups, 
       CASE 
         WHEN jsonb_typeof(yearGroups) = 'array' THEN 'Array'
         WHEN jsonb_typeof(yearGroups) = 'object' THEN 'Object'
         WHEN jsonb_typeof(yearGroups) = 'string' THEN 'String'
         ELSE 'Other'
       END as data_type
FROM activities 
LIMIT 10;

-- 2. Update activities where yearGroups is an object instead of array
UPDATE activities 
SET yearGroups = (
  SELECT jsonb_agg(key) 
  FROM jsonb_each(yearGroups) 
  WHERE value = 'true'::jsonb
)
WHERE jsonb_typeof(yearGroups) = 'object' 
  AND yearGroups IS NOT NULL
  AND yearGroups != '{}'::jsonb;

-- 3. Set yearGroups to empty array where it's null or empty
UPDATE activities 
SET yearGroups = '[]'::jsonb
WHERE yearGroups IS NULL OR yearGroups = '{}'::jsonb OR yearGroups = 'null'::jsonb;

-- 4. Verify the fixes
SELECT 'Updated yearGroups data in activities:' as info;
SELECT id, activity, yearGroups, 
       CASE 
         WHEN jsonb_typeof(yearGroups) = 'array' THEN 'Array'
         WHEN jsonb_typeof(yearGroups) = 'object' THEN 'Object'
         WHEN jsonb_typeof(yearGroups) = 'string' THEN 'String'
         ELSE 'Other'
       END as data_type
FROM activities 
LIMIT 10;

-- 5. Show count of activities with proper array format
SELECT 'Activities with proper yearGroups format:' as info;
SELECT COUNT(*) as count
FROM activities 
WHERE jsonb_typeof(yearGroups) = 'array';
