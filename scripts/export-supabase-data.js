/**
 * Supabase Data Export Script
 * 
 * This script exports all your data from Supabase to JSON files.
 * Run with: node scripts/export-supabase-data.js
 * 
 * Exported data will be saved to: exports/[timestamp]/
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = 'https://wiudrzdkbpyziaodqoog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpdWRyemRrYnB5emlhb2Rxb29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzgxNzcsImV4cCI6MjA2NjUxNDE3N30.LpD82hY_1wYzroA09nYfaz13iNx5gRJzmPTt0gPCLMI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tables to export
const TABLES = [
  'activities',
  'lessons', 
  'lesson_plans',
  'eyfs_statements',
  'subjects',
  'subject_categories',
  'activity_packs',
  'user_purchases'
];

async function exportTable(tableName, exportDir) {
  console.log(`📦 Exporting ${tableName}...`);
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log(`   ⚠️  Table '${tableName}' does not exist, skipping...`);
        return { table: tableName, count: 0, status: 'not_found' };
      }
      throw error;
    }
    
    const filePath = path.join(exportDir, `${tableName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    console.log(`   ✅ Exported ${data?.length || 0} records to ${tableName}.json`);
    return { table: tableName, count: data?.length || 0, status: 'success' };
    
  } catch (error) {
    console.error(`   ❌ Error exporting ${tableName}:`, error.message);
    return { table: tableName, count: 0, status: 'error', error: error.message };
  }
}

async function exportStorageFiles(exportDir) {
  console.log('\n📁 Exporting storage files...');
  
  try {
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('   ⚠️  Could not list storage buckets:', bucketsError.message);
      return;
    }
    
    for (const bucket of buckets || []) {
      console.log(`   📂 Bucket: ${bucket.name}`);
      
      const { data: files, error: filesError } = await supabase.storage
        .from(bucket.name)
        .list('', { limit: 1000 });
      
      if (filesError) {
        console.log(`      ⚠️  Could not list files in ${bucket.name}:`, filesError.message);
        continue;
      }
      
      // Save file list
      const bucketDir = path.join(exportDir, 'storage', bucket.name);
      fs.mkdirSync(bucketDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(bucketDir, '_file_list.json'),
        JSON.stringify(files, null, 2)
      );
      
      console.log(`      ✅ Listed ${files?.length || 0} files`);
    }
  } catch (error) {
    console.error('   ❌ Error exporting storage:', error.message);
  }
}

async function main() {
  console.log('🚀 Supabase Data Export\n');
  console.log(`📡 Connected to: ${supabaseUrl}\n`);
  
  // Create export directory with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const exportDir = path.join(__dirname, '..', 'exports', timestamp);
  fs.mkdirSync(exportDir, { recursive: true });
  
  console.log(`📁 Export directory: ${exportDir}\n`);
  console.log('═'.repeat(50));
  
  // Export all tables
  const results = [];
  for (const table of TABLES) {
    const result = await exportTable(table, exportDir);
    results.push(result);
  }
  
  // Export storage file list
  await exportStorageFiles(exportDir);
  
  // Create summary
  console.log('\n' + '═'.repeat(50));
  console.log('\n📊 Export Summary:\n');
  
  let totalRecords = 0;
  results.forEach(r => {
    const icon = r.status === 'success' ? '✅' : r.status === 'not_found' ? '⚠️' : '❌';
    console.log(`   ${icon} ${r.table}: ${r.count} records`);
    totalRecords += r.count;
  });
  
  console.log(`\n   📦 Total records exported: ${totalRecords}`);
  console.log(`   📁 Saved to: ${exportDir}`);
  
  // Save export manifest
  const manifest = {
    exportDate: new Date().toISOString(),
    supabaseUrl,
    tables: results,
    totalRecords
  };
  
  fs.writeFileSync(
    path.join(exportDir, '_manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log('\n✨ Export complete!\n');
  console.log('💡 TIP: Keep these files safe as a backup of your data.');
  console.log('   You can re-import them to a new database if needed.\n');
}

main().catch(console.error);
