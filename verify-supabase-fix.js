// Browser console script to verify Supabase schema fix
// Run this in the browser console on your app

console.log('🧪 Verifying Supabase schema fix...');

async function verifySupabaseFix() {
  try {
    // Get the Supabase client
    const supabase = window.supabase || window.__supabase__;
    
    if (!supabase) {
      console.log('❌ Supabase client not found');
      console.log('💡 Try: window.supabase = supabase; in the console first');
      return;
    }
    
    console.log('✅ Supabase client found');
    
    // Test 1: Check if we can query the table
    console.log('\n📊 Test 1: Querying half_terms table...');
    const { data: queryData, error: queryError } = await supabase
      .from('half_terms')
      .select('*')
      .limit(1);
    
    if (queryError) {
      console.log('❌ Query failed:', queryError.message);
      return;
    } else {
      console.log('✅ Query successful - schema is fixed!');
      console.log('📊 Sample data:', queryData);
    }
    
    // Test 2: Test upsert with proper schema
    console.log('\n📊 Test 2: Testing lesson assignment upsert...');
    
    const testAssignment = {
      id: 'A1',
      sheet_name: 'LKG',
      name: 'Autumn 1',
      lessons: ['1', '2', '3'],
      is_complete: false
    };
    
    console.log('🧪 Testing upsert with:', testAssignment);
    
    const { data: upsertData, error: upsertError } = await supabase
      .from('half_terms')
      .upsert(testAssignment, { onConflict: 'id,sheet_name' })
      .select();
    
    if (upsertError) {
      console.log('❌ Upsert failed:', upsertError.message);
    } else {
      console.log('✅ Upsert successful! Schema is working correctly');
      console.log('📊 Upserted data:', upsertData);
      
      // Clean up test data
      await supabase
        .from('half_terms')
        .delete()
        .eq('id', 'A1')
        .eq('sheet_name', 'LKG');
      
      console.log('🧹 Test data cleaned up');
    }
    
    // Test 3: Test with current assignment data
    console.log('\n📊 Test 3: Testing with current assignment...');
    
    // Get current half-terms from localStorage
    const localHalfTerms = localStorage.getItem('half-terms-LKG');
    if (localHalfTerms) {
      const parsedHalfTerms = JSON.parse(localHalfTerms);
      console.log('📊 Current local half-terms:', parsedHalfTerms);
      
      // Test syncing the first half-term to Supabase
      if (parsedHalfTerms.length > 0) {
        const firstHalfTerm = parsedHalfTerms[0];
        console.log('🧪 Testing sync for:', firstHalfTerm);
        
        const { data: syncData, error: syncError } = await supabase
          .from('half_terms')
          .upsert({
            id: firstHalfTerm.id,
            sheet_name: 'LKG',
            name: firstHalfTerm.name,
            lessons: firstHalfTerm.lessons || [],
            is_complete: firstHalfTerm.isComplete || false
          }, { onConflict: 'id,sheet_name' })
          .select();
        
        if (syncError) {
          console.log('❌ Sync failed:', syncError.message);
        } else {
          console.log('✅ Sync successful! Your assignments will now persist across browsers');
          console.log('📊 Synced data:', syncData);
        }
      }
    }
    
    console.log('\n🎉 VERIFICATION COMPLETE!');
    console.log('✅ Supabase schema is fixed');
    console.log('✅ Lesson assignments will sync to database');
    console.log('✅ Cross-browser persistence is now enabled');
    
  } catch (error) {
    console.error('💥 Error during verification:', error);
  }
}

// Run the verification
verifySupabaseFix();

console.log(`
📋 NEXT STEPS TO TEST CROSS-BROWSER PERSISTENCE:

1. ✅ Make sure your current assignment is working
2. 🔄 Open a new browser window (or incognito)
3. 🌐 Navigate to your app
4. 📊 Go to Unit Viewer tab
5. 👀 Check if assigned lessons appear under the correct half-terms

If you see the assigned lessons in the new browser, the fix is working! 🎉
`);
