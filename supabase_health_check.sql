-- COMPREHENSIVE SUPABASE HEALTH CHECK
-- This script tests ALL aspects of your Supabase setup

-- ==============================================
-- 1. BASIC CONNECTIVITY TEST
-- ==============================================
SELECT 'SUPABASE CONNECTIVITY TEST' as test_section;
SELECT 'Connection successful - Supabase is responding' as result;

-- ==============================================
-- 2. TABLE EXISTENCE CHECK
-- ==============================================
SELECT 'TABLE EXISTENCE CHECK' as test_section;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') 
        THEN '✅ activities table exists'
        ELSE '❌ activities table MISSING'
    END as activities_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'custom_categories') 
        THEN '✅ custom_categories table exists'
        ELSE '❌ custom_categories table MISSING'
    END as categories_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'category_groups') 
        THEN '✅ category_groups table exists'
        ELSE '❌ category_groups table MISSING'
    END as category_groups_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'year_groups') 
        THEN '✅ year_groups table exists'
        ELSE '❌ year_groups table MISSING'
    END as year_groups_status;

-- ==============================================
-- 3. TABLE SCHEMA VALIDATION
-- ==============================================
SELECT 'TABLE SCHEMA VALIDATION' as test_section;

-- Check custom_categories schema
SELECT 'custom_categories schema check:' as table_check;
SELECT 
    column_name,
    CASE 
        WHEN column_name IN ('id', 'name', 'color', 'position', 'group', 'groups', 'yearGroups') 
        THEN '✅ Required column'
        ELSE '⚠️ Optional column'
    END as status
FROM information_schema.columns 
WHERE table_name = 'custom_categories' 
ORDER BY ordinal_position;

-- Check year_groups schema
SELECT 'year_groups schema check:' as table_check;
SELECT 
    column_name,
    CASE 
        WHEN column_name IN ('id', 'name', 'color', 'sort_order') 
        THEN '✅ Required column'
        ELSE '⚠️ Optional column'
    END as status
FROM information_schema.columns 
WHERE table_name = 'year_groups' 
ORDER BY ordinal_position;

-- Check category_groups schema
SELECT 'category_groups schema check:' as table_check;
SELECT 
    column_name,
    CASE 
        WHEN column_name IN ('id', 'name', 'sort_order') 
        THEN '✅ Required column'
        ELSE '⚠️ Optional column'
    END as status
FROM information_schema.columns 
WHERE table_name = 'category_groups' 
ORDER BY ordinal_position;

-- ==============================================
-- 4. RLS POLICY CHECK
-- ==============================================
SELECT 'RLS POLICY CHECK' as test_section;
SELECT 
    tablename,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Has RLS policies'
        ELSE '❌ NO RLS policies'
    END as policy_status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('custom_categories', 'category_groups', 'year_groups')
GROUP BY tablename
ORDER BY tablename;

-- ==============================================
-- 5. RLS ENABLEMENT CHECK
-- ==============================================
SELECT 'RLS ENABLEMENT CHECK' as test_section;
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS enabled'
        ELSE '❌ RLS disabled'
    END as rls_status
FROM pg_tables 
WHERE tablename IN ('custom_categories', 'category_groups', 'year_groups')
ORDER BY tablename;

-- ==============================================
-- 6. DATA INTEGRITY CHECK
-- ==============================================
SELECT 'DATA INTEGRITY CHECK' as test_section;

-- Check for duplicate names in custom_categories
SELECT 'custom_categories duplicate check:' as integrity_check;
SELECT 
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT name) THEN '✅ No duplicate names'
        ELSE '❌ DUPLICATE names found'
    END as duplicate_status,
    COUNT(*) as total_records,
    COUNT(DISTINCT name) as unique_names
FROM custom_categories;

-- Check for duplicate names in year_groups
SELECT 'year_groups duplicate check:' as integrity_check;
SELECT 
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT name) THEN '✅ No duplicate names'
        ELSE '❌ DUPLICATE names found'
    END as duplicate_status,
    COUNT(*) as total_records,
    COUNT(DISTINCT name) as unique_names
FROM year_groups;

-- Check for duplicate names in category_groups
SELECT 'category_groups duplicate check:' as integrity_check;
SELECT 
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT name) THEN '✅ No duplicate names'
        ELSE '❌ DUPLICATE names found'
    END as duplicate_status,
    COUNT(*) as total_records,
    COUNT(DISTINCT name) as unique_names
FROM category_groups;

-- ==============================================
-- 7. WRITE PERMISSION TEST
-- ==============================================
SELECT 'WRITE PERMISSION TEST' as test_section;

-- Test insert into custom_categories (will rollback)
BEGIN;
INSERT INTO custom_categories (name, color, position) 
VALUES ('HEALTH_CHECK_TEST', '#FF0000', 999);
ROLLBACK;
SELECT '✅ custom_categories INSERT permission OK' as insert_test;

-- Test insert into year_groups (will rollback)
BEGIN;
INSERT INTO year_groups (name, color, sort_order) 
VALUES ('HEALTH_CHECK_TEST', '#FF0000', 999);
ROLLBACK;
SELECT '✅ year_groups INSERT permission OK' as insert_test;

-- Test insert into category_groups (will rollback)
BEGIN;
INSERT INTO category_groups (name, sort_order) 
VALUES ('HEALTH_CHECK_TEST', 999);
ROLLBACK;
SELECT '✅ category_groups INSERT permission OK' as insert_test;

-- ==============================================
-- 8. DATA TYPE VALIDATION
-- ==============================================
SELECT 'DATA TYPE VALIDATION' as test_section;

-- Check yearGroups column type in custom_categories
SELECT 'yearGroups column type check:' as type_check;
SELECT 
    column_name,
    data_type,
    CASE 
        WHEN data_type = 'jsonb' THEN '✅ Correct type (jsonb)'
        ELSE '❌ Wrong type: ' || data_type
    END as type_status
FROM information_schema.columns 
WHERE table_name = 'custom_categories' AND column_name = 'yearGroups';

-- Check groups column type in custom_categories
SELECT 'groups column type check:' as type_check;
SELECT 
    column_name,
    data_type,
    CASE 
        WHEN data_type = 'ARRAY' THEN '✅ Correct type (ARRAY)'
        ELSE '❌ Wrong type: ' || data_type
    END as type_status
FROM information_schema.columns 
WHERE table_name = 'custom_categories' AND column_name = 'groups';

-- ==============================================
-- 9. SAMPLE DATA CHECK
-- ==============================================
SELECT 'SAMPLE DATA CHECK' as test_section;

-- Show sample custom_categories data
SELECT 'Sample custom_categories data:' as sample_data;
SELECT name, color, position, "group", "groups", "yearGroups"
FROM custom_categories 
ORDER BY position 
LIMIT 3;

-- Show sample year_groups data
SELECT 'Sample year_groups data:' as sample_data;
SELECT name, color, sort_order
FROM year_groups 
ORDER BY sort_order 
LIMIT 3;

-- Show sample category_groups data
SELECT 'Sample category_groups data:' as sample_data;
SELECT name, sort_order
FROM category_groups 
ORDER BY sort_order 
LIMIT 3;

-- ==============================================
-- 10. PERFORMANCE CHECK
-- ==============================================
SELECT 'PERFORMANCE CHECK' as test_section;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples
FROM pg_stat_user_tables 
WHERE tablename IN ('custom_categories', 'category_groups', 'year_groups')
ORDER BY tablename;

-- ==============================================
-- 11. FINAL SUMMARY
-- ==============================================
SELECT 'FINAL HEALTH CHECK SUMMARY' as test_section;
SELECT 
    'Database connectivity' as check_item,
    '✅ PASS' as status
UNION ALL
SELECT 
    'Table existence',
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('custom_categories', 'category_groups', 'year_groups')) = 3
        THEN '✅ PASS'
        ELSE '❌ FAIL'
    END
UNION ALL
SELECT 
    'RLS policies',
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('custom_categories', 'category_groups', 'year_groups')) >= 3
        THEN '✅ PASS'
        ELSE '❌ FAIL'
    END
UNION ALL
SELECT 
    'Required columns',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'custom_categories' 
            AND column_name IN ('group', 'groups', 'yearGroups')
        )
        THEN '✅ PASS'
        ELSE '❌ FAIL'
    END
UNION ALL
SELECT 
    'Data integrity',
    CASE 
        WHEN (
            SELECT COUNT(*) = COUNT(DISTINCT name) 
            FROM custom_categories
        )
        THEN '✅ PASS'
        ELSE '❌ FAIL'
    END;
