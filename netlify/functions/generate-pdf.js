const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { html, footerTemplate, fileName } = JSON.parse(event.body);

    if (!html) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Missing html content' })
      };
    }

    // PDFBolt API configuration
    const PDFBOLT_API_KEY = process.env.VITE_PDFBOLT_API_KEY || '146bdd01-146f-43f8-92aa-26201c38aa11';
    const PDFBOLT_API_URL = 'https://api.pdfbolt.com/v1/direct';

    // Generate PDF using PDFBolt API (server-side, bypasses CORS)
    // Node 18+ has built-in fetch, but use node-fetch as fallback for compatibility
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
        headerTemplate: ''
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PDFBolt API Error:', response.status, errorText);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: `PDFBolt API Error: ${response.status} - ${errorText}` })
      };
    }

    // Get PDF blob
    const pdfBlob = await response.blob();
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Get Supabase credentials from environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wiudrzdkbpyziaodqoog.supabase.co';
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceRoleKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
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

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(base64, 'base64');

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
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
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
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
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
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: error.message || 'Internal server error'
      })
    };
  }
};

