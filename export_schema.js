// Export Supabase Schema Script
// This will connect to your Supabase project and export schema information

const SUPABASE_URL = 'https://wiudrzdkbpyziaodqoog.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdWRyemRrYnB5emlhT2RxT29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzNjQ4MjYsImV4cCI6MjA1MDk0MDgyNn0.JP2Rq8WkGZJh7xWYJh7xWYJh7xWYJh7xWYJh7xWY'; // You'll need to get this from your Supabase dashboard

async function exportSchema() {
    try {
        console.log('🔍 Connecting to Supabase...');
        console.log('📍 URL:', SUPABASE_URL);
        
        // Check if we can connect
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (response.ok) {
            console.log('✅ Successfully connected to Supabase!');
        } else {
            console.log('❌ Connection failed:', response.status, response.statusText);
            return;
        }
        
        // Check table structures
        console.log('\n📋 Table Structures:');
        const tables = ['custom_categories', 'category_groups', 'year_groups'];
        
        for (const table of tables) {
            try {
                const tableResponse = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                });
                
                if (tableResponse.ok) {
                    console.log(`✅ Table "${table}" exists and is accessible`);
                } else {
                    console.log(`❌ Table "${table}" error:`, tableResponse.status, tableResponse.statusText);
                }
            } catch (error) {
                console.log(`❌ Table "${table}" error:`, error.message);
            }
        }
        
        // Try to get sample data
        console.log('\n📊 Sample Data:');
        for (const table of tables) {
            try {
                const dataResponse = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=3`, {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                });
                
                if (dataResponse.ok) {
                    const data = await dataResponse.json();
                    console.log(`📋 ${table}:`, JSON.stringify(data, null, 2));
                } else {
                    console.log(`❌ ${table} data error:`, dataResponse.status, dataResponse.statusText);
                }
            } catch (error) {
                console.log(`❌ ${table} data error:`, error.message);
            }
        }
        
    } catch (error) {
        console.log('❌ Script error:', error.message);
    }
}

exportSchema();
