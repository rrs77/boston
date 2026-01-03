import React, { useState, useRef, useEffect } from 'react';
import { Download, X, Check, Tag, ChevronDown, Share2, Copy, Link2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { Activity } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { customObjectivesApi } from '../config/customObjectivesApi';
import type { CustomObjective, CustomObjectiveArea, CustomObjectiveYearGroup } from '../types/customObjectives';
import { supabase } from '../config/supabase';
import { useShareLesson } from '../hooks/useShareLesson';
import toast from 'react-hot-toast';

interface LessonPrintModalProps {
  lessonNumber?: string;
  onClose: () => void;
  halfTermId?: string;
  halfTermName?: string;
  unitId?: string;
  unitName?: string;
  lessonNumbers?: string[];
  isUnitPrint?: boolean;
}

export function LessonPrintModal({
                                   lessonNumber,
                                   onClose,
                                   halfTermId,
                                   halfTermName,
                                   unitId,
                                   unitName,
                                   lessonNumbers,
                                   isUnitPrint = false
                                 }: LessonPrintModalProps) {
  const { 
    allLessonsData, 
    currentSheetInfo, 
    lessonStandards, 
    halfTerms,
    getTermSpecificLessonNumber,
    getLessonDisplayTitle
  } = useData();
  const { getCategoryColor } = useSettings();
  const { shareLesson: shareSingleLesson, isSharing: isSharingSingle, getStoredShareUrl } = useShareLesson();
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [customObjectives, setCustomObjectives] = useState<CustomObjective[]>([]);
  const [customAreas, setCustomAreas] = useState<CustomObjectiveArea[]>([]);
  const [customYearGroups, setCustomYearGroups] = useState<CustomObjectiveYearGroup[]>([]);
  const [showEyfs, setShowEyfs] = useState(true);
  const [exportMode, setExportMode] = useState<'single' | 'unit'>(
      isUnitPrint || unitId || halfTermId ? 'unit' : 'single'
  );
  const previewRef = useRef<HTMLDivElement>(null);

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

  // Get custom objectives for a lesson (now stored at lesson level like EYFS statements)
  const getCustomObjectivesForLesson = (lessonNum: string) => {
    const lessonData = allLessonsData[lessonNum];
    if (!lessonData) {
      console.log('🔍 No lesson data found for:', lessonNum);
      return [];
    }

    console.log('🔍 Getting custom objectives for lesson:', lessonNum);
    console.log('🔍 Lesson customObjectives:', lessonData.customObjectives);
    console.log('🔍 Lesson curriculumType:', lessonData.curriculumType);
    
    // Get custom objectives stored at lesson level
    const lessonCustomObjectives: CustomObjective[] = [];
    
    if (lessonData.customObjectives && lessonData.customObjectives.length > 0) {
      // Find the custom objectives by their IDs
      lessonData.customObjectives.forEach(objectiveId => {
        const objective = customObjectives.find(obj => obj.id === objectiveId);
        if (objective) {
          lessonCustomObjectives.push(objective);
        }
      });
    }

    console.log('🔍 Total custom objectives for lesson:', lessonCustomObjectives);
    return lessonCustomObjectives;
  };

  // PDFBolt API configuration
const PDFBOLT_API_KEY = '146bdd01-146f-43f8-92aa-26201c38aa11'
  const PDFBOLT_API_URL = 'https://api.pdfbolt.com/v1/direct';

  // Temporary debugging - remove this later
  console.log('Environment check:', {
    apiKey: PDFBOLT_API_KEY,
    allEnvVars: import.meta.env
  });

  // Determine which lessons to print - FIXED ORDER
  const lessonsToRender = React.useMemo(() => {
    let lessons: string[] = [];

    if (exportMode === 'single' && lessonNumber) {
      lessons = [lessonNumber];
    } else if (lessonNumbers && lessonNumbers.length > 0) {
      lessons = [...lessonNumbers];
    } else if (unitId) {
      // Find the unit and get its lessons
      const units = JSON.parse(localStorage.getItem(`units-${currentSheetInfo.sheet}`) || '[]');
      const unit = units.find((u: any) => u.id === unitId);
      lessons = unit?.lessonNumbers || [];
    } else if (halfTermId) {
      // Get lessons for half-term
      const halfTerm = halfTerms.find(term => term.id === halfTermId);
      lessons = halfTerm?.lessons || [];
    } else if (lessonNumber) {
      lessons = [lessonNumber];
    }

    // Sort lessons numerically
    return lessons.sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      return numA - numB;
    });
  }, [exportMode, lessonNumber, lessonNumbers, unitId, halfTermId, halfTerms, currentSheetInfo.sheet]);

  // Get the title for the print
  const printTitle = React.useMemo(() => {
    if (exportMode === 'single' && lessonNumber) {
      const lessonData = allLessonsData[lessonNumber];
      return lessonData?.title || `Lesson ${lessonNumber}`;
    } else if (unitName) {
      return `Unit: ${unitName}`;
    } else if (halfTermName) {
      return `Half-Term: ${halfTermName}`;
    }
    return 'Lesson Plan';
  }, [exportMode, lessonNumber, unitName, halfTermName, allLessonsData]);

  // Generate HTML content for PDFBolt with Tailwind CSS
  const generateHTMLContent = () => {
    let footerContent

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${printTitle}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>  
          /* Page setup for A4 */
          @page {
            size: A4;
            margin: 1cm;
          }
          
          /* Lesson page styling - visible in preview */
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
          
          /* Print media styles */
          @media print {
            .page-header {
              display: none;
            }
            
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
           
            .print-border {
              border: 2px solid #000000 !important;
            }
           
            .print-text-dark {
              color: #000000 !important;
            }
           
            .print-bg-light {
              background-color: #f8f9fa !important;
            }
           
            .print-border-dark {
              border-color: #333333 !important;
            }
          }
        </style>
      </head>
      <body>
        <div>
          <div>
    `;

    lessonsToRender.forEach((lessonNum, lessonIndex) => {
      const lessonData = allLessonsData[lessonNum];
      if (!lessonData) return;

      // Extract numeric lesson number (handle "lesson1" format)
      const getLessonDisplayNumber = (num: string): string => {
        const numericPart = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
        return numericPart || num;
      };
      
      const lessonDisplayNumber = getLessonDisplayNumber(lessonNum);
      const termSpecificNumber = halfTermId ? getTermSpecificLessonNumber(lessonNum, halfTermId) : lessonDisplayNumber;

      // Debug custom header/footer
      console.log(`📄 Print - Lesson ${lessonNum} Header/Footer:`, {
        customHeader: lessonData.customHeader,
        customFooter: lessonData.customFooter,
        hasCustomHeader: !!lessonData.customHeader,
        hasCustomFooter: !!lessonData.customFooter,
        lessonDisplayNumber,
        termSpecificNumber
      });

      // Use custom footer if available, otherwise use default with correct lesson number
      const footerText = lessonData.customFooter || 
        ['Creative Curriculum Designer', `Lesson ${termSpecificNumber}`, currentSheetInfo.display, halfTermName || unitName, '© Rhythmstix 2026']
          .filter(Boolean)
          .join(' • ');
      
      footerContent = `<div
           style="width: 100%; text-align: center; font-size: 11px; color: #000000; font-weight: bold;">
        <p>${footerText}</p>
      </div>`

      const lessonStandardsList = lessonStandards[lessonNum] || lessonStandards[lessonIndex + 1] || lessonStandards[(lessonIndex + 1).toString()] || [];

      // Debug EYFS data - try multiple key formats
      console.log(`Looking for EYFS data:`, {
        lessonNum,
        lessonIndex: lessonIndex + 1,
        foundData: lessonStandardsList,
        availableKeys: Object.keys(lessonStandards)
      });

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

      htmlContent += `
        <div class="lesson-page bg-white">
          <div class="page-header bg-blue-50 px-6 py-3 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-blue-800">
                Lesson ${termSpecificNumber} Preview
              </span>
              <span class="text-xs text-blue-600">
                Page ${lessonIndex + 1} of ${lessonsToRender.length}
              </span>
            </div>
          </div>

          <!-- Lesson Content -->
          <div class="px-6 pt-3 pb-6">
            <!-- Lesson Title -->
            <div class="mb-3 border-b border-black pb-2">
              <h3 class="text-xl font-bold text-black">
                ${lessonData.customHeader || `Lesson ${termSpecificNumber}, ${halfTermName || unitName || 'Autumn 1'} - ${currentSheetInfo.display}, Music`}
              </h3>
            </div>
      `;

      // Get custom objectives for this lesson
      const lessonCustomObjectives = getCustomObjectivesForLesson(lessonNum);
      
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

      // Add Learning Goals section if enabled and has objectives
      // Prioritize based on what was actually edited
      // If lesson has custom objectives, show those. If lesson has EYFS, show those.
      const hasCustomObjectives = Object.keys(groupedCustomObjectives).length > 0;
      const hasEyfsObjectives = lessonStandardsList.length > 0;
      
      // Show custom objectives if they exist, otherwise show EYFS if they exist
      const shouldShowCustom = showEyfs && hasCustomObjectives;
      const shouldShowEyfs = showEyfs && hasEyfsObjectives && !hasCustomObjectives;
      
      console.log('🔍 PDF Generation Debug for lesson', lessonNum, {
        showEyfs,
        lessonStandardsList: lessonStandardsList.length,
        lessonCustomObjectives: lessonCustomObjectives.length,
        groupedCustomObjectives: Object.keys(groupedCustomObjectives).length,
        hasCustomObjectives,
        shouldShowEyfs,
        shouldShowCustom
      });
      
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

        // Add EYFS objectives only if no custom objectives exist
        if (shouldShowEyfs) {
          console.log('🔍 Rendering EYFS objectives for lesson', lessonNum);
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

        // Add Custom objectives (prioritized over EYFS) - displaying by area with section context
        if (shouldShowCustom) {
          console.log('🔍 Rendering Custom objectives for lesson', lessonNum);
          // Iterate through sections and their areas
          Object.entries(groupedCustomObjectives).forEach(([sectionName, areas]) => {
            Object.entries(areas).forEach(([areaName, objectives]) => {
              // Display title: If section exists and differs from area, show both; otherwise just area
              let displayTitle = areaName;
              if (sectionName && sectionName !== 'Other' && sectionName !== areaName) {
                // Check if the area name already contains the section (e.g., "Communication and Language - Speaking")
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

      // Add activities - use orderedActivities if available for correct order, otherwise fall back to categoryOrder
      console.log(`🖨️ Print Debug for Lesson ${lessonNum}:`, {
        hasOrderedActivities: !!(lessonData.orderedActivities && lessonData.orderedActivities.length > 0),
        orderedActivitiesCount: lessonData.orderedActivities?.length || 0,
        orderedActivities: lessonData.orderedActivities?.map((a: Activity) => a.activity) || [],
        categoryOrderCount: lessonData.categoryOrder?.length || 0,
        categoryOrder: lessonData.categoryOrder || []
      });
      
      const activitiesToPrint = lessonData.orderedActivities && lessonData.orderedActivities.length > 0
        ? lessonData.orderedActivities
        : lessonData.categoryOrder.flatMap(category => lessonData.grouped[category] || []);
      
      console.log(`🖨️ Activities to print (${activitiesToPrint.length}):`, activitiesToPrint.map((a: Activity) => a.activity));

      // Group activities by category for display
      const categoriesInOrder: string[] = [];
      const activitiesByCategory: Record<string, Activity[]> = {};
      
      activitiesToPrint.forEach(activity => {
        if (!activitiesByCategory[activity.category]) {
          activitiesByCategory[activity.category] = [];
          categoriesInOrder.push(activity.category);
        }
        activitiesByCategory[activity.category].push(activity);
      });

      // Display activities by category in the order they appear
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
              <!-- Activity Header -->
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
          if (activity.videoLink) resources.push({
            label: 'Video',
            url: activity.videoLink,
            classes: 'bg-red-100 text-red-800 border-red-300'
          });
          if (activity.musicLink) resources.push({
            label: 'Music',
            url: activity.musicLink,
            classes: 'bg-green-100 text-green-800 border-green-300'
          });
          if (activity.backingLink) resources.push({
            label: 'Backing',
            url: activity.backingLink,
            classes: 'bg-blue-100 text-blue-800 border-blue-300'
          });
          if (activity.resourceLink) resources.push({
            label: 'Resource',
            url: activity.resourceLink,
            classes: 'bg-purple-100 text-purple-800 border-purple-300'
          });
          if (activity.link) resources.push({
            label: 'Link',
            url: activity.link,
            classes: 'bg-gray-100 text-gray-800 border-gray-300'
          });
          if (activity.vocalsLink) resources.push({
            label: 'Vocals',
            url: activity.vocalsLink,
            classes: 'bg-orange-100 text-orange-800 border-orange-300'
          });
          if (activity.imageLink) resources.push({
            label: 'Image',
            url: activity.imageLink,
            classes: 'bg-pink-100 text-pink-800 border-pink-300'
          });

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
      `;
    });

    htmlContent += `
        </div>
        </div>
      </body>
      </html>
    `;

    return [htmlContent, footerContent];
  };

  if (lessonsToRender.length === 0) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-card shadow-soft p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">No lessons found to print.</p>
            <div className="flex justify-end">
              <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
    );
  }

  // PDFBolt API requires HTML content to be base64 encoded
  const encodeUnicodeBase64 = function (str: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);

    let binaryString = '';
    for (let i = 0; i < data.length; i++) {
      binaryString += String.fromCharCode(data[i]);
    }
    return btoa(binaryString);
  };

  const handleExport = async () => {
    if (!PDFBOLT_API_KEY || PDFBOLT_API_KEY === 'd089165b-e1da-43bb-a7dc-625ce514ed1b') {
      toast.error('Please set your PDFBolt API key in the environment variables (VITE_PDFBOLT_API_KEY)', {
        duration: 5000,
      });
      return;
    }

    setIsExporting(true);
    try {
      const htmlContent = encodeUnicodeBase64(generateHTMLContent()[0]);
      const footerContent = encodeUnicodeBase64(generateHTMLContent()[1]);

      console.log('Sending request to PDFBolt API...');
      console.log('API Key:', PDFBOLT_API_KEY ? 'Set' : 'Not set');
      console.log('HTML content length:', htmlContent.length);

      // PDFBolt API request - try with different format
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

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        // Try to get more details about the error
        const errorText = await response.text();
        console.error('PDFBolt API Error Details:', errorText);
        throw new Error(`PDFBolt API Error: ${response.status} - ${errorText}`);
      }

      // Get the PDF as a blob
      const pdfBlob = await response.blob();
      console.log('PDF blob received, size:', pdfBlob.size);

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;

      // Set filename - use lesson number in filename
      // Extract numeric lesson number (handle "lesson1" format)
      const getLessonDisplayNumber = (num: string): string => {
        const numericPart = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
        return numericPart || num;
      };
      
      const fileName = exportMode === 'single'
          ? (() => {
              const lessonDisplayNumber = getLessonDisplayNumber(lessonNumber!);
              return `${currentSheetInfo.sheet}_Lesson_${lessonDisplayNumber}.pdf`;
            })()
          : `${currentSheetInfo.sheet}_${(unitName || halfTermName || 'Unit').replace(/\s+/g, '_')}.pdf`;

      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportSuccess(true);
      toast.success('PDF exported successfully!', {
        duration: 3000,
        icon: '📄',
      });
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(error.message || 'Failed to export PDF', {
        duration: 5000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Check and create bucket if it doesn't exist
  const ensureBucketExists = async () => {
    const bucketName = 'lesson-pdfs';
    
    // Try to access the bucket directly instead of listing all buckets
    // This works with anon key if bucket exists and is public
    try {
      // Try to list files in the bucket (empty list is fine, just checking access)
      const { data: files, error: accessError } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 1 });
      
      // If we can access the bucket (even if empty), it exists
      if (!accessError) {
        console.log('✅ Bucket exists and is accessible');
        return { exists: true, created: false };
      }
      
      // If error is "Bucket not found", bucket doesn't exist
      if (accessError.message?.includes('not found') || accessError.message?.includes('Bucket not found')) {
        console.log('Bucket does not exist, attempting to create...');
        // Try to create the bucket (will fail with anon key, but we'll show helpful message)
        const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 52428800,
          allowedMimeTypes: ['application/pdf']
        });
        
        if (createError) {
          console.error('Error creating bucket:', createError);
          return { exists: false, error: createError.message, requiresManualSetup: true };
        }
        
        console.log('Bucket created successfully:', newBucket);
        return { exists: true, created: true };
      }
      
      // Other errors (permissions, etc.)
      console.error('Error accessing bucket:', accessError);
      return { exists: false, error: accessError.message, requiresManualSetup: true };
      
    } catch (error: any) {
      console.error('Unexpected error checking bucket:', error);
      return { exists: false, error: error.message || 'Unknown error', requiresManualSetup: true };
    }
  };

  const handleShare = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent default behavior and event propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Prevent multiple simultaneous calls
    if (isSharing || isSharingSingle) {
      return;
    }

    // For single lesson, use the useShareLesson hook
    // The hook already checks localStorage internally and will reuse existing URLs
    if (exportMode === 'single' && lessonNumber) {
      try {
        // Check if URL already exists in localStorage before calling shareSingleLesson
        // This allows us to show the right message (retrieved vs created)
        const storedUrl = getStoredShareUrl ? getStoredShareUrl(lessonNumber) : null;
        const wasStored = !!storedUrl;
        
        // Only set loading state if we're actually generating a new PDF
        if (!wasStored) {
          setIsSharing(true);
          setShareSuccess(false);
        }
        
        // shareSingleLesson will check localStorage internally and return immediately if found
        const url = await shareSingleLesson(lessonNumber);
        if (url) {
          setShareUrl(url);
          setShareSuccess(true);
          
          if (wasStored) {
            // URL was retrieved from localStorage - no PDF generation happened
            toast.success('Share link retrieved! URL copied to clipboard.', {
              duration: 4000,
              icon: '🔗',
            });
          } else {
            // New PDF was generated
            toast.success('Share link created! URL copied to clipboard.', {
              duration: 4000,
              icon: '🔗',
            });
            
            // Scroll to the share URL display area after a brief delay
            setTimeout(() => {
              const shareUrlElement = document.querySelector('[data-share-url]');
              if (shareUrlElement) {
                shareUrlElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }, 100);
          }
        }
      } catch (error: any) {
        console.error('Share error:', error);
        setShareSuccess(false);
        toast.error(error.message || 'Failed to create share link', {
          duration: 5000,
        });
      } finally {
        setIsSharing(false);
        setIsSharingSingle(false);
      }
      return;
    }

    // For unit/half-term sharing, use custom implementation
    if (!PDFBOLT_API_KEY || PDFBOLT_API_KEY === 'd089165b-e1da-43bb-a7dc-625ce514ed1b') {
      toast.error('Please set your PDFBolt API key in the environment variables (VITE_PDFBOLT_API_KEY)', {
        duration: 5000,
      });
      return;
    }

    setIsSharing(true);
    setShareUrl(null);
    setShareSuccess(false);

    try {
      // Ensure bucket exists before proceeding
      const bucketCheck = await ensureBucketExists();
      if (!bucketCheck.exists) {
        const setupUrl = 'https://supabase.com/dashboard/project/wiudrzdkbpyziaodqoog/storage/buckets';
        const errorMsg = bucketCheck.requiresManualSetup
          ? `The 'lesson-pdfs' storage bucket needs to be created.\n\nQuick Setup:\n1. Go to: ${setupUrl}\n2. Click "New bucket"\n3. Name: "lesson-pdfs"\n4. Enable "Public bucket"\n5. Click "Create bucket"`
          : `Storage bucket 'lesson-pdfs' does not exist. Error: ${bucketCheck.error || 'Unknown error'}`;
        
        toast.error(errorMsg, {
          duration: 8000,
        });
        throw new Error('Storage bucket not configured');
      }

      // Generate PDF using PDFBolt API (same as export)
      const htmlContent = encodeUnicodeBase64(generateHTMLContent()[0]);
      const footerContent = encodeUnicodeBase64(generateHTMLContent()[1]);

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
      
      const timestamp = Date.now();
      const fileName = exportMode === 'single'
          ? (() => {
              const lessonDisplayNumber = getLessonDisplayNumber(lessonNumber!);
              return `${timestamp}_${currentSheetInfo.sheet}_Lesson_${lessonDisplayNumber}.pdf`;
            })()
          : `${timestamp}_${currentSheetInfo.sheet}_${(unitName || halfTermName || 'Unit').replace(/\s+/g, '_')}.pdf`;

      // Convert blob to base64 for Netlify function
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Upload via Netlify function to bypass RLS
      // Use helper to route through Netlify subdomain on custom domains (fixes SSL issues)
      const { getNetlifyFunctionUrl } = await import('../utils/netlifyFunctions');
      const netlifyFunctionUrl = getNetlifyFunctionUrl('/.netlify/functions/upload-pdf');
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
        console.error('Upload error:', errorData);
        throw new Error(errorData.error || `Failed to upload PDF: ${uploadResponse.status}`);
      }

      const { url: publicUrl } = await uploadResponse.json();
      
      if (!publicUrl) {
        throw new Error('No URL returned from upload');
      }
      
      // Set share URL and success state immediately so it appears right away
      setShareUrl(publicUrl);
      setShareSuccess(true);
      
      // Scroll to the share URL display area after a brief delay
      setTimeout(() => {
        const shareUrlElement = document.querySelector('[data-share-url]');
        if (shareUrlElement) {
          shareUrlElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);

      // Copy to clipboard directly - NO native sharing, NO window.open, NO auto-open
      // This is the ONLY action allowed - clipboard copy only
      const clipboardSuccess = await copyToClipboard(publicUrl);
      
      if (!clipboardSuccess) {
        throw new Error('Failed to copy URL to clipboard. Please copy it manually from the URL shown.');
      }
      
      // Store the URL for future retrieval
      try {
        localStorage.setItem(`share-url-unit-${unitId || halfTermId || 'unknown'}`, JSON.stringify({
          url: publicUrl,
          timestamp: Date.now()
        }));
      } catch (storageError) {
        console.warn('Failed to store share URL:', storageError);
      }
      
    } catch (error: any) {
      console.error('Share failed:', error);
      toast.error(error.message || 'Failed to create share link', {
        duration: 5000,
      });
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Shareable URL copied to clipboard!', {
        duration: 3000,
        icon: '📋',
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback: create a temporary textarea
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        toast.success('Shareable URL copied to clipboard!', {
          duration: 3000,
          icon: '📋',
        });
      } catch (err) {
        toast.error(`Failed to copy URL. Here it is: ${text}`, {
          duration: 8000,
        });
      }
      document.body.removeChild(textarea);
    }
  };

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
        <div className="bg-white rounded-card shadow-soft w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isUnitPrint ? "Export Half-Term Plans" : "Export Lesson Plan"}
              </h2>
              <p className="text-sm text-gray-600">
                {printTitle} - {currentSheetInfo.display} ({lessonsToRender.length} lesson{lessonsToRender.length !== 1 ? 's' : ''})
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* REMOVED: No toggle buttons when printing from Unit Viewer (isUnitPrint = true) */}
              {!isUnitPrint && (halfTermId || (lessonNumbers && lessonNumbers.length > 1)) && (
                  <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setExportMode('single')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                            exportMode === 'single'
                                ? 'bg-white shadow-sm text-gray-900'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      Single Lesson
                    </button>
                    <button
                        onClick={() => setExportMode('unit')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                            exportMode === 'unit'
                                ? 'bg-white shadow-sm text-gray-900'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      {halfTermName ? 'Entire Half-Term' : 'All Lessons'}
                    </button>
                  </div>
              )}

              {/* Show unit info when printing from Unit Viewer */}
              {unitId && unitName && (
                  <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                    <span className="font-medium text-blue-800">Unit Print:</span> {unitName}
                  </div>
              )}

              <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Lessons: {lessonsToRender.map((_, index) => index + 1).join(', ')}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                    onClick={handleExport}
                    disabled={isExporting || isSharing}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 disabled:bg-blue-400"
                >
                  {isExporting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Exporting...</span>
                      </>
                  ) : exportSuccess ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Exported!</span>
                      </>
                  ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Export PDF</span>
                      </>
                  )}
                </button>
                <div 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    if (!isExporting && !isSharing && !isSharingSingle) {
                      handleShare(e as any);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  role="button"
                  aria-label="Copy share link to clipboard"
                  className={`px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 cursor-pointer ${
                    isExporting || isSharing || isSharingSingle ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isExporting && !isSharing && !isSharingSingle) {
                        handleShare(e as any);
                      }
                    }
                  }}
                >
                  {(isSharing || isSharingSingle) ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Copying...</span>
                      </>
                  ) : shareSuccess ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Copied!</span>
                      </>
                  ) : (
                      <>
                        <Link2 className="h-4 w-4" aria-hidden="true" />
                        <span>Copy Link</span>
                      </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Share URL Display - Show immediately when share is successful, moved outside options */}
          {shareUrl && shareSuccess && (
            <div 
              data-share-url
              className="p-4 border-t border-teal-200 bg-teal-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-teal-900 mb-1">Shareable URL:</p>
                  <p className="text-xs text-teal-700 break-all">{shareUrl}</p>
                </div>
                <button
                    onClick={() => copyToClipboard(shareUrl)}
                    className="ml-3 p-2 text-teal-600 hover:text-teal-800 hover:bg-teal-100 rounded-lg transition-colors"
                    title="Copy URL"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Preview - Each lesson as a separate "page" */}
          <div 
            className="flex-1 overflow-y-auto print-preview-container"
            style={{
              minHeight: 0,
              maxHeight: 'calc(90vh - 300px)',
              overflowY: 'auto',
              overflowX: 'hidden',
              backgroundColor: '#e5e7eb',
              padding: '20px'
            }}
          >
            {/* Render each lesson as a separate page-like container */}
            {lessonsToRender.map((lessonNum, lessonIndex) => {
              const lessonData = allLessonsData[lessonNum];
              if (!lessonData) return null;

              // Debug lesson data
              console.log(`Lesson ${lessonNum} data:`, {
                title: lessonData.title,
                lessonNum,
                lessonIndex,
                categoryOrder: lessonData.categoryOrder,
                grouped: Object.keys(lessonData.grouped || {})
              });

              const lessonStandardsList = lessonStandards[lessonNum] || lessonStandards[lessonIndex + 1] || lessonStandards[(lessonIndex + 1).toString()] || [];

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

              return (
                  <div
                      key={lessonNum}
                      className="lesson-page print-preview-page"
                      style={{
                        width: '210mm',
                        minHeight: '297mm',
                        margin: '0 auto 40px auto',
                        background: 'white',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 10px 30px rgba(0, 0, 0, 0.15)',
                        position: 'relative',
                        pageBreakAfter: lessonIndex < lessonsToRender.length - 1 ? 'always' : 'auto',
                        breakAfter: lessonIndex < lessonsToRender.length - 1 ? 'page' : 'auto',
                        border: '1px solid #d1d5db',
                        padding: '1cm',
                        boxSizing: 'border-box'
                      }}
                  >
                      {/* Page Header */}
                      <div className="bg-blue-50 px-6 py-3 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-800">
                        {(() => {
                          // Extract numeric lesson number (handle "lesson1" format)
                          const getLessonDisplayNumber = (num: string): string => {
                            const numericPart = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
                            return numericPart || num;
                          };
                          const lessonDisplayNumber = getLessonDisplayNumber(lessonNum);
                          const termSpecificNumber = halfTermId ? getTermSpecificLessonNumber(lessonNum, halfTermId) : lessonDisplayNumber;
                          return `Lesson ${termSpecificNumber}, ${halfTermName || unitName || 'Autumn 1'} - Lesson Preview`;
                        })()}
                      </span>
                          <span className="text-xs text-blue-600">
                        Page {lessonIndex + 1} of {lessonsToRender.length}
                      </span>
                        </div>
                      </div>

                      {/* Lesson Content - Match PDF export structure exactly (px-6 pt-3 pb-6 matches PDF) */}
                      <div className="px-6 pt-3 pb-6">
                        {/* Lesson Title */}
                        <div className="mb-3 border-b border-black pb-2">
                          <h3 className="text-xl font-bold text-black">
                            {lessonData.customHeader || (() => {
                              // Extract numeric lesson number (handle "lesson1" format)
                              const getLessonDisplayNumber = (num: string): string => {
                                const numericPart = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
                                return numericPart || num;
                              };
                              const lessonDisplayNumber = getLessonDisplayNumber(lessonNum);
                              const termSpecificNumber = halfTermId ? getTermSpecificLessonNumber(lessonNum, halfTermId) : lessonDisplayNumber;
                              return `Lesson ${termSpecificNumber}, ${halfTermName || unitName || 'Autumn 1'} - ${currentSheetInfo.display}, Music`;
                            })()}
                          </h3>
                        </div>

                        {/* Learning Goals - Same logic as PDF export */}
                        {(() => {
                          // Get custom objectives for this lesson (same logic as PDF export)
                          const lessonCustomObjectives = getCustomObjectivesForLesson(lessonNum);
                          
                          // Group custom objectives by area
                          const groupedCustomObjectives: Record<string, CustomObjective[]> = {};
                          lessonCustomObjectives.forEach(objective => {
                            const area = customAreas.find(a => a.id === objective.area_id);
                            if (area) {
                              if (!groupedCustomObjectives[area.name]) {
                                groupedCustomObjectives[area.name] = [];
                              }
                              groupedCustomObjectives[area.name].push(objective);
                            }
                          });

                          // Prioritize based on what was actually edited
                          // If lesson has custom objectives, show those. If lesson has EYFS, show those.
                          const hasCustomObjectives = Object.keys(groupedCustomObjectives).length > 0;
                          const hasEyfsObjectives = lessonStandardsList.length > 0;
                          
                          // Show custom objectives if they exist, otherwise show EYFS if they exist
                          const shouldShowCustom = showEyfs && hasCustomObjectives;
                          const shouldShowEyfs = showEyfs && hasEyfsObjectives && !hasCustomObjectives;
                          
                          if (shouldShowEyfs || shouldShowCustom) {
                            return (
                              <div className="mb-4">
                                <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                                  <Tag className="h-4 w-4 text-blue-600" />
                                  <span>Learning Goals</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {/* EYFS objectives only if no custom objectives exist */}
                                  {shouldShowEyfs && Object.entries(groupedEyfs).map(([area, statements]) => (
                                    <div key={area} className="bg-yellow-50 rounded-lg p-2 border border-gray-200">
                                      <h4 className="font-medium text-gray-800 text-xs mb-1">{area}</h4>
                                      <ul className="space-y-0.5">
                                        {statements.map((statement, index) => (
                                          <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                                            <span className="text-green-500 font-bold">✓</span>
                                            <span>{statement}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                  
                                  {/* Custom objectives (prioritized over EYFS) */}
                                  {shouldShowCustom && Object.entries(groupedCustomObjectives).map(([areaName, objectives]) => (
                                    <div key={areaName} className="bg-purple-50 rounded-lg p-2 border border-gray-200">
                                      <h4 className="font-medium text-gray-800 text-xs mb-1">{areaName}</h4>
                                      <ul className="space-y-0.5">
                                        {objectives.map((objective) => (
                                          <li key={objective.id} className="flex items-start space-x-2 text-sm text-gray-700">
                                            <span className="text-purple-500 font-bold">✓</span>
                                            <span>{objective.objective_text}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Activities by Category */}
                        {lessonData.categoryOrder.map((category) => {
                          const activities = lessonData.grouped[category] || [];
                          if (activities.length === 0) return null;

                          const categoryColor = getCategoryColor(category);

                          // Get category background color for activity headers (SAME AS PDF)
                          const getCategoryBgColor = (cat: string) => {
                            switch(cat) {
                              case 'Welcome': return '#FEF3C7'; // Light amber
                              case 'Kodaly Songs': return '#EDE9FE'; // Light purple
                              case 'Goodbye': return '#D1FAE5'; // Light emerald
                              default: return `${categoryColor}20`; // 20% opacity of category color
                            }
                          };

                          // Get category light border color (SAME AS PDF)
                          const getCategoryLightBorder = (cat: string) => {
                            switch(cat) {
                              case 'Welcome': return '#FDE68A'; // Lighter amber
                              case 'Kodaly Songs': return '#DDD6FE'; // Lighter purple
                              case 'Goodbye': return '#A7F3D0'; // Lighter emerald
                              default: return `${categoryColor}60`; // 60% opacity of category color
                            }
                          };

                          return (
                              <div key={category} className="mb-4">
                                <h2
                                    className="text-sm font-bold mb-1 text-black border-b border-black pb-0.5"
                                    style={{
                                      color: categoryColor
                                    }}
                                >
                                  {category}
                                </h2>

                                <div className="space-y-2">
                                  {activities.map((activity, index) => (
                                      <div
                                          key={`${category}-${index}`}
                                          className="bg-white rounded-lg border overflow-hidden"
                                          style={{
                                            borderLeftWidth: '4px',
                                            borderLeftColor: categoryColor,
                                            borderColor: getCategoryLightBorder(category)
                                          }}
                                      >
                                        {/* Activity Header */}
                                        <div
                                            className="px-2 py-0.5 border-b flex justify-between items-center"
                                            style={{
                                              backgroundColor: getCategoryBgColor(category),
                                              borderBottomColor: categoryColor
                                            }}
                                        >
                                          <h3 className="text-xs font-bold text-black">
                                            {activity.activity}
                                          </h3>
                                          {activity.time > 0 && (
                                              <div
                                                  className="px-1 py-0.5 rounded-full text-xs font-bold"
                                                  style={{
                                                    backgroundColor: 'rgba(0,0,0,0.15)',
                                                    color: '#374151'
                                                  }}
                                              >
                                                {activity.time}m
                                              </div>
                                          )}
                                        </div>

                                        {/* Activity Content */}
                                        <div className="p-1.5">
                                          {/* Activity Text (if available) */}
                                          {activity.activityText && (
                                              <div
                                                  className="mb-1 text-xs text-black font-medium"
                                                  dangerouslySetInnerHTML={{ __html: activity.activityText }}
                                              />
                                          )}

                                          {/* Description */}
                                          <div
                                              className={`text-xs text-black ${activity.activityText ? 'pt-1.5 border-t border-gray-300' : ''}`}
                                              dangerouslySetInnerHTML={{
                                                __html: activity.description.includes('<') ?
                                                    activity.description :
                                                    activity.description.replace(/\n/g, '<br>')
                                              }}
                                          />

                                          {/* Resources */}
                                          {(activity.videoLink || activity.musicLink || activity.backingLink ||
                                              activity.resourceLink || activity.link || activity.vocalsLink ||
                                              activity.imageLink) && (
                                              <div className="mt-1 pt-1 border-t border-gray-600">
                                                <p className="text-xs font-bold text-black mb-0.5">Resources:</p>
                                                <div className="flex flex-wrap gap-0.5">
                                                  {activity.videoLink && (
                                                      <a
                                                          href={activity.videoLink}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="inline-flex items-center px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded-full hover:bg-red-200 transition-colors"
                                                      >
                                                        Video
                                                      </a>
                                                  )}
                                                  {activity.musicLink && (
                                                      <a
                                                          href={activity.musicLink}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="inline-flex items-center px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full hover:bg-green-200 transition-colors"
                                                      >
                                                        Music
                                                      </a>
                                                  )}
                                                  {activity.backingLink && (
                                                      <a
                                                          href={activity.backingLink}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full hover:bg-blue-200 transition-colors"
                                                      >
                                                        Backing
                                                      </a>
                                                  )}
                                                  {activity.resourceLink && (
                                                      <a
                                                          href={activity.resourceLink}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full hover:bg-purple-200 transition-colors"
                                                      >
                                                        Resource
                                                      </a>
                                                  )}
                                                  {activity.link && (
                                                      <a
                                                          href={activity.link}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full hover:bg-gray-200 transition-colors"
                                                      >
                                                        Link
                                                      </a>
                                                  )}
                                                  {activity.vocalsLink && (
                                                      <a
                                                          href={activity.vocalsLink}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="inline-flex items-center px-1.5 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full hover:bg-orange-200 transition-colors"
                                                      >
                                                        Vocals
                                                      </a>
                                                  )}
                                                  {activity.imageLink && (
                                                      <a
                                                          href={activity.imageLink}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="inline-flex items-center px-1.5 py-0.5 bg-pink-100 text-pink-800 text-xs rounded-full hover:bg-pink-200 transition-colors"
                                                      >
                                                        Image
                                                      </a>
                                                  )}
                                                </div>
                                              </div>
                                          )}
                                        </div>
                                      </div>
                                  ))}
                                </div>
                              </div>
                          );
                        })}

                        {/* Notes Section */}
                        {lessonData.notes && (
                            <div className="mt-6 pt-4 border-t border-black">
                              <h3 className="text-lg font-bold text-black mb-2">Lesson Notes</h3>
                              <div
                                  className="bg-gray-200 rounded-lg p-3 text-black border border-gray-600"
                                  dangerouslySetInnerHTML={{ __html: lessonData.notes }}
                              />
                            </div>
                        )}
                      </div>

                      {/* Page Footer - Fixed at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gray-50 px-6 py-3 text-center text-xs text-gray-500 rounded-b-lg">
                        <p><strong>{lessonData.customFooter || (() => {
                          // Extract numeric lesson number (handle "lesson1" format)
                          const getLessonDisplayNumber = (num: string): string => {
                            const numericPart = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
                            return numericPart || num;
                          };
                          const lessonDisplayNumber = getLessonDisplayNumber(lessonNum);
                          const termSpecificNumber = halfTermId ? getTermSpecificLessonNumber(lessonNum, halfTermId) : lessonDisplayNumber;
                          return `Creative Curriculum Designer • Lesson ${termSpecificNumber} • ${currentSheetInfo.display} • ${halfTermName || unitName || ''} • © Rhythmstix 2026`;
                        })()}</strong></p>
                      </div>
                    </div>
                );
              })}
          </div>
        </div>
      </div>
  );
}
