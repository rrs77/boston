-- Fix the id column type in half_terms table
-- Run this in Supabase SQL Editor

-- Change the id column from uuid to text
ALTER TABLE half_terms ALTER COLUMN id TYPE text;
