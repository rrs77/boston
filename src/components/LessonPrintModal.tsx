import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, X, Check, Tag, ChevronDown, Share2, Copy, Link2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { Activity } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { customObjectivesApi } from '../config/customObjectivesApi';
import type { CustomObjective, CustomObjectiveArea, CustomObjectiveYearGroup } from '../types/customObjectives';
import { supabase } from '../config/supabase';
import { useShareLesson } from '../hooks/useShareLesson';
import toast from 'react-hot-toast';

// A4 dimensions and PDFBolt margin settings
// These MUST match the PDFBolt API settings exactly for accurate preview
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MM_TO_PX = 3.7795275591; // 1mm = 3.7795275591 pixels at 96 DPI

// A4 dimensions in pixels at 96 DPI
const A4_WIDTH_PX = A4_WIDTH_MM * MM_TO_PX; // ~794px
const A4_HEIGHT_PX = A4_HEIGHT_MM * MM_TO_PX; // ~1122px

// PDFBolt margin settings (in pixels) - MUST match API call
const PDFBOLT_MARGIN_TOP_PX = 15;
const PDFBOLT_MARGIN_BOTTOM_PX = 55; // Includes footer space
const PDFBOLT_MARGIN_LEFT_PX = 20;
const PDFBOLT_MARGIN_RIGHT_PX = 20;

// Available content area height (A4 height minus top and bottom margins)
const PAGE_CONTENT_HEIGHT_PX = A4_HEIGHT_PX - PDFBOLT_MARGIN_TOP_PX - PDFBOLT_MARGIN_BOTTOM_PX; // ~1052px

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
  
  // Track page assignments for each lesson - which elements go on which page
  // Structure: { lessonNum: { pageIndex: [elementIds] } }
  const [lessonPageAssignments, setLessonPageAssignments] = useState<Record<string, { pages: number; elementPages: Record<string, number> }>>({});
  const measurementContainerRef = useRef<HTMLDivElement>(null);
  
  // Determine which lessons to print - FIXED ORDER (must be before calculatePageAssignments)
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
  
  // Calculate page assignments by measuring elements and simulating PDFBolt's page break logic
  const calculatePageAssignments = useCallback(() => {
    if (!measurementContainerRef.current) return;
    
    const newAssignments: Record<string, { pages: number; elementPages: Record<string, number> }> = {};
    
    // For each lesson, find all measurable elements and calculate page assignments
    lessonsToRender.forEach(lessonNum => {
      const lessonContainer = measurementContainerRef.current?.querySelector(`[data-lesson="${lessonNum}"]`);
      if (!lessonContainer) {
        newAssignments[lessonNum] = { pages: 1, elementPages: {} };
        return;
      }
      
      // Find all elements that should not be broken (activities, headers, etc.)
      const elements = lessonContainer.querySelectorAll('[data-element-id]');
      const elementPages: Record<string, number> = {};
      
      let currentPage = 0;
      let currentPageHeight = 0;
      const maxPageHeight = PAGE_CONTENT_HEIGHT_PX - 40; // Leave some margin for footer
      
      elements.forEach((el) => {
        const elementId = el.getAttribute('data-element-id') || '';
        const elementHeight = (el as HTMLElement).offsetHeight + 8; // Add margin
        
        // If adding this element would exceed page height, move to next page
        // (unless it's the first element on the page or element is taller than page)
        if (currentPageHeight > 0 && currentPageHeight + elementHeight > maxPageHeight) {
          currentPage++;
          currentPageHeight = 0;
        }
        
        elementPages[elementId] = currentPage;
        currentPageHeight += elementHeight;
      });
      
      newAssignments[lessonNum] = { 
        pages: currentPage + 1, 
        elementPages 
      };
      
      console.log(`📄 Lesson ${lessonNum}: ${currentPage + 1} pages, elements:`, elementPages);
    });
    
    setLessonPageAssignments(newAssignments);
  }, [lessonsToRender]);
  
  // Recalculate page assignments when lessons change or modal opens
  useEffect(() => {
    // Delay to ensure content is rendered and measured
    const timer = setTimeout(() => {
      calculatePageAssignments();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [lessonNumber, lessonNumbers, exportMode, calculatePageAssignments, allLessonsData]);

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

  // Generate HTML content for PDFBolt with custom styling (no Tailwind dependency)
  const generateHTMLContent = () => {
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${printTitle}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #1a1a1a;
            background: #fff;
          }
          
          @page {
            size: A4;
            margin: 12mm 15mm 25mm 15mm;
            @bottom-center {
              content: counter(page) " of " counter(pages);
              font-family: 'Inter', sans-serif;
              font-size: 9px;
              color: #6b7280;
            }
          }
          
          .lesson-page {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            padding: 0;
            position: relative;
            min-height: calc(100vh - 25mm);
          }
          
          /* Header Section */
          .lesson-header {
            background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 8px 8px 0 0;
            margin-bottom: 0;
          }
          
          .lesson-header h1 {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 4px;
            letter-spacing: -0.02em;
          }
          
          .lesson-header .subtitle {
            font-size: 11px;
            opacity: 0.9;
            font-weight: 500;
          }
          
          .lesson-header .meta {
            display: flex;
            gap: 16px;
            margin-top: 8px;
            font-size: 10px;
            opacity: 0.85;
          }
          
          .lesson-header .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          /* Content Container */
          .content-wrapper {
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
            padding: 16px;
            background: #fafafa;
          }
          
          /* Section Cards */
          .section-card {
            background: white;
            border-radius: 6px;
            margin-bottom: 10px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
            page-break-inside: avoid;
          }
          
          .section-header {
            padding: 8px 12px;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            border-bottom: 1px solid rgba(0,0,0,0.08);
          }
          
          .section-content {
            padding: 10px 12px;
            font-size: 10px;
            line-height: 1.5;
          }
          
          .section-content ul {
            margin: 0;
            padding-left: 16px;
          }
          
          .section-content li {
            margin-bottom: 3px;
          }
          
          .section-content p {
            margin-bottom: 6px;
          }
          
          .section-content p:last-child {
            margin-bottom: 0;
          }
          
          /* Two Column Layout */
          .two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 10px;
          }
          
          .two-col .section-card {
            margin-bottom: 0;
          }
          
          /* Simplified Color Themes - Teal, Blue, and Muted tones */
          .theme-teal .section-header { background: #f0fdfa; color: #0f766e; border-left: 4px solid #0d9488; }
          .theme-teal-dark .section-header { background: #ccfbf1; color: #115e59; border-left: 4px solid #0f766e; }
          .theme-blue .section-header { background: #eff6ff; color: #1e40af; border-left: 4px solid #3b82f6; }
          .theme-blue-light .section-header { background: #f0f9ff; color: #0369a1; border-left: 4px solid #0ea5e9; }
          .theme-slate .section-header { background: #f8fafc; color: #475569; border-left: 4px solid #64748b; }
          .theme-gray .section-header { background: #f9fafb; color: #4b5563; border-left: 4px solid #6b7280; }
          
          /* Activity Cards */
          .activity-section {
            margin-top: 12px;
          }
          
          .activity-category {
            font-size: 12px;
            font-weight: 700;
            color: #0f766e;
            padding: 6px 0;
            border-bottom: 2px solid #0d9488;
            margin-bottom: 8px;
          }
          
          .activity-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            margin-bottom: 8px;
            overflow: hidden;
            border-left: 3px solid #0d9488;
          }
          
          .activity-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: #f0fdfa;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .activity-title {
            font-weight: 600;
            font-size: 11px;
            color: #0f766e;
          }
          
          .activity-time {
            background: #ccfbf1;
            color: #0f766e;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: 600;
          }
          
          .activity-body {
            padding: 10px 12px;
            font-size: 10px;
            color: #374151;
          }
          
          .activity-resources {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed #d1d5db;
          }
          
          .resource-tag {
            font-size: 8px;
            padding: 2px 6px;
            border-radius: 10px;
            font-weight: 500;
            background: #f0fdfa;
            color: #0f766e;
          }
          
          /* Footer */
          .lesson-footer {
            margin-top: 16px;
            padding: 12px 16px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9px;
            color: #64748b;
            border-radius: 0 0 8px 8px;
          }
          
          .footer-left {
            font-weight: 500;
          }
          
          .footer-center {
            text-align: center;
          }
          
          .footer-right {
            font-weight: 600;
            color: #0f766e;
          }
          
          /* Print styles */
          @media print {
            body { background: white; }
            .lesson-page { box-shadow: none; min-height: auto; }
            .content-wrapper { background: white; }
          }
        </style>
      </head>
      <body>
        <div class="lesson-page">
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


      const lessonStandardsList = lessonStandards[lessonNum] || lessonStandards[lessonIndex + 1] || lessonStandards[(lessonIndex + 1).toString()] || [];

      // Group EYFS statements by area
      const groupedEyfs: Record<string, string[]> = {};
      lessonStandardsList.forEach(statement => {
        const parts = statement.split(':');
        const area = parts[0].trim();
        const detail = parts.length > 1 ? parts[1].trim() : statement;
        if (!groupedEyfs[area]) groupedEyfs[area] = [];
        groupedEyfs[area].push(detail);
      });

      // Lesson title
      const lessonTitle = lessonData.title || `Lesson ${termSpecificNumber}`;
      const lessonSubtitle = lessonData.lessonName || `${halfTermName || unitName || 'Autumn 1'} - ${currentSheetInfo.display}`;

      htmlContent += `
          <!-- Lesson Header -->
          <div class="lesson-header">
            <h1>${lessonData.customHeader || lessonTitle}</h1>
            <div class="subtitle">${lessonSubtitle}</div>
            <div class="meta">
              <span class="meta-item">📚 ${currentSheetInfo.display}</span>
              <span class="meta-item">⏱ ${lessonData.totalTime || 45} mins</span>
              <span class="meta-item">📅 ${halfTermName || unitName || 'Term 1'}</span>
            </div>
          </div>
          
          <div class="content-wrapper">
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

      // CLEAN LESSON PLAN LAYOUT - Matching preview style
      // Simple headers with rounded content boxes
      
      const hasLessonPlanDetails = lessonData.learningOutcome || lessonData.successCriteria || 
        lessonData.introduction || lessonData.mainActivity || lessonData.plenary ||
        lessonData.vocabulary || lessonData.keyQuestions || lessonData.resources ||
        lessonData.differentiation || lessonData.assessment;

      if (hasLessonPlanDetails) {
        
        // Helper function for clean section rendering
        const renderCleanSection = (title: string, content: string, iconSvg?: string) => {
          return `
            <div style="margin-bottom: 16px;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                ${iconSvg ? `<span style="margin-right: 8px; color: #0d9488;">${iconSvg}</span>` : ''}
                <h3 style="font-size: 14px; font-weight: 700; color: #1f2937; margin: 0;">${title}</h3>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px;">
                <div style="font-size: 11px; color: #374151; line-height: 1.6;">${content}</div>
              </div>
            </div>
          `;
        };

        // Target icon SVG
        const targetIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>';

        // Learning Outcome
        if (lessonData.learningOutcome) {
          htmlContent += renderCleanSection('Learning Outcome', lessonData.learningOutcome, targetIcon);
        }

        // Success Criteria
        if (lessonData.successCriteria) {
          htmlContent += renderCleanSection('Success Criteria', lessonData.successCriteria, targetIcon);
        }

        // Assessment Objectives (if any)
        if (lessonData.assessmentObjectives && lessonData.assessmentObjectives.length > 0) {
          const objectivesList = lessonData.assessmentObjectives.map((obj: string, i: number) => 
            `<div style="margin-bottom: 6px;"><strong style="color: #7c3aed;">${i + 1}.</strong> ${obj}</div>`
          ).join('');
          htmlContent += renderCleanSection('Assessment Objectives', objectivesList);
        }

        // Introduction
        if (lessonData.introduction) {
          htmlContent += renderCleanSection('Introduction', lessonData.introduction);
        }

        // Main Activity
        if (lessonData.mainActivity) {
          htmlContent += renderCleanSection('Main Activity', lessonData.mainActivity);
        }

        // Plenary
        if (lessonData.plenary) {
          htmlContent += renderCleanSection('Plenary', lessonData.plenary);
        }

        // Vocabulary
        if (lessonData.vocabulary) {
          // Format vocabulary with bold terms
          const formattedVocab = lessonData.vocabulary.replace(/^([^-:]+)(\s*[-:]\s*)/gm, '<strong>$1</strong>$2');
          htmlContent += renderCleanSection('Vocabulary', formattedVocab);
        }

        // Key Questions
        if (lessonData.keyQuestions) {
          htmlContent += renderCleanSection('Key Questions', lessonData.keyQuestions);
        }

        // Resources
        if (lessonData.resources) {
          htmlContent += renderCleanSection('Resources', lessonData.resources);
        }

        // Differentiation
        if (lessonData.differentiation) {
          // Format with bold Support/Challenge labels
          const formattedDiff = lessonData.differentiation
            .replace(/Support:/gi, '<strong>Support:</strong>')
            .replace(/Challenge:/gi, '<strong>Challenge:</strong>');
          htmlContent += renderCleanSection('Differentiation', formattedDiff);
        }

        // Assessment
        if (lessonData.assessment) {
          htmlContent += renderCleanSection('Assessment', lessonData.assessment);
        }
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

      // Display activities by category with clean styling
      if (categoriesInOrder.length > 0) {
        htmlContent += `
          <div class="activity-section">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <h3 style="font-size: 14px; font-weight: 700; color: #1f2937; margin: 0;">Activities from Library</h3>
            </div>
        `;
        
        categoriesInOrder.forEach(category => {
          const activities = activitiesByCategory[category] || [];
          if (activities.length === 0) return;

          const categoryColor = getCategoryColor(category);

          htmlContent += `
            <div class="activity-category" style="color: ${categoryColor}; border-bottom-color: ${categoryColor};">
              ${category}
            </div>
          `;

          activities.forEach(activity => {
            htmlContent += `
              <div class="activity-card" style="border-left: 3px solid ${categoryColor};">
                <div class="activity-header">
                  <span class="activity-title">${activity.activity}</span>
                  ${activity.time > 0 ? `<span class="activity-time">${activity.time} min</span>` : ''}
                </div>
                <div class="activity-body">
                  ${activity.activityText ? `<p style="font-weight: 500; margin-bottom: 6px;">${activity.activityText}</p>` : ''}
                  <div>${activity.description.includes('<') ? activity.description : activity.description.replace(/\n/g, '<br>')}</div>
            `;

            // Resources
            const resources = [];
            if (activity.videoLink) resources.push({ label: 'Video', class: 'resource-video' });
            if (activity.musicLink) resources.push({ label: 'Music', class: 'resource-music' });
            if (activity.backingLink) resources.push({ label: 'Backing', class: 'resource-backing' });
            if (activity.resourceLink) resources.push({ label: 'Resource', class: 'resource-resource' });
            if (activity.link) resources.push({ label: 'Link', class: 'resource-link' });
            if (activity.vocalsLink) resources.push({ label: 'Vocals', class: 'resource-vocals' });
            if (activity.imageLink) resources.push({ label: 'Image', class: 'resource-image' });

            if (resources.length > 0) {
              htmlContent += `<div class="activity-resources">`;
              resources.forEach(r => {
                htmlContent += `<span class="resource-tag ${r.class}">${r.label}</span>`;
              });
              htmlContent += `</div>`;
            }

            htmlContent += `</div></div>`;
          });
        });
        
        htmlContent += `</div>`;
      }

      // Add notes if available
      if (lessonData.notes) {
        htmlContent += `
          <div class="section-card" style="margin-top: 12px;">
            <div class="section-header" style="background: #f3f4f6; color: #374151; border-left: 4px solid #9ca3af;">
              Teacher Notes
            </div>
            <div class="section-content">${lessonData.notes}</div>
          </div>
        `;
      }

      // Close content wrapper
      htmlContent += `</div>`;
      
      // Build footer text
      const footerText = lessonData.customFooter || 
        [currentSheetInfo.display, halfTermName || unitName, '© Forward Thinking 2026']
          .filter(Boolean)
          .join(' • ');
      
      // Footer with page number
      htmlContent += `
        <div class="lesson-footer">
          <div class="footer-left">Creative Curriculum Designer</div>
          <div class="footer-center">${footerText}</div>
          <div class="footer-right">Lesson ${termSpecificNumber} • Page ${lessonIndex + 1} of ${lessonsToRender.length}</div>
        </div>
      `;
    });

    htmlContent += `
        </div>
      </body>
      </html>
    `;

    // Create footer template for PDFBolt (separate from in-page footer)
    const footerContent = `
      <div style="width: 100%; font-size: 9px; padding: 5px 20px; display: flex; justify-content: space-between; align-items: center; color: #666; font-family: 'Inter', sans-serif;">
        <span>Creative Curriculum Designer</span>
        <span>${currentSheetInfo.display || ''} ${halfTermName || unitName ? '• ' + (halfTermName || unitName) : ''} • © Forward Thinking 2026</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
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
    console.log('🔗 Copy Link button clicked!');
    console.log('🔗 Current state:', { exportMode, lessonNumber, isSharing, isSharingSingle });
    
    // Prevent default behavior and event propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Prevent multiple simultaneous calls
    if (isSharing || isSharingSingle) {
      console.log('Share already in progress, ignoring duplicate call');
      return;
    }

    // For single lesson, use the useShareLesson hook
    // The hook already checks localStorage internally and will reuse existing URLs
    if (exportMode === 'single' && lessonNumber) {
      try {
        console.log('🔄 Starting share process for single lesson:', lessonNumber);
        
        // Check if URL already exists in localStorage before calling shareSingleLesson
        // This allows us to show the right message (retrieved vs created)
        const storedUrl = getStoredShareUrl ? getStoredShareUrl(lessonNumber) : null;
        const wasStored = !!storedUrl;
        
        console.log('📦 Stored URL check:', { wasStored, storedUrl });
        
        // Only set loading state if we're actually generating a new PDF
        if (!wasStored) {
          setIsSharing(true);
          setShareSuccess(false);
        }
        
        // shareSingleLesson will check localStorage internally and return immediately if found
        const url = await shareSingleLesson(lessonNumber);
        console.log('✅ Share function returned URL:', url);
        
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
        } else {
          console.warn('⚠️ Share function returned null/undefined URL');
          toast.error('Failed to generate share link. Please check console for details.', {
            duration: 5000,
          });
        }
      } catch (error: any) {
        console.error('❌ Share error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        setShareSuccess(false);
        
        // Provide more helpful error messages
        let errorMessage = error.message || 'Failed to create share link';
        
        if (error.message?.includes('bucket')) {
          errorMessage = 'Storage bucket not configured. Please ensure the "lesson-pdfs" bucket exists in Supabase Storage and is set to public.';
        } else if (error.message?.includes('Service role key')) {
          errorMessage = 'Server configuration error. Please ensure SUPABASE_SERVICE_ROLE_KEY is set in Netlify environment variables.';
        } else if (error.message?.includes('Network error') || error.message?.includes('Failed to connect')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        }
        
        toast.error(errorMessage, {
          duration: 8000,
        });
      } finally {
        setIsSharing(false);
        // Note: isSharingSingle is managed by the useShareLesson hook internally
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

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Shareable URL copied to clipboard!', {
        duration: 3000,
        icon: '📋',
      });
      return true;
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
        document.body.removeChild(textarea);
        return true;
      } catch (err) {
        toast.error(`Failed to copy URL. Here it is: ${text}`, {
          duration: 8000,
        });
        document.body.removeChild(textarea);
        return false;
      }
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
                  Lessons: {lessonsToRender.length}
                </div>
                <div className="text-sm text-gray-600">
                  •
                </div>
                <div className="text-sm text-gray-600">
                  Total Pages: {lessonsToRender.reduce((sum, ln) => sum + (lessonPageAssignments[ln]?.pages || 1), 0)}
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
                <button
                  type="button"
                  onClick={(e) => {
                    console.log('🔗 Copy Link button onClick fired!');
                    e.preventDefault();
                    if (!isExporting && !isSharing && !isSharingSingle) {
                      handleShare(e);
                    }
                  }}
                  disabled={isExporting || isSharing || isSharingSingle}
                  aria-label="Copy share link to clipboard"
                  className={`px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 ${
                    isExporting || isSharing || isSharingSingle ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
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
                </button>
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

          {/* Hidden measurement container - used to calculate element heights */}
          <div 
            ref={measurementContainerRef}
            style={{ 
              position: 'absolute', 
              visibility: 'hidden', 
              pointerEvents: 'none',
              width: '210mm',
              left: '-9999px'
            }}
          >
            {lessonsToRender.map((lessonNum, lessonIndex) => {
              const lessonData = allLessonsData[lessonNum];
              if (!lessonData) return null;
              
              const lessonStandardsList = lessonStandards[lessonNum] || lessonStandards[lessonIndex + 1] || lessonStandards[(lessonIndex + 1).toString()] || [];
              const groupedEyfs: Record<string, string[]> = {};
              lessonStandardsList.forEach(statement => {
                const parts = statement.split(':');
                const area = parts[0].trim();
                const detail = parts.length > 1 ? parts[1].trim() : statement;
                if (!groupedEyfs[area]) groupedEyfs[area] = [];
                groupedEyfs[area].push(detail);
              });
              
              const lessonCustomObjectives = getCustomObjectivesForLesson(lessonNum);
              const groupedCustomObjectives: Record<string, CustomObjective[]> = {};
              lessonCustomObjectives.forEach(objective => {
                const area = customAreas.find(a => a.id === objective.area_id);
                if (area) {
                  if (!groupedCustomObjectives[area.name]) groupedCustomObjectives[area.name] = [];
                  groupedCustomObjectives[area.name].push(objective);
                }
              });
              const hasCustomObjectives = Object.keys(groupedCustomObjectives).length > 0;
              const hasEyfsObjectives = lessonStandardsList.length > 0;
              const shouldShowCustom = showEyfs && hasCustomObjectives;
              const shouldShowEyfs = showEyfs && hasEyfsObjectives && !hasCustomObjectives;
              
              let elementIndex = 0;
              
              return (
                <div key={lessonNum} data-lesson={lessonNum} style={{ padding: `${PDFBOLT_MARGIN_TOP_PX}px ${PDFBOLT_MARGIN_RIGHT_PX}px ${PDFBOLT_MARGIN_BOTTOM_PX}px ${PDFBOLT_MARGIN_LEFT_PX}px` }}>
                  {/* Title */}
                  <div data-element-id={`${lessonNum}-title`} className="mb-3 border-b border-black pb-2">
                    <h3 className="text-xl font-bold text-black">
                      {lessonData.customHeader || `Lesson - ${currentSheetInfo.display}, Music`}
                    </h3>
                  </div>
                  
                  {/* Learning Goals */}
                  {(shouldShowEyfs || shouldShowCustom) && (
                    <div data-element-id={`${lessonNum}-goals`} className="mb-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-2">Learning Goals</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {shouldShowEyfs && Object.entries(groupedEyfs).map(([area, statements]) => (
                          <div key={area} className="bg-yellow-50 rounded-lg p-2 border border-gray-200">
                            <h4 className="font-medium text-gray-800 text-xs mb-1">{area}</h4>
                            <ul className="space-y-0.5">
                              {statements.map((statement, idx) => (
                                <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                                  <span className="text-green-500 font-bold">✓</span>
                                  <span>{statement}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
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
                  )}
                  
                  {/* Activities */}
                  {lessonData.categoryOrder.map((category) => {
                    const activities = lessonData.grouped[category] || [];
                    if (activities.length === 0) return null;
                    const categoryColor = getCategoryColor(category);
                    
                    return (
                      <div key={category}>
                        <div data-element-id={`${lessonNum}-cat-${category}`} className="mb-1">
                          <h2 className="text-sm font-bold border-b border-black pb-0.5" style={{ color: categoryColor }}>{category}</h2>
                        </div>
                        {activities.map((activity, index) => {
                          elementIndex++;
                          return (
                            <div 
                              key={`${category}-${index}`} 
                              data-element-id={`${lessonNum}-activity-${elementIndex}`}
                              className="mb-2 bg-white rounded-lg border overflow-hidden"
                              style={{ borderLeftWidth: '4px', borderLeftColor: categoryColor }}
                            >
                              <div className="px-2 py-0.5 border-b flex justify-between items-center" style={{ backgroundColor: `${categoryColor}20` }}>
                                <h3 className="text-xs font-bold text-black">{activity.activity}</h3>
                                {activity.time > 0 && <div className="px-1 py-0.5 rounded-full text-xs font-bold bg-gray-200">{activity.time}m</div>}
                              </div>
                              <div className="p-1.5">
                                {activity.activityText && <div className="mb-1 text-xs text-black font-medium" dangerouslySetInnerHTML={{ __html: activity.activityText }} />}
                                <div className="text-xs text-black" dangerouslySetInnerHTML={{ __html: activity.description.includes('<') ? activity.description : activity.description.replace(/\n/g, '<br>') }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                  
                  {/* Notes */}
                  {lessonData.notes && (
                    <div data-element-id={`${lessonNum}-notes`} className="mt-4 pt-4 border-t border-black">
                      <h3 className="text-lg font-bold text-black mb-2">Lesson Notes</h3>
                      <div className="bg-gray-200 rounded-lg p-3 text-black border border-gray-600" dangerouslySetInnerHTML={{ __html: lessonData.notes }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Preview - PDF-style view with separate A4 pages */}
          <div 
            className="flex-1 overflow-y-auto print-preview-container"
            style={{
              minHeight: 0,
              maxHeight: 'calc(90vh - 300px)',
              overflowY: 'auto',
              overflowX: 'hidden',
              backgroundColor: '#525659',
              padding: '24px'
            }}
          >
            {/* Render each lesson - pages based on calculated assignments */}
            {lessonsToRender.map((lessonNum, lessonIndex) => {
              const lessonData = allLessonsData[lessonNum];
              if (!lessonData) return null;

              const lessonStandardsList = lessonStandards[lessonNum] || lessonStandards[lessonIndex + 1] || lessonStandards[(lessonIndex + 1).toString()] || [];
              const groupedEyfs: Record<string, string[]> = {};
              lessonStandardsList.forEach(statement => {
                const parts = statement.split(':');
                const area = parts[0].trim();
                const detail = parts.length > 1 ? parts[1].trim() : statement;
                if (!groupedEyfs[area]) groupedEyfs[area] = [];
                groupedEyfs[area].push(detail);
              });

              // Get page assignments for this lesson
              const assignments = lessonPageAssignments[lessonNum] || { pages: 1, elementPages: {} };
              const numPages = assignments.pages;
              
              // Helper to check if element belongs on a page
              const isElementOnPage = (elementId: string, pageIndex: number) => {
                return (assignments.elementPages[elementId] ?? 0) === pageIndex;
              };

              // Get custom objectives
              const lessonCustomObjectives = getCustomObjectivesForLesson(lessonNum);
              const groupedCustomObjectives: Record<string, CustomObjective[]> = {};
              lessonCustomObjectives.forEach(objective => {
                const area = customAreas.find(a => a.id === objective.area_id);
                if (area) {
                  if (!groupedCustomObjectives[area.name]) groupedCustomObjectives[area.name] = [];
                  groupedCustomObjectives[area.name].push(objective);
                }
              });
              const hasCustomObjectives = Object.keys(groupedCustomObjectives).length > 0;
              const hasEyfsObjectives = lessonStandardsList.length > 0;
              const shouldShowCustom = showEyfs && hasCustomObjectives;
              const shouldShowEyfs = showEyfs && hasEyfsObjectives && !hasCustomObjectives;
              
              // Render each page
              return Array.from({ length: numPages }, (_, pageIndex) => {
                let elementIndex = 0;
                
                return (
                  <div
                    key={`${lessonNum}-page-${pageIndex}`}
                    className="pdf-page-card"
                    style={{
                      width: '210mm',
                      height: `${A4_HEIGHT_PX}px`,
                      margin: '0 auto 16px auto',
                      background: 'white',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '2px'
                    }}
                  >
                    <div
                      style={{
                        paddingTop: `${PDFBOLT_MARGIN_TOP_PX}px`,
                        paddingRight: `${PDFBOLT_MARGIN_RIGHT_PX}px`,
                        paddingBottom: `${PDFBOLT_MARGIN_BOTTOM_PX}px`,
                        paddingLeft: `${PDFBOLT_MARGIN_LEFT_PX}px`,
                        height: '100%',
                        boxSizing: 'border-box',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Title - only on first page */}
                      {isElementOnPage(`${lessonNum}-title`, pageIndex) && (
                        <div className="mb-3 border-b border-black pb-2">
                          <h3 className="text-xl font-bold text-black">
                            {lessonData.customHeader || (() => {
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
                      )}

                      {/* Learning Goals */}
                      {isElementOnPage(`${lessonNum}-goals`, pageIndex) && (shouldShowEyfs || shouldShowCustom) && (
                        <div className="mb-4">
                          <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                            <Tag className="h-4 w-4 text-blue-600" />
                            <span>Learning Goals</span>
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
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
                      )}

                      {/* Lesson Plan Details - Compact Layout - Only show on first page */}
                      {pageIndex === 0 && (lessonData.learningOutcome || lessonData.successCriteria || 
                        lessonData.introduction || lessonData.mainActivity || lessonData.plenary ||
                        lessonData.vocabulary || lessonData.keyQuestions || lessonData.resources ||
                        lessonData.differentiation || lessonData.assessment) && (
                        <div className="mb-2">
                          {/* Learning Outcome & Success Criteria side by side */}
                          {(lessonData.learningOutcome || lessonData.successCriteria) && (
                            <div className="grid grid-cols-2 gap-1 mb-1">
                              {lessonData.learningOutcome && (
                                <div className="rounded p-1.5 border-l-4 border-blue-500 bg-blue-50">
                                  <h4 className="font-bold text-blue-800 text-xs mb-0.5">Learning Outcome</h4>
                                  <div className="text-xs text-black leading-tight" dangerouslySetInnerHTML={{ __html: lessonData.learningOutcome }} />
                                </div>
                              )}
                              {lessonData.successCriteria && (
                                <div className="rounded p-1.5 border-l-4 border-green-500 bg-green-50">
                                  <h4 className="font-bold text-green-800 text-xs mb-0.5">Success Criteria</h4>
                                  <div className="text-xs text-black leading-tight" dangerouslySetInnerHTML={{ __html: lessonData.successCriteria }} />
                                </div>
                              )}
                            </div>
                          )}
                          {lessonData.introduction && (
                            <div className="rounded p-1.5 border-l-4 border-purple-500 bg-purple-50 mb-1">
                              <h4 className="font-bold text-purple-800 text-xs mb-0.5">Introduction</h4>
                              <div className="text-xs text-black leading-tight" dangerouslySetInnerHTML={{ __html: lessonData.introduction }} />
                            </div>
                          )}
                          {lessonData.mainActivity && (
                            <div className="rounded p-1.5 border-l-4 border-orange-500 bg-orange-50 mb-1">
                              <h4 className="font-bold text-orange-800 text-xs mb-0.5">Main Activity</h4>
                              <div className="text-xs text-black leading-tight" dangerouslySetInnerHTML={{ __html: lessonData.mainActivity }} />
                            </div>
                          )}
                          {lessonData.plenary && (
                            <div className="rounded p-1.5 border-l-4 border-teal-500 bg-teal-50 mb-1">
                              <h4 className="font-bold text-teal-800 text-xs mb-0.5">Plenary / Conclusion</h4>
                              <div className="text-xs text-black leading-tight" dangerouslySetInnerHTML={{ __html: lessonData.plenary }} />
                            </div>
                          )}
                          {/* 4-column grid for smaller sections */}
                          {(lessonData.vocabulary || lessonData.keyQuestions || lessonData.resources || lessonData.differentiation) && (
                            <div className="grid grid-cols-2 gap-1 mb-1">
                              {lessonData.vocabulary && (
                                <div className="rounded p-1 border-l-4 border-yellow-500 bg-yellow-50">
                                  <h4 className="font-bold text-yellow-700 text-xs mb-0.5">Vocabulary</h4>
                                  <div className="text-xs text-black leading-tight" dangerouslySetInnerHTML={{ __html: lessonData.vocabulary }} />
                                </div>
                              )}
                              {lessonData.keyQuestions && (
                                <div className="rounded p-1 border-l-4 border-indigo-500 bg-indigo-50">
                                  <h4 className="font-bold text-indigo-700 text-xs mb-0.5">Key Questions</h4>
                                  <div className="text-xs text-black leading-tight" dangerouslySetInnerHTML={{ __html: lessonData.keyQuestions }} />
                                </div>
                              )}
                              {lessonData.resources && (
                                <div className="rounded p-1 border-l-4 border-pink-500 bg-pink-50">
                                  <h4 className="font-bold text-pink-700 text-xs mb-0.5">Resources</h4>
                                  <div className="text-xs text-black leading-tight" dangerouslySetInnerHTML={{ __html: lessonData.resources }} />
                                </div>
                              )}
                              {lessonData.differentiation && (
                                <div className="rounded p-1 border-l-4 border-cyan-500 bg-cyan-50">
                                  <h4 className="font-bold text-cyan-700 text-xs mb-0.5">Differentiation</h4>
                                  <div className="text-xs text-black leading-tight" dangerouslySetInnerHTML={{ __html: lessonData.differentiation }} />
                                </div>
                              )}
                            </div>
                          )}
                          {lessonData.assessment && (
                            <div className="rounded p-1.5 border-l-4 border-red-500 bg-red-50 mb-1">
                              <h4 className="font-bold text-red-800 text-xs mb-0.5">Assessment</h4>
                              <div className="text-xs text-black leading-tight" dangerouslySetInnerHTML={{ __html: lessonData.assessment }} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Activities by Category */}
                      {lessonData.categoryOrder.map((category) => {
                        const activities = lessonData.grouped[category] || [];
                        if (activities.length === 0) return null;

                        const categoryColor = getCategoryColor(category);
                        const getCategoryBgColor = (cat: string) => {
                          switch(cat) {
                            case 'Welcome': return '#FEF3C7';
                            case 'Kodaly Songs': return '#EDE9FE';
                            case 'Goodbye': return '#D1FAE5';
                            default: return `${categoryColor}20`;
                          }
                        };
                        const getCategoryLightBorder = (cat: string) => {
                          switch(cat) {
                            case 'Welcome': return '#FDE68A';
                            case 'Kodaly Songs': return '#DDD6FE';
                            case 'Goodbye': return '#A7F3D0';
                            default: return `${categoryColor}60`;
                          }
                        };

                        // Check if category header or any activity from this category is on this page
                        const categoryOnThisPage = isElementOnPage(`${lessonNum}-cat-${category}`, pageIndex) ||
                          activities.some((_, idx) => {
                            elementIndex++;
                            return isElementOnPage(`${lessonNum}-activity-${elementIndex}`, pageIndex);
                          });
                        
                        // Reset elementIndex for actual rendering
                        elementIndex = lessonData.categoryOrder.slice(0, lessonData.categoryOrder.indexOf(category))
                          .reduce((sum, cat) => sum + (lessonData.grouped[cat]?.length || 0), 0);

                        if (!categoryOnThisPage) return null;

                        return (
                          <div key={category} className="mb-4">
                            {isElementOnPage(`${lessonNum}-cat-${category}`, pageIndex) && (
                              <h2 className="text-sm font-bold mb-1 border-b border-black pb-0.5" style={{ color: categoryColor }}>
                                {category}
                              </h2>
                            )}
                            <div className="space-y-2">
                              {activities.map((activity, index) => {
                                elementIndex++;
                                if (!isElementOnPage(`${lessonNum}-activity-${elementIndex}`, pageIndex)) return null;
                                
                                return (
                                  <div
                                    key={`${category}-${index}`}
                                    className="bg-white rounded-lg border overflow-hidden"
                                    style={{
                                      borderLeftWidth: '4px',
                                      borderLeftColor: categoryColor,
                                      borderColor: getCategoryLightBorder(category)
                                    }}
                                  >
                                    <div
                                      className="px-2 py-0.5 border-b flex justify-between items-center"
                                      style={{
                                        backgroundColor: getCategoryBgColor(category),
                                        borderBottomColor: categoryColor
                                      }}
                                    >
                                      <h3 className="text-xs font-bold text-black">{activity.activity}</h3>
                                      {activity.time > 0 && (
                                        <div className="px-1 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: '#374151' }}>
                                          {activity.time}m
                                        </div>
                                      )}
                                    </div>
                                    <div className="p-1.5">
                                      {activity.activityText && (
                                        <div className="mb-1 text-xs text-black font-medium" dangerouslySetInnerHTML={{ __html: activity.activityText }} />
                                      )}
                                      <div
                                        className={`text-xs text-black ${activity.activityText ? 'pt-1.5 border-t border-gray-300' : ''}`}
                                        dangerouslySetInnerHTML={{
                                          __html: activity.description.includes('<') ? activity.description : activity.description.replace(/\n/g, '<br>')
                                        }}
                                      />
                                      {(activity.videoLink || activity.musicLink || activity.backingLink || activity.resourceLink || activity.link || activity.vocalsLink || activity.imageLink) && (
                                        <div className="mt-1 pt-1 border-t border-gray-600">
                                          <p className="text-xs font-bold text-black mb-0.5">Resources:</p>
                                          <div className="flex flex-wrap gap-0.5">
                                            {activity.videoLink && <span className="inline-flex items-center px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">Video</span>}
                                            {activity.musicLink && <span className="inline-flex items-center px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Music</span>}
                                            {activity.backingLink && <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">Backing</span>}
                                            {activity.resourceLink && <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">Resource</span>}
                                            {activity.link && <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">Link</span>}
                                            {activity.vocalsLink && <span className="inline-flex items-center px-1.5 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full">Vocals</span>}
                                            {activity.imageLink && <span className="inline-flex items-center px-1.5 py-0.5 bg-pink-100 text-pink-800 text-xs rounded-full">Image</span>}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Notes Section */}
                      {isElementOnPage(`${lessonNum}-notes`, pageIndex) && lessonData.notes && (
                        <div className="mt-6 pt-4 border-t border-black">
                          <h3 className="text-lg font-bold text-black mb-2">Lesson Notes</h3>
                          <div className="bg-gray-200 rounded-lg p-3 text-black border border-gray-600" dangerouslySetInnerHTML={{ __html: lessonData.notes }} />
                        </div>
                      )}
                    </div>

                    {/* Page Footer */}
                    <div 
                      className="text-center text-xs text-gray-600"
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: `${PDFBOLT_MARGIN_LEFT_PX}px`,
                        right: `${PDFBOLT_MARGIN_RIGHT_PX}px`
                      }}
                    >
                      <p><strong>{lessonData.customFooter || (() => {
                        const getLessonDisplayNumber = (num: string): string => {
                          const numericPart = num.replace(/^lesson/i, '').replace(/[^0-9]/g, '');
                          return numericPart || num;
                        };
                        const lessonDisplayNumber = getLessonDisplayNumber(lessonNum);
                        const termSpecificNumber = halfTermId ? getTermSpecificLessonNumber(lessonNum, halfTermId) : lessonDisplayNumber;
                        return `Creative Curriculum Designer • Lesson ${termSpecificNumber} • ${currentSheetInfo.display} • ${halfTermName || unitName || ''} • © Forward Thinking 2026`;
                      })()}</strong></p>
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>
  );
}
