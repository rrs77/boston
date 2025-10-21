-- Run these queries ONE BY ONE in Supabase SQL Editor

-- Query 1: Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('custom_categories', 'category_groups', 'year_groups');
