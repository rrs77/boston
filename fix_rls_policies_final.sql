-- FINAL RLS POLICY FIX
-- This ensures anonymous users can read/write to settings tables

-- 1. Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous access to custom_categories" ON custom_categories;
DROP POLICY IF EXISTS "Allow anonymous access to category_groups" ON category_groups;
DROP POLICY IF EXISTS "Allow anonymous access to year_groups" ON year_groups;

-- 2. Create new policies for anonymous access
CREATE POLICY "Allow anonymous access to custom_categories" ON custom_categories
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access to category_groups" ON category_groups
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access to year_groups" ON year_groups
FOR ALL USING (true) WITH CHECK (true);

-- 3. Verify policies were created
SELECT 'RLS Policies after fix:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('custom_categories', 'category_groups', 'year_groups')
ORDER BY tablename, policyname;

-- 4. Enable RLS on tables (should already be enabled)
ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE year_groups ENABLE ROW LEVEL SECURITY;

-- 5. Verify RLS status
SELECT 'RLS Status after fix:' as info;
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename IN ('custom_categories', 'category_groups', 'year_groups');
