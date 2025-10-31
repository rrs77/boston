import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Save, 
  Clock, 
  Users, 
  Search,
  Plus,
  Check,
  MoreVertical,
  X,
  FolderOpen,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { ActivityStackCard } from './ActivityStackCard';
import { LessonDropZone } from './LessonDropZone';
import { ActivityDetails } from './ActivityDetails';
import { SimpleNestedCategoryDropdown } from './SimpleNestedCategoryDropdown';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import type { Activity, LessonPlan, ActivityStack } from '../contexts/DataContext';

interface LessonPlanBuilderProps {
  editingLessonNumber?: string;
  onEditComplete?: () => void;
  onUnsavedChangesChange?: (hasChanges: boolean) => void;
}

export function LessonPlanBuilderNew({ 
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
      isEditingExisting: false
    };
  });

  // Library state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showStacks, setShowStacks] = useState(true);
  // Persist selected activities so they survive tab switches/unmounts
  const selectionStorageKey = `lesson-builder-selection-${currentSheetInfo.sheet}-${editingLessonNumber || 'new'}`;
  const [selectedActivities, setSelectedActivities] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(selectionStorageKey);
      if (!raw) return [];
      const ids = JSON.parse(raw);
      if (!Array.isArray(ids)) return [];
      return ids.filter((id: string) => allActivities.some(act => (act._id || act.id) === id));
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(selectionStorageKey, JSON.stringify(selectedActivities));
    } catch {}
  }, [selectedActivities, selectionStorageKey]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null);
  const [draggedStack, setDraggedStack] = useState<ActivityStack | null>(null);
  
  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveStatus, setShowSaveStatus] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | 'saving'>('saving');

  // Filter activities based on search and filters
  const filteredActivities = allActivities.filter(activity => {
    const matchesSearch = activity.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (activity.description && activity.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
    
    const matchesLevel = !selectedLevel || activity.level === selectedLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  // Filter activity stacks
  const filteredActivityStacks = activityStacks.filter(stack => {
    const matchesSearch = stack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (stack.description && stack.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

  // Handle lesson plan field updates
  const handleLessonPlanFieldUpdate = (field: keyof LessonPlan, value: any) => {
    setCurrentLessonPlan(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date()
    }));
    
    if (onUnsavedChangesChange) {
      onUnsavedChangesChange(true);
    }
  };

  // Handle adding activities
  const handleActivityAdd = (activity: Activity) => {
    const activityWithId = {
      ...activity,
      _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
    };
    
    setCurrentLessonPlan(prev => {
      const newActivities = [...prev.activities, activityWithId];
      const newDuration = newActivities.reduce((total, act) => total + (act.time || 0), 0);
      
      return {
        ...prev,
        activities: newActivities,
        duration: newDuration,
        updatedAt: new Date()
      };
    });
    
    if (onUnsavedChangesChange) {
      onUnsavedChangesChange(true);
    }
  };

  // Handle removing activities
  const handleActivityRemove = (activityId: string) => {
    setCurrentLessonPlan(prev => {
      const newActivities = prev.activities.filter(act => 
        (act._uniqueId || act.id) !== activityId
      );
      const newDuration = newActivities.reduce((total, act) => total + (act.time || 0), 0);
      
      return {
        ...prev,
        activities: newActivities,
        duration: newDuration,
        updatedAt: new Date()
      };
    });
    
    if (onUnsavedChangesChange) {
      onUnsavedChangesChange(true);
    }
  };

  // Handle activity reordering
  const handleActivityReorder = (dragIndex: number, hoverIndex: number) => {
    setCurrentLessonPlan(prev => {
      const newActivities = [...prev.activities];
      const draggedActivity = newActivities[dragIndex];
      
      newActivities.splice(dragIndex, 1);
      newActivities.splice(hoverIndex, 0, draggedActivity);
      
      return {
        ...prev,
        activities: newActivities,
        updatedAt: new Date()
      };
    });
    
    if (onUnsavedChangesChange) {
      onUnsavedChangesChange(true);
    }
  };

  // Handle activity preview
  const handleActivityPreview = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  // Handle activity selection
  const toggleActivitySelection = (activityId: string) => {
    setSelectedActivities(prev => 
      prev.includes(activityId) 
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  // Handle adding selected activities
  const handleAddSelectedActivities = () => {
    console.log('🔍 handleAddSelectedActivities called with:', selectedActivities);
    
    selectedActivities.forEach(activityId => {
      const activity = allActivities.find(act => (act._id || act.id) === activityId);
      console.log('🔍 Processing activity:', { activityId, activity });
      if (activity) {
        handleActivityAdd(activity);
      }
    });
    
    // Clear selections after adding
    setSelectedActivities([]);
    console.log('🔍 Cleared selectedActivities');
  };

  // Handle saving lesson plan
  const handleSaveLessonPlan = async () => {
    if (!currentLessonPlan.title.trim()) {
      setSaveStatus('error');
      setShowSaveStatus(true);
      setTimeout(() => setShowSaveStatus(false), 3000);
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');
    setShowSaveStatus(true);

    try {
      await addOrUpdateUserLessonPlan(currentLessonPlan);
      setSaveStatus('success');
      
      if (onUnsavedChangesChange) {
        onUnsavedChangesChange(false);
      }
      
      setTimeout(() => setShowSaveStatus(false), 3000);
    } catch (error) {
      console.error('Error saving lesson plan:', error);
      setSaveStatus('error');
      setTimeout(() => setShowSaveStatus(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div 
        className="flex"
        style={{ 
          height: 'calc(100vh - 140px)',
          backgroundColor: '#F9FAFB'
        }}
      >
        {/* LEFT PANEL - Lesson Plan Area (58%) */}
        <div 
          className="flex flex-col"
          style={{ 
            width: '58%',
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid #E5E7EB'
          }}
        >
          {/* LESSON HEADER - Sticky */}
          <div 
            className="bg-white border-b border-gray-200"
            style={{ 
              padding: '24px',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}
          >
            {/* Top row - flex, justify-content: space-between */}
            <div className="flex justify-between items-start mb-4">
              {/* Left side */}
              <div className="flex-1 mr-6">
                {/* Lesson name input */}
                <input
                  type="text"
                  value={currentLessonPlan.title}
                  onChange={(e) => handleLessonPlanFieldUpdate('title', e.target.value)}
                  placeholder="Enter lesson title..."
                  style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#111827',
                    borderBottom: '2px solid transparent',
                    width: '100%',
                    marginBottom: '12px',
                    backgroundColor: 'transparent',
                    outline: 'none',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderBottom = '2px solid #D1D5DB';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderBottom = '2px solid transparent';
                  }}
                  onFocus={(e) => {
                    e.target.style.borderBottom = '2px solid #14B8A6';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderBottom = '2px solid transparent';
                  }}
                />

                {/* Meta row (flex, gap: 24px) */}
                <div className="flex items-center gap-6">
                  {/* Grade level input */}
                  <input
                    type="text"
                    placeholder="Grade"
                    style={{
                      width: '80px',
                      height: '32px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '1px solid #14B8A6';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '1px solid #D1D5DB';
                    }}
                  />

                  {/* Duration display */}
                  <div className="flex items-center gap-1.5">
                    <Clock style={{ width: '16px', height: '16px', color: '#6B7280' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>
                      {currentLessonPlan.duration} min
                    </span>
                  </div>

                  {/* Activities count */}
                  <div className="flex items-center gap-1.5">
                    <Users style={{ width: '16px', height: '16px', color: '#6B7280' }} />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>
                      {currentLessonPlan.activities.length} activities
                    </span>
                  </div>
                </div>
              </div>

              {/* Right side - Save Lesson button */}
              <button
                onClick={handleSaveLessonPlan}
                disabled={isSaving}
                style={{
                  backgroundColor: '#14B8A6',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  height: '36px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.7 : 1,
                  transition: 'all 200ms'
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) {
                    e.target.style.backgroundColor = '#0D9488';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSaving) {
                    e.target.style.backgroundColor = '#14B8A6';
                  }
                }}
              >
                <Save style={{ width: '16px', height: '16px' }} />
                <span>{isSaving ? 'Saving...' : 'Save Lesson'}</span>
              </button>
            </div>
          </div>

          {/* LESSON CONTENT AREA */}
          <div 
            className="flex-1 overflow-y-auto"
            style={{ padding: '32px' }}
          >
            {currentLessonPlan.activities.length === 0 ? (
              /* EMPTY STATE */
              <div 
                className="flex flex-col items-center justify-center text-center"
                style={{ 
                  padding: '64px 32px',
                  height: '100%'
                }}
              >
                {/* Icon circle */}
                <div 
                  className="flex items-center justify-center mb-4"
                  style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '50%'
                  }}
                >
                  <Plus style={{ width: '32px', height: '32px', color: '#9CA3AF' }} />
                </div>

                {/* Heading */}
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 500,
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  Start building your lesson
                </h3>

                {/* Description */}
                <p style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  maxWidth: '320px',
                  lineHeight: 1.5
                }}>
                  Drag activities from the library on the right to create your lesson plan
                </p>

                {/* Drop zone */}
                <div 
                  className="mt-8"
                  style={{ width: '100%' }}
                >
                  <LessonDropZone 
                    lessonPlan={currentLessonPlan}
                    onActivityAdd={handleActivityAdd}
                    onActivityRemove={handleActivityRemove}
                    onActivityReorder={handleActivityReorder}
                    onLessonPlanFieldUpdate={handleLessonPlanFieldUpdate}
                    isEditing={true}
                    onActivityClick={(activity) => setSelectedActivity(activity)}
                  />
                </div>
              </div>
            ) : (
              /* WITH ACTIVITIES */
              <div className="space-y-4">
                {currentLessonPlan.activities.map((activity, index) => (
                  <div
                    key={activity._uniqueId || activity.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-teal-500 transition-all duration-200"
                    style={{
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Numbered badge */}
                        <div 
                          className="flex items-center justify-center text-white text-sm font-medium"
                          style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: '#14B8A6',
                            borderRadius: '50%'
                          }}
                        >
                          {index + 1}
                        </div>

                        {/* Activity info */}
                        <div>
                          <h3 className="font-medium text-gray-900 mb-1">{activity.activity}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{activity.category}</span>
                            <span>{activity.level}</span>
                            {activity.time > 0 && (
                              <span className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{activity.time}m</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => handleActivityRemove(activity._uniqueId || activity.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Drop zone for additional activities */}
                <LessonDropZone 
                  lessonPlan={currentLessonPlan}
                  onActivityAdd={handleActivityAdd}
                  onActivityRemove={handleActivityRemove}
                  onActivityReorder={handleActivityReorder}
                  onLessonPlanFieldUpdate={handleLessonPlanFieldUpdate}
                  isEditing={true}
                  onActivityClick={(activity) => setSelectedActivity(activity)}
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - Activity Library (42%) */}
        <div 
          className="flex flex-col"
          style={{ 
            width: '42%',
            backgroundColor: '#F9FAFB',
            overflowY: 'auto'
          }}
        >
          {/* LIBRARY HEADER - Sticky */}
          <div 
            className="bg-white border-b border-gray-200"
            style={{ 
              padding: '16px',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}
          >
            {/* Title */}
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '16px'
            }}>
              Activity Library
            </h2>

            {/* Search input */}
            <div className="relative mb-3">
              <Search 
                style={{ 
                  width: '16px', 
                  height: '16px', 
                  color: '#9CA3AF',
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }} 
              />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  padding: '0 12px 0 36px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid transparent';
                  e.target.style.boxShadow = '0 0 0 2px #14B8A6';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid #D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Filters row (grid, 2 columns, gap: 8px) */}
            <div className="grid grid-cols-2 gap-2">
              <SimpleNestedCategoryDropdown
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                placeholder="All Categories"
                className="text-sm"
              />
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                style={{
                  height: '36px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  padding: '0 12px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid transparent';
                  e.target.style.boxShadow = '0 0 0 2px #14B8A6';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid #D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="">All Levels</option>
                {customYearGroups.map((yearGroup) => (
                  <option key={yearGroup.id} value={yearGroup.name}>
                    {yearGroup.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ACTIVITY STACKS SECTION */}
          {filteredActivityStacks.length > 0 && (
            <div 
              className="bg-white border-b border-gray-200"
              style={{ padding: '16px' }}
            >
              {/* Header row */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen style={{ width: '16px', height: '16px', color: '#6B7280' }} />
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: '#6B7280',
                    letterSpacing: 'wider'
                  }}>
                    Activity Stacks ({filteredActivityStacks.length})
                  </span>
                </div>
                <button
                  onClick={() => setShowStacks(!showStacks)}
                  style={{
                    fontSize: '12px',
                    color: '#14B8A6',
                    fontWeight: 500,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#0D9488';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = '#14B8A6';
                  }}
                >
                  {showStacks ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Stack cards */}
              {showStacks && (
                <div className="space-y-2">
                  {filteredActivityStacks.map((stack) => (
                    <div
                      key={stack.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3 cursor-move hover:border-teal-500 transition-all duration-200"
                      style={{
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#14B8A6';
                        e.target.style.boxShadow = '0 2px 8px rgba(20,184,166,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#E5E7EB';
                        e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div style={{ width: '16px', height: '16px', color: '#9CA3AF' }}>
                          <MoreVertical className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                            {stack.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B7280' }}>
                            {stack.activities.length} activities • {stack.totalTime} min
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACTIVITIES LIST */}
          <div style={{ padding: '16px', backgroundColor: '#F9FAFB', marginTop: '16px' }}>
            <div className="space-y-3">
              {filteredActivities.map((activity, index) => {
                const activityId = activity._id || activity.id || '';
                const isSelected = selectedActivities.includes(activityId);
                
                return (
                  <div
                    key={`${activity._id || activity.id || activityId}-${index}`}
                    className={`bg-white border rounded-lg p-4 cursor-move hover:border-teal-500 transition-all duration-200 ${
                      isSelected ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                    }`}
                    style={{
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#14B8A6';
                      e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = isSelected ? '#14B8A6' : '#E5E7EB';
                      e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const isCheckboxClick = clickX > rect.width - 60;
                      
                      if (isCheckboxClick) {
                        toggleActivitySelection(activityId);
                      } else {
                        handleActivityPreview(activity);
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      {/* Grip handle */}
                      <div 
                        className="flex-shrink-0 mt-1"
                        style={{ width: '16px', height: '16px', color: '#9CA3AF' }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </div>

                      {/* Left accent bar */}
                      <div 
                        className="flex-shrink-0"
                        style={{
                          width: '4px',
                          backgroundColor: '#14B8A6',
                          borderRadius: '9999px'
                        }}
                      />

                      {/* Content area */}
                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h4 style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#111827',
                          marginBottom: '8px'
                        }}>
                          {activity.activity}
                        </h4>

                        {/* Tags row */}
                        <div className="flex gap-2 mb-2">
                          <span style={{
                            backgroundColor: '#F3F4F6',
                            color: '#6B7280',
                            fontSize: '12px',
                            padding: '4px 8px',
                            borderRadius: '6px'
                          }}>
                            {activity.category}
                          </span>
                          <span style={{
                            backgroundColor: '#F3F4F6',
                            color: '#6B7280',
                            fontSize: '12px',
                            padding: '4px 8px',
                            borderRadius: '6px'
                          }}>
                            {activity.level}
                          </span>
                        </div>

                        {/* Description */}
                        <p style={{
                          fontSize: '12px',
                          color: '#6B7280',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {activity.description || 'No description available'}
                        </p>
                      </div>

                      {/* Checkbox */}
                      <div 
                        className="flex-shrink-0 cursor-pointer"
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
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Add Selected Activities Bar - whole bar clickable */}
            {selectedActivities.length > 0 && (
              <div
                className="sticky top-2 z-50 mb-4"
                style={{ pointerEvents: 'auto', userSelect: 'none' }}
              >
                <button
                  type="button"
                  onClick={() => {
                    console.log('🔍 Add bar clicked, selectedActivities:', selectedActivities);
                    handleAddSelectedActivities();
                  }}
                  aria-label={`Add ${selectedActivities.length} selected activities`}
                  className="w-full py-3 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-3 shadow-md focus:outline-none"
                  style={{
                    backgroundColor: '#065F5B',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0D9488';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#065F5B';
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 3px rgba(13,148,136,0.35)';
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  <span>Add</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
                  >
                    {selectedActivities.length}
                  </span>
                  <span>Selected Activities</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Details Modal */}
      {selectedActivity && (
        <ActivityDetails
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      )}

      {/* Save Status */}
      {showSaveStatus && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`p-4 rounded-lg shadow-lg ${
            saveStatus === 'success' ? 'bg-green-100 border border-green-200' :
            saveStatus === 'error' ? 'bg-red-100 border border-red-200' :
            'bg-blue-100 border border-blue-200'
          }`}>
            <div className="flex items-center space-x-3">
              {saveStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {saveStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
              {saveStatus === 'saving' && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>}
              
              <div>
                <h3 className={`text-lg font-medium ${
                  saveStatus === 'success' ? 'text-green-800' :
                  saveStatus === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {saveStatus === 'success' ? 'Lesson saved successfully!' :
                   saveStatus === 'error' ? 'Failed to save lesson' :
                   'Saving lesson...'}
                </h3>
                {saveStatus === 'error' && (
                  <p className="text-sm text-red-600">Please provide a lesson title.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DndProvider>
  );
}
