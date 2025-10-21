import { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Search, 
  Clock, 
  Users, 
  Check, 
  ArrowUp, 
  ArrowDown, 
  Trash2,
  Layers,
  Save,
  Target
} from 'lucide-react';
import type { LessonData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { SimpleNestedCategoryDropdown } from './SimpleNestedCategoryDropdown';
import { NestedStandardsBrowser } from './NestedStandardsBrowser';

interface StackedLesson {
  id: string;
  name: string;
  description?: string;
  color: string;
  lessons: string[];
  totalTime: number;
  totalActivities: number;
  customObjectives?: string[];
  curriculumType?: 'EYFS' | 'CUSTOM';
  created_at: string;
}

interface LessonStackBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stack: Omit<StackedLesson, 'id' | 'created_at'>) => void;
  editingStack?: StackedLesson | null;
  allLessonsData: Record<string, LessonData>;
  lessonNumbers: string[];
  existingStacks: StackedLesson[];
}

const COLOR_OPTIONS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
  '#14B8A6', '#F43F5E', '#8B5CF6', '#06B6D4', '#84CC16'
];

export function LessonStackBuilder({
  isOpen,
  onClose,
  onSave,
  editingStack,
  allLessonsData,
  lessonNumbers,
  existingStacks
}: LessonStackBuilderProps) {
  const { getCategoryColor } = useSettings();
  
  // Form state
  const [stackName, setStackName] = useState('');
  const [stackDescription, setStackDescription] = useState('');
  const [stackColor, setStackColor] = useState('#3B82F6');
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customObjectives, setCustomObjectives] = useState<string[]>([]);
  const [showObjectivesBrowser, setShowObjectivesBrowser] = useState(false);


  // Initialize form when editing
  useEffect(() => {
    if (editingStack) {
      setStackName(editingStack.name);
      setStackDescription(editingStack.description || '');
      setStackColor(editingStack.color);
      setSelectedLessons(editingStack.lessons);
      setCustomObjectives(editingStack.customObjectives || []);
    } else {
      setStackName('');
      setStackDescription('');
      setStackColor('#3B82F6');
      setSelectedLessons([]);
      setCustomObjectives([]);
    }
    setSearchQuery('');
    setSelectedCategory('all');
  }, [editingStack, isOpen]);

  // Filter lessons based on search and category
  const filteredLessons = useMemo(() => {
    return lessonNumbers.filter(lessonNum => {
      const lessonData = allLessonsData[lessonNum];
      if (!lessonData) return false;

      // Filter out lessons already in other stacks (unless editing current stack)
      const isInOtherStack = existingStacks.some(stack => 
        stack.id !== editingStack?.id && stack.lessons.includes(lessonNum)
      );
      if (isInOtherStack) return false;

      // Search filter
      if (searchQuery) {
        const matchesSearch = 
          lessonNum.includes(searchQuery) ||
          (lessonData.title && lessonData.title.toLowerCase().includes(searchQuery.toLowerCase()));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        if (!lessonData.categoryOrder?.includes(selectedCategory)) return false;
      }

      return true;
    });
  }, [lessonNumbers, allLessonsData, searchQuery, selectedCategory, existingStacks, editingStack]);

  // Calculate totals for selected lessons
  const stackTotals = useMemo(() => {
    let totalTime = 0;
    let totalActivities = 0;
    
    selectedLessons.forEach(lessonNum => {
      const lessonData = allLessonsData[lessonNum];
      if (lessonData) {
        totalTime += lessonData.totalTime || 0;
        totalActivities += Object.values(lessonData.grouped).reduce(
          (sum: number, activities: any) => sum + (Array.isArray(activities) ? activities.length : 0),
          0
        );
      }
    });

    return { totalTime, totalActivities };
  }, [selectedLessons, allLessonsData]);

  const handleLessonToggle = (lessonNum: string) => {
    setSelectedLessons(prev => {
      if (prev.includes(lessonNum)) {
        return prev.filter(num => num !== lessonNum);
      } else {
        return [...prev, lessonNum];
      }
    });
  };

  const handleReorderLesson = (fromIndex: number, toIndex: number) => {
    setSelectedLessons(prev => {
      const newLessons = [...prev];
      const [movedLesson] = newLessons.splice(fromIndex, 1);
      newLessons.splice(toIndex, 0, movedLesson);
      return newLessons;
    });
  };

  const handleRemoveLesson = (lessonNum: string) => {
    setSelectedLessons(prev => prev.filter(num => num !== lessonNum));
  };

  const handleSave = () => {
    if (!stackName.trim() || selectedLessons.length === 0) {
      alert('Please provide a stack name and select at least one lesson.');
      return;
    }

    onSave({
      name: stackName.trim(),
      description: stackDescription.trim(),
      color: stackColor,
      lessons: selectedLessons,
      totalTime: stackTotals.totalTime,
      totalActivities: stackTotals.totalActivities,
      customObjectives: customObjectives.length > 0 ? customObjectives : undefined,
      curriculumType: customObjectives.length > 0 ? 'CUSTOM' : undefined
    });
  };

  const handleAddObjective = (objectiveId: string) => {
    if (!customObjectives.includes(objectiveId)) {
      setCustomObjectives([...customObjectives, objectiveId]);
    }
  };

  const handleRemoveObjective = (objectiveId: string) => {
    setCustomObjectives(customObjectives.filter(id => id !== objectiveId));
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 text-white" style={{ backgroundColor: '#64748B' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Layers className="h-6 w-6" />
              <h2 className="text-xl font-bold">
                {editingStack ? 'Edit Lesson Stack' : 'Create Lesson Stack'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-col h-[calc(90vh-80px)]">
          {/* Stack Details */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stack Name *
                </label>
                <input
                  type="text"
                  value={stackName}
                  onChange={(e) => setStackName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="e.g., Fractions Unit"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={stackColor}
                    onChange={(e) => setStackColor(e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <div className="flex flex-wrap gap-1">
                    {COLOR_OPTIONS.slice(0, 8).map(color => (
                      <button
                        key={color}
                        onClick={() => setStackColor(color)}
                        className={`w-8 h-8 rounded-lg border-2 ${
                          stackColor === color ? 'border-gray-400' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stack Summary
                </label>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Layers className="h-4 w-4" />
                    <span>{selectedLessons.length} lessons</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{stackTotals.totalTime} minutes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{stackTotals.totalActivities} activities</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={stackDescription}
                onChange={(e) => setStackDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                rows={2}
                placeholder="Brief description of this lesson stack..."
              />
            </div>

            {/* Curriculum Objectives */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Curriculum Objectives ({customObjectives.length})
                </label>
                <button
                  onClick={() => setShowObjectivesBrowser(true)}
                  className="px-3 py-1 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center space-x-1"
                  type="button"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Objectives</span>
                </button>
              </div>
              
              {customObjectives.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {customObjectives.slice(0, 5).map((objectiveId, index) => (
                    <div
                      key={objectiveId}
                      className="inline-flex items-center px-2 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-medium border border-teal-200"
                    >
                      <Target className="h-3 w-3 mr-1" />
                      <span>Objective {index + 1}</span>
                      <button
                        onClick={() => handleRemoveObjective(objectiveId)}
                        className="ml-1 text-teal-600 hover:text-teal-800"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {customObjectives.length > 5 && (
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      +{customObjectives.length - 5} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No objectives added yet</p>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex">
            {/* Available Lessons */}
            <div className="w-1/2 border-r border-gray-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-white">
                <h3 className="font-semibold text-gray-900 mb-3">Available Lessons</h3>
                
                {/* Search and Filter */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search lessons..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  
                  <SimpleNestedCategoryDropdown
                    selectedCategory={selectedCategory === 'all' ? '' : selectedCategory}
                    onCategoryChange={(category) => setSelectedCategory(category || 'all')}
                    placeholder="All Categories"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {filteredLessons.map(lessonNum => {
                    const lessonData = allLessonsData[lessonNum];
                    if (!lessonData) return null;

                    return (
                      <div
                        key={lessonNum}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          selectedLessons.includes(lessonNum)
                            ? 'bg-gray-100 border-gray-300'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleLessonToggle(lessonNum)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {lessonData.title || `Lesson ${lessonNum}`}
                            </h4>
                            <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{lessonData.totalTime} min</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>{Object.values(lessonData.grouped).reduce((sum: number, acts: any) => sum + acts.length, 0)} activities</span>
                              </div>
                            </div>
                            {lessonData.categoryOrder && lessonData.categoryOrder.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {lessonData.categoryOrder.slice(0, 3).map(category => (
                                  <span
                                    key={category}
                                    className="px-2 py-1 rounded-full text-xs font-medium border"
                                    style={{
                                      backgroundColor: `${getCategoryColor(category)}20`,
                                      color: getCategoryColor(category),
                                      borderColor: `${getCategoryColor(category)}40`
                                    }}
                                  >
                                    {category}
                                  </span>
                                ))}
                                {lessonData.categoryOrder.length > 3 && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                    +{lessonData.categoryOrder.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            {selectedLessons.includes(lessonNum) ? (
                              <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredLessons.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Layers className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p>No lessons available</p>
                      <p className="text-sm">All lessons may already be in other stacks</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Lessons */}
            <div className="w-1/2 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-white">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Selected Lessons ({selectedLessons.length})
                </h3>
                <p className="text-sm text-gray-600">
                  Drag to reorder or click to remove
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {selectedLessons.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Plus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No lessons selected</p>
                    <p className="text-sm">Choose lessons from the left panel</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedLessons.map((lessonNum, index) => {
                      const lessonData = allLessonsData[lessonNum];
                      if (!lessonData) return null;

                      return (
                        <div
                          key={lessonNum}
                          className="p-3 bg-gray-100 border border-gray-300 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex flex-col space-y-1">
                                {index > 0 && (
                                  <button
                                    onClick={() => handleReorderLesson(index, index - 1)}
                                    className="p-1 text-gray-400 hover:text-gray-600"
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </button>
                                )}
                                {index < selectedLessons.length - 1 && (
                                  <button
                                    onClick={() => handleReorderLesson(index, index + 1)}
                                    className="p-1 text-gray-400 hover:text-gray-600"
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  {lessonData.title || `Lesson ${lessonNum}`}
                                </h4>
                                <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{lessonData.totalTime} min</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Users className="h-3 w-3" />
                                    <span>{Object.values(lessonData.grouped).reduce((sum: number, acts: any) => sum + acts.length, 0)} activities</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleRemoveLesson(lessonNum)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!stackName.trim() || selectedLessons.length === 0}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{editingStack ? 'Update Stack' : 'Create Stack'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Objectives Browser Modal */}
      {showObjectivesBrowser && (
        <NestedStandardsBrowser
          isOpen={showObjectivesBrowser}
          onClose={() => setShowObjectivesBrowser(false)}
          selectedObjectives={customObjectives}
          onAddObjective={handleAddObjective}
          onRemoveObjective={handleRemoveObjective}
        />
      )}
    </div>
  );
}
