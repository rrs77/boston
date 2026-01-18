// Script to restore missing year groups to Supabase
// Run with: node scripts/restore-year-groups.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wiudrzdkbpyziaodqoog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdWRyemRrYnB5emlhb2Rxb29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzgxNzcsImV4cCI6MjA2NjUxNDE3N30.LpD82hY_1wYzroA09nYfaz13iNx5gRJzmPTt0gPCLMI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Year groups to restore
const missingYearGroups = [
  { name: 'Year 3', color: '#14B8A6' },
  { name: 'Year 4', color: '#14B8A6' },
  { name: 'Year 5', color: '#14B8A6' },
  { name: 'Year 6', color: '#14B8A6' },
  { name: 'Reception Drama', color: '#8B5CF6' },
  { name: 'Year 1 Drama', color: '#8B5CF6' },
  { name: 'Year 2 Drama', color: '#8B5CF6' }
];

async function restoreYearGroups() {
  console.log('🔄 Checking existing year groups...');
  
  // Get current year groups
  const { data: existing, error: fetchError } = await supabase
    .from('year_groups')
    .select('*')
    .order('sort_order');
  
  if (fetchError) {
    console.error('❌ Error fetching year groups:', fetchError);
    return;
  }
  
  console.log('📦 Current year groups:', existing?.map(g => g.name));
  
  // Find the highest sort_order
  const maxOrder = existing?.reduce((max, g) => Math.max(max, g.sort_order || 0), 0) || 0;
  
  // Check which year groups are missing
  const existingNames = new Set(existing?.map(g => g.name) || []);
  const toAdd = missingYearGroups.filter(g => !existingNames.has(g.name));
  
  if (toAdd.length === 0) {
    console.log('✅ All year groups already exist!');
    return;
  }
  
  console.log('📝 Adding missing year groups:', toAdd.map(g => g.name));
  
  // Format for insertion
  const formatted = toAdd.map((g, i) => ({
    id: crypto.randomUUID(),
    name: g.name,
    color: g.color,
    sort_order: maxOrder + i + 1
  }));
  
  // Insert the missing year groups
  const { data, error } = await supabase
    .from('year_groups')
    .insert(formatted)
    .select();
  
  if (error) {
    console.error('❌ Error adding year groups:', error);
    return;
  }
  
  console.log('✅ Successfully restored year groups:', data?.map(g => g.name));
  
  // Show final list
  const { data: final } = await supabase
    .from('year_groups')
    .select('*')
    .order('sort_order');
  
  console.log('\n📋 Final year groups list:');
  final?.forEach((g, i) => console.log(`  ${i + 1}. ${g.name}`));
}

restoreYearGroups();
