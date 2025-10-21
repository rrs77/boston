-- Copy bubble songs from activities_rows to activities table
-- Run this in the Supabase SQL Editor

-- First, let's copy all bubble songs from activities_rows to activities
-- Generate UUIDs for the id column since activities table expects UUID type
INSERT INTO activities (
    id, activity, description, activity_text, time, video_link, 
    music_link, backing_link, resource_link, link, vocals_link, 
    image_link, teaching_unit, category, level, unit_name, 
    lesson_number, eyfs_standards, user_id, created_at, updated_at
)
SELECT 
    gen_random_uuid() as id, -- Generate new UUID for each row
    activity, description, activity_text, time, video_link, 
    music_link, backing_link, resource_link, link, vocals_link, 
    image_link, teaching_unit, category, level, unit_name, 
    lesson_number, 
    CASE 
        WHEN eyfs_standards IS NULL OR eyfs_standards = '' THEN NULL
        ELSE ARRAY[eyfs_standards] -- Convert text to text array
    END as eyfs_standards,
    user_id, created_at, updated_at
FROM activities_rows 
WHERE category = 'Bubble Songs';

-- Verify the copy worked
SELECT 'Bubble songs copied to activities table:' as info;
SELECT id, activity, category, level, created_at
FROM activities 
WHERE category = 'Bubble Songs' 
ORDER BY created_at DESC;

-- Check total count in activities table now
SELECT 'Total activities count:' as info;
SELECT COUNT(*) as total_activities FROM activities;
