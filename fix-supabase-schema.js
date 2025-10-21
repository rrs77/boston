// Browser console script to fix Supabase half_terms table schema
// Run this in the browser console on your app

console.log('🚀 Starting Supabase schema fix...');

// Get the Supabase client from the window object
const supabase = window.supabase || window.__supabase__;

if (!supabase) {
  console.error('❌ Supabase client not found. Make sure you are on the app page.');
  console.log('💡 Try: window.supabase = supabase; in the console first');
} else {
  console.log('✅ Supabase client found');
  
  // Test current table structure
  async function testAndFixTable() {
    try {
      console.log('🧪 Testing current half_terms table...');
      
      // Try to query the table to see what columns exist
      const { data: testData, error: testError } = await supabase
        .from('half_terms')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.log('📊 Current table error:', testError.message);
        
        // The table exists but has wrong schema
        if (testError.message.includes("Could not find the 'name' column")) {
          console.log('🔧 Fixing missing name column...');
          
          // Try to add the missing column using RPC
          const { error: alterError } = await supabase.rpc('exec_sql', {
            sql: "ALTER TABLE half_terms ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';"
          });
          
          if (alterError) {
            console.log('⚠️ Could not alter table directly:', alterError.message);
            console.log('💡 You may need to run this migration in the Supabase dashboard');
          } else {
            console.log('✅ Successfully added name column');
          }
        }
      } else {
        console.log('✅ Table structure looks correct');
        console.log('📊 Sample data:', testData);
      }
      
      // Test upsert with proper schema
      console.log('🧪 Testing upsert with correct schema...');
      
      const testRecord = {
        id: 'A1',
        sheet_name: 'LKG',
        name: 'Autumn 1',
        lessons: ['1', '2'],
        is_complete: false
      };
      
      const { data: upsertData, error: upsertError } = await supabase
        .from('half_terms')
        .upsert(testRecord, { onConflict: 'id,sheet_name' })
        .select();
      
      if (upsertError) {
        console.error('❌ Upsert failed:', upsertError);
      } else {
        console.log('✅ Upsert successful:', upsertData);
        
        // Clean up test record
        await supabase
          .from('half_terms')
          .delete()
          .eq('id', 'A1')
          .eq('sheet_name', 'LKG');
        
        console.log('🧹 Test record cleaned up');
      }
      
    } catch (error) {
      console.error('💥 Error during schema fix:', error);
    }
  }
  
  // Run the test and fix
  testAndFixTable();
}

// Alternative: Manual SQL execution
console.log(`
📋 MANUAL MIGRATION STEPS (if automatic fix fails):

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: wiudrzdkbpyziaodqoog
3. Go to SQL Editor
4. Run this SQL:

ALTER TABLE half_terms ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';

5. If the table doesn't exist at all, run:

CREATE TABLE half_terms (
  id text NOT NULL,
  sheet_name text NOT NULL,
  name text NOT NULL,
  lessons text[] DEFAULT '{}',
  is_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id, sheet_name)
);

ALTER TABLE half_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage half-terms"
  ON half_terms
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
`);
