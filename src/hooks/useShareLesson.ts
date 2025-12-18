import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { supabase } from '../config/supabase';
import { customObjectivesApi } from '../config/customObjectivesApi';
import type { CustomObjective, CustomObjectiveArea, CustomObjectiveYearGroup } from '../types/customObjectives';
import type { Activity } from '../contexts/DataContext';

export function useShareLesson() {
  const { allLessonsData, currentSheetInfo, lessonStandards, halfTerms, getTermSpecificLessonNumber, getLessonDisplayTitle } = useData();
  const { getCategoryColor } = useSettings();
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [customObjectives, setCustomObjectives] = useState<CustomObjective[]>([]);
  const [customAreas, setCustomAreas] = useState<CustomObjectiveArea[]>([]);
  const [customYearGroups, setCustomYearGroups] = useState<CustomObjectiveYearGroup[]>([]);

  // Load custom objectives data
  useEffect(() => {
    const loadCustomObjectives = async () => {
      try {
        const [objectives, areas, yearGroups] = await Promise.all([
          customObjectivesApi.objectives.getAll(),
          customObjectivesApi.areas.getAll(),
          customObjectivesApi.yearGroups.getAll()
        ]);
        setCustomObjectives(objectives);
        setCustomAreas(areas);
        setCustomYearGroups(yearGroups);
      } catch (error) {
        console.warn('Failed to load custom objectives for PDF export:', error);
      }
    };
    loadCustomObjectives();
  }, []);

  // Get custom objectives for a lesson
  const getCustomObjectivesForLesson = (lessonNum: string) => {
    const lessonData = allLessonsData[lessonNum];
    if (!lessonData) return [];

    const lessonCustomObjectives: CustomObjective[] = [];
    
    if (lessonData.customObjectives && lessonData.customObjectives.length > 0) {
      lessonData.customObjectives.forEach(objectiveId => {
        const objective = customObjectives.find(obj => obj.id === objectiveId);
        if (objective) {
          lessonCustomObjectives.push(objective);
        }
      });
    }
    
    return lessonCustomObjectives;
  };

  // Get stored share URL for a lesson
  const getStoredShareUrl = (lessonNumber: string): string | null => {
    try {
      const stored = localStorage.getItem(`share-url-${lessonNumber}`);
      return stored ? JSON.parse(stored).url : null;
    } catch {
      return null;
    }
  };

  // Store share URL for a lesson
  const storeShareUrl = (lessonNumber: string, url: string) => {
    try {
      localStorage.setItem(`share-url-${lessonNumber}`, JSON.stringify({
        url,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to store share URL:', error);
    }
  };

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

  // Generate HTML content for PDF (full lesson plan version)
  const generateHTMLContent = (lessonNumber: string) => {
    const lessonData = allLessonsData[lessonNumber];
    if (!lessonData) return ['', ''];

    const getLessonDisplayNumber = (num: string): string => {
      const numericPart = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
      return numericPart || num;
    };
    
    const lessonDisplayNumber = getLessonDisplayNumber(lessonNumber);
    const lessonTitle = getLessonDisplayTitle(lessonNumber) || lessonData.title || `Lesson ${lessonDisplayNumber}`;
    
    // Get half-term info if available
    const halfTerm = halfTerms.find(ht => 
      ht.lessons && ht.lessons.includes(lessonNumber)
    );
    const halfTermName = halfTerm?.name || '';
    const termSpecificNumber = halfTerm ? getTermSpecificLessonNumber(lessonNumber, halfTerm.id) : lessonDisplayNumber;

    // Get EYFS statements for this lesson
    const lessonStandardsList = lessonStandards[lessonNumber] || [];
    
    // Group EYFS statements by area
    const groupedEyfs: Record<string, string[]> = {};
    lessonStandardsList.forEach(statement => {
      const parts = statement.split(':');
      const area = parts[0].trim();
      const detail = parts.length > 1 ? parts[1].trim() : statement;
      if (!groupedEyfs[area]) {
        groupedEyfs[area] = [];
      }
      groupedEyfs[area].push(detail);
    });

    // Get custom objectives for this lesson
    const lessonCustomObjectives = getCustomObjectivesForLesson(lessonNumber);
    
    // Group custom objectives by section, then by area
    const groupedCustomObjectives: Record<string, Record<string, CustomObjective[]>> = {};
    lessonCustomObjectives.forEach(objective => {
      const area = customAreas.find(a => a.id === objective.area_id);
      if (area) {
        const sectionName = area.section || 'Other';
        const areaName = area.name;
        if (!groupedCustomObjectives[sectionName]) {
          groupedCustomObjectives[sectionName] = {};
        }
        if (!groupedCustomObjectives[sectionName][areaName]) {
          groupedCustomObjectives[sectionName][areaName] = [];
        }
        groupedCustomObjectives[sectionName][areaName].push(objective);
      }
    });

    const hasCustomObjectives = Object.keys(groupedCustomObjectives).length > 0;
    const hasEyfsObjectives = lessonStandardsList.length > 0;
    const shouldShowCustom = hasCustomObjectives;
    const shouldShowEyfs = hasEyfsObjectives && !hasCustomObjectives;

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
        <div class="lesson-page bg-white">
          <div class="px-6 pt-3 pb-6">
            <!-- Lesson Title -->
            <div class="mb-3 border-b border-black pb-2">
              <h3 class="text-xl font-bold text-black">
                ${lessonData.customHeader || `Lesson ${termSpecificNumber}, ${halfTermName || 'Autumn 1'} - ${currentSheetInfo.display}, Music`}
              </h3>
            </div>
    `;

    // Add Learning Goals section if available
    if (shouldShowEyfs || shouldShowCustom) {
      htmlContent += `
        <div class="mb-4">
          <h3 class="text-base font-bold text-black mb-2 flex items-center space-x-2">
            <svg class="h-4 w-4 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
            </svg>
            <span>Learning Goals</span>
          </h3>
          <div class="grid grid-cols-2 gap-2">
      `;

      // Add EYFS objectives
      if (shouldShowEyfs) {
        Object.entries(groupedEyfs).forEach(([area, statements]) => {
          htmlContent += `
            <div class="rounded-lg p-2 border border-gray-800" style="background-color: #fffbeb;">
              <h4 class="font-bold text-black text-xs mb-1">${area}</h4>
              <ul class="space-y-0.5">
          `;
          statements.forEach(statement => {
            htmlContent += `
              <li class="flex items-start space-x-2 text-xs text-black">
                <span class="text-green-600 font-bold">✓</span>
                <span>${statement}</span>
              </li>
            `;
          });
          htmlContent += `</ul></div>`;
        });
      }

      // Add Custom objectives
      if (shouldShowCustom) {
        Object.entries(groupedCustomObjectives).forEach(([sectionName, areas]) => {
          Object.entries(areas).forEach(([areaName, objectives]) => {
            let displayTitle = areaName;
            if (sectionName && sectionName !== 'Other' && sectionName !== areaName) {
              if (!areaName.includes(sectionName)) {
                displayTitle = `${sectionName}, ${areaName}`;
              }
            }
            
            htmlContent += `
              <div class="rounded-lg p-2 border border-gray-800" style="background-color: #f3e8ff;">
                <h4 class="font-bold text-black text-xs mb-1">${displayTitle}</h4>
                <ul class="space-y-0.5">
            `;
            objectives.forEach(objective => {
              htmlContent += `
                <li class="flex items-start space-x-2 text-xs text-black">
                  <span class="text-purple-600 font-bold">✓</span>
                  <span>${objective.objective_text}</span>
                </li>
              `;
            });
            htmlContent += `</ul></div>`;
          });
        });
      }

      htmlContent += `</div></div>`;
    }

    // Add activities with full details
    const activitiesToPrint = lessonData.orderedActivities && lessonData.orderedActivities.length > 0
      ? lessonData.orderedActivities
      : (lessonData.categoryOrder || []).flatMap((category: string) => lessonData.grouped[category] || []);
    
    // Group activities by category for display
    const categoriesInOrder: string[] = [];
    const activitiesByCategory: Record<string, Activity[]> = {};
    
    activitiesToPrint.forEach((activity: Activity) => {
      if (!activitiesByCategory[activity.category]) {
        activitiesByCategory[activity.category] = [];
        categoriesInOrder.push(activity.category);
      }
      activitiesByCategory[activity.category].push(activity);
    });

    // Display activities by category
    categoriesInOrder.forEach(category => {
      const activities = activitiesByCategory[category] || [];
      if (activities.length === 0) return;

      const categoryColor = getCategoryColor(category);
      const categoryLightBorder = `${categoryColor}60`;
      const categoryColorStyle = `color: ${categoryColor};`;
      const borderColorStyle = `border-left-color: ${categoryColor};`;
      const categoryBgStyle = `background-color: ${categoryColor}20; border-bottom-color: ${categoryColor};`;

      htmlContent += `
        <div class="mb-4">
          <h2 class="text-sm font-bold mb-1 text-black border-b border-black pb-0.5" style="${categoryColorStyle} page-break-after: avoid;">
            ${category}
          </h2>
         
          <div class="space-y-2">
      `;

      activities.forEach(activity => {
        htmlContent += `
          <div class="bg-white rounded-lg border overflow-hidden" style="page-break-inside: avoid; border-left-width: 4px; ${borderColorStyle} border-color: ${categoryLightBorder};">
            <div class="px-2 py-0.5 border-b flex justify-between items-center" style="${categoryBgStyle}">
              <h3 class="font-bold text-black text-xs">
                ${activity.activity}
              </h3>
              ${activity.time > 0 ? `
                <div class="px-1 py-0.5 rounded-full text-xs font-bold" style="background-color: rgba(0,0,0,0.15); color: #374151;">
                  ${activity.time}m
                </div>
              ` : ''}
            </div>
           
            <div class="p-1.5">
              ${activity.activityText ? `
                <div class="mb-1 text-xs text-black font-medium">
                  ${activity.activityText}
                </div>
              ` : ''}
              
              <div class="text-sm text-gray-700">
                ${activity.description.includes('<')
                  ? activity.description
                  : activity.description.replace(/\n/g, '<br>')
                }
              </div>
        `;

        const resources = [];
        if (activity.videoLink) resources.push({ label: 'Video', url: activity.videoLink, classes: 'bg-red-100 text-red-800 border-red-300' });
        if (activity.musicLink) resources.push({ label: 'Music', url: activity.musicLink, classes: 'bg-green-100 text-green-800 border-green-300' });
        if (activity.backingLink) resources.push({ label: 'Backing', url: activity.backingLink, classes: 'bg-blue-100 text-blue-800 border-blue-300' });
        if (activity.resourceLink) resources.push({ label: 'Resource', url: activity.resourceLink, classes: 'bg-purple-100 text-purple-800 border-purple-300' });
        if (activity.link) resources.push({ label: 'Link', url: activity.link, classes: 'bg-gray-100 text-gray-800 border-gray-300' });
        if (activity.vocalsLink) resources.push({ label: 'Vocals', url: activity.vocalsLink, classes: 'bg-orange-100 text-orange-800 border-orange-300' });
        if (activity.imageLink) resources.push({ label: 'Image', url: activity.imageLink, classes: 'bg-pink-100 text-pink-800 border-pink-300' });

        if (resources.length > 0) {
          htmlContent += `
            <div class="mt-1 pt-1 border-t border-gray-600">
              <p class="text-xs font-bold text-black mb-0.5">Resources:</p>
              <div class="flex flex-wrap gap-0.5">
          `;
          resources.forEach(resource => {
            htmlContent += `
              <a href="${resource.url}"
                 class="inline-flex items-center px-1.5 py-0.5 text-xs rounded-full border font-bold ${resource.classes}"
                 target="_blank"
                 rel="noopener noreferrer">
                ${resource.label}
              </a>
            `;
          });
          htmlContent += `</div></div>`;
        }

        htmlContent += `</div></div>`;
      });

      htmlContent += `</div></div>`;
    });

    // Add notes if available
    if (lessonData.notes) {
      htmlContent += `
        <div class="mt-6 pt-4 border-t border-black">
          <h3 class="text-lg font-bold text-black mb-2">Lesson Notes</h3>
          <div class="bg-gray-200 rounded-lg p-3 text-black border border-gray-600">
            ${lessonData.notes}
          </div>
        </div>
      `;
    }

    htmlContent += `
          </div>
        </div>
      </body>
      </html>
    `;

    // Footer content
    const footerText = lessonData.customFooter || 
      ['Creative Curriculum Designer', `Lesson ${termSpecificNumber}`, currentSheetInfo.display, halfTermName, '© Rhythmstix 2025']
        .filter(Boolean)
        .join(' • ');
    
    const footerContent = `
      <div style="width: 100%; text-align: center; font-size: 11px; color: #000000; font-weight: bold;">
        <p>${footerText}</p>
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
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      // Try modern clipboard API first
      await navigator.clipboard.writeText(text);
      // Verify it worked by checking clipboard (if possible)
      return true;
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback:', err);
      // Fallback for older browsers or when clipboard API is blocked
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.opacity = '0';
        textArea.style.pointerEvents = 'none';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
          throw new Error('execCommand copy failed');
        }
        return true;
      } catch (fallbackErr) {
        console.error('Fallback clipboard copy failed:', fallbackErr);
        return false;
      }
    }
  };

  // Main share function
  const shareLesson = async (lessonNumber: string): Promise<string | null> => {
    // Prevent multiple simultaneous calls
    if (isSharing) {
      console.warn('Share already in progress, ignoring duplicate call');
      return null;
    }

    // Check if we already have a stored URL for this lesson FIRST
    // If it exists, just copy it to clipboard and return immediately - no PDF generation needed
    const storedUrl = getStoredShareUrl(lessonNumber);
    if (storedUrl) {
      console.log('✅ Found stored share URL for lesson', lessonNumber, '- reusing existing link');
      // Copy existing URL to clipboard
      const clipboardSuccess = await copyToClipboard(storedUrl);
      if (clipboardSuccess) {
        setShareUrl(storedUrl);
        // Don't set isSharing to true - we're just retrieving, not generating
        return storedUrl;
      } else {
        console.warn('⚠️ Failed to copy stored URL to clipboard, will generate new one');
        // If clipboard copy fails, continue to generate new PDF
      }
    }

    // Only proceed with PDF generation if no stored URL exists
    console.log('🔄 No stored URL found for lesson', lessonNumber, '- generating new PDF');
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

      // PDF generation is handled by Netlify function, no API key check needed here

      // Generate HTML content
      const [htmlContent, footerContent] = generateHTMLContent(lessonNumber);
      const encodedHtml = encodeUnicodeBase64(htmlContent);
      const encodedFooter = encodeUnicodeBase64(footerContent);

      // Generate filename
      const getLessonDisplayNumber = (num: string): string => {
        const numericPart = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
        return numericPart || num;
      };
      
      const lessonDisplayNumber = getLessonDisplayNumber(lessonNumber);
      const timestamp = Date.now();
      const fileName = `shared-pdfs/${timestamp}_${currentSheetInfo.sheet}_Lesson_${lessonDisplayNumber}.pdf`;

      // Use Netlify function to generate PDF and upload (bypasses CORS)
      // Use helper to route through Netlify subdomain on custom domains (fixes SSL issues)
      const { getNetlifyFunctionUrl } = await import('../utils/netlifyFunctions');
      const netlifyFunctionUrl = getNetlifyFunctionUrl('/.netlify/functions/generate-pdf');
      
      console.log('Generating PDF via Netlify function:', netlifyFunctionUrl);
      
      let uploadResponse;
      try {
        uploadResponse = await fetch(netlifyFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            html: encodedHtml,
            footerTemplate: encodedFooter,
            fileName: fileName
          })
        });
      } catch (fetchError: any) {
        console.error('Network error calling Netlify function:', fetchError);
        console.error('Function URL attempted:', netlifyFunctionUrl);
        throw new Error(`Failed to connect to PDF generation service. This might be a network issue or the function may not be deployed. Please check Netlify function logs. Error: ${fetchError.message || 'Network error'}`);
      }

      if (!uploadResponse.ok) {
        let errorText;
        try {
          errorText = await uploadResponse.text();
        } catch (textError) {
          throw new Error(`Upload failed with status ${uploadResponse.status}. Unable to read error message.`);
        }
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Upload failed' };
        }
        
        // If it's a server configuration error, provide helpful message
        if (errorData.error === 'Server configuration error' || uploadResponse.status === 500) {
          throw new Error('Server configuration error: Please ensure SUPABASE_SERVICE_ROLE_KEY is set in Netlify environment variables.');
        }
        
        // If function not found
        if (uploadResponse.status === 404) {
          throw new Error('Upload function not found. Please ensure the Netlify function is deployed correctly.');
        }
        
        throw new Error(errorData.error || `Upload failed: ${uploadResponse.status}`);
      }

      const responseData = await uploadResponse.json();
      const publicUrl = responseData.url || responseData.publicUrl;
      
      if (!publicUrl) {
        throw new Error('No URL returned from upload function');
      }
      
      // Store the URL for future retrieval
      storeShareUrl(lessonNumber, publicUrl);
      setShareUrl(publicUrl);

      // Copy to clipboard directly (no Web Share API dialog)
      const clipboardSuccess = await copyToClipboard(publicUrl);
      
      if (!clipboardSuccess) {
        throw new Error('Failed to copy URL to clipboard. Please copy it manually from the URL shown.');
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
    shareError,
    getStoredShareUrl
  };
}

