import React, { useState, useRef, useEffect } from 'react';
import { X, Clock, Video, Music, FileText, Link as LinkIcon, Image, Volume2, Maximize2, Minimize2, ExternalLink, Tag, Plus, Save, Upload, Edit3, Check, Trash2, Info, BookOpen, FolderOpen, Palette } from 'lucide-react';
import { EditableText } from './EditableText';
import { RichTextEditor } from './RichTextEditor';
import { ResourceViewer } from './ResourceViewer';
import { NestedStandardsBrowser } from './NestedStandardsBrowser';
import { SimpleNestedCategoryDropdown } from './SimpleNestedCategoryDropdown';
import type { Activity } from '../contexts/DataContext';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { useIsViewOnly } from '../hooks/useIsViewOnly';

interface ActivityDetailsProps {
  activity: Activity;
  onClose: () => void;
  onAddToLesson?: () => void;
  isEditing?: boolean;
  onUpdate?: (updatedActivity: Activity) => void;
  initialResource?: {url: string, title: string, type: string} | null;
  onDelete?: (activityId: string) => void;
  onAddActivityToLesson?: (activity: Activity, isModified?: boolean) => void;
  isLessonBuilderContext?: boolean;
  initialEditMode?: boolean;
  onViewUnit?: (unitName: string) => void;
  onViewLesson?: (lessonNumber: string) => void;
}

export function ActivityDetails({ 
  activity, 
  onClose, 
  onAddToLesson,
  isEditing = false,
  onUpdate,
  initialResource = null,
  onDelete,
  onAddActivityToLesson,
  isLessonBuilderContext = false,
  initialEditMode = false,
  onViewUnit,
  onViewLesson
}: ActivityDetailsProps) {
  // Safety check - ensure activity exists and has required fields
  if (!activity || !activity.activity) {
    console.error('ActivityDetails: Invalid activity data', activity);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">Activity data is invalid or missing.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  
  const { nestedStandards, lessonStandards, addStandardToLesson, removeStandardFromLesson, updateActivity: updateActivityGlobal } = useData();
  const { customYearGroups, mapActivityLevelToYearGroup } = useSettings();
  const [selectedResource, setSelectedResource] = useState<{ url: string; title: string; type: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStandardsSelector, setShowStandardsSelector] = useState(false);
  const [selectedStandards, setSelectedStandards] = useState<string[]>(activity.standards || activity.eyfsStandards || []);
  const [editedActivity, setEditedActivity] = useState<Activity>({
    ...activity,
    canvaLink: activity.canvaLink || '', // Initialize canvaLink
    yearGroups: Array.isArray(activity.yearGroups) ? activity.yearGroups : (activity.level ? [activity.level] : []) // Initialize yearGroups from level for backward compatibility
  });
  const [isEditMode, setIsEditMode] = useState(isLessonBuilderContext ? initialEditMode : isEditing);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [standardsHasChanges, setStandardsHasChanges] = useState(false);
  const [standardsLastSaved, setStandardsLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Check if user is in view-only mode
  const isViewOnly = useIsViewOnly();
  const isReadOnly = isViewOnly;

  // Set the initial resource if provided
  useEffect(() => {
    if (initialResource) {
      setSelectedResource(initialResource);
    }
  }, [initialResource]);

  // Fullscreen functionality
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Initialize edited activity when the component mounts or activity changes
  useEffect(() => {
    const normalizedActivity = {
      ...activity,
      yearGroups: Array.isArray(activity.yearGroups) ? activity.yearGroups : (activity.level ? [activity.level] : []),
      // Ensure category is properly set
      category: activity.category || ''
    };
    setEditedActivity(normalizedActivity);
    setSelectedStandards(activity.standards || activity.eyfsStandards || []);
    // Only allow edit mode if onUpdate is provided and isEditing is true
    setIsEditMode(isLessonBuilderContext ? initialEditMode : (isEditing && !isReadOnly));
    setHasUnsavedChanges(false);
  }, [activity, isEditing, isReadOnly, isLessonBuilderContext, initialEditMode]);

  // Track changes to edited activity
  useEffect(() => {
    if (isLessonBuilderContext) {
      const hasChanges = JSON.stringify(editedActivity) !== JSON.stringify(activity);
      setHasUnsavedChanges(hasChanges);
    }
  }, [editedActivity, activity, isLessonBuilderContext]);
  const handleSave = async () => {
    if (isViewOnly) {
      alert('View-only mode: Cannot save activity changes.');
      return;
    }
    
    const updatedActivity = {
      ...editedActivity,
      standards: selectedStandards
    };
    
    // ALWAYS update the global activity data first (master copy)
    // This ensures changes propagate to all lessons using this activity
    try {
      await updateActivityGlobal(updatedActivity);
      console.log('✅ Activity updated globally:', updatedActivity.id || updatedActivity._id);
    } catch (error) {
      console.error('❌ Failed to update activity globally:', error);
    }
    
    // Then handle context-specific logic
    if (isLessonBuilderContext && onAddActivityToLesson) {
      // In lesson builder context, also notify the lesson builder
      onAddActivityToLesson(updatedActivity, hasUnsavedChanges);
      onClose();
    } else if (onUpdate) {
      // Also call the provided onUpdate callback if available
      onUpdate(updatedActivity);
      setIsEditMode(false);
    } else {
      // No callback provided, just close edit mode
      setIsEditMode(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return; // Prevent uploads in read-only mode
    
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for demo purposes
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setEditedActivity(prev => ({
        ...prev,
        imageLink: imageUrl
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = () => {
    if (isReadOnly) return; // Prevent deletion in read-only mode
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (onDelete && !isReadOnly) {
      // Use the activity's ID instead of its name for deletion
      onDelete(activity._id || activity.id || '');
      onClose();
    }
    setShowDeleteConfirm(false);
  };

  const renderDescription = () => {
    if (isEditMode && !isReadOnly) {
      return (
        <RichTextEditor
          value={editedActivity.description || ''}
          onChange={(value) => setEditedActivity(prev => ({ ...prev, description: value }))}
          placeholder="Enter activity description..."
          minHeight="150px"
        />
      );
    }
    
    if (activity.htmlDescription) {
      // Render HTML description with basic formatting
      return (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: activity.htmlDescription }}
          dir="ltr"
        />
      );
    }
    
    // Safety check - ensure description exists
    if (!activity.description) {
      return (
        <div className="text-gray-500 italic">
          No description available.
        </div>
      );
    }
    
    // Render plain text with markdown-style formatting or HTML
    if (activity.description.includes('<')) {
      return (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: activity.description }}
          dir="ltr"
        />
      );
    }
    
    // Format plain text with line breaks and basic markdown
    const formattedDescription = activity.description
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<u>$1</u>')
      .replace(/\n/g, '<br>');
    
    return (
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: formattedDescription }}
        dir="ltr"
      />
    );
  };

  const renderActivityText = () => {
    if (isEditMode && !isReadOnly) {
      return (
        <RichTextEditor
          value={editedActivity.activityText || ''}
          onChange={(value) => setEditedActivity(prev => ({ ...prev, activityText: value }))}
          placeholder="Enter activity instructions..."
          minHeight="100px"
        />
      );
    }
    
    // If there's activity text, display it
    if (activity.activityText) {
      return (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: activity.activityText }}
          dir="ltr"
        />
      );
    }
    
    return null; // Don't show anything if there's no activity text
  };

  const resources = [
    { label: 'Video', url: isEditMode ? editedActivity.videoLink : activity.videoLink, icon: Video, color: 'text-red-600 bg-red-50 border-red-200', type: 'video' },
    { label: 'Music', url: isEditMode ? editedActivity.musicLink : activity.musicLink, icon: Music, color: 'bg-green-50 border-green-200', type: 'music' },
    { label: 'Backing', url: isEditMode ? editedActivity.backingLink : activity.backingLink, icon: Volume2, color: 'text-blue-600 bg-blue-50 border-blue-200', type: 'backing' },
    { label: 'Resource', url: isEditMode ? editedActivity.resourceLink : activity.resourceLink, icon: FileText, color: 'text-purple-600 bg-purple-50 border-purple-200', type: 'resource' },
    { label: 'Link', url: isEditMode ? editedActivity.link : activity.link, icon: LinkIcon, color: 'text-gray-600 bg-gray-50 border-gray-200', type: 'link' },
    { label: 'Vocals', url: isEditMode ? editedActivity.vocalsLink : activity.vocalsLink, icon: Volume2, color: 'text-orange-600 bg-orange-50 border-orange-200', type: 'vocals' },
    { label: 'Image', url: isEditMode ? editedActivity.imageLink : activity.imageLink, icon: Image, color: 'text-pink-600 bg-pink-50 border-pink-200', type: 'image' },
    { label: 'Canva', url: isEditMode ? editedActivity.canvaLink : activity.canvaLink, icon: Palette, color: 'text-indigo-600 bg-indigo-50 border-indigo-200', type: 'canva' },
  ].filter(resource => resource.url && resource.url.trim());

  const handleResourceClick = (resource: any) => {
    // Open all resources in ResourceViewer modal
    setSelectedResource({
      url: resource.url,
      title: `${activity.activity} - ${resource.label}`,
      type: resource.type
    });
    const url = resource.url;
    
    // Force open in browser window - bypass PWA context
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    
    // Fallback if popup blocked - create temporary link and click it
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      // Add to body temporarily
      document.body.appendChild(link);
      link.click();
      // Remove after click
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    }
  };

  const handleStandardsToggle = (standard: string) => {
    // Allow standards editing even in read-only mode for lesson plans
    if (selectedStandards.includes(standard)) {
      setSelectedStandards(prev => prev.filter(s => s !== standard));
      if (activity.lessonNumber) {
        removeStandardFromLesson(activity.lessonNumber, standard);
        setStandardsLastSaved(new Date());
        // Show brief feedback
        setTimeout(() => setStandardsLastSaved(null), 3000);
      }
    } else {
      setSelectedStandards(prev => [...prev, standard]);
      if (activity.lessonNumber) {
        addStandardToLesson(activity.lessonNumber, standard);
        setStandardsLastSaved(new Date());
        // Show brief feedback
        setTimeout(() => setStandardsLastSaved(null), 3000);
      }
    }
  };

  const handleYearGroupChange = (yearGroup: string, checked: boolean) => {
    setEditedActivity(prev => ({
      ...prev,
      yearGroups: checked 
        ? [...(prev.yearGroups || []), yearGroup]
        : (prev.yearGroups || []).filter(g => g !== yearGroup)
    }));
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <div 
          ref={containerRef}
          className={`bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col modal-content modal-responsive ${
            isFullscreen ? 'fixed inset-0 rounded-none max-w-none max-h-none' : ''
          }`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              {isEditMode && !isReadOnly ? (
                <input
                  type="text"
                  value={editedActivity.activity}
                  onChange={(e) => setEditedActivity(prev => ({ ...prev, activity: e.target.value }))}
                  className="text-xl font-bold text-gray-900 border-b border-gray-300 focus:border-blue-500 focus:outline-none w-full"
                  dir="ltr"
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-900">{activity.activity}</h2>
              )}
              <div className="flex items-center space-x-3 mt-1">
                {isEditMode && !isReadOnly ? (
                  <div className="bg-[#17A697] rounded-lg p-1 shadow-sm">
                    <SimpleNestedCategoryDropdown
                      selectedCategory={editedActivity.category}
                      onCategoryChange={(category) => setEditedActivity(prev => ({ ...prev, category }))}
                      placeholder="Select Category"
                      className="px-3 py-1.5 text-sm font-medium"
                      textColor="white"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-[#2D3748]">{activity.category}</p>
                )}
                {/* Display year groups */}
                {(() => {
                  if (!isEditMode && editedActivity.yearGroups && editedActivity.yearGroups.length > 0) {
                    // Filter out "All" and empty values from year groups
                    const validYearGroups = editedActivity.yearGroups.filter(
                      group => group && group.trim() !== '' && group.toLowerCase() !== 'all'
                    );
                    
                    // Only show if there are valid year groups
                    if (validYearGroups.length === 0) return null;
                    
                    // Create abbreviation function
                    const abbreviate = (label: string) => {
                      if (!label) return label;
                      
                      // Handle comma-separated values (e.g., "EYFS U, Reception")
                      if (label.includes(',')) {
                        return label.split(',').map(part => abbreviate(part.trim())).join(', ');
                      }
                      
                      // Handle old "EYFS U" format → "UKG"
                      if (label === 'EYFS U' || label === 'Upper EYFS' || label.startsWith('EYFS U')) {
                        const parts = label.split(' ');
                        if (parts.length > 2) {
                          const category = parts.slice(2).join(' ').trim();
                          const catAbbr = category ? category.charAt(0) : '';
                          return `UKG ${catAbbr}`.trim();
                        }
                        return 'UKG';
                      }
                      
                      // Handle old "EYFS L" format → "LKG"
                      if (label === 'EYFS L' || label === 'Lower EYFS' || label.startsWith('EYFS L')) {
                        const parts = label.split(' ');
                        if (parts.length > 2) {
                          const category = parts.slice(2).join(' ').trim();
                          const catAbbr = category ? category.charAt(0) : '';
                          return `LKG ${catAbbr}`.trim();
                        }
                        return 'LKG';
                      }
                      
                      // Handle "Lower Kindergarten" → "LKG"
                      if (label.includes('Lower Kindergarten')) {
                        const category = label.replace('Lower Kindergarten', '').trim();
                        const catAbbr = category ? category.charAt(0) : '';
                        return `LKG ${catAbbr}`.trim();
                      }
                      // Handle "Upper Kindergarten" → "UKG"
                      if (label.includes('Upper Kindergarten')) {
                        const category = label.replace('Upper Kindergarten', '').trim();
                        const catAbbr = category ? category.charAt(0) : '';
                        return `UKG ${catAbbr}`.trim();
                      }
                      // Handle "Reception" → "Reception M/D/etc"
                      if (label.includes('Reception')) {
                        const category = label.replace('Reception', '').trim();
                        const catAbbr = category ? category.charAt(0) : '';
                        return `Reception ${catAbbr}`.trim();
                      }
                      // Fallback: return original
                      return label;
                    };
                    
                    return (
                      <div className="flex flex-wrap gap-1">
                        {validYearGroups.map(yearGroup => (
                          <span key={yearGroup} className="px-2 py-1 bg-[#D4F1EF] text-[#17A697] text-xs font-medium rounded-full whitespace-nowrap">
                            {abbreviate(yearGroup)}
                          </span>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
                {/* Edit year groups */}
                {isEditMode && !isReadOnly && (
                  <div 
                    className="space-y-2 max-h-32 overflow-y-auto border border-[#D4F1EF] bg-white rounded-xl p-3 shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                  >
                    {customYearGroups.map(group => (
                      <label 
                        key={group.name} 
                        className="flex items-center space-x-3 cursor-pointer group"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={editedActivity.yearGroups?.includes(group.name) || false}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleYearGroupChange(group.name, e.target.checked);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onMouseUp={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded-full border-2 border-gray-300 text-[#17A697] focus:ring-2 focus:ring-[#17A697] focus:ring-offset-0 cursor-pointer checked:bg-[#17A697] checked:border-[#17A697] transition-all duration-200"
                        />
                        <span className="text-sm text-[#2D3748] group-hover:text-[#17A697] transition-colors duration-200">{group.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Read-only Notice */}
              {isReadOnly && (
                <div className="flex items-center space-x-1 px-3 py-2 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                  <Info className="h-4 w-4" />
                  <span className="text-xs font-medium">Read-only</span>
                </div>
              )}
              
              {!isEditMode && onDelete && !isReadOnly && (
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Delete Activity"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
              {!isEditMode && !isReadOnly && !isLessonBuilderContext && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="Edit Activity"
                >
                  <Edit3 className="h-5 w-5" />
                </button>
              )}
              {!isEditMode && isLessonBuilderContext && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="Edit Activity for Lesson"
                >
                  <Edit3 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => setShowStandardsSelector(!showStandardsSelector)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Standards"
              >
                <Tag className="h-5 w-5" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

        {/* Read-only Information Banner */}
{isReadOnly && (
  <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <div className="flex items-start space-x-3">
      <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm text-blue-700">Read-only mode.</p>
        <p className="text-sm mt-1" style={{color: '#0BA596'}}>
          <span className="font-medium">✓ Switch to Activities tab to edit.</span>
          <br />
          <span className="font-medium">✓ Standards are editable</span>
        </p>
      </div>
    </div>
  </div>
)}

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 min-h-0">
            {/* Standards Selector (conditionally shown) */}
            {showStandardsSelector && activity.lessonNumber && (
              <div className="mb-6">
                <NestedStandardsBrowser lessonNumber={activity.lessonNumber} />
              </div>
            )}

            {/* Time */}
            {(activity.time > 0 || (isEditMode && !isReadOnly)) && (
              <div className="flex items-center space-x-2 mb-4 p-3 bg-[#D4F1EF] rounded-lg border border-[#17A697]/20">
                <Clock className="h-5 w-5 text-[#17A697]" />
                {isEditMode && !isReadOnly ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-[#2D3748]">Duration:</span>
                    <input
                      type="number"
                      value={editedActivity.time}
                      onChange={(e) => setEditedActivity(prev => ({ ...prev, time: parseInt(e.target.value) || 0 }))}
                      className="w-16 px-2 py-1 border border-[#17A697]/30 rounded focus:ring-2 focus:ring-[#17A697] focus:border-[#17A697]"
                      min="0"
                      dir="ltr"
                    />
                    <span className="text-sm font-medium text-[#2D3748]">minutes</span>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-[#2D3748]">
                    Duration: {activity.time} minutes
                  </span>
                )}
              </div>
            )}

            {/* Activity Text - NEW FIELD */}
            {(editedActivity.activityText || (isEditMode && !isReadOnly)) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  <EditableText 
                    id="activity-text-heading" 
                    fallback="Activity"
                  />
                </h3>
                <div className="text-gray-700 leading-relaxed">
                  {renderActivityText()}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                <EditableText 
                  id="activity-description-heading" 
                  fallback="Description"
                />
              </h3>
              <div className="text-gray-700 leading-relaxed">
                {renderDescription()}
              </div>
            </div>

            {/* Unit Name */}
            {(activity.unitName || (isEditMode && !isReadOnly)) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  <EditableText 
                    id="activity-unit-heading" 
                    fallback="Unit"
                  />
                </h3>
                {isEditMode && !isReadOnly ? (
                  <input
                    type="text"
                    value={editedActivity.unitName}
                    onChange={(e) => setEditedActivity(prev => ({ ...prev, unitName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter unit name"
                    dir="ltr"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-700" dir="ltr">{activity.unitName}</p>
                    {onViewUnit && activity.unitName && (
                      <button
                        onClick={() => onViewUnit(activity.unitName)}
                        className="p-1.5 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors"
                        title="View Unit"
                      >
                        <FolderOpen className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Lesson Number */}
            {(activity.lessonNumber || (isEditMode && !isReadOnly)) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  <EditableText 
                    id="activity-lesson-heading" 
                    fallback="Lesson"
                  />
                </h3>
                {isEditMode && !isReadOnly ? (
                  <input
                    type="text"
                    value={editedActivity.lessonNumber}
                    onChange={(e) => setEditedActivity(prev => ({ ...prev, lessonNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter lesson number"
                    dir="ltr"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-700" dir="ltr">Lesson {activity.lessonNumber}</p>
                    {onViewLesson && activity.lessonNumber && (
                      <button
                        onClick={() => onViewLesson(activity.lessonNumber)}
                        className="p-1.5 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors"
                        title="View Lesson"
                      >
                        <BookOpen className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Standards (if any) */}
            {selectedStandards.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-blue-600" />
                  <span>Standards</span>
                  {isReadOnly && (
                    <span className="text-xs bg-[#17A697] text-white px-2 py-1 rounded-full">
                      Editable
                    </span>
                  )}
                </h3>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <ul className="space-y-2">
                    {selectedStandards.map((standard, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-700" dir="ltr">{standard}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Image Upload (only in edit mode and not read-only) */}
            {isEditMode && !isReadOnly && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Activity Image</h3>
                <div className="flex items-center space-x-4">
                  {editedActivity.imageLink ? (
                    <div className="relative">
                      <img 
                        src={editedActivity.imageLink} 
                        alt="Activity" 
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => setEditedActivity(prev => ({ ...prev, imageLink: '' }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      <Image className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">
                      Upload an image for this activity or provide an image URL
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center space-x-1"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Upload</span>
                      </button>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <input
                        type="url"
                        value={editedActivity.imageLink}
                        onChange={(e) => setEditedActivity(prev => ({ ...prev, imageLink: e.target.value }))}
                        placeholder="Or paste image URL"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resources */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                <EditableText 
                  id="activity-resources-heading" 
                  fallback="Resources"
                />
              </h3>
              
              {isEditMode && !isReadOnly ? (
                <div className="space-y-4">
                  {[
                    { key: 'videoLink', label: 'Video URL', icon: Video },
                    { key: 'musicLink', label: 'Music URL', icon: Music },
                    { key: 'backingLink', label: 'Backing Track URL', icon: Volume2 },
                    { key: 'resourceLink', label: 'Resource URL', icon: FileText },
                    { key: 'link', label: 'Additional Link', icon: LinkIcon },
                    { key: 'vocalsLink', label: 'Vocals URL', icon: Volume2 },
                    { key: 'canvaLink', label: 'Canva Design URL', icon: Palette },
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <input
                        type="url"
                        value={editedActivity[key as keyof Activity] as string}
                        onChange={(e) => setEditedActivity(prev => ({ ...prev, [key]: e.target.value }))}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={label}
                        dir="ltr"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {resources.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {resources.map((resource, index) => {
                        const IconComponent = resource.icon;
                        return (
                          <button
                            key={index}
                            onClick={() => handleResourceClick(resource)}
                            className={`flex items-center space-x-2 p-2 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-sm ${resource.color}`}
                          >
                            <IconComponent className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm font-medium truncate" dir="ltr">{resource.label}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        <EditableText 
                          id="activity-no-resources-message" 
                          fallback="No additional resources available"
                        />
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            {isEditMode && !isReadOnly ? (
              <div className="flex justify-between w-full">
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    setEditedActivity({...activity}); // Reset changes
                    setHasUnsavedChanges(false);
                  }}
                  className="px-6 py-2 bg-[#2D3748] hover:bg-[#1a202c] text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <div className="flex space-x-3">
                  {isLessonBuilderContext && (
                    <button
                      onClick={() => {
                        // Add original activity without changes
                        if (onAddActivityToLesson) {
                          onAddActivityToLesson(activity, false);
                        }
                        onClose();
                      }}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Original</span>
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-[#17A697] hover:bg-[#138d7f] text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 shadow-sm"
                  >
                    <Save className="h-4 w-4" />
                    <span>
                      {isLessonBuilderContext 
                        ? (hasUnsavedChanges ? 'Save & Add to Lesson' : 'Add to Lesson')
                        : 'Save Changes'
                      }
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between w-full">
                <div>
                  {onAddToLesson && !isLessonBuilderContext && (
                    <button
                      onClick={onAddToLesson}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add to Lesson</span>
                    </button>
                  )}
                  {isLessonBuilderContext && (
                    <button
                      onClick={() => {
                        if (onAddActivityToLesson) {
                          onAddActivityToLesson(activity, false);
                        }
                        onClose();
                      }}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add to Lesson</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <EditableText 
                      id="activity-close-button" 
                      fallback="Close"
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ResourceViewer Modal */}
      {selectedResource && (
        <ResourceViewer
          url={selectedResource.url}
          title={selectedResource.title}
          type={selectedResource.type}
          onClose={() => setSelectedResource(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && !isReadOnly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Activity</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "{activity.activity}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Activity</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}