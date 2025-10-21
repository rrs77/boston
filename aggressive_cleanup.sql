-- Aggressive cleanup of year groups - completely reset the table
-- Run this in the Supabase SQL Editor

-- First, let's see what we have
SELECT name, COUNT(*) as count, string_agg(id::text, ', ') as ids
FROM year_groups 
GROUP BY name 
ORDER BY count DESC;

-- Delete ALL year groups to start fresh
DELETE FROM year_groups;

-- Verify the table is empty
SELECT COUNT(*) as remaining_count FROM year_groups;

-- The app will recreate the year groups when it loads
