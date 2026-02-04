const { createClient } = require('@supabase/supabase-js');

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event, context) => {
  // Handle CORS preflight requests (OPTIONS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Method not allowed',
        allowedMethods: ['POST', 'OPTIONS']
      })
    };
  }

  try {
    const { html, footerTemplate, fileName } = JSON.parse(event.body);

    if (!html) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing html content' })
      };
    }

    // PDFBolt API configuration
    const PDFBOLT_API_KEY = process.env.VITE_PDFBOLT_API_KEY || '146bdd01-146f-43f8-92aa-26201c38aa11';
    const PDFBOLT_API_URL = 'https://api.pdfbolt.com/v1/direct';

    // Generate PDF using PDFBolt API (server-side, bypasses CORS)
    // Use node-fetch for Node.js compatibility
    const fetch = require('node-fetch');

    const response = await fetch(PDFBOLT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API_KEY': PDFBOLT_API_KEY
      },
      body: JSON.stringify({
        html: html,
        printBackground: true,
        waitUntil: "networkidle",
        format: "A4",
        margin: {
          "top": "15px",
          "right": "20px",
          "left": "20px",
          "bottom": "55px"
        },
        displayHeaderFooter: true,
        footerTemplate: footerTemplate || '',
        headerTemplate: '',
        emulateMediaType: 'screen'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PDFBolt API Error:', response.status, errorText);
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: `PDFBolt API Error: ${response.status} - ${errorText}` })
      };
    }

    // Get PDF buffer (node-fetch returns buffer, not blob)
    const pdfBuffer = await response.buffer();

    // Get Supabase credentials from environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wiudrzdkbpyziaodqoog.supabase.co';
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceRoleKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set in Netlify.'
        })
      };
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false
      }
    });

    // Generate filename if not provided
    const storageFileName = fileName || `shared-pdfs/${Date.now()}_lesson.pdf`;

    // Use the buffer directly (already a Buffer from response.buffer())
    const fileBuffer = pdfBuffer;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('lesson-pdfs')
      .upload(storageFileName, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
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
        ...corsHeaders,
        'Content-Type': 'application/json'
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
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: error.message || 'Internal server error'
      })
    };
  }
};

