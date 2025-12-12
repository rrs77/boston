/**
 * Script to create the lesson-pdfs storage bucket in Supabase
 * 
 * This requires your Supabase Service Role Key (not the anon key)
 * You can find it in: Supabase Dashboard → Settings → API → service_role key
 * 
 * Usage:
 * 1. Set SUPABASE_SERVICE_ROLE_KEY environment variable
 * 2. Run: node scripts/create-storage-bucket.js
 * 
 * Or run directly with:
 * SUPABASE_SERVICE_ROLE_KEY=your_service_role_key node scripts/create-storage-bucket.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wiudrzdkbpyziaodqoog.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('\n📝 To get your service role key:');
  console.log('1. Go to: https://supabase.com/dashboard/project/wiudrzdkbpyziaodqoog/settings/api');
  console.log('2. Copy the "service_role" key (NOT the anon key)');
  console.log('3. Run: SUPABASE_SERVICE_ROLE_KEY=your_key_here node scripts/create-storage-bucket.js');
  console.log('\n⚠️  Keep your service role key secret! Never commit it to git.');
  process.exit(1);
}

async function createBucket() {
  // Create Supabase client with service role key (has admin permissions)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false
    }
  });

  const bucketName = 'lesson-pdfs';

  try {
    console.log('🔍 Checking if bucket exists...');
    
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      throw listError;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log(`✅ Bucket "${bucketName}" already exists!`);
      console.log('📦 Bucket details:');
      const bucket = buckets.find(b => b.name === bucketName);
      console.log(`   - Name: ${bucket.name}`);
      console.log(`   - Public: ${bucket.public ? 'Yes' : 'No'}`);
      console.log(`   - Created: ${bucket.created_at}`);
      return;
    }

    console.log(`📦 Creating bucket "${bucketName}"...`);
    
    // Create the bucket
    const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true, // Make it public so URLs are accessible
      fileSizeLimit: 52428800, // 50 MB
      allowedMimeTypes: ['application/pdf']
    });

    if (createError) {
      console.error('❌ Error creating bucket:', createError);
      throw createError;
    }

    console.log('✅ Bucket created successfully!');
    console.log('\n📋 Bucket Configuration:');
    console.log(`   - Name: ${bucketName}`);
    console.log(`   - Public: Yes`);
    console.log(`   - File size limit: 50 MB`);
    console.log(`   - Allowed MIME types: application/pdf`);
    console.log('\n🎉 Your PDF sharing feature is now ready to use!');
    
  } catch (error) {
    console.error('\n❌ Failed to create bucket:', error.message);
    console.log('\n💡 Alternative: Create it manually in the Supabase Dashboard:');
    console.log(`   https://supabase.com/dashboard/project/wiudrzdkbpyziaodqoog/storage/buckets`);
    process.exit(1);
  }
}

createBucket();

