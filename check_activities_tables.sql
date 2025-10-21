-- Check both activities tables in Supabase
-- Run these queries in the Supabase SQL Editor

-- 1. Check the 'activities' table (what the app currently uses)
SELECT 
    'activities' as table_name,
    COUNT(*) as row_count,
    MIN(created_at) as earliest_activity,
    MAX(created_at) as latest_activity
FROM activities;

-- 2. Check the 'activities_rows' table (where bubble songs were imported)
SELECT 
    'activities_rows' as table_name,
    COUNT(*) as row_count,
    MIN(created_at) as earliest_activity,
    MAX(created_at) as latest_activity
FROM activities_rows;

-- 3. Sample data from activities table
SELECT 'Sample from activities table:' as info;
SELECT id, activity, category, level 
FROM activities 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Sample data from activities_rows table
SELECT 'Sample from activities_rows table:' as info;
SELECT id, activity, category, level 
FROM activities_rows 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Check if activities_rows has the bubble songs
SELECT 'Bubble songs in activities_rows:' as info;
SELECT id, activity, category, level 
FROM activities_rows 
WHERE category = 'Bubble Songs' 
ORDER BY id;
