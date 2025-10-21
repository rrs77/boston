-- Add the missing A2 half-term to the database
-- Run this in the Supabase SQL Editor

-- Check what half-terms currently exist for LKG
SELECT id, sheet_name, name, lessons, is_complete 
FROM half_terms 
WHERE sheet_name = 'LKG' 
ORDER BY id;

-- Insert the missing A2 half-term
INSERT INTO half_terms (id, sheet_name, name, lessons, is_complete, term_id, created_at, updated_at)
VALUES (
  'A2',
  'LKG', 
  'Autumn 2',
  '[]'::jsonb,
  false,
  'A2',
  now(),
  now()
)
ON CONFLICT (id, sheet_name) 
DO UPDATE SET 
  name = EXCLUDED.name,
  term_id = EXCLUDED.term_id,
  updated_at = now();

-- Verify A2 was added
SELECT id, sheet_name, name, lessons, is_complete 
FROM half_terms 
WHERE sheet_name = 'LKG' 
ORDER BY id;
