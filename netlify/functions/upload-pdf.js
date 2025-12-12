const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { fileName, fileData } = JSON.parse(event.body);

    if (!fileName || !fileData) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing fileName or fileData' })
      };
    }

    // Get Supabase credentials from environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wiudrzdkbpyziaodqoog.supabase.co';
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceRoleKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false
      }
    });

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(fileData, 'base64');

    // Upload to Supabase Storage
    const storageFileName = `shared-pdfs/${fileName}`;
    const { data, error } = await supabase.storage
      .from('lesson-pdfs')
      .upload(storageFileName, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true // Allow overwriting
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Upload failed: ${error.message}` })
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('lesson-pdfs')
      .getPublicUrl(storageFileName);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        url: urlData.publicUrl,
        path: storageFileName
      })
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};

