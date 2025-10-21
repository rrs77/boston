import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wiudrzdkbpyziaodqoog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdWRyemRrYnB5emlhb2Rxb29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzgxNzcsImV4cCI6MjA2NjUxNDE3N30.LpD82hY_1wYzroA09nYfaz13iNx5gRJzmPTt0gPCLMI';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please connect to Supabase using the "Connect to Supabase" button.');
}

// Create Supabase client with options to bypass RLS for anonymous access
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey
      }
    }
  }
);

// Database table names
export const TABLES = {
  ACTIVITIES: 'activities',
  LESSONS: 'lessons',
  LESSON_PLANS: 'lesson_plans',
  EYFS_STATEMENTS: 'eyfs_statements',
  HALF_TERMS: 'half_terms',
  YEAR_GROUPS: 'year_groups',
  CUSTOM_CATEGORIES: 'custom_categories',
  CATEGORY_GROUPS: 'category_groups',
  CUSTOM_OBJECTIVE_YEAR_GROUPS: 'custom_objective_year_groups',
  CUSTOM_OBJECTIVE_AREAS: 'custom_objective_areas',
  CUSTOM_OBJECTIVES: 'custom_objectives',
  ACTIVITY_CUSTOM_OBJECTIVES: 'activity_custom_objectives',
  LESSON_STACKS: 'lesson_stacks',
  ACTIVITY_STACKS: 'activity_stacks',
  
  // Unused tables (commented out for safety - can be deleted later)
  // ACTIVITIES_ROWS: 'activities_rows',
  // BACKUP_SNAPSHOTS: 'backup_snapshots', 
  // USER_CLASSES: 'user_classes',
  // USER_LESSON_PLANS: 'user_lesson_plans'
};

// Helper function to check if Supabase is configured
// Only logs once on first call to reduce console noise
let configCheckLogged = false;

export const isSupabaseConfigured = () => {
  const configured = !!supabaseUrl && !!supabaseAnonKey;
  
  // Only log once
  if (!configCheckLogged) {
    console.log('🔍 Supabase configuration check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      configured
    });
    configCheckLogged = true;
  }
  
  return configured;
};