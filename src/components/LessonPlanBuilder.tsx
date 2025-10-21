import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Save, 
  Clock, 
  Users, 
  Search,
  Grid,
  List,
  Tag,
  ArrowUpDown,
  ArrowDownUp,
  MoreVertical,
  Plus,
  Check,
  Filter,
  Edit3,
  FolderOpen,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { ActivityStackCard } from './ActivityStackCard';
import { LessonDropZone } from './LessonDropZone';
import { ActivityDetails } from './ActivityDetails';
import { SimpleNestedCategoryDropdown } from './SimpleNestedCategoryDropdown';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import type { Activity, LessonPlan, ActivityStack } from '../contexts/DataContext';

// Define half-term periods
const HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct' },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec' },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb' },
  { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr' },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May' },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul' },
];

interface LessonPlanBuilderProps {
  editingLessonNumber?: string;
  onEditComplete?: () => void;
  onUnsavedChangesChange?: (hasChanges: boolean) => void;
}

export function LessonPlanBuilder({ 
  editingLessonNumber, 
  onEditComplete,
  onUnsavedChangesChange 
}: LessonPlanBuilderProps = {}) {
  const { currentSheetInfo, allLessonsData, addOrUpdateUserLessonPlan, userCreatedLessonPlans, allActivities, activityStacks } = useData();
  const { categories, customYearGroups, mapActivityLevelToYearGroup } = useSettings();
  
  // Initialize currentLessonPlan with a default value instead of null
  const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan>(() => {
    // If editing an existing lesson
    if (editingLessonNumber && allLessonsData[editingLessonNumber]) {
      const existingLesson = allLessonsData[editingLessonNumber];
      
      // Convert database lesson format to builder format
      const activities = Object.values(existingLesson.grouped).flat().map(activity => ({
        ...activity,
        _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
      }));

      return {
        id: crypto.randomUUID(),
        date: new Date(),
        week: parseInt(editingLessonNumber),
        className: currentSheetInfo.sheet,
        activities: activities,
        duration: existingLesson.totalTime,
        notes: '',
        status: 'draft',
        title: existingLesson.title || `Lesson ${editingLessonNumber}`,
        term: '',
        lessonNumber: editingLessonNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEditingExisting: true
      };
    }
    
    // Default new lesson
    return {
      id: crypto.randomUUID(),
      date: new Date(),
      week: 1,
      className: currentSheetInfo.sheet,
      activities: [],
      duration: 0,
      notes: '',
      status: 'draft',
      title: '',
      term: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'time' | 'level'>('category');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lessonNumber, setLessonNumber] = useState<string>('');
  
  // Activity preview and edit states
  const [activityToView, setActivityToView] = useState<Activity | null>(null);
  const [showActivityPreview, setShowActivityPreview] = useState(false);
  
  // Stack-related state
  const [expandedStacks, setExpandedStacks] = useState<Set<string>>(new Set());
  const [showStacks, setShowStacks] = useState(true);
  const [selectedStackIds, setSelectedStackIds] = useState<Set<string>>(new Set());

  // Generate a lesson number when component mounts
  useEffect(() => {
    if (!editingLessonNumber) {
      generateNextLessonNumber();
    }
  }, [allLessonsData, currentSheetInfo.sheet, editingLessonNumber]);

  // Generate the next available lesson number
  const generateNextLessonNumber = () => {
    const lessonNumbers = Object.keys(allLessonsData).map(num => parseInt(num));
    if (lessonNumbers.length === 0) {
      setLessonNumber('1');
      return;
    }
    
    const maxLessonNumber = Math.max(...lessonNumbers);
    setLessonNumber((maxLessonNumber + 1).toString());
    
    // Also update the current lesson plan
    setCurrentLessonPlan(prev => ({
      ...prev,
      lessonNumber: (maxLessonNumber + 1).toString()
    }));
  };

  // Notify parent component about unsaved changes
  useEffect(() => {
    if (onUnsavedChangesChange) {
      onUnsavedChangesChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChangesChange]);

  const handleUpdateLessonPlan = (updatedPlan: LessonPlan) => {
    try {
      // Validate that the plan has a title
      if (!updatedPlan.title.trim()) {
        alert('Please provide a lesson title');
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        return false;
      }
      
      // Make sure the lesson has a lesson number
      if (!updatedPlan.lessonNumber) {
        updatedPlan.lessonNumber = lessonNumber;
      }
      
      // Save the lesson plan using the context function
      addOrUpdateUserLessonPlan(updatedPlan);
      
      setCurrentLessonPlan(updatedPlan);
      setSaveStatus('success');
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
      return true;
    } catch (error) {
      console.error('Failed to update lesson plan:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return false;
    }
  };

  const handleActivityAdd = (activity: Activity) => {
    // Create a deep copy of the activity to avoid reference issues
    const activityCopy = JSON.parse(JSON.stringify(activity));
    
    // Generate a unique ID for this activity instance to ensure it's treated as unique
    const uniqueActivity = {
      ...activityCopy,
      _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
    };
    
    const updatedPlan = {
      ...currentLessonPlan,
      activities: [...currentLessonPlan.activities, uniqueActivity],
      duration: currentLessonPlan.duration + (uniqueActivity.time || 0),
    };
    
    setCurrentLessonPlan(updatedPlan);
    setHasUnsavedChanges(true);
  };


  // Handle activity preview from library
  const handleActivityPreview = (activity: Activity) => {
    setActivityToView(activity);
    setShowActivityPreview(true);
  };

  // Handle adding activity from preview modal
  const handleAddActivityFromPreview = (activity: Activity, isModified: boolean = false) => {
    // If the activity was modified, create a customized version
    if (isModified) {
      // Create a deep copy with a new ID to distinguish it from the original
      const customizedActivity = {
        ...JSON.parse(JSON.stringify(activity)),
        _id: undefined, // Remove original ID
        id: undefined,  // Remove original ID
        activity: activity.activity + ' (Customized)', // Mark as customized
        _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9),
        _isCustomized: true // Flag to indicate this is a customized version
      };
      handleActivityAdd(customizedActivity);
    } else {
      // Add the original activity
      handleActivityAdd(activity);
    }
    
    // Close the preview modal
    setShowActivityPreview(false);
    setActivityToView(null);
  };
  const handleActivityRemove = (activityIndex: number) => {
    const removedActivity = currentLessonPlan.activities[activityIndex];
    const updatedPlan = {
      ...currentLessonPlan,
      activities: currentLessonPlan.activities.filter((_, index) => index !== activityIndex),
      duration: currentLessonPlan.duration - (removedActivity.time || 0),
    };
    setCurrentLessonPlan(updatedPlan);
    setHasUnsavedChanges(true);
  };

  const handleActivityReorder = (dragIndex: number, hoverIndex: number) => {
    const draggedActivity = currentLessonPlan.activities[dragIndex];
    const newActivities = [...currentLessonPlan.activities];
    newActivities.splice(dragIndex, 1);
    newActivities.splice(hoverIndex, 0, draggedActivity);
    
    const updatedPlan = {
      ...currentLessonPlan,
      activities: newActivities,
    };
    
    setCurrentLessonPlan(updatedPlan);
    setHasUnsavedChanges(true);
  };

  const handleLessonPlanFieldUpdate = (field: string, value: any) => {
    const updatedPlan = {
      ...currentLessonPlan,
      [field]: value
    };
    setCurrentLessonPlan(updatedPlan);
    setHasUnsavedChanges(true);
  };

  // Stack Management Functions
  const handleToggleStackExpansion = (stackId: string) => {
    setExpandedStacks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stackId)) {
        newSet.delete(stackId);
      } else {
        newSet.add(stackId);
      }
      return newSet;
    });
  };

  const handleStackSelection = (stackId: string, selected: boolean) => {
    setSelectedStackIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(stackId);
      } else {
        newSet.delete(stackId);
      }
      return newSet;
    });
  };

  const handleStackDrop = (stack: ActivityStack) => {
    // Add all activities from the stack to the lesson
    const activitiesToAdd = stack.activities.map(activity => ({
      ...activity,
      _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
    }));

    const updatedPlan = {
      ...currentLessonPlan,
      activities: [...currentLessonPlan.activities, ...activitiesToAdd],
      duration: currentLessonPlan.duration + activitiesToAdd.reduce((sum, activity) => sum + (activity.time || 0), 0),
    };
    
    setCurrentLessonPlan(updatedPlan);
    setHasUnsavedChanges(true);
  };

  const handleSaveLessonPlan = () => {
    // Make sure the lesson has a lesson number
    if (!currentLessonPlan.lessonNumber) {
      const updatedPlan = {
        ...currentLessonPlan,
        lessonNumber
      };
      setCurrentLessonPlan(updatedPlan);
      const success = handleUpdateLessonPlan(updatedPlan);
      if (success) {
        setHasUnsavedChanges(false);
        if (currentLessonPlan.isEditingExisting && onEditComplete) {
          onEditComplete();
        }
      }
    } else {
      const success = handleUpdateLessonPlan(currentLessonPlan);
      if (success) {
        setHasUnsavedChanges(false);
        if (currentLessonPlan.isEditingExisting && onEditComplete) {
          onEditComplete();
        }
      }
    }
  };

  // Create a new lesson plan after saving the current one
  const handleCreateNewAfterSave = () => {
    // First save the current plan
    const planToSave = {
      ...currentLessonPlan,
      lessonNumber: currentLessonPlan.lessonNumber || lessonNumber
    };
    
    const success = handleUpdateLessonPlan(planToSave);
    
    if (success) {
      // Generate a new lesson number
      const newLessonNumber = (parseInt(lessonNumber) + 1).toString();
      setLessonNumber(newLessonNumber);
      
      // Create a new empty plan
      const newPlan: LessonPlan = {
        id: crypto.randomUUID(),
        date: new Date(),
        week: currentLessonPlan.week + 1, // Increment week number
        className: currentSheetInfo.sheet,
        activities: [],
        duration: 0,
        notes: '',
        status: 'draft',
        title: '',
        term: '',
        lessonNumber: newLessonNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setCurrentLessonPlan(newPlan);
      setHasUnsavedChanges(false);
      
      if (onEditComplete) {
        onEditComplete();
      }
    }
  };

  // Navigation between lessons
  const navigateToLesson = (direction: 'prev' | 'next') => {
    // Check for unsaved changes
    if (hasUnsavedChanges) {
      const confirmNavigation = window.confirm('You have unsaved changes. Do you want to continue without saving?');
      if (!confirmNavigation) {
        return;
      }
    }
    
    // Find all user-created lesson plans for this class
    const classLessonPlans = userCreatedLessonPlans
      .filter(plan => plan.className === currentSheetInfo.sheet)
      .sort((a, b) => {
        // Sort by lesson number if available, otherwise by date
        if (a.lessonNumber && b.lessonNumber) {
          return parseInt(a.lessonNumber) - parseInt(b.lessonNumber);
        }
        return a.date.getTime() - b.date.getTime();
      });
    
    // Find the current lesson in the list
    const currentIndex = classLessonPlans.findIndex(plan => plan.id === currentLessonPlan.id);
    
    if (currentIndex === -1) {
      // Current lesson is not saved yet
      if (direction === 'prev' && classLessonPlans.length > 0) {
        // Navigate to the last saved lesson
        setCurrentLessonPlan(classLessonPlans[classLessonPlans.length - 1]);
      } else if (direction === 'next') {
        // Create a new lesson
        handleCreateNewAfterSave();
      }
    } else {
      // Current lesson is in the list
      if (direction === 'prev' && currentIndex > 0) {
        setCurrentLessonPlan(classLessonPlans[currentIndex - 1]);
      } else if (direction === 'next' && currentIndex < classLessonPlans.length - 1) {
        setCurrentLessonPlan(classLessonPlans[currentIndex + 1]);
      } else if (direction === 'next' && currentIndex === classLessonPlans.length - 1) {
        // Create a new lesson
        handleCreateNewAfterSave();
      }
    }
    
    setHasUnsavedChanges(false);
  };

  // Filter and sort activities for the library
  const filteredAndSortedActivities = React.useMemo(() => {
    let filtered = allActivities.filter(activity => {
      const matchesSearch = activity.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           activity.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
      const matchesLevel = selectedLevel === 'all' || 
                          activity.level === selectedLevel || 
                          activity.level === 'All' ||
                          mapActivityLevelToYearGroup(activity.level) === selectedLevel ||
                          (activity.yearGroups && activity.yearGroups.includes(selectedLevel));
      
      return matchesSearch && matchesCategory && matchesLevel;
    });

    // Sort activities
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.activity.localeCompare(b.activity);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'time':
          comparison = a.time - b.time;
          break;
        case 'level':
          comparison = a.level.localeCompare(b.level);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allActivities, searchQuery, selectedCategory, selectedLevel, sortBy, sortOrder]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Toggle activity selection
  const toggleActivitySelection = (activityId: string) => {
    if (selectedActivities.includes(activityId)) {
      setSelectedActivities(prev => prev.filter(id => id !== activityId));
    } else {
      setSelectedActivities(prev => [...prev, activityId]);
    }
  };

  // Add selected activities to lesson plan
  const addSelectedActivities = () => {
    // Find all selected activities
    const activitiesToAdd = allActivities.filter(activity => {
      const activityId = `${activity.activity}-${activity.category}`;
      return selectedActivities.includes(activityId);
    });
    
    if (activitiesToAdd.length === 0) return;
    
    // Create a new array of activities with unique IDs
    const newActivities = activitiesToAdd.map(activity => {
      // Create a deep copy of the activity
      const activityCopy = JSON.parse(JSON.stringify(activity));
      
      // Add a unique ID
      return {
        ...activityCopy,
        _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
      };
    });
    
    // Calculate new total duration
    const additionalDuration = newActivities.reduce((sum, activity) => sum + (activity.time || 0), 0);
    
    // Update the lesson plan
    const updatedPlan = {
      ...currentLessonPlan,
      activities: [...currentLessonPlan.activities, ...newActivities],
      duration: currentLessonPlan.duration + additionalDuration,
    };
    
    setCurrentLessonPlan(updatedPlan);
    setHasUnsavedChanges(true);
    
    // Clear selections after adding
    setSelectedActivities([]);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Main Content */}
          
          {/* Editing Mode Header */}
          {currentLessonPlan.isEditingExisting && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Edit3 className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-blue-900">
                      Editing: {currentLessonPlan.title}
                    </h3>
                    <p className="text-sm text-blue-700">
                      Make changes to activities and lesson details
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveLessonPlan}
                    className="px-4 py-2 btn-primary text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={onEditComplete}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lesson Plan Details */}
            <div className="lg:col-span-1 flex flex-col">
              <div className="flex-1">
                <LessonDropZone
                  lessonPlan={currentLessonPlan}
                  onActivityAdd={handleActivityAdd}
                  onActivityRemove={handleActivityRemove}
                  onActivityReorder={handleActivityReorder}
                  onLessonPlanFieldUpdate={handleLessonPlanFieldUpdate}
                  isEditing={true}
                  onActivityClick={(activity) => setSelectedActivity(activity)}
                  onSave={handleSaveLessonPlan}
                  onSaveAndCreate={handleCreateNewAfterSave}
                />
              </div>
            </div>

            {/* Activity Library Panel */}
            <div className="lg:col-span-1 flex flex-col">
              <div className="bg-white rounded-xl shadow-md  overflow-hidden sticky top-8 flex flex-col max-h-[calc(100vh-4rem)]">
                {/* Library Header */}
                <div className="p-6 border-b border-gray-200 text-white h-[180px] flex flex-col justify-between" style={{ background: 'linear-gradient(to right, #14B8A6, #0D9488)' }}>
                  <h3 className="text-lg font-semibold mb-4">Activity Library</h3>
                  
                  {/* Search */}
                  <div className="relative mb-3">
                    <Search 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                      style={{ color: '#FFFFFF' }}
                    />
                    <input
                      type="text"
                      placeholder="Search activities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-sm font-semibold text-white placeholder:text-white placeholder:opacity-90"
                    />
                  </div>
                  
                  {/* Filters */}
                  <div className="flex space-x-2">
        <SimpleNestedCategoryDropdown
          selectedCategory={selectedCategory === 'all' ? '' : selectedCategory}
          onCategoryChange={(category) => setSelectedCategory(category || 'all')}
          placeholder="All Categories"
          className="w-full flex-1 px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent text-sm truncate font-semibold"
          dropdownBackgroundColor="#D6F2EE"
        />
                    
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="w-full flex-1 px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent text-sm truncate font-semibold"
                    >
                      <option value="all" className="text-gray-900">All</option>
                      {customYearGroups.map(group => (
                        <option key={group.name} value={group.name} className="text-gray-900">{group.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Add Selected Button */}
                  {selectedActivities.length > 0 && (
                    <div className="mt-3 mb-6">
                      <button
                        onClick={addSelectedActivities}
                        className="w-full px-4 py-2 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                        style={{
                          backgroundColor: '#007366',
                          border: 'none'
                        }}
                        onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#004C45'}
                        onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#007366'}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add {selectedActivities.length} Selected {selectedActivities.length === 1 ? 'Activity' : 'Activities'}</span>
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Stacks Section */}
                {activityStacks.length > 0 && (
                  <div className="border-b border-gray-200 bg-gray-50">
                    <div className="p-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>📚</span>
                          <h4 className="text-sm font-semibold text-gray-700">Activity Stacks</h4>
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                            {activityStacks.length}
                          </span>
                        </div>
                        <button
                          onClick={() => setShowStacks(!showStacks)}
                          className="px-3 py-1 btn-primary text-white rounded-md text-xs transition-colors"
                        >
                          {showStacks ? 'Hide Stacks' : 'Show Stacks'}
                        </button>
                      </div>
                    </div>
                    
                    {showStacks && (
                      <div className="p-3">
                        <div className="space-y-2">
                          {activityStacks.map((stack) => (
                            <ActivityStackCard
                              key={stack.id}
                              stack={stack}
                              isExpanded={expandedStacks.has(stack.id)}
                              onToggleExpand={() => handleToggleStackExpansion(stack.id)}
                              onEdit={() => {}} // Not needed in lesson builder
                              onDelete={() => {}} // Not needed in lesson builder
                              onAddActivities={() => {}} // Not needed in lesson builder
                              onRemoveActivity={() => {}} // Not needed in lesson builder
                              onUnstack={() => {}} // Not needed in lesson builder
                              draggable={true}
                              selectable={true}
                              isSelected={selectedStackIds.has(stack.id)}
                              onSelectionChange={handleStackSelection}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Activity List */}
                <div className="p-3 flex-1 overflow-y-auto min-h-0">
                  {filteredAndSortedActivities.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No matching activities found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredAndSortedActivities.map((activity, index) => {
                        const activityId = `${activity.activity}-${activity.category}`;
                        const isSelected = selectedActivities.includes(activityId);
                        
                        return (
                          <div 
                            key={`${activity._id || activity.id || activityId}-${index}`}
                            className={`relative bg-white rounded-lg border-2 p-3 transition-all duration-200 hover:shadow-md ${
                              isSelected ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                            } cursor-pointer`}
                            onClick={(e) => {
                              // Check if the click was on the checkbox area (right side)
                              const rect = e.currentTarget.getBoundingClientRect();
                              const clickX = e.clientX - rect.left;
                              const isCheckboxClick = clickX > rect.width - 60; // Last 60px is checkbox area
                              
                              if (isCheckboxClick) {
                                toggleActivitySelection(activityId);
                              } else {
                                // Click on main area opens preview
                                handleActivityPreview(activity);
                              }
                            }}
                          >
                            {/* Checkbox */}
                            <div 
                              className="absolute top-3 right-3 z-10 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleActivitySelection(activityId);
                              }}
                            >
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                isSelected ? 'bg-teal-600' : 'border-2 border-gray-300'
                              }`}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                            </div>
                            
                            <div className="pr-6">
                              <div className="flex items-start">
                                <div 
                                  className="w-1 h-full rounded-full flex-shrink-0 mr-2"
                                  style={{ 
                                    backgroundColor: activity.category ? 
                                      categories.find(cat => cat.name === activity.category)?.color || '#6B7280'
                                    : '#6B7280',
                                    minHeight: '40px'
                                  }}
                                />
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 text-sm">{activity.activity}</h4>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-xs text-gray-500">{activity.category}</span>
                                    {activity.level && (
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {activity.level}
                                      </span>
                                    )}
                                    {activity.time > 0 && (
                                      <span className="text-xs text-gray-500 flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {activity.time}m
                                      </span>
                                    )}
                                  </div>
                                  {/* Show description preview with proper HTML rendering */}
                                  {activity.description && (
                                    <div 
                                      className="text-xs text-gray-600 mt-1 line-clamp-2"
                                      dangerouslySetInnerHTML={{ 
                                        __html: activity.description.length > 100 
                                          ? activity.description.substring(0, 100) + '...'
                                          : activity.description
                                      }}
                                    />
                                  )}
                                  {/* Click to preview indicator */}
                                  <div className="text-xs text-blue-600 italic mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Click to preview • Check to select
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Details Modal - Original context (add to lesson) */}
      {selectedActivity && (
        <ActivityDetails
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onAddToLesson={() => {
            handleActivityAdd(selectedActivity);
            setSelectedActivity(null);
          }}
        />
      )}

      {/* Activity Preview Modal - Lesson Builder context */}
      {showActivityPreview && activityToView && (
        <ActivityDetails
          activity={activityToView}
          onClose={() => {
            setShowActivityPreview(false);
            setActivityToView(null);
          }}
          onAddActivityToLesson={(activity, isModified) => handleAddActivityFromPreview(activity, isModified)}
          isLessonBuilderContext={true}
          initialEditMode={false}
        />
      )}

      {/* Save Status Message */}
      {saveStatus !== 'idle' && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className={`max-w-md w-full mx-auto px-6 py-4 rounded-lg shadow-xl transition-all duration-300 transform ${
            saveStatus === 'success' ? 'bg-teal-50 border border-teal-200' :
            'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center space-x-3">
              {saveStatus === 'success' ? (
                <>
                  <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    <Check className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-teal-800">Lesson saved successfully!</h3>
                    <p className="text-sm text-teal-600">Your lesson plan has been saved.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-red-800">Failed to save lesson</h3>
                    <p className="text-sm text-red-600">Please provide a lesson title.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </DndProvider>
  );
}