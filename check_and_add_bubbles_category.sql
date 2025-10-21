-- Check and add bubbles category to custom_categories table
-- Run this in the Supabase SQL Editor

-- 1. Check what categories currently exist in custom_categories
SELECT 'Current categories in custom_categories table:' as info;
SELECT id, name, color, position, "group", groups, "yearGroups", created_at 
FROM custom_categories 
ORDER BY position, name;

-- 2. Check if 'bubbles' category already exists
SELECT 'Checking for bubbles category:' as info;
SELECT COUNT(*) as count, name 
FROM custom_categories 
WHERE LOWER(name) LIKE '%bubble%' 
GROUP BY name;

-- 3. Add 'bubbles' category if it doesn't exist
INSERT INTO custom_categories (
    name, 
    color, 
    position, 
    "group", 
    groups, 
    "yearGroups",
    created_at,
    updated_at
)
SELECT 
    'Bubbles',
    '#87CEEB', -- Sky blue color
    COALESCE((SELECT MAX(position) FROM custom_categories), 0) + 1,
    'Core Activities', -- Default group
    ARRAY['Core Activities'], -- Default groups array
    '{"LKG": true, "UKG": true, "Reception": true}'::jsonb, -- Default year groups
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM custom_categories 
    WHERE LOWER(name) = 'bubbles'
);

-- 4. Verify the bubbles category was added
SELECT 'Verification - Bubbles category:' as info;
SELECT id, name, color, position, "group", groups, "yearGroups" 
FROM custom_categories 
WHERE LOWER(name) = 'bubbles';

-- 5. Show updated category count
SELECT 'Total categories count:' as info;
SELECT COUNT(*) as total_categories FROM custom_categories;
