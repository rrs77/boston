/**
 * Vercel Serverless Function: Generate lesson PDF and upload to Supabase Storage.
 * Returns a public URL for the saved PDF (shortcut link for the lesson plan).
 *
 * POST body: { html: string (base64), footerTemplate?: string (base64), fileName?: string }
 * Env: VITE_PDFBOLT_API_KEY or PDFBOLT_API_KEY, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL or SUPABASE_URL
 */

import { createClient } from '@supabase/supabase-js';

const PDFBOLT_API_URL = 'https://api.pdfbolt.com/v1/direct';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { html: encodedHtml, footerTemplate: encodedFooter, fileName } = body || {};

    if (!encodedHtml) {
      return jsonResponse({ error: 'Missing html content' }, 400);
    }

    const PDFBOLT_API_KEY = process.env.VITE_PDFBOLT_API_KEY || process.env.PDFBOLT_API_KEY;
    if (!PDFBOLT_API_KEY) {
      return jsonResponse({ error: 'PDFBOLT_API_KEY or VITE_PDFBOLT_API_KEY not set' }, 500);
    }

    // Pass base64 HTML and footer directly to PDFBolt (API expects base64 - same as Netlify)
    const pdfResponse = await fetch(PDFBOLT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API_KEY': PDFBOLT_API_KEY,
      },
      body: JSON.stringify({
        html: encodedHtml,
        printBackground: true,
        waitUntil: 'networkidle',
        format: 'A4',
        margin: { top: '15px', right: '20px', left: '20px', bottom: '55px' },
        displayHeaderFooter: true,
        footerTemplate: encodedFooter || '',
        headerTemplate: '',
      }),
    });

    if (!pdfResponse.ok) {
      const errText = await pdfResponse.text();
      console.error('PDFBolt error:', pdfResponse.status, errText);
      return jsonResponse({ error: `PDF generation failed: ${pdfResponse.status}` }, 500);
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    const storageFileName = fileName || `shared-pdfs/${Date.now()}_lesson.pdf`;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://wiudrzdkbpyziaodqoog.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return jsonResponse({ error: 'SUPABASE_SERVICE_ROLE_KEY not set in Vercel environment' }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const { error: uploadError } = await supabase.storage
      .from('lesson-pdfs')
      .upload(storageFileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return jsonResponse({ error: `Upload failed: ${uploadError.message}` }, 500);
    }

    const { data: urlData } = supabase.storage.from('lesson-pdfs').getPublicUrl(storageFileName);

    return jsonResponse({
      success: true,
      url: urlData.publicUrl,
      path: storageFileName,
    });
  } catch (err) {
    console.error('generate-pdf error:', err);
    return jsonResponse(
      { error: err.message || 'Internal server error' },
      500
    );
  }
}
