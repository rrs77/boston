import { supabase } from '../config/supabase';
import { useData } from '../contexts/DataContext';

const PDFBOLT_API_URL = 'https://api.pdfbolt.com/api/v1/generate';
const PDFBOLT_API_KEY = import.meta.env.VITE_PDFBOLT_API_KEY;

// DreamHost PDF upload configuration (optional - falls back to Supabase if not set)
const DREAMHOST_PDF_UPLOAD_URL = import.meta.env.VITE_PDF_UPLOAD_URL;
const DREAMHOST_PDF_API_KEY = import.meta.env.VITE_PDF_API_KEY;
const USE_DREAMHOST_STORAGE = !!DREAMHOST_PDF_UPLOAD_URL;

interface ShareLessonOptions {
  lessonNumber: string;
  currentSheetInfo: { sheet: string; display: string };
  allLessonsData: Record<string, any>;
  generateHTMLContent: () => string[];
}

/**
 * Upload PDF to DreamHost server
 */
async function uploadToDreamHost(pdfBlob: Blob, fileName: string): Promise<string> {
  if (!DREAMHOST_PDF_UPLOAD_URL || !DREAMHOST_PDF_API_KEY) {
    throw new Error('DreamHost PDF upload not configured');
  }

  // Convert blob to base64
  const arrayBuffer = await pdfBlob.arrayBuffer();
  const base64Data = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  const response = await fetch(DREAMHOST_PDF_UPLOAD_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': DREAMHOST_PDF_API_KEY
    },
    body: JSON.stringify({
      fileData: base64Data,
      fileName: fileName
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DreamHost upload failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  if (!result.success || !result.url) {
    throw new Error(result.error || 'Upload failed - no URL returned');
  }

  return result.url;
}

/**
 * Check if storage bucket exists and is accessible
 */
export async function ensureBucketExists() {
  const bucketName = 'lesson-pdfs';
  
  try {
    const { data: files, error: accessError } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1 });
    
    if (!accessError) {
      return { exists: true };
    }
    
    if (accessError.message?.includes('not found') || accessError.message?.includes('Bucket not found')) {
      return { exists: false, requiresManualSetup: true };
    }
    
    return { exists: false, error: accessError.message, requiresManualSetup: true };
    
  } catch (error: any) {
    return { exists: false, error: error.message || 'Unknown error', requiresManualSetup: true };
  }
}

/**
 * Share a lesson by generating PDF and uploading to Supabase Storage
 */
export async function shareLesson(options: ShareLessonOptions): Promise<string> {
  const { lessonNumber, currentSheetInfo, allLessonsData, generateHTMLContent } = options;

  if (!PDFBOLT_API_KEY || PDFBOLT_API_KEY === 'd089165b-e1da-43bb-a7dc-625ce514ed1b') {
    throw new Error('Please set your PDFBolt API key in the environment variables (VITE_PDFBOLT_API_KEY)');
  }

  // Check bucket exists
  const bucketCheck = await ensureBucketExists();
  if (!bucketCheck.exists) {
    const setupUrl = 'https://supabase.com/dashboard/project/wiudrzdkbpyziaodqoog/storage/buckets';
    const errorMsg = bucketCheck.requiresManualSetup
      ? `The 'lesson-pdfs' storage bucket needs to be created.\n\n` +
        `Quick Setup (2 minutes):\n` +
        `1. Go to: ${setupUrl}\n` +
        `2. Click "New bucket"\n` +
        `3. Name: "lesson-pdfs"\n` +
        `4. Enable "Public bucket"\n` +
        `5. Click "Create bucket"\n\n` +
        `Or use the automated script: node scripts/create-storage-bucket.js\n\n` +
        `See QUICK_STORAGE_SETUP.md for more options.`
      : `Storage bucket 'lesson-pdfs' does not exist. Please create it manually in Supabase Dashboard.\n\nError: ${bucketCheck.error || 'Unknown error'}\n\nGo to: ${setupUrl}`;
    
    throw new Error(errorMsg);
  }

  // Encode HTML content
  const encodeUnicodeBase64 = (str: string): string => {
    return btoa(unescape(encodeURIComponent(str)));
  };

  const htmlContent = encodeUnicodeBase64(generateHTMLContent()[0]);
  const footerContent = encodeUnicodeBase64(generateHTMLContent()[1]);

  // Generate PDF using PDFBolt API
  const response = await fetch(PDFBOLT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API_KEY': PDFBOLT_API_KEY
    },
    body: JSON.stringify({
      html: htmlContent,
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
      footerTemplate: footerContent,
      headerTemplate: encodeUnicodeBase64(`<div></div>`)
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PDFBolt API Error: ${response.status} - ${errorText}`);
  }

  // Get the PDF as a blob
  const pdfBlob = await response.blob();

  // Generate filename
  const getLessonDisplayNumber = (num: string): string => {
    const numericPart = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
    return numericPart || num;
  };
  
  const lessonDisplayNumber = getLessonDisplayNumber(lessonNumber);
  const fileName = `${currentSheetInfo.sheet}_Lesson_${lessonDisplayNumber}.pdf`;

  // Upload to DreamHost if configured, otherwise use Supabase
  if (USE_DREAMHOST_STORAGE) {
    console.log('📤 Uploading PDF to DreamHost...');
    return await uploadToDreamHost(pdfBlob, fileName);
  }

  // Fallback: Upload to Supabase Storage
  console.log('📤 Uploading PDF to Supabase Storage...');
  const timestamp = Date.now();
  const storageFileName = `shared-pdfs/${timestamp}_${fileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('lesson-pdfs')
    .upload(storageFileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: false
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw new Error(`Failed to upload PDF: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('lesson-pdfs')
    .getPublicUrl(storageFileName);

  return urlData.publicUrl;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

