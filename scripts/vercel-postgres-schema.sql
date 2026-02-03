-- ============================================
-- CC Designer – Vercel Postgres schema
-- Run this in your Vercel-connected Postgres (e.g. Neon) SQL editor.
-- Matches tables used by the app (Supabase-compatible names/columns).
-- ============================================

-- Activities
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity TEXT,
  description TEXT,
  activity_text TEXT,
  description_heading TEXT DEFAULT 'Introduction/Context',
  activity_heading TEXT DEFAULT 'Activity',
  link_heading TEXT DEFAULT 'Additional Link',
  time TEXT,
  video_link TEXT,
  music_link TEXT,
  backing_link TEXT,
  resource_link TEXT,
  link TEXT,
  vocals_link TEXT,
  image_link TEXT,
  canva_link TEXT DEFAULT '',
  teaching_unit TEXT,
  category TEXT,
  level TEXT,
  unit_name TEXT,
  lesson_number TEXT,
  eyfs_standards JSONB,
  yeargroups JSONB,
  year_groups JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons (sheet_name + year as key; content as jsonb)
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_name TEXT NOT NULL,
  year TEXT,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sheet_name, year)
);

-- Lesson plans
CREATE TABLE IF NOT EXISTS lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL,
  week INTEGER,
  class_name TEXT,
  activities JSONB DEFAULT '[]',
  duration INTEGER DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'planned',
  unit_id TEXT,
  unit_name TEXT,
  lesson_number TEXT,
  title TEXT,
  term TEXT,
  time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EYFS statements (per sheet)
CREATE TABLE IF NOT EXISTS eyfs_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_name TEXT UNIQUE NOT NULL,
  all_statements JSONB,
  structured_statements JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Half terms
CREATE TABLE IF NOT EXISTS half_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  months TEXT,
  lessons JSONB,
  stacks JSONB,
  is_complete BOOLEAN DEFAULT FALSE,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom categories
CREATE TABLE IF NOT EXISTS custom_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  position INTEGER,
  group_name TEXT,
  groups JSONB,
  year_groups JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Category groups
CREATE TABLE IF NOT EXISTS category_groups (
  id TEXT PRIMARY KEY,
  groups JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Year groups
CREATE TABLE IF NOT EXISTS year_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lesson stacks
CREATE TABLE IF NOT EXISTS lesson_stacks (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  color TEXT,
  lessons JSONB DEFAULT '[]',
  total_time INTEGER,
  total_activities INTEGER,
  custom_objectives JSONB,
  curriculum_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity stacks
CREATE TABLE IF NOT EXISTS activity_stacks (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  activities JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom objectives (year groups)
CREATE TABLE IF NOT EXISTS custom_objective_year_groups (
  id TEXT PRIMARY KEY,
  name TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom objectives (areas)
CREATE TABLE IF NOT EXISTS custom_objective_areas (
  id TEXT PRIMARY KEY,
  year_group_id TEXT REFERENCES custom_objective_year_groups(id) ON DELETE CASCADE,
  name TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom objectives
CREATE TABLE IF NOT EXISTS custom_objectives (
  id TEXT PRIMARY KEY,
  area_id TEXT REFERENCES custom_objective_areas(id) ON DELETE CASCADE,
  objective_text TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity – custom objectives (many-to-many)
CREATE TABLE IF NOT EXISTS activity_custom_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id TEXT NOT NULL,
  objective_id TEXT NOT NULL REFERENCES custom_objectives(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, objective_id)
);

-- Optional: subjects (if used)
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subject_categories (
  id TEXT PRIMARY KEY,
  subject_id TEXT,
  name TEXT,
  position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity packs & user purchases (from SUPABASE_MIGRATION)
CREATE TABLE IF NOT EXISTS activity_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  icon TEXT,
  category_ids JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  pack_id TEXT,
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  paypal_transaction_id TEXT UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes (optional, for performance)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_date ON lesson_plans(date);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_class ON lesson_plans(class_name);
CREATE INDEX IF NOT EXISTS idx_lessons_sheet ON lessons(sheet_name);
