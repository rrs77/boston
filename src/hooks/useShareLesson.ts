import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { supabase } from '../config/supabase';
import { customObjectivesApi } from '../config/customObjectivesApi';
import type { CustomObjective, CustomObjectiveArea, CustomObjectiveYearGroup } from '../types/customObjectives';

const PDFBOLT_API_URL = 'https://api.pdfbolt.com/api/v1/generate';
const PDFBOLT_API_KEY = import.meta.env.VITE_PDFBOLT_API_KEY;

export function useShareLesson() {
  const { allLessonsData, currentSheetInfo, lessonStandards, halfTerms, getTermSpecificLessonNumber, getLessonDisplayTitle } = useData();
  const { getCategoryColor } = useSettings();
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  // Check if bucket exists
  const ensureBucketExists = async () => {
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
  };

  // Generate HTML content for PDF (simplified version for single lesson)
  const generateHTMLContent = (lessonNumber: string) => {
    const lessonData = allLessonsData[lessonNumber];
    if (!lessonData) return ['', ''];

    const getLessonDisplayNumber = (num: string): string => {
      const numericPart = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
      return numericPart || num;
    };
    
    const lessonDisplayNumber = getLessonDisplayNumber(lessonNumber);
    const lessonTitle = getLessonDisplayTitle(lessonNumber) || lessonData.title || `Lesson ${lessonDisplayNumber}`;

    // Get EYFS statements for this lesson
    const lessonEyfsStatements = lessonStandards[lessonNumber] || [];

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${lessonTitle}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>  
          @page {
            size: A4;
            margin: 1cm;
          }
          
          .lesson-page {
            width: 21cm;
            min-height: 29.7cm;
            padding: 1cm;
            margin: 0 auto 2cm auto;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            page-break-after: always;
            break-after: always;
          }
          
          .lesson-page:last-child {
            margin-bottom: 0;
          }
          
          @media print {
            .lesson-page {
              box-shadow: none;
              margin: 0;
              padding: 0;
              width: 100%;
              min-height: auto;
            }
            
            .lesson-page:not(:last-child) {
              page-break-after: always;
              break-after: always;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="lesson-page">
          <div class="mb-6">
            <h1 class="text-3xl font-bold mb-2">${lessonTitle}</h1>
            <p class="text-gray-600">${currentSheetInfo.display}</p>
          </div>
    `;

    // Add activities by category
    const categoryOrder = lessonData.categoryOrder || [];
    categoryOrder.forEach((category: string) => {
      const activities = lessonData.grouped[category] || [];
      if (activities.length > 0) {
        htmlContent += `
          <div class="mb-6">
            <h2 class="text-xl font-semibold mb-3 pb-2 border-b-2" style="border-color: ${getCategoryColor(category)}">
              ${category}
            </h2>
            <ul class="list-disc list-inside space-y-2">
        `;
        
        activities.forEach((activity: any) => {
          htmlContent += `<li class="text-gray-700">${activity.activity || activity.name || ''}</li>`;
        });
        
        htmlContent += `
            </ul>
          </div>
        `;
      }
    });

    // Add EYFS statements if available
    if (lessonEyfsStatements.length > 0) {
      htmlContent += `
        <div class="mt-8 pt-6 border-t-2 border-gray-300">
          <h2 class="text-xl font-semibold mb-3">EYFS Statements</h2>
          <ul class="list-disc list-inside space-y-2">
      `;
      
      lessonEyfsStatements.forEach((statement: string) => {
        htmlContent += `<li class="text-gray-700">${statement}</li>`;
      });
      
      htmlContent += `
          </ul>
        </div>
      `;
    }

    htmlContent += `
        </div>
      </body>
      </html>
    `;

    // Footer content
    const footerContent = `
      <div style="font-size: 10px; text-align: center; width: 100%; padding: 10px 0; color: #666;">
        <span>${currentSheetInfo.display} - ${lessonTitle}</span>
        <span style="margin: 0 10px;">|</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;

    return [htmlContent, footerContent];
  };

  // Encode to base64
  const encodeUnicodeBase64 = (str: string): string => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    let binaryString = '';
    for (let i = 0; i < data.length; i++) {
      binaryString += String.fromCharCode(data[i]);
    }
    return btoa(binaryString);
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  // Main share function
  const shareLesson = async (lessonNumber: string): Promise<string | null> => {
    setIsSharing(true);
    setShareUrl(null);
    setShareError(null);

    try {
      // Check bucket exists
      const bucketCheck = await ensureBucketExists();
      if (!bucketCheck.exists) {
        const setupUrl = 'https://supabase.com/dashboard/project/wiudrzdkbpyziaodqoog/storage/buckets';
        const errorMsg = bucketCheck.requiresManualSetup
          ? `The 'lesson-pdfs' storage bucket needs to be created.\n\nQuick Setup:\n1. Go to: ${setupUrl}\n2. Click "New bucket"\n3. Name: "lesson-pdfs"\n4. Enable "Public bucket"\n5. Click "Create bucket"`
          : `Storage bucket 'lesson-pdfs' does not exist. Error: ${bucketCheck.error || 'Unknown error'}`;
        
        throw new Error(errorMsg);
      }

      if (!PDFBOLT_API_KEY || PDFBOLT_API_KEY === 'd089165b-e1da-43bb-a7dc-625ce514ed1b') {
        throw new Error('Please set your PDFBolt API key in the environment variables (VITE_PDFBOLT_API_KEY)');
      }

      // Generate HTML content
      const [htmlContent, footerContent] = generateHTMLContent(lessonNumber);
      const encodedHtml = encodeUnicodeBase64(htmlContent);
      const encodedFooter = encodeUnicodeBase64(footerContent);

      // Generate PDF using PDFBolt API
      const response = await fetch(PDFBOLT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API_KEY': PDFBOLT_API_KEY
        },
        body: JSON.stringify({
          html: encodedHtml,
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
          footerTemplate: encodedFooter,
          headerTemplate: encodeUnicodeBase64(`<div></div>`)
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PDFBolt API Error: ${response.status} - ${errorText}`);
      }

      // Get PDF blob
      const pdfBlob = await response.blob();

      // Generate filename
      const getLessonDisplayNumber = (num: string): string => {
        const numericPart = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
        return numericPart || num;
      };
      
      const lessonDisplayNumber = getLessonDisplayNumber(lessonNumber);
      const timestamp = Date.now();
      const fileName = `${timestamp}_${currentSheetInfo.sheet}_Lesson_${lessonDisplayNumber}.pdf`;

      // Convert blob to base64 for Netlify function
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Upload via Netlify function to bypass RLS
      const netlifyFunctionUrl = '/.netlify/functions/upload-pdf';
      const uploadResponse = await fetch(netlifyFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          fileData: base64
        })
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `Upload failed: ${uploadResponse.status}`);
      }

      const { url: publicUrl } = await uploadResponse.json();
      
      if (!publicUrl) {
        throw new Error('No URL returned from upload');
      }
      setShareUrl(publicUrl);

      // Try to use Web Share API if available, otherwise copy to clipboard
      if (navigator.share) {
        try {
          await navigator.share({
            title: fileName,
            text: `Check out this lesson plan: ${fileName}`,
            url: publicUrl
          });
        } catch (shareError: any) {
          if (shareError.name !== 'AbortError') {
            await copyToClipboard(publicUrl);
          }
        }
      } else {
        await copyToClipboard(publicUrl);
      }

      return publicUrl;
    } catch (error: any) {
      console.error('Share failed:', error);
      setShareError(error.message);
      throw error;
    } finally {
      setIsSharing(false);
    }
  };

  return {
    shareLesson,
    isSharing,
    shareUrl,
    shareError
  };
}

