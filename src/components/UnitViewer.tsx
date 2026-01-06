import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  FolderOpen, 
  Search, 
  EyeOff, 
  ChevronLeft, 
  ChevronRight,
  Clock, 
  BookOpen, 
  Calendar, 
  Tag, 
  X,
  Edit3,
  Eye,
  Plus,
  Check,
  Save,
  CheckCircle,
  Printer
} from 'lucide-react';
import { UnitCard } from './UnitCard';
import { LessonLibraryCard } from './LessonLibraryCard';
import { ActivityDetails } from './ActivityDetails';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { LessonExporter } from './LessonExporter';
import { HalfTermCard } from './HalfTermCard';
import { LessonSelectionModal } from './LessonSelectionModal';
import { HalfTermView } from './HalfTermView';
import { LessonDetailsModal } from './LessonDetailsModal';
import { LessonPrintModal } from './LessonPrintModal';
import { YearNavigation } from './YearNavigation';
import { TermCopyModal } from './TermCopyModal';
import { StackCard } from './StackCard';
import { StackModal } from './StackModal';
import { useLessonStacks } from '../hooks/useLessonStacks';
import { MinimizableActivityCard } from './MinimizableActivityCard';
import { SimpleNestedCategoryDropdown } from './SimpleNestedCategoryDropdown';
import type { Activity } from '../contexts/DataContext';

interface Unit {
  id: string;
  name: string;
  description: string;
  lessonNumbers: string[];
  color: string;
  term?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define half-term periods
const HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct' },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec' },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb' },
  { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr' },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May' },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul' },
];

// Map term IDs to readable names
const TERM_NAMES: Record<string, string> = {
  'A1': 'Autumn 1 (Sep-Oct)',
  'A2': 'Autumn 2 (Nov-Dec)',
  'SP1': 'Spring 1 (Jan-Feb)',
  'SP2': 'Spring 2 (Mar-Apr)',
  'SM1': 'Summer 1 (Apr-May)',
  'SM2': 'Summer 2 (Jun-Jul)',
};

// Map term IDs to colors
const TERM_COLORS: Record<string, string> = {
  'A1': '#3B82F6', // Blue
  'A2': '#1D4ED8', // Darker Blue
  'SP1': '#10B981', // Green
  'SP2': '#059669', // Darker Green
  'SM1': '#0EA5E9', // Light Blue
  'SM2': '#06B6D4', // Cyan Blue
};

export function UnitViewer() {
  const { 
    currentSheetInfo, 
    allLessonsData, 
    halfTerms, 
    updateHalfTerm, 
    getLessonsForHalfTerm,
    getTermSpecificLessonNumber,
    getLessonDisplayTitle,
    currentAcademicYear,
    setCurrentAcademicYear,
    getAvailableYears,
    getAcademicYearData,
    copyTermToYear,
    refreshData,
    loading,
    allActivities,
    updateLessonData
  } = useData();
  const { getThemeForClass } = useSettings();
  const { stacks } = useLessonStacks();
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedLessonForExport, setSelectedLessonForExport] = useState<string | null>(null);
  const [focusedHalfTermId, setFocusedHalfTermId] = useState<string | null>(null);
  const [selectedHalfTerm, setSelectedHalfTerm] = useState<string | null>(null);
  const [showLessonSelectionModal, setShowLessonSelectionModal] = useState(false);
  const [selectedLessonForDetails, setSelectedLessonForDetails] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printHalfTermId, setPrintHalfTermId] = useState<string | null>(null);
  const [printHalfTermName, setPrintHalfTermName] = useState<string | null>(null);
  const [selectedStackForModal, setSelectedStackForModal] = useState<string | null>(null);
  const [printUnitId, setPrintUnitId] = useState<string | null>(null);
  const [printUnitName, setPrintUnitName] = useState<string | null>(null);
  const [printStackId, setPrintStackId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render when half-terms change
  const [showTermCopyModal, setShowTermCopyModal] = useState(false);
  
  // Lesson editing states
  const [editingLessonNumber, setEditingLessonNumber] = useState<string | null>(null);
  const [editingLessonActivities, setEditingLessonActivities] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHeaderFooterEdit, setShowHeaderFooterEdit] = useState(false);
  const [customHeader, setCustomHeader] = useState<string>('');
  const [customFooter, setCustomFooter] = useState<string>('');
  
  // Add Activity Modal State
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Get theme colors for current class
  const theme = getThemeForClass(currentSheetInfo.sheet);
  
  // Helper function to get plain text from HTML
  const getPlainTextFromHtml = (html: string) => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  // Handle year change
  const handleYearChange = async (year: string) => {
    setCurrentAcademicYear(year);
    // Trigger a full data reload for the new academic year
    // This will filter lessons by the new academic year
    await refreshData();
  };

  // Handle term copy
  const handleCopyTerm = async (sourceYear: string, sourceTerm: string, targetYear: string, targetTerm: string) => {
    await copyTermToYear(sourceYear, sourceTerm, targetYear, targetTerm);
    // Refresh the display
    setRefreshKey(prev => prev + 1);
  };

  // FIXED: Function to check if a lesson is assigned to any half-term
  const isLessonAssignedToHalfTerm = (lessonNumber: string): boolean => {
    return halfTerms.some(halfTerm => halfTerm.lessons.includes(lessonNumber));
  };

  // CRITICAL FIX: Force refresh when half-terms change to show newly assigned lessons
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
    console.log('🔄 UnitViewer: Half-terms changed, refreshing display', { 
      loading,
      halfTerms,
      halfTermsWithLessons: halfTerms.map(ht => ({ 
        id: ht.id, 
        name: ht.name, 
        lessons: ht.lessons,
        stacks: ht.stacks 
      }))
    });
  }, [halfTerms, loading]);

  // Load units from localStorage
  useEffect(() => {
    const savedUnits = localStorage.getItem(`units-${currentSheetInfo.sheet}`);
    if (savedUnits) {
      try {
        const parsedUnits = JSON.parse(savedUnits).map((unit: any) => ({
          ...unit,
          createdAt: new Date(unit.createdAt),
          updatedAt: new Date(unit.updatedAt),
        }));
        setUnits(parsedUnits);
      } catch (error) {
        console.error('Error parsing saved units:', error);
        setUnits([]);
      }
    } else {
      // Initialize with an empty array
      setUnits([]);
      localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify([]));
    }
  }, [currentSheetInfo.sheet]);

  // Group units by half-term
  const unitsByHalfTerm = React.useMemo(() => {
    const grouped: Record<string, Unit[]> = {};
    
    // Initialize all half-terms with empty arrays
    Object.keys(TERM_NAMES).forEach(termId => {
      grouped[termId] = [];
    });
    
    // Group units by term
    units.forEach(unit => {
      if (unit.term) {
        if (!grouped[unit.term]) {
          grouped[unit.term] = [];
        }
        grouped[unit.term].push(unit);
      } else {
        // If no term is specified, put in Autumn 1 by default
        if (!grouped['A1']) {
          grouped['A1'] = [];
        }
        grouped['A1'].push(unit);
      }
    });
    
    return grouped;
  }, [units]);

  // Handle unit selection
  const handleUnitSelect = (unit: Unit) => {
    console.log('🎯 UnitViewer: Half-term selected', {
      halfTermId: unit.id,
      halfTermName: unit.name,
      lessonNumbers: unit.lessonNumbers,
      lessonCount: unit.lessonNumbers?.length || 0,
      lessonsExistInData: unit.lessonNumbers?.map(ln => ({ 
        lessonNumber: ln, 
        exists: !!allLessonsData[ln] 
      }))
    });
    setSelectedUnit(unit);
  };

  // Handle back button click
  const handleBackToUnits = () => {
    setSelectedUnit(null);
  };

  // Handle activity click
  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  // Handle lesson export
  const handleLessonExport = (lessonNumber: string) => {
    setSelectedLessonForExport(lessonNumber);
  };

  // Handle focusing on a specific half-term
  const handleFocusHalfTerm = (termId: string) => {
    setFocusedHalfTermId(termId === focusedHalfTermId ? null : termId);
    // Reset the term filter when focusing on a specific half-term
    setSelectedTerm('all');
  };

  // Handle half-term card click
  const handleHalfTermClick = (halfTermId: string) => {
    setSelectedHalfTerm(halfTermId);
    setShowLessonSelectionModal(true);
  };

  // Check if a half-term is marked as complete
  const isHalfTermComplete = (halfTermId: string) => {
    const halfTerm = halfTerms.find(term => term.id === halfTermId);
    return halfTerm ? halfTerm.isComplete || false : false;
  };

  // Handle lesson reordering
  const handleReorderLessons = (dragIndex: number, hoverIndex: number) => {
    if (!selectedHalfTerm) return;
    
    const lessons = getLessonsForHalfTerm(selectedHalfTerm);
    const draggedLesson = lessons[dragIndex];
    const newLessons = [...lessons];
    newLessons.splice(dragIndex, 1);
    newLessons.splice(hoverIndex, 0, draggedLesson);
    updateHalfTerm(selectedHalfTerm, newLessons, isHalfTermComplete(selectedHalfTerm));
  };

  // Handle lesson removal
  const handleRemoveLesson = (halfTermId: string, lessonNumber: string) => {
    const lessons = getLessonsForHalfTerm(halfTermId);
    const newLessons = lessons.filter(num => num !== lessonNumber);
    
    // If all lessons are removed, automatically set isComplete to false
    const isComplete = newLessons.length > 0 ? isHalfTermComplete(halfTermId) : false;
    
    updateHalfTerm(halfTermId, newLessons, isComplete);
  };

  // Handle view lesson details
  const handleViewLessonDetails = (lessonNumber: string) => {
    setSelectedLessonForDetails(lessonNumber);
    // Find which half-term contains this lesson (for removing from term vs deleting permanently)
    const containingHalfTerm = halfTerms.find(ht => 
      ht.lessons && ht.lessons.includes(lessonNumber)
    );
    if (containingHalfTerm) {
      setSelectedHalfTerm(containingHalfTerm.id);
    }
  };

  // Create a new unit
  const handleCreateUnit = () => {
    const newUnit: Unit = {
      id: `unit-${Date.now()}`,
      name: 'New Unit',
      description: 'Add a description for this unit',
      lessonNumbers: [],
      color: getRandomColor(),
      term: 'A1', // Default to Autumn 1
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const updatedUnits = [...units, newUnit];
    setUnits(updatedUnits);
    localStorage.setItem(`units-${currentSheetInfo.sheet}`, JSON.stringify(updatedUnits));
    
    // Select the new unit
    setSelectedUnit(newUnit);
  };

  // Generate a random color for new units
  const getRandomColor = () => {
    const colors = [
      '#3B82F6', // Blue
      '#F59E0B', // Amber
      '#10B981', // Emerald
      '#8B5CF6', // Violet
      '#EC4899', // Pink
      '#EF4444', // Red
      '#F97316', // Orange
      '#14B8A6', // Teal
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Handle printing a half-term
  const handlePrintHalfTerm = (halfTermId: string, halfTermName: string) => {
    setPrintHalfTermId(halfTermId);
    setPrintHalfTermName(halfTermName);
    setShowPrintModal(true);
  };

  // Handle printing a unit
  const handlePrintUnit = (unitId: string) => {
    const unit = units.find(u => u.id === unitId);
    if (unit) {
      setPrintUnitId(unitId);
      setPrintUnitName(unit.name);
      setShowPrintModal(true);
    }
  };

  // Start editing a lesson (same as LessonLibrary)
  const handleEditLesson = (lessonNumber: string) => {
    const lessonData = allLessonsData[lessonNumber];
    if (lessonData) {
      // Use orderedActivities if available (preserves exact order across categories)
      // Otherwise fall back to categoryOrder method (for backward compatibility)
      let activities: any[];
      
      if (lessonData.orderedActivities && Array.isArray(lessonData.orderedActivities)) {
        // Use the flat ordered array - this preserves exact order including cross-category ordering
        activities = lessonData.orderedActivities.map((activity: any, index: number) => ({
          ...activity,
          _editId: `${lessonNumber}-${index}-${Date.now()}`
        }));
        console.log('📖 Loading lesson with orderedActivities (exact order preserved)');
      } else {
        // Fallback to old method using categoryOrder
        const categoryOrder = lessonData.categoryOrder || Object.keys(lessonData.grouped);
        activities = categoryOrder
          .filter(category => lessonData.grouped[category])
          .flatMap(category => lessonData.grouped[category] || [])
          .map((activity: any, index: number) => ({
            ...activity,
            _editId: `${lessonNumber}-${index}-${Date.now()}`
          }));
        console.log('📖 Loading lesson with categoryOrder (legacy method)');
      }
      
      console.log('📖 Loading lesson for editing:', {
        lessonNumber,
        activityCount: activities.length,
        activitiesOrder: activities.map((a, i) => `${i + 1}. ${a.activity} (${a.category})`)
      });
      
      // Load custom header and footer if they exist
      setCustomHeader(lessonData.customHeader || '');
      setCustomFooter(lessonData.customFooter || '');
      setShowHeaderFooterEdit(!!(lessonData.customHeader || lessonData.customFooter));
      
      setEditingLessonActivities(activities);
    setEditingLessonNumber(lessonNumber);
    setShowEditModal(true);
    }
  };

  // Save edited lesson
  const handleSaveEditing = async () => {
    console.log('💾 SAVE BUTTON CLICKED - Current state:', {
      lessonNumber: editingLessonNumber,
      activitiesCount: editingLessonActivities.length,
      currentOrder: editingLessonActivities.map((a, i) => `${i + 1}. ${a.activity} (${a.category})`)
    });
    
    if (editingLessonNumber && editingLessonActivities.length >= 0) {
      // Clean activities by removing temporary edit IDs
      const cleanedActivities = editingLessonActivities.map(activity => {
        const { _editId, ...cleanActivity } = activity;
        return cleanActivity;
      });

      // Group activities back by category while preserving order
      const grouped: Record<string, any[]> = {};
      const categoryOrder: string[] = [];
      
      cleanedActivities.forEach(activity => {
        const category = activity.category || 'Other';
        if (!grouped[category]) {
          grouped[category] = [];
          categoryOrder.push(category);
        }
        grouped[category].push(activity);
      });

      // Update lesson data - IMPORTANT: Save orderedActivities to preserve exact order
      const updatedLessonData = {
        ...allLessonsData[editingLessonNumber],
        grouped,
        categoryOrder,
        orderedActivities: cleanedActivities, // Store flat ordered array
        totalTime: cleanedActivities.reduce((sum: number, act: any) => sum + (act.time || 0), 0),
        customHeader: customHeader || undefined, // Only save if not empty
        customFooter: customFooter || undefined  // Only save if not empty
      };

      console.log('💾 Saving lesson with order:', {
        lessonNumber: editingLessonNumber,
        categoryOrder,
        activityCount: cleanedActivities.length,
        categories: Object.keys(grouped).map(cat => `${cat}: ${grouped[cat].length} activities`),
        orderedActivities: cleanedActivities.map((a, i) => `${i + 1}. ${a.activity} (${a.category})`),
        customHeader: customHeader || '(using default)',
        customFooter: customFooter || '(using default)'
      });

      // Update in context and wait for it to complete
      if (updateLessonData) {
        await updateLessonData(editingLessonNumber, updatedLessonData);
        console.log('✅ Lesson save complete');
      }
      
      cancelEditing();
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingLessonNumber(null);
    setEditingLessonActivities([]);
    setShowEditModal(false);
    setShowActivityPicker(false);
    setActivitySearchQuery('');
    setSelectedCategory('all');
    setShowHeaderFooterEdit(false);
    setCustomHeader('');
    setCustomFooter('');
  };

  // Delete activity
  const handleDeleteActivity = (activityIndex: number) => {
    setEditingLessonActivities(prev => prev.filter((_, index) => index !== activityIndex));
  };

  // Reorder activities
  const handleReorderActivity = (fromIndex: number, toIndex: number) => {
    console.log(`🔄 Reordering activity: from index ${fromIndex} to ${toIndex}`);
    setEditingLessonActivities(prev => {
      const newActivities = [...prev];
      const [movedActivity] = newActivities.splice(fromIndex, 1);
      newActivities.splice(toIndex, 0, movedActivity);
      console.log('📝 New activity order:', newActivities.map((a, i) => `${i + 1}. ${a.activity}`));
      return newActivities;
    });
  };

  // Add activity to editing lesson
  const handleAddActivity = (activity: any) => {
    const newActivity = {
      ...activity,
      _editId: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };
    setEditingLessonActivities(prev => [...prev, newActivity]);
    setShowActivityPicker(false);
    setActivitySearchQuery('');
    setSelectedCategory('all');
  };

  // Filter activities for the picker
  const filteredActivities = React.useMemo(() => {
    if (!allActivities) return [];
    
    return allActivities.filter((activity: any) => {
      const matchesSearch = !activitySearchQuery || 
        activity.activity.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
        getPlainTextFromHtml(activity.description).toLowerCase().includes(activitySearchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allActivities, activitySearchQuery, selectedCategory]);

  // If a unit is selected, show its details
  if (selectedUnit) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Unit Header */}
          <div className="bg-white rounded-card shadow-soft border border-gray-200 overflow-hidden mb-6">
            <div 
              className="p-6 text-white relative"
              style={{ 
                background: `linear-gradient(135deg, ${selectedUnit.color || theme.primary} 0%, ${theme.secondary} 100%)` 
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <button
                      onClick={handleBackToUnits}
                      className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200"
                      title="Back to all units"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-2xl font-bold">{selectedUnit.name}</h1>
                  </div>
                  <div className="flex items-center space-x-4 text-white text-opacity-90">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5" />
                      <span className="font-medium">{selectedUnit.lessonNumbers.length} lessons</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span className="font-medium">{TERM_NAMES[selectedUnit.term || 'A1'] || 'Not assigned'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePrintUnit(selectedUnit.id)}
                    className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group flex items-center space-x-2"
                    title="Export Unit to PDF"
                  >
                    <Printer className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-medium">Export PDF</span>
                  </button>
                  <button
                    className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 group flex items-center space-x-2"
                    title="Edit Unit"
                  >
                    <Edit3 className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-medium">Edit Unit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Unit Description */}
          {selectedUnit.description && (
            <div className="bg-white rounded-card shadow-soft border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Unit Description</h2>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedUnit.description }}
              />
            </div>
          )}

          {/* Lessons and Stacks in this Unit */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lessons and Stacks in this Unit</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {/* Display individual lessons */}
              {selectedUnit.lessonNumbers.map((lessonNumber, index) => {
                const lessonData = allLessonsData[lessonNumber];
                
                console.log('🔍 UnitViewer - Rendering lesson:', {
                  lessonNumber,
                  hasData: !!lessonData,
                  unitLessonIndex: index + 1
                });
                
                // Only show lessons that exist in allLessonsData
                // Note: Lessons assigned to units should show even if not assigned to a half-term yet
                if (!lessonData) {
                  console.warn('⚠️ Lesson data not found for:', lessonNumber);
                  return null;
                }
                
                return (
                  <div key={lessonNumber} className="relative group">
                    <LessonLibraryCard
                      lessonNumber={lessonNumber}
                      displayNumber={index + 1}
                      lessonData={lessonData}
                      viewMode="grid"
                      onClick={() => handleViewLessonDetails(lessonNumber)}
                      onEdit={() => handleEditLesson(lessonNumber)}
                      theme={theme}
                      halfTerms={halfTerms}
                      onShare={() => {}} // Share functionality handled internally in card
                    />
                    
                    {/* Overlay buttons that appear on hover */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLessonExport(lessonNumber);
                        }}
                        className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg shadow-sm text-gray-700 hover:text-gray-900"
                        title="Export Lesson"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {/* Display stacks assigned to this half-term */}
              {(() => {
                const halfTermData = halfTerms.find(term => term.id === selectedUnit.id);
                const stackIds = halfTermData?.stacks || [];
                
                return stackIds.map((stackId) => {
                  const stack = stacks.find(s => s.id === stackId);
                  if (!stack) return null;
                  
                  return (
                    <div key={`stack-${stackId}`} className="relative group">
                      <StackCard 
                        stack={stack} 
                        onClick={() => setSelectedStackForModal(stack.id)}
                        onPrint={(stack) => {
                          // Trigger print modal with stack's lessons
                          setPrintStackId(stack.id);
                          setPrintHalfTermName(`${stack.name}`);
                          setPrintHalfTermId(null);
                          setPrintUnitId(null);
                          setPrintUnitName(null);
                          setShowPrintModal(true);
                        }}
                      />
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Back to Units Button */}
          <div className="text-center">
            <button
              onClick={handleBackToUnits}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-button transition-colors duration-200 shadow-soft hover:shadow-hover"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back to All Units</span>
            </button>
          </div>
        </div>

        {/* Activity Details Modal */}
        {selectedActivity && (
          <ActivityDetails
            activity={selectedActivity}
            onClose={() => setSelectedActivity(null)}
          />
        )}

        {/* Lesson Exporter */}
        {selectedLessonForExport && (
          <LessonExporter
            lessonNumber={selectedLessonForExport}
            onClose={() => setSelectedLessonForExport(null)}
          />
        )}

        {/* Lesson Details Modal */}
        {selectedLessonForDetails && (() => {
          // Find which half-term contains this lesson
          const containingHalfTerm = halfTerms.find(ht => 
            ht.lessons && ht.lessons.includes(selectedLessonForDetails)
          );
          
          return (
            <LessonDetailsModal
              lessonNumber={selectedLessonForDetails}
              onClose={() => {
                setSelectedLessonForDetails(null);
                setSelectedHalfTerm(null);
              }}
              theme={theme}
              onExport={() => {
                setSelectedLessonForExport(selectedLessonForDetails);
                setSelectedLessonForDetails(null);
              }}
              onEdit={() => {
                handleEditLesson(selectedLessonForDetails);
                setSelectedLessonForDetails(null);
              }}
              unitId={selectedUnit.id}
              unitName={selectedUnit.name}
              halfTermId={containingHalfTerm?.id}
              halfTermName={containingHalfTerm?.name}
            />
          );
        })()}

        {/* Print Modal - Handles lessons, stacks, half-terms, and units */}
        {showPrintModal && (
          <LessonPrintModal
            lessonNumbers={
              printStackId
                ? (stacks.find(s => s.id === printStackId)?.lessons.filter(l => typeof l === 'string') as string[] || [])
                : printUnitId 
                  ? (units.find(u => u.id === printUnitId)?.lessonNumbers.filter(lessonNumber => 
                      allLessonsData[lessonNumber]
                    ) || [])
                  : printHalfTermId
                    ? getLessonsForHalfTerm(printHalfTermId)
                    : selectedUnit.lessonNumbers.filter(lessonNumber => 
                        allLessonsData[lessonNumber]
                      )
            }
            onClose={() => {
              setShowPrintModal(false);
              setPrintHalfTermId(null);
              setPrintHalfTermName(null);
              setPrintUnitId(null);
              setPrintUnitName(null);
              setPrintStackId(null);
            }}
            halfTermId={printHalfTermId || undefined}
            halfTermName={printHalfTermName || undefined}
            unitId={printUnitId || selectedUnit.id}
            unitName={printUnitName || selectedUnit.name}
            isUnitPrint={!!printUnitId || !!printStackId}
          />
        )}

        {/* Activity Picker Modal */}
        {showActivityPicker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
            <div className="bg-white rounded-card shadow-soft w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-gray-200 text-white"
style={{ background: 'linear-gradient(to right, #2DD4BF, #14B8A6)' }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Add Activity to Lesson</h3>
                  <button
                    onClick={() => setShowActivityPicker(false)}
                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Search and Filter */}
                <div className="flex space-x-3 mt-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search activities..."
                      value={activitySearchQuery}
                      onChange={(e) => setActivitySearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <div className="relative" style={{ minWidth: '250px' }}>
                    <SimpleNestedCategoryDropdown
                      selectedCategory={selectedCategory === 'all' ? '' : selectedCategory}
                      onCategoryChange={(category) => setSelectedCategory(category || 'all')}
                      placeholder="All Categories"
                      className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredActivities.map((activity: any, index: number) => (
                    <button
                      key={`${activity.id || index}-${activity.activity}`}
                      onClick={() => handleAddActivity(activity)}
                      className="text-left p-4 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm mb-1">
                            {activity.activity}
                          </h4>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs px-2 py-1 bg-gray-200 rounded-full text-gray-600">
                              {activity.category}
                            </span>
                            {activity.time > 0 && (
                              <span className="text-xs text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {activity.time}m
                              </span>
                            )}
                          </div>
                          <div 
                            className="text-xs text-gray-600 line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: activity.description || '' }}
                          />
                        </div>
                        <Plus className="h-5 w-5 text-blue-600 ml-2 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
                
                {filteredActivities.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No activities found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lesson Edit Modal */}
        {showEditModal && editingLessonNumber && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-card shadow-soft w-full max-w-6xl max-h-[90vh] overflow-hidden">
              {/* Edit Header */}
              <div className="p-4 border-b border-gray-200 text-white"
style={{ background: 'linear-gradient(to right, #2DD4BF, #14B8A6)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Edit3 className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">
                      Editing: {allLessonsData[editingLessonNumber]?.title || `Lesson ${editingLessonNumber}`}
                    </h3>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveEditing}
                      className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      <span>Save Changes</span>
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 bg-transparent hover:bg-white hover:bg-opacity-10 text-white font-medium rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Header/Footer Toggle */}
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showHeaderFooterEdit}
                    onChange={(e) => setShowHeaderFooterEdit(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Edit header and footer text
                  </span>
                </label>
              </div>

              {/* Header/Footer Edit Section - Collapsible */}
              {showHeaderFooterEdit && (
                <div className="border-b border-gray-200 bg-blue-50 px-6 py-4">
                  <div className="space-y-4">
                    {/* Header Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Header
                      </label>
                      <input
                        type="text"
                        value={customHeader}
                        onChange={(e) => setCustomHeader(e.target.value)}
                        placeholder={`Leave blank for default: "Lesson ${editingLessonNumber}"`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Default: Lesson {editingLessonNumber}
                      </p>
                    </div>

                    {/* Footer Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Footer
                      </label>
                      <input
                        type="text"
                        value={customFooter}
                        onChange={(e) => setCustomFooter(e.target.value)}
                        placeholder="Leave blank for default footer"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Default: Creative Curriculum Designer • Lesson {editingLessonNumber} • {currentSheetInfo.display} • © Rhythmstix 2026
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Activities List - Editable with Drag & Drop */}
              <div className="flex-1 overflow-hidden">
                <div className="p-6 max-h-[55vh] overflow-y-auto">
                  <DndProvider backend={HTML5Backend}>
                    <div className="space-y-3">
                      {editingLessonActivities.map((activity: any, activityIndex: number) => (
                        <MinimizableActivityCard
                          key={activity._editId || `activity-${activityIndex}`}
                          activity={activity}
                          index={activityIndex}
                          onRemove={handleDeleteActivity}
                          onReorder={handleReorderActivity}
                          onActivityClick={(activity) => {
                            // Optional: Could open activity details modal here
                            console.log('Activity clicked:', activity.activity);
                          }}
                        />
                      ))}
                    </div>
                  </DndProvider>
                  
                  {editingLessonActivities.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg">No activities in this lesson</p>
                      <p className="text-sm">Add activities to build your lesson</p>
                    </div>
                  )}
                </div>

                {/* Add Activity Button */}
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <button
                    onClick={() => setShowActivityPicker(true)}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Activity to Lesson</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default view - half-term cards
  return (
    <DndProvider backend={HTML5Backend}>
      <div key={refreshKey} className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          {/* Clean White Header Card */}
          <div className="bg-white rounded-card shadow-soft border border-gray-200 mb-6 sm:mb-8 p-4 sm:p-6 md:p-7">
            <div className="text-gray-900">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-shrink-0">
                  <h2 
                    className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
                  >
                    Half-Term Planner
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-xs sm:text-sm font-normal text-gray-600">
                      Academic Year {currentAcademicYear}
                    </span>
                    {(() => {
                      const currentYear = new Date().getFullYear();
                      const nextYear = currentYear + 1;
                      const currentAcademicYearCheck = `${currentYear}-${nextYear}`;
                      return currentAcademicYear === currentAcademicYearCheck && (
                        <span className="text-xs font-medium px-2 sm:px-3 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: '#F0FDFA', color: '#0F766E' }}>
                          Current Year
                        </span>
                      );
                    })()}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1 lg:flex-initial lg:max-w-md">
                  {/* Year Navigation Arrows */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        const currentIndex = getAvailableYears().indexOf(currentAcademicYear);
                        const canGoBack = currentIndex < getAvailableYears().length - 1;
                        if (canGoBack) {
                          handleYearChange(getAvailableYears()[currentIndex + 1]);
                        }
                      }}
                      disabled={getAvailableYears().indexOf(currentAcademicYear) >= getAvailableYears().length - 1}
                      className="w-8 h-8 sm:w-9 sm:h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200 hover:border-teal-600 hover:text-teal-600 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      style={{ color: '#6B7280' }}
                      title="View previous academic year"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => {
                        const currentIndex = getAvailableYears().indexOf(currentAcademicYear);
                        const canGoForward = currentIndex > 0;
                        if (canGoForward) {
                          handleYearChange(getAvailableYears()[currentIndex - 1]);
                        }
                      }}
                      disabled={getAvailableYears().indexOf(currentAcademicYear) <= 0}
                      className="w-8 h-8 sm:w-9 sm:h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200 hover:border-teal-600 hover:text-teal-600 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      style={{ color: '#6B7280' }}
                      title="Return to more recent year"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Copy Term Button */}
                  <button
                    onClick={() => setShowTermCopyModal(true)}
                    className="px-3 sm:px-4 py-2 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 touch-manipulation min-h-[36px] sm:min-h-[40px]"
                    style={{ 
                      backgroundColor: '#14B8A6', 
                      fontWeight: 500,
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#0D9488';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#14B8A6';
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.backgroundColor = '#0D9488';
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.backgroundColor = '#14B8A6';
                    }}
                  >
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span style={{ fontWeight: 500, userSelect: 'none', whiteSpace: 'nowrap' }}>Copy Term</span>
                  </button>
                  
                  {/* Search field */}
                  <div className="relative flex-1 sm:flex-initial sm:min-w-[180px] sm:max-w-[240px]">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ width: '16px', height: '16px' }}>
                      <svg 
                        viewBox="0 0 80 80" 
                        className="w-full h-full"
                        style={{ fill: 'none' }}
                      >
                        <defs>
                          <linearGradient id="searchBarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#14B8A6" />
                            <stop offset="50%" stopColor="#0D9488" />
                            <stop offset="100%" stopColor="#008272" />
                          </linearGradient>
                        </defs>
                        <circle
                          cx="40"
                          cy="40"
                          r="38"
                          fill="url(#searchBarGradient)"
                        />
                        <text
                          x="40"
                          y="40"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="white"
                          fontSize="32"
                          fontWeight="700"
                          fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
                          letterSpacing="-1"
                        >
                          CD
                        </text>
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search units..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-48 pl-10 pr-4 border border-gray-300 rounded-lg text-xs sm:text-sm transition-all duration-200 touch-manipulation"
                      style={{ 
                        height: '36px',
                        minHeight: '36px',
                        fontSize: '14px',
                        color: '#111827',
                        backgroundColor: 'white',
                        WebkitAppearance: 'none',
                        appearance: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'transparent';
                        e.target.style.boxShadow = '0 0 0 2px #14B8A6';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#D1D5DB';
                        e.target.style.boxShadow = 'none';
                      }}
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Focused Half-Term Indicator */}
          {focusedHalfTermId && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Focused on {TERM_NAMES[focusedHalfTermId]}</h3>
                  <p className="text-sm text-gray-600">Showing only units from this half-term</p>
                </div>
              </div>
              <button
                onClick={() => setFocusedHalfTermId(null)}
                className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-medium"
              >
                Show All Half-Terms
              </button>
            </div>
          )}

          {/* Half-Term Cards Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              <span className="ml-3 text-gray-600">Loading half-terms...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
              {HALF_TERMS
                .map((halfTerm) => {
                  const lessons = getLessonsForHalfTerm(halfTerm.id);
                  const isComplete = isHalfTermComplete(halfTerm.id);
                  
                  // Get stacks for this half-term
                  const halfTermData = halfTerms.find(term => term.id === halfTerm.id);
                  const stackIds = halfTermData?.stacks || [];
                  
                  // Count only valid lessons that exist in allLessonsData
                  const validLessons = lessons.filter(lessonNum => allLessonsData[lessonNum]);
                  
                  // Count only valid stacks that exist in stacks array
                  const validStacks = stackIds.filter(stackId => stacks.find(s => s.id === stackId));
                  
                  // Count lessons from valid stacks only and only those that exist in allLessonsData
                  const stackLessons = validStacks.reduce((total, stackId) => {
                    const stack = stacks.find(s => s.id === stackId);
                    if (!stack) return total;
                    const validStackLessonCount = (stack.lessons || []).filter(l => !!allLessonsData[l]).length;
                    return total + validStackLessonCount;
                  }, 0);
                  
                  // Total lesson count includes both individual lessons and lessons from stacks
                  const totalLessonCount = validLessons.length + stackLessons;
                  
                  // Group lessons by unit name for this half-term
                  const lessonsByUnit: Record<string, Array<{ lessonNumber: string; lessonData: any }>> = {};
                  
                  validLessons.forEach((lessonNumber) => {
                    const lessonData = allLessonsData[lessonNumber];
                    if (!lessonData) return;
                    
                    // Extract unit names from activities
                    const unitNames = new Set<string>();
                    
                    // Check all activities in the lesson
                    Object.values(lessonData.grouped || {}).forEach((activities: any[]) => {
                      activities.forEach((activity: any) => {
                        if (activity.unitName && activity.unitName.trim()) {
                          unitNames.add(activity.unitName.trim());
                        }
                      });
                    });
                    
                    // Also check orderedActivities if available
                    if (lessonData.orderedActivities) {
                      lessonData.orderedActivities.forEach((activity: any) => {
                        if (activity.unitName && activity.unitName.trim()) {
                          unitNames.add(activity.unitName.trim());
                        }
                      });
                    }
                    
                    // Add lesson to each unit it belongs to
                    unitNames.forEach(unitName => {
                      if (!lessonsByUnit[unitName]) {
                        lessonsByUnit[unitName] = [];
                      }
                      lessonsByUnit[unitName].push({ lessonNumber, lessonData });
                    });
                  });
                  
                  // Sort lessons within each unit
                  Object.keys(lessonsByUnit).forEach(unitName => {
                    lessonsByUnit[unitName].sort((a, b) => {
                      const numA = parseInt(a.lessonNumber.replace(/^lesson/i, '')) || 0;
                      const numB = parseInt(b.lessonNumber.replace(/^lesson/i, '')) || 0;
                      return numA - numB;
                    });
                  });
                  
                  // DEBUG: Log lesson count calculation
                  console.log(`📊 HalfTerm ${halfTerm.id} (${halfTerm.name}):`, {
                    lessons: validLessons.length,
                    lessonsList: validLessons,
                    stackLessons: stackLessons,
                    totalLessonCount: totalLessonCount,
                    validStacksCount: validStacks.length,
                    loading: loading,
                    halfTermData: halfTermData,
                    stackIds: stackIds,
                    allHalfTerms: halfTerms.map(ht => ({ id: ht.id, name: ht.name, lessons: ht.lessons, stacks: ht.stacks }))
                  });
                  
                  return (
                    <HalfTermCard
                      key={halfTerm.id}
                      id={halfTerm.id}
                      name={halfTerm.name}
                      months={halfTerm.months}
                      color={TERM_COLORS[halfTerm.id]}
                      lessonCount={totalLessonCount}
                      stackCount={validStacks.length}
                      onClick={() => handleHalfTermClick(halfTerm.id)}
                      isComplete={isComplete}
                      theme={theme}
                      onLessonClick={handleViewLessonDetails}
                      onLessonEdit={handleEditLesson}
                      halfTerms={halfTerms}
                    />
                  );
                })}
            </div>
          )}


        </div>

        {/* Activity Details Modal */}
        {selectedActivity && (
          <ActivityDetails
            activity={selectedActivity}
            onClose={() => setSelectedActivity(null)}
          />
        )}

        {/* Lesson Exporter */}
        {selectedLessonForExport && (
          <LessonExporter
            lessonNumber={selectedLessonForExport}
            onClose={() => setSelectedLessonForExport(null)}
          />
        )}

        {/* Lesson Selection Modal */}
        {showLessonSelectionModal && selectedHalfTerm && (() => {
          const lessonsForHalfTerm = getLessonsForHalfTerm(selectedHalfTerm);
          console.log('🎯 UNIT VIEWER - Opening LessonSelectionModal:', {
            selectedHalfTerm,
            lessonsForHalfTerm,
            lessonsCount: lessonsForHalfTerm.length,
            halfTerms: halfTerms.map(ht => ({ id: ht.id, name: ht.name, lessons: ht.lessons }))
          });
          return (
            <LessonSelectionModal
              isOpen={showLessonSelectionModal}
              onClose={() => {
                setShowLessonSelectionModal(false);
                setSelectedHalfTerm(null);
              }}
              halfTermId={selectedHalfTerm}
              halfTermName={HALF_TERMS.find(term => term.id === selectedHalfTerm)?.name || ''}
              halfTermMonths={HALF_TERMS.find(term => term.id === selectedHalfTerm)?.months || ''}
              halfTermColor={TERM_COLORS[selectedHalfTerm]}
              selectedLessons={lessonsForHalfTerm}
              onSave={(lessons, isComplete) => {
                // Preserve existing stacks when updating half-term
                const existingHalfTerm = halfTerms.find(term => term.id === selectedHalfTerm);
                const existingStacks = existingHalfTerm?.stacks || [];
                updateHalfTerm(selectedHalfTerm, lessons, isComplete, existingStacks);
                setShowLessonSelectionModal(false);
                setSelectedHalfTerm(null);
              }}
            />
          );
        })()}

        {/* Lesson Details Modal */}
        {selectedLessonForDetails && (() => {
          // Find which half-term contains this lesson
          const containingHalfTerm = halfTerms.find(ht => 
            ht.lessons && ht.lessons.includes(selectedLessonForDetails)
          );
          
          return (
            <LessonDetailsModal
              lessonNumber={selectedLessonForDetails}
              onClose={() => {
                setSelectedLessonForDetails(null);
                setSelectedHalfTerm(null);
              }}
              theme={theme}
              onExport={() => {
                setSelectedLessonForExport(selectedLessonForDetails);
                setSelectedLessonForDetails(null);
              }}
              halfTermId={containingHalfTerm?.id}
              halfTermName={containingHalfTerm?.name}
            />
          );
        })()}

        {/* Stack Modal */}
        {selectedStackForModal && (
          <StackModal
            isOpen={true}
            onClose={() => setSelectedStackForModal(null)}
            stack={stacks.find(s => s.id === selectedStackForModal) || null}
            onOpenLesson={(lessonNumber) => setSelectedLessonForDetails(lessonNumber)}
          />
        )}

        {/* Print Modal - Handles lessons, stacks, half-terms, and units */}
        {showPrintModal && (
          <LessonPrintModal
            lessonNumbers={
              printStackId
                ? (stacks.find(s => s.id === printStackId)?.lessons.filter(l => typeof l === 'string') as string[] || [])
                : printUnitId 
                  ? (units.find(u => u.id === printUnitId)?.lessonNumbers.filter(lessonNumber => 
                      allLessonsData[lessonNumber]
                    ) || [])
                  : printHalfTermId 
                    ? getLessonsForHalfTerm(printHalfTermId)
                    : []
            }
            onClose={() => {
              setShowPrintModal(false);
              setPrintHalfTermId(null);
              setPrintHalfTermName(null);
              setPrintUnitId(null);
              setPrintUnitName(null);
              setPrintStackId(null);
            }}
            halfTermId={printHalfTermId || undefined}
            halfTermName={printHalfTermName || undefined}
            unitId={printUnitId || undefined}
            unitName={printUnitName || undefined}
            isUnitPrint={!!printUnitId || !!printStackId}
          />
        )}

        {/* Term Copy Modal */}
        <TermCopyModal
          isOpen={showTermCopyModal}
          onClose={() => setShowTermCopyModal(false)}
          onCopy={handleCopyTerm}
          availableYears={getAvailableYears()}
          currentYear={currentAcademicYear}
        />
      </div>
    </DndProvider>
  );
}