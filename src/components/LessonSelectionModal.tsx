import React, { useState, useEffect } from 'react';
import { X, Calendar, Eye, Save, Star, Clock, Search, Tag, CheckCircle, Download } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { LessonDetailsModal } from './LessonDetailsModal';
import { HalfTermView } from './HalfTermView';
import { LessonPrintModal } from './LessonPrintModal';
import { StackCard } from './StackCard';
import { StackModal } from './StackModal';
import { useLessonStacks } from '../hooks/useLessonStacks';

interface LessonSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  halfTermId: string;
  halfTermName: string;
  halfTermMonths: string;
  halfTermColor: string;
  selectedLessons: string[];
  onSave: (lessons: string[], isComplete?: boolean) => void;
}

export function LessonSelectionModal({
  isOpen,
  onClose,
  halfTermId,
  halfTermName,
  halfTermMonths,
  halfTermColor,
  selectedLessons,
  onSave
}: LessonSelectionModalProps) {
  // FIXED: Added halfTerms to the destructuring to check lesson assignments
  const { lessonNumbers, allLessonsData, currentSheetInfo, halfTerms, getTermSpecificLessonNumber } = useData();
  const { getThemeForClass } = useSettings();
  const { stacks } = useLessonStacks();
  
  // DEBUG: Log when stacks change
  useEffect(() => {
    console.log('🔍 LESSON SELECTION MODAL - Stacks updated:', {
      stacksLength: stacks.length,
      stackIds: stacks.map(s => s.id),
      halfTermId
    });
  }, [stacks, halfTermId]);
  // Initialize with all assigned lessons selected (since they're already assigned)
  const [localSelectedLessons, setLocalSelectedLessons] = useState<string[]>(selectedLessons);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHalfTermView, setShowHalfTermView] = useState(false);
  const [orderedLessons, setOrderedLessons] = useState<string[]>(selectedLessons);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedLessonForDetails, setSelectedLessonForDetails] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedStackForModal, setSelectedStackForModal] = useState<string | null>(null);

  // Update local state when selectedLessons prop changes (e.g., after lesson deletion)
  useEffect(() => {
    setLocalSelectedLessons(selectedLessons);
    setOrderedLessons(selectedLessons);
  }, [selectedLessons]);
  
  // Get theme colors for current class
  const theme = getThemeForClass(currentSheetInfo.sheet);

  // Get stacks assigned to this half-term
  const halfTermData = halfTerms.find(term => term.id === halfTermId);
  const assignedStackIds = halfTermData?.stacks || [];
  const assignedStacks = stacks.filter(stack => assignedStackIds.includes(stack.id));
  
  // Safety check: if halfTermData exists but stacks field is missing, initialize it
  if (halfTermData && halfTermData.stacks === undefined) {
    console.warn('⚠️ Half-term data missing stacks field:', {
      halfTermId,
      halfTermData,
      hasStacksField: 'stacks' in halfTermData
    });
  }
  
  // DEBUG: Log stack data with more detail
  console.log('🔍 LESSON SELECTION MODAL - Stack data:', {
    halfTermId,
    halfTermData: halfTermData ? { 
      id: halfTermData.id, 
      name: halfTermData.name, 
      stacks: halfTermData.stacks,
      stacksType: typeof halfTermData.stacks,
      stacksLength: halfTermData.stacks?.length
    } : null,
    assignedStackIds,
    assignedStackIdsType: typeof assignedStackIds,
    assignedStackIdsLength: assignedStackIds?.length,
    allStacks: stacks.map(s => ({ id: s.id, name: s.name })),
    allStacksLength: stacks.length,
    assignedStacks: assignedStacks.map(s => ({ id: s.id, name: s.name })),
    assignedStacksLength: assignedStacks.length,
    stackIdMatching: assignedStackIds?.map(stackId => ({
      stackId,
      foundInAllStacks: stacks.some(s => s.id === stackId),
      matchingStack: stacks.find(s => s.id === stackId)
    }))
  });

  // Load completion status from localStorage
  React.useEffect(() => {
    const savedHalfTerms = localStorage.getItem(`half-terms-${currentSheetInfo.sheet}`);
    if (savedHalfTerms) {
      try {
        const parsedHalfTerms = JSON.parse(savedHalfTerms);
        const halfTerm = parsedHalfTerms.find((term: any) => term.id === halfTermId);
        if (halfTerm) {
          setIsComplete(halfTerm.isComplete || false);
        }
      } catch (error) {
        console.error('Error parsing saved half-terms:', error);
      }
    }
  }, [halfTermId, currentSheetInfo.sheet]);

  if (!isOpen) return null;

  // Show all available lessons that can be assigned to this half-term
  const filteredLessons = lessonNumbers.filter(lessonNum => {
    const lessonData = allLessonsData[lessonNum];
    if (!lessonData) return false;
    
    // Apply search filtering
    if (searchQuery) {
      const matchesSearch = 
        lessonNum.includes(searchQuery) || 
        (lessonData.title && lessonData.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        Object.values(lessonData.grouped).some(activities => 
          activities.some(activity => 
            activity.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.category.toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
      
      if (!matchesSearch) return false;
    }
    
    return true;
  });

  // DEBUG: Log lesson filtering
  console.log('🔍 LESSON SELECTION MODAL - Lesson filtering:', {
    halfTermId,
    totalLessons: lessonNumbers.length,
    filteredLessons: filteredLessons.length,
    selectedLessons: selectedLessons,
    localSelectedLessons: localSelectedLessons,
    searchQuery,
    halfTermData: halfTerms.find(term => term.id === halfTermId)
  });

  // Handle lesson selection
  const handleLessonSelection = (lessonNumber: string) => {
    setLocalSelectedLessons(prev => {
      if (prev.includes(lessonNumber)) {
        // Remove lesson if already selected
        return prev.filter(num => num !== lessonNumber);
      } else {
        // Add lesson if not selected
        return [...prev, lessonNumber];
      }
    });
  };

  // Handle save
  const handleSave = () => {
    onSave(showHalfTermView ? orderedLessons : localSelectedLessons, isComplete);
    onClose();
  };

  // Toggle completion status
  const toggleComplete = () => {
    setIsComplete(!isComplete);
  };

  // Handle lesson reordering
  const handleReorderLessons = (dragIndex: number, hoverIndex: number) => {
    const draggedLesson = orderedLessons[dragIndex];
    const newOrderedLessons = [...orderedLessons];
    newOrderedLessons.splice(dragIndex, 1);
    newOrderedLessons.splice(hoverIndex, 0, draggedLesson);
    setOrderedLessons(newOrderedLessons);
  };

  // Handle export PDF - FIXED VERSION
  const handleExportPDF = () => {
    // Don't call onSave here - just show the print modal
    setShowPrintModal(true);
  };

  // Handle view lesson details
  const handleViewLessonDetails = (lessonNumber: string) => {
    setSelectedLessonForDetails(lessonNumber);
  };

  // Handle remove lesson from half-term
  const onRemoveLesson = (lessonNumber: string) => {
    const newOrderedLessons = orderedLessons.filter(num => num !== lessonNumber);
    setOrderedLessons(newOrderedLessons);
    setLocalSelectedLessons(prev => prev.filter(num => num !== lessonNumber));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div 
          className="p-6 text-white relative"
          style={{ 
            background: `linear-gradient(135deg, ${halfTermColor} 0%, ${halfTermColor}99 100%)` 
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">{halfTermName} - {halfTermMonths}</h2>
              <p className="text-white text-opacity-90">
                {showHalfTermView 
                  ? `${orderedLessons.length} lessons in this half-term` 
                  : 'Manage lessons assigned to this half-term'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Mark Complete Checkbox */}
              <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-2 rounded-lg">
                <span className="text-sm font-medium">Mark Complete</span>
                <button
                  onClick={toggleComplete}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                    isComplete 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white bg-opacity-50 text-transparent'
                  }`}
                >
                  {isComplete && <CheckCircle className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Export PDF Button - Single Click */}
              {showHalfTermView && orderedLessons.length > 0 && (
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  title="Export PDF"
                >
                  <Download className="h-4 w-4" />
                  <span className="text-sm font-medium">Export PDF</span>
                </button>
              )}
              
              <button
                onClick={() => {
                  if (showHalfTermView) {
                    setShowHalfTermView(false);
                  } else {
                    setShowHalfTermView(true);
                    setOrderedLessons([...localSelectedLessons]);
                  }
                }}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                {showHalfTermView ? (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>View All Lessons</span>
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    <span>Half-Term View</span>
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showHalfTermView && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search lessons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {showHalfTermView ? (
            /* Half-term view - ordered lessons and stacks */
            <div className="space-y-6">
              <div className={`border rounded-lg p-4 mb-6 ${
                isComplete 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className={`h-5 w-5 ${isComplete ? '' : 'text-blue-600'}`} style={isComplete ? {color: '#0BA596'} : {}} />
                    <h3 className="font-medium text-gray-900">{halfTermName} {isComplete ? 'Complete' : 'In Progress'}</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Drag and drop lessons to reorder them for this half-term
                </p>
              </div>

              {/* Stacks Section */}
              {assignedStacks.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Star className="h-5 w-5 mr-2" style={{ color: '#10A293' }} />
                    Lesson Stacks ({assignedStacks.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assignedStacks.map((stack) => (
                      <StackCard
                        key={stack.id}
                        stack={stack}
                        onClick={() => setSelectedStackForModal(stack.id)}
                        onPrint={(stack) => {
                          // Print functionality is handled by the parent (UnitViewer)
                          // This modal doesn't need print functionality
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Individual Lessons Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2" style={{ color: '#0BA596' }} />
                  Individual Lessons ({orderedLessons.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orderedLessons.map((lessonNum, index) => {
                    const lessonData = allLessonsData[lessonNum];
                    if (!lessonData) return null;
                    
                    return (
                      <div 
                        key={lessonNum} 
                        className="bg-white rounded-lg shadow-md border border-gray-200 p-4"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', index.toString());
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                          handleReorderLessons(dragIndex, index);
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">Lesson {getTermSpecificLessonNumber(lessonNum, halfTermId)}</h4>
                          <div className="flex items-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveLesson(lessonNum);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{lessonData.title || `Lesson ${index + 1}`}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                          <Clock className="h-3 w-3" />
                          <span>{lessonData.duration || '30'} min</span>
                          <Tag className="h-3 w-3" />
                          <span>{Object.keys(lessonData.grouped || {}).length} activities</span>
                        </div>
                        <button
                          onClick={() => handleViewLessonDetails(lessonNum)}
                          className="w-full text-left text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Lesson selection view */
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Tag className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-gray-900">Manage Lessons for {halfTermName}</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  View and manage lessons assigned to this half-term. Click lessons to remove them from this half-term.
                  {filteredLessons.length === 0 && assignedStacks.length === 0 ? ' No lessons assigned to this half-term yet.' : ''}
                </p>
              </div>

              {filteredLessons.length === 0 && assignedStacks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <Tag className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Lessons Assigned</h3>
                  <p className="text-gray-600">
                    {searchQuery 
                      ? 'No assigned lessons match your search criteria.' 
                      : 'No lessons have been assigned to this half-term yet. Use the Lesson Library to assign lessons to half-terms.'}
                  </p>
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stacks Section */}
                  {assignedStacks.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Star className="h-5 w-5 mr-2" style={{ color: '#8B5CF6' }} />
                        Lesson Stacks ({assignedStacks.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {assignedStacks.map((stack) => (
                          <StackCard
                            key={stack.id}
                            stack={stack}
                            onClick={() => setSelectedStackForModal(stack.id)}
                            onPrint={(stack) => {
                              // Print functionality is handled by the parent (UnitViewer)
                              // This modal doesn't need print functionality
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Individual Lessons Section */}
                  {filteredLessons.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Clock className="h-5 w-5 mr-2" style={{ color: '#0BA596' }} />
                        Individual Lessons ({filteredLessons.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredLessons.map((lessonNum, index) => {
                          const lessonData = allLessonsData[lessonNum];
                          if (!lessonData) return null;
                          
                          const isSelected = localSelectedLessons.includes(lessonNum);
                          
                          return (
                            <div 
                              key={lessonNum} 
                              className={`bg-white rounded-lg shadow-md border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                                isSelected 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => handleLessonSelection(lessonNum)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-900">Lesson {getTermSpecificLessonNumber(lessonNum, halfTermId)}</h4>
                                <div className="flex items-center">
                                  {isSelected && (
                                    <CheckCircle className="h-5 w-5 text-blue-600" />
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{lessonData.title || `Lesson ${getTermSpecificLessonNumber(lessonNum, halfTermId)}`}</p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                                <Clock className="h-3 w-3" />
                                <span>{lessonData.totalTime} mins</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {lessonData.categoryOrder.slice(0, 3).map(category => (
                                  <span 
                                    key={category}
                                    className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                                  >
                                    {category}
                                  </span>
                                ))}
                                {lessonData.categoryOrder.length > 3 && (
                                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    +{lessonData.categoryOrder.length - 3}
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewLessonDetails(lessonNum);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                >
                                  <Eye className="h-3 w-3" />
                                  <span>View Details</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">
              {showHalfTermView 
                ? `${orderedLessons.length} lessons in order` 
                : `${localSelectedLessons.length} lessons will remain assigned`}
            </span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save {showHalfTermView ? 'Order' : 'Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lesson Details Modal */}
      {selectedLessonForDetails && (
        <LessonDetailsModal
          lessonNumber={selectedLessonForDetails}
          onClose={() => setSelectedLessonForDetails(null)}
          theme={theme}
          halfTermId={halfTermId}
          halfTermName={halfTermName}
        />
      )}

      {/* Print Modal */}
      {showPrintModal && (
        <LessonPrintModal
          lessonNumbers={orderedLessons}
          onClose={() => setShowPrintModal(false)}
          halfTermId={halfTermId}
          halfTermName={halfTermName}
          isUnitPrint={true}
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
    </div>
  );
}