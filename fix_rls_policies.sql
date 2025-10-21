-- Fix Row Level Security policies to allow anonymous access
-- Run this in the Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON year_groups;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON custom_categories;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON activities;

-- Create new policies that allow anonymous access
CREATE POLICY "Allow all operations for year groups" ON year_groups
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for custom categories" ON custom_categories
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for activities" ON activities
  FOR ALL USING (true) WITH CHECK (true);

-- Also fix the year_groups table structure if needed
-- Drop and recreate with correct schema
DROP TABLE IF EXISTS year_groups CASCADE;

CREATE TABLE year_groups (
  id text PRIMARY KEY,
  name text NOT NULL,
  color text DEFAULT '#3B82F6',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for sorting
CREATE INDEX idx_year_groups_sort_order ON year_groups(sort_order);

-- Enable Row Level Security
ALTER TABLE year_groups ENABLE ROW LEVEL SECURITY;

-- Create the permissive policy
CREATE POLICY "Allow all operations for year groups" ON year_groups
  FOR ALL USING (true) WITH CHECK (true);

-- Ensure other tables have permissive policies too
ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('year_groups', 'custom_categories', 'activities');
