-- Export Supabase Schema for Debugging
-- Run these queries in your Supabase SQL Editor

-- 1. Check table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('custom_categories', 'category_groups', 'year_groups')
ORDER BY table_name, ordinal_position;

-- 2. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('custom_categories', 'category_groups', 'year_groups');

-- 3. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('custom_categories', 'category_groups', 'year_groups');

-- 4. Check real-time publications
SELECT 
    pubname,
    puballtables,
    pubinsert,
    pubupdate,
    pubdelete
FROM pg_publication 
WHERE pubname = 'supabase_realtime';

-- 5. Check if tables are in real-time publication
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('custom_categories', 'category_groups', 'year_groups');

-- 6. Check current data in tables
SELECT 'custom_categories' as table_name, count(*) as row_count FROM custom_categories
UNION ALL
SELECT 'category_groups' as table_name, count(*) as row_count FROM category_groups
UNION ALL
SELECT 'year_groups' as table_name, count(*) as row_count FROM year_groups;

-- 7. Sample data from each table
SELECT 'custom_categories sample:' as info;
SELECT * FROM custom_categories LIMIT 5;

SELECT 'category_groups sample:' as info;
SELECT * FROM category_groups LIMIT 5;

SELECT 'year_groups sample:' as info;
SELECT * FROM year_groups LIMIT 5;
