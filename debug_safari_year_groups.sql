-- Debug Safari Year Groups Issue
-- Check what's actually in the year_groups table

SELECT 'Current year_groups in database:' as info;
SELECT id, name, color, sort_order, created_at 
FROM year_groups 
ORDER BY sort_order, name;

SELECT 'Count of year groups:' as info;
SELECT COUNT(*) as total_count FROM year_groups;

-- Check if there are any recent inserts
SELECT 'Recent year group entries (last 24 hours):' as info;
SELECT id, name, color, created_at 
FROM year_groups 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Check for duplicates by name
SELECT 'Potential duplicates by name:' as info;
SELECT name, COUNT(*) as count
FROM year_groups 
GROUP BY name 
HAVING COUNT(*) > 1;
