import React, { useState } from 'react';
import { Clock, Users, Calendar, Edit3, Copy } from 'lucide-react';
import type { LessonData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { AssignToHalfTermModal } from './AssignToHalfTermModal';

interface HalfTerm {
  id: string;
  name: string;
  months: string;
  lessons: string[];
  isComplete: boolean;
}

interface LessonLibraryCardProps {
  lessonNumber: string;
  displayNumber: number;
  lessonData: LessonData;
  viewMode: 'grid' | 'list' | 'compact';
  onClick: () => void;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
  };
  onAssignToUnit?: (lessonNumber: string, halfTermId: string) => void;
  halfTerms?: HalfTerm[];
  onEdit?: () => void;
  onDuplicate?: () => void;
}

export function LessonLibraryCard({
  lessonNumber,
  displayNumber,
  lessonData,
  viewMode,
  onClick,
  onEdit,
  onDuplicate,
  theme,
  onAssignToUnit,
  halfTerms = []
}: LessonLibraryCardProps) {
  // Debug console log
  // Debug logs removed to reduce console noise (was logging for every card on every render)
  // Uncomment below if you need to debug a specific issue:
  // console.log('LessonLibraryCard:', lessonNumber, { hasOnEdit: !!onEdit, halfTermsCount: halfTerms?.length });

  const { getCategoryColor } = useSettings();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  
  // Check if lesson is assigned to any half-term
  const isAssigned = halfTerms.some(halfTerm => halfTerm.lessons.includes(lessonNumber));
  
  // Calculate total activities
  const totalActivities = React.useMemo(() => {
    try {
      if (!lessonData || !lessonData.grouped) return 0;
      return Object.values(lessonData.grouped).reduce(
        (sum, activities) => sum + (Array.isArray(activities) ? activities.length : 0),
        0
      );
    } catch (error) {
      console.error('Error calculating total activities:', error);
      return 0;
    }
  }, [lessonData]);

  // Safety check for lesson data
  if (!lessonData) {
    console.warn(`❌ LessonLibraryCard: No lesson data for lesson ${lessonNumber}`);
    return null;
  }

  // Ensure required properties exist
  const safeLessonData = {
    ...lessonData,
    title: lessonData.title || `Lesson ${displayNumber}`,
    categoryOrder: lessonData.categoryOrder || [],
    grouped: lessonData.grouped || {},
    totalTime: lessonData.totalTime || 0
  };

  const handleAssignClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowAssignModal(true);
  };

  const handleAssignToHalfTerm = (halfTermId: string) => {
    if (onAssignToUnit) {
      onAssignToUnit(lessonNumber, halfTermId);
      setShowAssignModal(false);
    }
  };

  const handleDuplicateConfirm = () => {
    console.log('🔄 Duplicate confirmation dialog - confirming duplication for lesson:', lessonNumber);
    if (onDuplicate) {
      console.log('✅ onDuplicate function exists, calling it...');
      onDuplicate();
      setShowDuplicateConfirm(false);
      console.log('✅ Duplicate function called and dialog closed');
    } else {
      console.error('❌ onDuplicate function not provided to LessonLibraryCard');
    }
  };

  if (viewMode === 'compact') {
    return (
      <div className="relative group">
        <div 
          className="bg-white rounded-lg shadow-sm border-l-4 p-3 transition-all duration-200 hover:shadow-md cursor-pointer h-full"
          style={{ borderLeftColor: theme.primary }}
          onClick={onClick}
        >
          <div className="flex items-center justify-between h-full">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm truncate" dir="ltr">{safeLessonData.title}</h4>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{safeLessonData.totalTime} mins</span>
                <span>•</span>
                <span>{totalActivities} activities</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons - Assign, Edit, and Duplicate buttons */}
        {((onAssignToUnit && halfTerms.length > 0) || onEdit || onDuplicate) && (
          <div className="absolute top-0 right-0 h-full flex items-center pr-2">
            <div className="flex items-center space-x-1">
              {onAssignToUnit && halfTerms.length > 0 && (
                <button
                  onClick={handleAssignClick}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center space-x-1"
                  title="Assign to Unit"
                >
                  <Calendar className="h-3 w-3" />
                  <span className="text-xs">Assign</span>
                </button>
              )}
              {onDuplicate && (
                <button
                  onClick={(e) => {
                    console.log('🔄 Duplicate button clicked for lesson:', lessonNumber);
                    e.stopPropagation();
                    console.log('🔄 Setting showDuplicateConfirm to true');
                    setShowDuplicateConfirm(true);
                  }}
                  className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm flex items-center space-x-1"
                  title="Duplicate lesson"
                >
                  <Copy className="h-3 w-3" />
                  <span className="text-xs">Copy</span>
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm flex items-center space-x-1"
                  title="Edit lesson activities"
                >
                  <Edit3 className="h-3 w-3" />
                  <span className="text-xs">Edit</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && (
          <AssignToHalfTermModal
            isOpen={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            onAssign={handleAssignToHalfTerm}
            lessonNumber={displayNumber.toString()}
            halfTerms={halfTerms}
          />
        )}
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="relative group">
        <div 
          className="bg-white rounded-xl shadow-md border border-gray-200 p-4 transition-all duration-200 hover:shadow-lg cursor-pointer hover:border-blue-300"
          onClick={onClick}
        >
          <div className="flex items-start">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mr-4"
              style={{ backgroundColor: theme.primary }}
            >
              {displayNumber}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 text-base truncate" dir="ltr">{safeLessonData.title}</h4>
              </div>
              
              <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{safeLessonData.totalTime} mins</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{totalActivities} activities</span>
                </div>
              </div>
              
              <p className="mt-2 text-sm text-gray-600 line-clamp-1" dir="ltr">
                {(safeLessonData as any).description || ''}
              </p>
            </div>
          </div>
        </div>
        

        {/* Action buttons - Assign, Duplicate, and Edit buttons */}
        {((onAssignToUnit && halfTerms.length > 0) || onEdit || onDuplicate) && (
          <div className="absolute top-2 right-2 flex items-center space-x-2">
            {onAssignToUnit && halfTerms.length > 0 && (
              <button
                onClick={handleAssignClick}
                className={`p-2 text-white rounded-lg shadow-sm flex items-center space-x-1 ${
                  isAssigned 
                    ? 'bg-teal-600 hover:bg-teal-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                title={isAssigned ? "Reassign to Different Half-Term" : "Assign to Half-Term"}
              >
                <Calendar className="h-4 w-4" />
                <span className="text-xs">{isAssigned ? 'Reassign' : 'Assign'}</span>
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={(e) => {
                  console.log('🔄 Duplicate button (list view) clicked for lesson:', lessonNumber);
                  e.stopPropagation();
                  console.log('🔄 Setting showDuplicateConfirm to true');
                  setShowDuplicateConfirm(true);
                }}
                className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm flex items-center space-x-1"
                title="Duplicate Lesson"
              >
                <Copy className="h-4 w-4" />
                <span className="text-xs">Copy</span>
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm flex items-center space-x-1"
                title="Edit Lesson"
              >
                <Edit3 className="h-4 w-4" />
                <span className="text-xs">Edit</span>
              </button>
            )}
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && (
          <AssignToHalfTermModal
            isOpen={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            onAssign={handleAssignToHalfTerm}
            lessonNumber={displayNumber.toString()}
            halfTerms={halfTerms}
          />
        )}
      </div>
    );
  }

  // Default grid view
  return (
    <div className="relative group">
      <div 
        className="bg-white rounded-xl shadow-lg border border-gray-300 transition-all duration-300 hover:shadow-xl cursor-pointer overflow-hidden hover:scale-[1.02] h-full flex flex-col"
        onClick={onClick}
      >
        {/* Header with blue color */}
        <div 
          className="p-4 text-white relative overflow-hidden"
          style={{ backgroundColor: '#4580ED' }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">
                Lesson {displayNumber}
              </h3>
            </div>
            <p className="text-gray-100 text-sm font-medium" dir="ltr">
              {safeLessonData.title}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-grow flex flex-col">
          <div className="flex items-center space-x-4 text-gray-600 mb-3">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{safeLessonData.totalTime} mins</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">{totalActivities} activities</span>
            </div>
          </div>
          
          {/* Categories */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {safeLessonData.categoryOrder.slice(0, 4).map((category) => (
                <span
                  key={category}
                  className="px-2 py-1 rounded-full text-sm font-medium border shadow-sm"
                  style={{
                    backgroundColor: `${getCategoryColor(category)}20`,
                    color: getCategoryColor(category),
                    borderColor: `${getCategoryColor(category)}40`
                  }}
                >
                  {category}
                </span>
              ))}
              {safeLessonData.categoryOrder.length > 4 && (
                <span className="px-2 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200 shadow-sm">
                  +{safeLessonData.categoryOrder.length - 4} more
                </span>
              )}
            </div>
          </div>
          
          {/* Description Preview */}
          <p className="mt-2 text-sm text-gray-600 line-clamp-1" dir="ltr">
            {(safeLessonData as any).description || ''}
          </p>
        </div>
        

        {/* Action buttons - Assign, Duplicate, and Edit buttons */}
        {((onAssignToUnit && halfTerms.length > 0) || onEdit || onDuplicate) && (
          <div className="absolute top-2 right-2 z-10 flex items-center space-x-2">
            {onAssignToUnit && halfTerms.length > 0 && (
              <button
                onClick={handleAssignClick}
                className={`p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg shadow-sm transition-colors ${
                  isAssigned 
                    ? 'text-teal-600 hover:text-teal-800' 
                    : 'text-blue-600 hover:text-blue-800'
                }`}
                title={isAssigned ? "Reassign to Different Half-Term" : "Assign to Half-Term"}
              >
                <Calendar className="h-4 w-4" />
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={(e) => {
                  console.log('🔄 Duplicate button (grid view) clicked for lesson:', lessonNumber);
                  e.stopPropagation();
                  console.log('🔄 Setting showDuplicateConfirm to true');
                  setShowDuplicateConfirm(true);
                }}
                className="p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg shadow-sm text-purple-600 hover:text-purple-800 transition-colors"
                title="Duplicate Lesson"
              >
                <Copy className="h-4 w-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg shadow-sm text-teal-600 hover:text-teal-800 transition-colors"
                title="Edit Lesson"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignToHalfTermModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onAssign={handleAssignToHalfTerm}
          lessonNumber={displayNumber.toString()}
          halfTerms={halfTerms}
        />
      )}

      {/* Duplicate Confirmation Modal */}
      {showDuplicateConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          {console.log('🎨 Rendering duplicate confirmation dialog for lesson:', lessonNumber)}
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <Copy className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Duplicate Lesson</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to duplicate <strong>Lesson {displayNumber}</strong>? 
                This will create a new lesson with all the same activities and content.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDuplicateConfirm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDuplicateConfirm}
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                >
                  Duplicate Lesson
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}