-- Create lesson_stacks table for storing lesson stacks
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS lesson_stacks (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#3B82F6',
  lessons text[] DEFAULT '{}',
  total_time integer DEFAULT 0,
  total_activities integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lesson_stacks ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for reading and writing lesson stacks
CREATE POLICY "Allow anonymous access to lesson_stacks"
  ON lesson_stacks
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lesson_stacks_created_at ON lesson_stacks(created_at);
CREATE INDEX IF NOT EXISTS idx_lesson_stacks_lessons ON lesson_stacks USING GIN(lessons);

-- Verify the table was created
SELECT 'lesson_stacks table created successfully' as status;
