-- Simple fix for half_terms table
-- Run this in Supabase SQL Editor

-- Add primary key constraint
ALTER TABLE half_terms ADD CONSTRAINT half_terms_pkey PRIMARY KEY (id, sheet_name);
