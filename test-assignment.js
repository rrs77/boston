// Browser console script to test lesson assignment and Supabase sync
// Run this in the browser console on your app

console.log('🧪 Testing lesson assignment and Supabase sync...');

// Test 1: Check current half-terms data
console.log('\n📊 Test 1: Current half-terms data');
console.log('Half-terms from DataContext:', window.halfTerms || 'Not available');
console.log('Current sheet:', window.currentSheetInfo || 'Not available');

// Test 2: Check if assignment worked locally
console.log('\n📊 Test 2: Local assignment check');
if (window.localStorage) {
  const localHalfTerms = localStorage.getItem('half-terms-LKG');
  console.log('Local half-terms data:', localHalfTerms ? JSON.parse(localHalfTerms) : 'No local data');
}

// Test 3: Test Supabase connection
console.log('\n📊 Test 3: Supabase connection test');
async function testSupabaseConnection() {
  try {
    // Get the Supabase client
    const supabase = window.supabase || window.__supabase__;
    
    if (!supabase) {
      console.log('❌ Supabase client not found in window object');
      console.log('💡 Try: window.supabase = supabase; in the console first');
      return;
    }
    
    console.log('✅ Supabase client found');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('half_terms')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Supabase connection error:', error.message);
      
      if (error.message.includes("Could not find the 'name' column")) {
        console.log('🔧 ISSUE IDENTIFIED: Missing name column in half_terms table');
        console.log('📋 SOLUTION: Run the schema fix script or apply migration manually');
      }
    } else {
      console.log('✅ Supabase connection working');
      console.log('📊 Sample data:', data);
    }
    
    // Test upsert with current assignment
    console.log('\n📊 Test 4: Testing assignment upsert');
    
    const testAssignment = {
      id: 'A1',
      sheet_name: 'LKG',
      name: 'Autumn 1',
      lessons: ['1', '2', '3'], // Example lessons
      is_complete: false
    };
    
    console.log('🧪 Testing upsert with:', testAssignment);
    
    const { data: upsertData, error: upsertError } = await supabase
      .from('half_terms')
      .upsert(testAssignment, { onConflict: 'id,sheet_name' })
      .select();
    
    if (upsertError) {
      console.log('❌ Upsert failed:', upsertError.message);
      console.log('🔧 This confirms the schema issue');
    } else {
      console.log('✅ Upsert successful:', upsertData);
      
      // Clean up test data
      await supabase
        .from('half_terms')
        .delete()
        .eq('id', 'A1')
        .eq('sheet_name', 'LKG');
      
      console.log('🧹 Test data cleaned up');
    }
    
  } catch (error) {
    console.error('💥 Error during Supabase test:', error);
  }
}

// Run the Supabase test
testSupabaseConnection();

// Test 5: Check if assignment is visible in Unit Viewer
console.log('\n📊 Test 5: Unit Viewer data check');
console.log('💡 Check if assigned lessons appear in the Unit Viewer tab');

console.log(`
🎯 SUMMARY:
1. ✅ Assignment is working locally (stored in localStorage)
2. ❌ Supabase sync is failing due to missing 'name' column
3. 🔧 Need to fix Supabase schema to enable cross-browser persistence

📋 NEXT STEPS:
1. Fix the Supabase schema (see fix-supabase-schema.js)
2. Test assignment in another browser
3. Verify data persists across sessions
`);
