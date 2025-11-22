import React, { useState, useEffect } from 'react';
import { X, Copy, AlertCircle } from 'lucide-react';

interface ClassCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopy: (sourceLessons: string[], targetClass: string) => Promise<void>;
  availableClasses: Array<{ id: string; name: string }>;
  currentClass: string;
  allLessonsData: Record<string, any>;
}

export function ClassCopyModal({ 
  isOpen, 
  onClose, 
  onCopy, 
  availableClasses,
  currentClass,
  allLessonsData
}: ClassCopyModalProps) {
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [targetClass, setTargetClass] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectAll, setSelectAll] = useState(false);

  // Get available lessons from current class
  const availableLessons = Object.keys(allLessonsData).sort((a, b) => {
    const numA = parseInt(a);
    const numB = parseInt(b);
    return numA - numB;
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedLessons([]);
      setTargetClass('');
      setError('');
      setSelectAll(false);
    }
  }, [isOpen]);

  // Handle select all toggle
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLessons([]);
    } else {
      setSelectedLessons([...availableLessons]);
    }
    setSelectAll(!selectAll);
  };

  // Handle individual lesson toggle
  const handleLessonToggle = (lessonNumber: string) => {
    setSelectedLessons(prev => {
      if (prev.includes(lessonNumber)) {
        return prev.filter(l => l !== lessonNumber);
      } else {
        return [...prev, lessonNumber];
      }
    });
  };

  const handleCopy = async () => {
    if (selectedLessons.length === 0) {
      setError('Please select at least one lesson');
      return;
    }

    if (!targetClass) {
      setError('Please select a target class');
      return;
    }

    if (targetClass === currentClass) {
      setError('Target class cannot be the same as source class');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onCopy(selectedLessons, targetClass);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to copy lessons');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600 text-white">
          <div>
            <h2 className="text-2xl font-bold">Copy Lessons to Another Class</h2>
            <p className="text-sm text-white/90 mt-1">Select lessons to copy from <strong>{availableClasses.find(c => c.id === currentClass)?.name}</strong> to another class</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Lesson Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Lessons to Copy
              </label>
              <button
                onClick={handleSelectAll}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                {selectAll ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
              {availableLessons.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No lessons available in the current class
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {availableLessons.map(lessonNumber => {
                    const lessonData = allLessonsData[lessonNumber];
                    const activityCount = lessonData?.orderedActivities?.length || 
                                         Object.values(lessonData?.grouped || {}).flat().length || 0;
                    
                    return (
                      <label
                        key={lessonNumber}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLessons.includes(lessonNumber)}
                          onChange={() => handleLessonToggle(lessonNumber)}
                          className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              Lesson {lessonNumber}
                              {lessonData?.title && ` - ${lessonData.title}`}
                            </span>
                            <span className="text-xs text-gray-500">
                              {activityCount} {activityCount === 1 ? 'activity' : 'activities'}
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            
            {selectedLessons.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {selectedLessons.length} {selectedLessons.length === 1 ? 'lesson' : 'lessons'} selected
              </p>
            )}
          </div>

          {/* Target Class Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Class
            </label>
            <select
              value={targetClass}
              onChange={(e) => setTargetClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Select a class...</option>
              {availableClasses
                .filter(c => c.id !== currentClass)
                .map(classItem => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Warning */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Important</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Copied lessons will be added to the target class. If lessons with the same numbers exist, they will be overwritten.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            disabled={isLoading || selectedLessons.length === 0 || !targetClass}
            className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Copying...</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy {selectedLessons.length} {selectedLessons.length === 1 ? 'Lesson' : 'Lessons'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

