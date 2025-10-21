// Test Supabase connection and lesson_stacks table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wiudrzdkbpyziaodqoog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdWRyemRrYnB5emlhb2Rxb29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzgxNzcsImV4cCI6MjA2NjUxNDE3N30.LpD82hY_1wYzroA09nYfaz13iNx5gRJzmPTt0gPCLMI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase.from('activities').select('count').limit(1);
    if (error) {
      console.error('❌ Basic connection failed:', error);
      return;
    }
    console.log('✅ Basic connection successful');
    
    // Test lesson_stacks table exists
    console.log('2. Testing lesson_stacks table...');
    const { data: stacksData, error: stacksError } = await supabase.from('lesson_stacks').select('*').limit(1);
    if (stacksError) {
      console.error('❌ lesson_stacks table error:', stacksError);
      console.log('📝 You need to run the SQL script to create the table');
      return;
    }
    console.log('✅ lesson_stacks table exists');
    
    // Test inserting a stack
    console.log('3. Testing stack insertion...');
    const testStack = {
      id: 'test-stack-' + Date.now(),
      name: 'Test Stack',
      description: 'Test description',
      color: '#3B82F6',
      lessons: ['1', '2'],
      total_time: 30,
      total_activities: 5
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('lesson_stacks')
      .insert(testStack)
      .select();
      
    if (insertError) {
      console.error('❌ Stack insertion failed:', insertError);
      return;
    }
    console.log('✅ Stack insertion successful:', insertData);
    
    // Clean up test data
    await supabase.from('lesson_stacks').delete().eq('id', testStack.id);
    console.log('✅ Test data cleaned up');
    
    console.log('🎉 All Supabase tests passed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSupabaseConnection();
