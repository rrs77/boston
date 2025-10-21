-- COMPREHENSIVE DATABASE SCHEMA DEBUG
-- Run this in Supabase SQL Editor to check ALL potential issues

-- 1. Check if tables exist
SELECT 'Table Existence Check:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('custom_categories', 'category_groups', 'year_groups')
ORDER BY table_name;

-- 2. Check table structures
SELECT 'custom_categories table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'custom_categories' 
ORDER BY ordinal_position;

SELECT 'category_groups table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'category_groups' 
ORDER BY ordinal_position;

SELECT 'year_groups table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'year_groups' 
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT 'RLS Policies Check:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('custom_categories', 'category_groups', 'year_groups')
ORDER BY tablename, policyname;

-- 4. Check if RLS is enabled
SELECT 'RLS Status:' as info;
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename IN ('custom_categories', 'category_groups', 'year_groups');

-- 5. Check current data
SELECT 'Current custom_categories data:' as info;
SELECT * FROM custom_categories LIMIT 5;

SELECT 'Current category_groups data:' as info;
SELECT * FROM category_groups LIMIT 5;

SELECT 'Current year_groups data:' as info;
SELECT * FROM year_groups LIMIT 5;

-- 6. Test INSERT permissions
SELECT 'Testing INSERT permissions:' as info;
-- This will show if we can insert (won't actually insert due to constraints)
SELECT 'custom_categories insert test' as test, 
       CASE WHEN EXISTS (
         SELECT 1 FROM custom_categories LIMIT 1
       ) THEN 'READ OK' ELSE 'READ FAILED' END as result;

-- 7. Check for any constraints or triggers
SELECT 'Constraints and Triggers:' as info;
SELECT tc.constraint_name, tc.table_name, tc.constraint_type, 
       kcu.column_name, rc.unique_constraint_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.referential_constraints rc 
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name IN ('custom_categories', 'category_groups', 'year_groups')
ORDER BY tc.table_name, tc.constraint_type;
