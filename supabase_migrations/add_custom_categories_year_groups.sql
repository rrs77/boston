-- Add year_groups column to custom_categories if it doesn't exist.
-- This stores which year groups each category is assigned to (e.g. LKG, UKG, Reception).
-- Run this in Supabase SQL Editor if category year group assignments are not persisting.

ALTER TABLE custom_categories
ADD COLUMN IF NOT EXISTS year_groups JSONB DEFAULT '{}';

COMMENT ON COLUMN custom_categories.year_groups IS 'Map of year group key to true/false (e.g. {"LKG": true, "UKG": true}). Used in Settings > Categories > Assign Year Groups.';
