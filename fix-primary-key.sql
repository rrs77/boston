-- Fix primary key constraint for half_terms table
-- Run this in Supabase SQL Editor

-- First, let's see what the current primary key is
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'half_terms'
AND tc.constraint_type = 'PRIMARY KEY';

-- Drop the existing primary key constraint
ALTER TABLE half_terms DROP CONSTRAINT IF EXISTS half_terms_pkey;

-- Add the correct primary key constraint on (id, sheet_name)
ALTER TABLE half_terms ADD CONSTRAINT half_terms_pkey PRIMARY KEY (id, sheet_name);

-- Verify the new constraint
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'half_terms'
AND tc.constraint_type = 'PRIMARY KEY';
