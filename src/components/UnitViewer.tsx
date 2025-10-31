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
import { LessonPlanBuilder } from './LessonPlanBuilder';
import { YearNavigation } from './YearNavigation';
import { TermCopyModal } from './TermCopyModal';
import { StackCard } from './StackCard';
import { StackModal } from './StackModal';
import { useLessonStacks } from '../hooks/useLessonStacks';
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
    loading
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
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Get theme colors for current class
  const theme = getThemeForClass(currentSheetInfo.sheet);

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

  // Handle editing a lesson
  const handleEditLesson = (lessonNumber: string) => {
    console.log('✏️ Starting to edit lesson:', lessonNumber);
    setEditingLessonNumber(lessonNumber);
    setShowEditModal(true);
  };

  // Handle completing lesson edit
  const handleEditComplete = () => {
    console.log('✅ Lesson edit completed');
    setEditingLessonNumber(null);
    setShowEditModal(false);
  };

  // If a unit is selected, show its details
  if (selectedUnit) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Unit Header */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
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
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Display individual lessons */}
              {selectedUnit.lessonNumbers.map((lessonNumber, index) => {
                const lessonData = allLessonsData[lessonNumber];
                
                console.log('🔍 UnitViewer - Rendering lesson:', {
                  lessonNumber,
                  hasData: !!lessonData,
                  isAssigned: isLessonAssignedToHalfTerm(lessonNumber),
                  halfTermsWithThisLesson: halfTerms.filter(ht => ht.lessons.includes(lessonNumber)).map(ht => ht.id)
                });
                
                // FIXED: Only show lessons that exist in allLessonsData
                // Since selectedUnit.lessonNumbers already contains the lessons for this half-term,
                // we don't need to check if they're assigned again
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
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
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
        {selectedLessonForDetails && (
          <LessonDetailsModal
            lessonNumber={selectedLessonForDetails}
            onClose={() => setSelectedLessonForDetails(null)}
            theme={theme}
            onExport={() => {
              setSelectedLessonForExport(selectedLessonForDetails);
              setSelectedLessonForDetails(null);
            }}
            unitId={selectedUnit.id}
            unitName={selectedUnit.name}
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
                      allLessonsData[lessonNumber] && isLessonAssignedToHalfTerm(lessonNumber)
                    ) || [])
                  : printHalfTermId
                    ? getLessonsForHalfTerm(printHalfTermId)
                    : selectedUnit.lessonNumbers.filter(lessonNumber => 
                        allLessonsData[lessonNumber] && isLessonAssignedToHalfTerm(lessonNumber)
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

        {/* Lesson Edit Modal */}
        {showEditModal && editingLessonNumber && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
              <LessonPlanBuilder
                editingLessonNumber={editingLessonNumber}
                onEditComplete={handleEditComplete}
              />
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
        <div className="max-w-7xl mx-auto px-8 py-6">
          {/* Clean White Header Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6" style={{ padding: '24px' }}>
            <div className="text-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 
                    className="text-2xl font-semibold text-gray-900 mb-1"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
                  >
                    Half-Term Planner
                  </h2>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-normal text-gray-600">
                      Academic Year {currentAcademicYear}
                    </span>
                    {(() => {
                      const currentYear = new Date().getFullYear();
                      const nextYear = currentYear + 1;
                      const currentAcademicYearCheck = `${currentYear}-${nextYear}`;
                      return currentAcademicYear === currentAcademicYearCheck && (
                        <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#F0FDFA', color: '#0F766E' }}>
                          Current Year
                        </span>
                      );
                    })()}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Year Navigation Arrows */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const currentIndex = getAvailableYears().indexOf(currentAcademicYear);
                        const canGoBack = currentIndex < getAvailableYears().length - 1;
                        if (canGoBack) {
                          handleYearChange(getAvailableYears()[currentIndex + 1]);
                        }
                      }}
                      disabled={getAvailableYears().indexOf(currentAcademicYear) >= getAvailableYears().length - 1}
                      className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200 hover:border-teal-600 hover:text-teal-600"
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
                      className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200 hover:border-teal-600 hover:text-teal-600"
                      style={{ color: '#6B7280' }}
                      title="Return to more recent year"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Copy Term Button */}
                  <button
                    onClick={() => setShowTermCopyModal(true)}
                    className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2 focus:outline-none focus:ring-0"
                    style={{ 
                      backgroundColor: '#14B8A6', 
                      height: '36px',
                      fontWeight: 500,
                      userSelect: 'none',
                      WebkitUserSelect: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#0D9488';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#14B8A6';
                    }}
                  >
                    <Calendar className="h-4 w-4" />
                    <span style={{ fontWeight: 500, userSelect: 'none' }}>Copy Term</span>
                  </button>
                  
                  {/* Search field */}
                  <div className="relative">
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
                      className="w-64 pl-10 pr-4 border border-gray-300 rounded-lg text-sm transition-all duration-200"
                      style={{ 
                        height: '36px',
                        fontSize: '14px',
                        color: '#111827',
                        backgroundColor: 'white'
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
        {selectedLessonForDetails && (
          <LessonDetailsModal
            lessonNumber={selectedLessonForDetails}
            onClose={() => setSelectedLessonForDetails(null)}
            theme={theme}
            onExport={() => {
              setSelectedLessonForExport(selectedLessonForDetails);
              setSelectedLessonForDetails(null);
            }}
          />
        )}

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
                      allLessonsData[lessonNumber] && isLessonAssignedToHalfTerm(lessonNumber)
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