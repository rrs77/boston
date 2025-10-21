-- Clean up duplicate year groups in the database
-- Run this in the Supabase SQL Editor

-- First, let's see what duplicates we have
SELECT name, COUNT(*) as count 
FROM year_groups 
GROUP BY name 
HAVING COUNT(*) > 1 
ORDER BY count DESC;

-- Delete duplicates, keeping only the first one for each name
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) as rn
  FROM year_groups
)
DELETE FROM year_groups 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Verify the cleanup worked
SELECT name, COUNT(*) as count 
FROM year_groups 
GROUP BY name 
HAVING COUNT(*) > 1;

-- Show final year groups
SELECT * FROM year_groups ORDER BY sort_order;
