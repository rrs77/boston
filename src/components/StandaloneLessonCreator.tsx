import React, { useState, useMemo, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { X, Plus, Trash2, Eye, BookOpen, Target, Link2, Clock, Search, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { ActivityCard } from './ActivityCard';
import { SimpleNestedCategoryDropdown } from './SimpleNestedCategoryDropdown';
import { ActivitySearchModal } from './ActivitySearchModal';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import type { Activity, LessonPlan } from '../contexts/DataContext';

interface StandaloneLessonCreatorProps {
  onSave: (lessonData: any) => void;
  onClose: () => void;
  editingLesson?: {
    lessonNumber: string;
    lessonData: any;
  };
}

// Compact Draggable Activity Item Component
interface CompactDraggableActivityProps {
  activity: Activity;
  index: number;
  onRemove: () => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
}

function CompactDraggableActivity({ activity, index, onRemove, onReorder }: CompactDraggableActivityProps) {
  const { getCategoryColor } = useSettings();
  const ref = useRef<HTMLDivElement>(null);
  const categoryColor = getCategoryColor(activity.category);

  const [{ handlerId }, drop] = useDrop({
    accept: 'compact-activity',
    collect(monitor) {
      return { handlerId: monitor.getHandlerId() };
    },
    hover(item: { index: number }, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      onReorder(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'compact-activity',
    item: () => ({ index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity }}
      data-handler-id={handlerId}
      className="flex items-center py-2 px-3 hover:bg-gray-50 group cursor-move"
    >
      <GripVertical className="h-4 w-4 text-gray-400 mr-2" />
      <div 
        className="w-1 h-6 rounded-full mr-2 flex-shrink-0"
        style={{ backgroundColor: categoryColor }}
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-900">{activity.activity}</span>
      </div>
      <span 
        className="px-2 py-0.5 text-white text-xs font-medium rounded-full mr-2"
        style={{ backgroundColor: categoryColor }}
      >
        {activity.category}
      </span>
      {activity.time > 0 && (
        <div className="flex items-center space-x-1 text-gray-500 mr-2">
          <Clock className="h-3 w-3" />
          <span className="text-xs">{activity.time}m</span>
        </div>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors opacity-0 group-hover:opacity-100"
        title="Remove Activity"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export const StandaloneLessonCreator: React.FC<StandaloneLessonCreatorProps> = ({ onSave, onClose, editingLesson }) => {
  const { allActivities, updateLessonData } = useData();
  const { categories, customYearGroups } = useSettings();
  
  const [activeTab, setActiveTab] = useState<'main' | 'extended'>('main');
  const [showPreview, setShowPreview] = useState(false);
  
  // Initialize lesson state - populate if editing
  const [lesson, setLesson] = useState(() => {
    if (editingLesson?.lessonData) {
      const lessonData = editingLesson.lessonData;
      return {
        lessonTitle: lessonData.title || '',
        lessonName: lessonData.lessonName || '',
        duration: lessonData.totalTime || 60,
        learningOutcome: lessonData.learningOutcome || '',
        successCriteria: lessonData.successCriteria || '',
        introduction: lessonData.introduction || '',
        mainActivity: lessonData.mainActivity || '',
        plenary: lessonData.plenary || '',
        vocabulary: lessonData.vocabulary || '',
        keyQuestions: lessonData.keyQuestions || '',
        resources: lessonData.resources || '',
        differentiation: lessonData.differentiation || '',
        assessment: lessonData.assessment || '',
        videoLink: lessonData.videoLink || '',
        resourceLink: lessonData.resourceLink || '',
        imageLink: lessonData.imageLink || '',
        additionalLinks: lessonData.additionalLinks || [] as Array<{ url: string; label: string }>,
      };
    }
    return {
      lessonTitle: '',
      lessonName: '',
      duration: 60,
      learningOutcome: '',
      successCriteria: '',
      introduction: '',
      mainActivity: '',
      plenary: '',
      vocabulary: '',
      keyQuestions: '',
      resources: '',
      differentiation: '',
      assessment: '',
      videoLink: '',
      resourceLink: '',
      imageLink: '',
      additionalLinks: [] as Array<{ url: string; label: string }>,
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Activity library state - populate if editing
  const [selectedActivities, setSelectedActivities] = useState<Activity[]>(() => {
    if (editingLesson?.lessonData) {
      const lessonData = editingLesson.lessonData;
      // Use orderedActivities if available, otherwise flatten grouped
      let activities: Activity[] = [];
      if (lessonData.orderedActivities && Array.isArray(lessonData.orderedActivities)) {
        activities = lessonData.orderedActivities.map((activity: Activity) => ({
          ...activity,
          _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
        }));
      } else if (lessonData.grouped) {
        const categoryOrder = lessonData.categoryOrder || Object.keys(lessonData.grouped);
        activities = categoryOrder
          .filter(category => lessonData.grouped[category])
          .flatMap(category => lessonData.grouped[category] || [])
          .map((activity: Activity) => ({
            ...activity,
            _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
          }));
      }
      return activities;
    }
    return [];
  });
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showActivitiesSection, setShowActivitiesSection] = useState(editingLesson ? true : false);

  // Auto-resize textareas on mount and when values change
  React.useEffect(() => {
    const textareas = document.querySelectorAll('textarea[name]');
    textareas.forEach((textarea) => {
      const ta = textarea as HTMLTextAreaElement;
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });
  }, [lesson]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLesson((prev) => ({ ...prev, [name]: name === 'duration' ? parseInt(value) || 0 : value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleRichTextChange = (field: string, value: string) => {
    setLesson((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddLink = () => {
    setLesson((prev) => ({
      ...prev,
      additionalLinks: [...prev.additionalLinks, { url: '', label: '' }],
    }));
  };

  const handleRemoveLink = (index: number) => {
    setLesson((prev) => ({
      ...prev,
      additionalLinks: prev.additionalLinks.filter((_, i) => i !== index),
    }));
  };

  const handleLinkChange = (index: number, field: 'url' | 'label', value: string) => {
    setLesson((prev) => ({
      ...prev,
      additionalLinks: prev.additionalLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!lesson.lessonTitle.trim()) newErrors.lessonTitle = 'Lesson title is required';
    if (!lesson.lessonName.trim()) newErrors.lessonName = 'Lesson name is required';
    if (!lesson.duration || lesson.duration <= 0) newErrors.duration = 'Duration must be greater than 0';
    if (!lesson.learningOutcome.trim()) newErrors.learningOutcome = 'Learning outcome is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle activity selection from modal
  const handleSelectActivity = (activity: Activity) => {
    const activityCopy = JSON.parse(JSON.stringify(activity));
    const uniqueActivity = {
      ...activityCopy,
      _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
    };
    
    // Check if already added
    const isAlreadyAdded = selectedActivities.some(
      a => (a._id || a.id) === (activity._id || activity.id)
    );
    
    if (!isAlreadyAdded) {
      setSelectedActivities(prev => [...prev, uniqueActivity]);
      
      // Update duration
      setLesson(prev => ({
        ...prev,
        duration: prev.duration + (uniqueActivity.time || 0)
      }));
    }
  };

  // Handle activity removal from modal
  const handleRemoveActivity = (activity: Activity) => {
    const activityToRemove = selectedActivities.find(
      a => (a._id || a.id) === (activity._id || activity.id)
    );
    
    if (activityToRemove) {
      setSelectedActivities(prev => prev.filter(
        a => (a._id || a.id) !== (activity._id || activity.id)
      ));
      
      // Update duration
      setLesson(prev => ({
        ...prev,
        duration: Math.max(0, prev.duration - (activityToRemove.time || 0))
      }));
    }
  };

  // Handle adding activity from library
  const handleActivityAdd = (activity: Activity) => {
    const activityCopy = JSON.parse(JSON.stringify(activity));
    const uniqueActivity = {
      ...activityCopy,
      _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
    };
    setSelectedActivities(prev => [...prev, uniqueActivity]);
    
    // Update duration
    setLesson(prev => ({
      ...prev,
      duration: prev.duration + (uniqueActivity.time || 0)
    }));
  };

  // Handle removing activity
  const handleActivityRemove = (index: number) => {
    const removedActivity = selectedActivities[index];
    setSelectedActivities(prev => prev.filter((_, i) => i !== index));
    
    // Update duration
    setLesson(prev => ({
      ...prev,
      duration: Math.max(0, prev.duration - (removedActivity.time || 0))
    }));
  };

  // Handle reordering activities
  const handleActivityReorder = (dragIndex: number, hoverIndex: number) => {
    setSelectedActivities(prev => {
      const newActivities = [...prev];
      const [movedActivity] = newActivities.splice(dragIndex, 1);
      newActivities.splice(hoverIndex, 0, movedActivity);
      return newActivities;
    });
  };

  const handleSubmit = async () => {
    console.log('📝 Submit button clicked');
    console.log('📊 Current lesson data:', lesson);
    
    if (!validate()) {
      console.log('❌ Validation failed');
      return;
    }

    console.log('✅ Validation passed');

    // Group activities by category
    const grouped: Record<string, Activity[]> = {};
    const categoryOrder: string[] = [];
    
    selectedActivities.forEach(activity => {
      const category = activity.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
        categoryOrder.push(category);
      }
      grouped[category].push(activity);
    });

    const lessonData = {
      title: lesson.lessonTitle,
      lessonName: lesson.lessonName,
      totalTime: lesson.duration,
      type: 'standalone',
      createdAt: editingLesson?.lessonData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      learningOutcome: lesson.learningOutcome,
      successCriteria: lesson.successCriteria,
      introduction: lesson.introduction,
      mainActivity: lesson.mainActivity,
      plenary: lesson.plenary,
      vocabulary: lesson.vocabulary,
      keyQuestions: lesson.keyQuestions,
      resources: lesson.resources,
      differentiation: lesson.differentiation,
      assessment: lesson.assessment,
      videoLink: lesson.videoLink,
      resourceLink: lesson.resourceLink,
      imageLink: lesson.imageLink,
      additionalLinks: lesson.additionalLinks,
      grouped: grouped,
      categoryOrder: categoryOrder,
      orderedActivities: selectedActivities.map(a => {
        const { _uniqueId, ...cleanActivity } = a;
        return cleanActivity;
      })
    };

    // If editing, use updateLessonData
    if (editingLesson && updateLessonData) {
      console.log('💾 Updating existing lesson:', editingLesson.lessonNumber);
      await updateLessonData(editingLesson.lessonNumber, lessonData);
      console.log('✅ Lesson updated successfully');
      onClose();
    } else {
      console.log('💾 Creating new lesson');
      onSave(lessonData);
    }
  };

  return (
    <>
      {/* Main Create Lesson Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-[100]">
        <div className="bg-white rounded-card shadow-soft w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[98vh] sm:max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white flex-shrink-0" />
            <h2 className="text-base sm:text-xl font-bold text-white truncate">
              {editingLesson ? `Editing: ${editingLesson.lessonData?.title || `Lesson ${editingLesson.lessonNumber}`}` : 'Create Lesson Plan'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200 flex-shrink-0"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-50 border-0" style={{ border: 'none', borderBottom: 'none', outline: 'none' }}>
          <button
            onClick={() => setActiveTab('main')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'main'
                ? 'text-white bg-teal-600'
                : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
            }`}
            style={{ 
              border: 'none !important', 
              borderBottom: 'none !important', 
              borderTop: 'none !important',
              borderLeft: 'none !important',
              borderRight: 'none !important',
              outline: 'none !important',
              boxShadow: 'none !important',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.border = 'none';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.border = 'none';
            }}
          >
            <div className="flex items-center justify-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Key Information</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('extended')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'extended'
                ? 'text-white bg-teal-600'
                : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
            }`}
            style={{
              border: 'none !important',
              borderBottom: 'none !important',
              borderTop: 'none !important',
              borderLeft: 'none !important',
              borderRight: 'none !important',
              outline: 'none !important',
              boxShadow: 'none !important',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.border = 'none';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.border = 'none';
            }}
          >
            <div className="flex items-center justify-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Extended Details</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'main' ? (
            <div className="p-6 space-y-6">
              {/* Basic Information Card */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <BookOpen className="h-5 w-5 text-teal-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Lesson Title (for card) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lessonTitle"
                      value={lesson.lessonTitle}
                      onChange={handleChange}
                      className={`w-full h-10 px-3 border ${errors.lessonTitle ? 'border-red-500' : 'border-gray-300'} rounded-lg text-sm bg-white`}
                      placeholder="e.g., Musical Rhythms"
                    />
                    {errors.lessonTitle && (
                      <p className="mt-1 text-xs text-red-500">{errors.lessonTitle}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Lesson Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lessonName"
                      value={lesson.lessonName}
                      onChange={handleChange}
                      className={`w-full h-10 px-3 border ${errors.lessonName ? 'border-red-500' : 'border-gray-300'} rounded-lg text-sm bg-white`}
                      placeholder="e.g., Exploring Tempo"
                    />
                    {errors.lessonName && (
                      <p className="mt-1 text-xs text-red-500">{errors.lessonName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Duration (mins) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="duration"
                      value={lesson.duration || ''}
                      onChange={handleChange}
                      className={`w-full h-10 px-3 border ${errors.duration ? 'border-red-500' : 'border-gray-300'} rounded-lg text-sm bg-white`}
                      placeholder="60"
                      min="0"
                    />
                    {errors.duration && (
                      <p className="mt-1 text-xs text-red-500">{errors.duration}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Learning Objectives Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <Target className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Learning Objectives</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Learning Outcome <span className="text-red-500">*</span>
                    </label>
                    <div className="bg-white rounded-lg border border-gray-300">
                      <RichTextEditor
                        value={lesson.learningOutcome}
                        onChange={(value) => handleRichTextChange('learningOutcome', value)}
                        placeholder="Students will be able to identify and perform different musical tempos (e.g., adagio, andante, allegro)"
                      />
                    </div>
                    {errors.learningOutcome && (
                      <p className="mt-1 text-xs text-red-500">{errors.learningOutcome}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Success Criteria
                    </label>
                    <div className="bg-white rounded-lg border border-gray-300">
                      <RichTextEditor
                        value={lesson.successCriteria}
                        onChange={(value) => handleRichTextChange('successCriteria', value)}
                        placeholder="• Students can clap rhythms at different tempos • Can identify tempo changes when listening • Can explain the difference between fast and slow tempo"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Introduction Card */}
              <div className={`bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg transition-all duration-300 ${lesson.introduction ? 'p-5' : 'p-4'}`}>
                <div className="flex items-center space-x-2 mb-3">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  <h3 className="text-base font-semibold text-gray-900">Introduction/Context</h3>
                </div>
                {lesson.introduction || true ? (
                  <textarea
                    name="introduction"
                    value={lesson.introduction}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                    style={{ height: lesson.introduction ? 'auto' : '60px', minHeight: '60px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                    placeholder="Warm-up: Sing familiar song at normal tempo, then experiment with different speeds"
                  />
                ) : null}
              </div>

              {/* Main Activity Card */}
              <div className={`bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg transition-all duration-300 ${lesson.mainActivity ? 'p-5' : 'p-4'}`}>
                <div className="flex items-center space-x-2 mb-3">
                  <Target className="h-5 w-5 text-green-600" />
                  <h3 className="text-base font-semibold text-gray-900">Main Activity</h3>
                </div>
                {lesson.mainActivity || true ? (
                  <div className="bg-white rounded-lg border border-gray-300">
                    <RichTextEditor
                      value={lesson.mainActivity}
                      onChange={(value) => handleRichTextChange('mainActivity', value)}
                      placeholder="Describe the main activity in detail. For music: Include instrumental work, singing, movement, listening activities, and performance elements."
                    />
                  </div>
                ) : null}

                {/* Activities Section - Collapsible at bottom of Main Activity */}
                <div className="mt-4 pt-4 border-t border-green-200">
                  <button
                    onClick={() => setShowActivitiesSection(!showActivitiesSection)}
                    className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Plus className="h-4 w-4 text-teal-600" />
                      <span className="text-sm font-medium text-gray-900">Activities</span>
                      {selectedActivities.length > 0 && (
                        <span className="text-xs text-gray-500">({selectedActivities.length} selected)</span>
                      )}
                    </div>
                    {showActivitiesSection ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </button>

                  {/* Collapsible Activities Content */}
                  {showActivitiesSection && (
                    <DndProvider backend={HTML5Backend}>
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-3">
                          <button
                            onClick={() => setShowActivityModal(true)}
                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Activities</span>
                          </button>
                        </div>
                        
                        {selectedActivities.length === 0 ? (
                          <p className="text-sm text-gray-600 py-4 text-center">
                            Click "Add Activities" to select activities for this lesson plan.
                          </p>
                        ) : (
                          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                            {selectedActivities.map((activity, index) => (
                              <CompactDraggableActivity
                                key={activity._uniqueId || `${activity._id || activity.id || activity.activity}-${index}`}
                                activity={activity}
                                index={index}
                                onRemove={() => handleActivityRemove(index)}
                                onReorder={handleActivityReorder}
                              />
                            ))}
                            <div className="p-3 border-t border-gray-200">
                              <button
                                onClick={() => setShowActivityModal(true)}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                                <span>Add Activity to Lesson</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </DndProvider>
                  )}
                </div>
              </div>

              {/* Plenary Card */}
              <div className={`bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg transition-all duration-300 ${lesson.plenary ? 'p-5' : 'p-4'}`}>
                <div className="flex items-center space-x-2 mb-3">
                  <Target className="h-5 w-5 text-orange-600" />
                  <h3 className="text-base font-semibold text-gray-900">Plenary/Conclusion</h3>
                </div>
                {lesson.plenary || true ? (
                  <textarea
                    name="plenary"
                    value={lesson.plenary}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                    style={{ height: lesson.plenary ? 'auto' : '60px', minHeight: '60px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                    placeholder="Performance: Groups perform their pieces at chosen tempos, class discusses effectiveness"
                  />
                ) : null}
              </div>
            </div>
          ) : activeTab === 'extended' ? (
            <div className="p-6 space-y-5">
              {/* Extended Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lesson.vocabulary || true ? (
                  <div className={`bg-gray-50 border border-gray-200 rounded-lg transition-all duration-300 ${lesson.vocabulary ? 'p-4' : 'p-3'}`}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vocabulary
                    </label>
                    <textarea
                      name="vocabulary"
                      value={lesson.vocabulary}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                      style={{ height: lesson.vocabulary ? 'auto' : '60px', minHeight: '60px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      placeholder="Tempo, Adagio, Andante, Allegro, Beat, Rhythm"
                    />
                  </div>
                ) : null}

                {lesson.keyQuestions || true ? (
                  <div className={`bg-gray-50 border border-gray-200 rounded-lg transition-all duration-300 ${lesson.keyQuestions ? 'p-4' : 'p-3'}`}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key Questions
                    </label>
                    <textarea
                      name="keyQuestions"
                      value={lesson.keyQuestions}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                      style={{ height: lesson.keyQuestions ? 'auto' : '60px', minHeight: '60px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      placeholder="How does tempo affect the mood? What happens when we play faster/slower?"
                    />
                  </div>
                ) : null}

                {lesson.resources || true ? (
                  <div className={`bg-gray-50 border border-gray-200 rounded-lg transition-all duration-300 ${lesson.resources ? 'p-4' : 'p-3'}`}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resources
                    </label>
                    <textarea
                      name="resources"
                      value={lesson.resources}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                      style={{ height: lesson.resources ? 'auto' : '60px', minHeight: '60px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      placeholder="Percussion instruments, metronome, audio player, tempo cards"
                    />
                  </div>
                ) : null}

                {lesson.assessment || true ? (
                  <div className={`bg-gray-50 border border-gray-200 rounded-lg transition-all duration-300 ${lesson.assessment ? 'p-4' : 'p-3'}`}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assessment
                    </label>
                    <textarea
                      name="assessment"
                      value={lesson.assessment}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                      style={{ height: lesson.assessment ? 'auto' : '60px', minHeight: '60px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      placeholder="Observe: Can students match tempo? Do they understand terminology?"
                    />
                  </div>
                ) : null}
              </div>

              {lesson.differentiation || true ? (
                <div className={`bg-gray-50 border border-gray-200 rounded-lg transition-all duration-300 ${lesson.differentiation ? 'p-4' : 'p-3'}`}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Differentiation
                  </label>
                  <textarea
                    name="differentiation"
                    value={lesson.differentiation}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                    style={{ height: lesson.differentiation ? 'auto' : '80px', minHeight: '80px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                    placeholder="Support: Use visual tempo indicators, simplified patterns. Extension: Compose using multiple tempo changes"
                  />
                </div>
              ) : null}

              {/* Web Links Card */}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <Link2 className="h-5 w-5 text-cyan-600" />
                  <h3 className="text-base font-semibold text-gray-900">Web Links & Resources</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Video Link
                    </label>
                    <input
                      type="url"
                      name="videoLink"
                      value={lesson.videoLink}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                      placeholder="https://youtube.com/..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Resource Link
                    </label>
                    <input
                      type="url"
                      name="resourceLink"
                      value={lesson.resourceLink}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Image Link
                    </label>
                    <input
                      type="url"
                      name="imageLink"
                      value={lesson.imageLink}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Additional Links */}
                {lesson.additionalLinks.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {lesson.additionalLinks.map((link, index) => (
                      <div key={index} className="grid grid-cols-[1fr_auto_auto] gap-2">
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                          className="h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                          placeholder="https://..."
                        />
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => handleLinkChange(index, 'label', e.target.value)}
                          className="h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white w-40"
                          placeholder="Label"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(index)}
                          className="h-10 px-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddLink}
                  className="flex items-center space-x-2 px-3 py-2 text-teal-600 hover:bg-teal-50 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Link</span>
                </button>
              </div>
            </div>
            ) : null}
          </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-2 px-4 py-2 text-teal-600 hover:bg-teal-50 rounded-lg text-sm font-medium transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span>Preview Card</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 text-sm font-medium transition-all shadow-sm"
            >
              {editingLesson ? 'Save Changes' : 'Create Lesson'}
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Full Lesson Preview Modal - Separate overlay with higher z-index */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-2 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                <h3 className="text-lg sm:text-xl font-bold text-white">Full Lesson Preview</h3>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Lesson Header Info */}
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg p-4 border border-teal-200">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {lesson.lessonTitle || 'Untitled Lesson'}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                  {lesson.lessonName && (
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4 text-teal-600" />
                      <span className="font-medium">{lesson.lessonName}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-teal-600" />
                    <span className="font-medium">{lesson.duration} minutes</span>
                  </div>
                </div>
              </div>

              {/* Learning Outcome */}
              {lesson.learningOutcome && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Target className="h-5 w-5 text-teal-600" />
                    <span>Learning Outcome</span>
                  </h4>
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200"
                    dangerouslySetInnerHTML={{ __html: lesson.learningOutcome }}
                  />
                </div>
              )}

              {/* Success Criteria */}
              {lesson.successCriteria && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Target className="h-5 w-5 text-teal-600" />
                    <span>Success Criteria</span>
                  </h4>
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200"
                    dangerouslySetInnerHTML={{ __html: lesson.successCriteria }}
                  />
                </div>
              )}

              {/* Introduction */}
              {lesson.introduction && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Introduction</h4>
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200"
                    dangerouslySetInnerHTML={{ __html: lesson.introduction }}
                  />
                </div>
              )}

              {/* Main Activity */}
              {lesson.mainActivity && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Main Activity</h4>
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200"
                    dangerouslySetInnerHTML={{ __html: lesson.mainActivity }}
                  />
                </div>
              )}

              {/* Plenary */}
              {lesson.plenary && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Plenary</h4>
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200"
                    dangerouslySetInnerHTML={{ __html: lesson.plenary }}
                  />
                </div>
              )}

              {/* Vocabulary */}
              {lesson.vocabulary && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Vocabulary</h4>
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200"
                    dangerouslySetInnerHTML={{ __html: lesson.vocabulary }}
                  />
                </div>
              )}

              {/* Key Questions */}
              {lesson.keyQuestions && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Key Questions</h4>
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200"
                    dangerouslySetInnerHTML={{ __html: lesson.keyQuestions }}
                  />
                </div>
              )}

              {/* Resources */}
              {lesson.resources && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Resources</h4>
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200"
                    dangerouslySetInnerHTML={{ __html: lesson.resources }}
                  />
                </div>
              )}

              {/* Differentiation */}
              {lesson.differentiation && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Differentiation</h4>
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200"
                    dangerouslySetInnerHTML={{ __html: lesson.differentiation }}
                  />
                </div>
              )}

              {/* Assessment */}
              {lesson.assessment && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">Assessment</h4>
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200"
                    dangerouslySetInnerHTML={{ __html: lesson.assessment }}
                  />
                </div>
              )}

              {/* Links Section */}
              {(lesson.videoLink || lesson.resourceLink || lesson.imageLink || (lesson.additionalLinks && lesson.additionalLinks.length > 0)) && (
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Link2 className="h-5 w-5 text-teal-600" />
                    <span>Links & Resources</span>
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                    {lesson.videoLink && (
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></span>
                        <a href={lesson.videoLink} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800 hover:underline text-sm">
                          Video Link
                        </a>
                      </div>
                    )}
                    {lesson.resourceLink && (
                      <div className="flex items-center space-x-2">
                        <Link2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
                        <a href={lesson.resourceLink} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800 hover:underline text-sm">
                          Resource Link
                        </a>
                      </div>
                    )}
                    {lesson.imageLink && (
                      <div className="flex items-center space-x-2">
                        <Link2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
                        <a href={lesson.imageLink} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800 hover:underline text-sm">
                          Image Link
                        </a>
                      </div>
                    )}
                    {lesson.additionalLinks && lesson.additionalLinks.length > 0 && lesson.additionalLinks.map((link, index) => (
                      link.url && (
                        <div key={index} className="flex items-center space-x-2">
                          <Link2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800 hover:underline text-sm">
                            {link.label || `Link ${index + 1}`}
                          </a>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Search Modal */}
      <ActivitySearchModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        onSelectActivity={handleSelectActivity}
        onRemoveActivity={handleRemoveActivity}
        selectedActivities={selectedActivities}
      />
    </>
  );
};
