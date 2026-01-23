-- ============================================
-- ADD linked_year_groups COLUMN TO custom_objective_year_groups
-- Creative Curriculum Designer - Custom Objectives
-- Run this migration ONCE in Supabase SQL Editor
-- ============================================

-- Add linked_year_groups column to custom_objective_year_groups table
-- This column stores an array of year group names that this objective year group is linked to
ALTER TABLE custom_objective_year_groups
ADD COLUMN IF NOT EXISTS linked_year_groups TEXT[] DEFAULT '{}';

-- Add a comment to document the column
COMMENT ON COLUMN custom_objective_year_groups.linked_year_groups IS 
  'Array of year group names (from year_groups table) that this objective year group is linked to. If empty, objectives are available to all year groups.';
