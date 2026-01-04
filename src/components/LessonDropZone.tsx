import React, { useRef, useState } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { 
  Plus, 
  Clock, 
  Users, 
  FileText, 
  GripVertical, 
  Trash2,
  Edit3,
  Save,
  X,
  ChevronRight
} from 'lucide-react';
import { ActivityDetails } from './ActivityDetails'; // Import the modal component
import { useData } from '../contexts/DataContext'; // Import to access updateActivity
import { useSettings } from '../contexts/SettingsContextNew';
import type { Activity } from '../contexts/DataContext';

interface LessonPlan {
  id: string;
  date: Date;
  week: number;
  className: string;
  activities: Activity[];
  duration: number;
  notes: string;
  status: 'planned' | 'completed' | 'cancelled';
}

interface LessonDropZoneProps {
  lessonPlan: LessonPlan;
  onActivityAdd: (activity: Activity) => void;
  onActivityRemove: (index: number) => void;
  onActivityReorder: (dragIndex: number, hoverIndex: number) => void;
  onLessonPlanFieldUpdate: (field: string, value: any) => void; // NEW: Add this for lesson naming
  isEditing: boolean;
  onSave?: () => void; // NEW: Add save lesson functionality
  onAddActivitiesClick?: () => void; // NEW: Callback for opening activity modal
  notes?: string; // NEW: Lesson notes
  onNotesChange?: (notes: string) => void; // NEW: Callback for notes change
}

interface DraggableActivityProps {
  activity: Activity;
  index: number;
  onRemove: () => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
  isEditing: boolean;
  onActivityClick: (activity: Activity) => void; // NEW: Add click handler prop
}

function DraggableActivity({ 
  activity, 
  index, 
  onRemove, 
  onReorder, 
  isEditing,
  onActivityClick // NEW: Receive click handler
}: DraggableActivityProps) {
  const { getCategoryColor } = useSettings();
  const ref = useRef<HTMLDivElement>(null);
  const [isDragStarted, setIsDragStarted] = useState(false);

  const [{ handlerId }, drop] = useDrop({
    accept: 'lesson-activity',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: { index: number }, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      onReorder(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'lesson-activity',
    item: () => {
      setIsDragStarted(true);
      return { index };
    },
    end: () => {
      // Reset drag state after a delay to prevent click from firing
      setTimeout(() => setIsDragStarted(false), 100);
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

  // NEW: Handle activity click with drag prevention
  const handleActivityClick = (e: React.MouseEvent) => {
    // Prevent click if we just finished dragging
    if (isDragStarted) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Prevent click if target is a button or drag handle
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-drag-handle]')) {
      return;
    }

    e.stopPropagation();
    onActivityClick(activity);
  };

  const categoryColor = getCategoryColor(activity.category);

  return (
    <div
      ref={ref}
      style={{ opacity }}
      data-handler-id={handlerId}
      className="relative bg-white transition-all duration-200 hover:bg-gray-50 group cursor-move"
      onClick={handleActivityClick}
    >
      <div className="flex items-center py-2.5 px-4">
        {/* Colored left border */}
        <div 
          className="w-1 h-full absolute left-0 top-0 bottom-0 flex-shrink-0"
          style={{ backgroundColor: categoryColor }}
        />
        
        {/* Drag handle */}
        {isEditing && (
          <div 
            data-drag-handle
            className="flex items-center mr-2 cursor-move text-gray-400 hover:text-gray-600"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        
        {/* Activity content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm leading-tight">
            {activity.activity}
          </h4>
        </div>
        
        {/* Category tag */}
        <div className="mx-2">
          <span 
            className="px-2 py-0.5 text-white text-xs font-medium rounded-full whitespace-nowrap"
            style={{ backgroundColor: categoryColor }}
          >
            {activity.category}
          </span>
        </div>
        
        {/* Duration */}
        {activity.time > 0 && (
          <div className="flex items-center space-x-1 text-gray-500 mr-2">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{activity.time}m</span>
          </div>
        )}
        
        {/* Remove button */}
        {isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200 opacity-0 group-hover:opacity-100"
            title="Remove Activity"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function LessonDropZone({
  lessonPlan,
  onActivityAdd,
  onActivityRemove,
  onActivityReorder,
  onLessonPlanFieldUpdate, // NEW: Add this prop
  isEditing,
  onSave, // NEW: Add save functionality
  onAddActivitiesClick, // NEW: Add activities button callback
  notes, // NEW: Lesson notes
  onNotesChange // NEW: Notes change callback
}: LessonDropZoneProps) {
  // NEW: Add modal state management and activity editing
  const { updateActivity, deleteActivity } = useData(); // Access data context functions
  const { mapActivityLevelToYearGroup } = useSettings();
  const [selectedActivityDetails, setSelectedActivityDetails] = useState<Activity | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [initialResource, setInitialResource] = useState<{url: string, title: string, type: string} | null>(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['activity', 'activity-stack'],
    drop: (item: { activity: Activity } | { stack: any }) => {
      if ('activity' in item) {
        onActivityAdd(item.activity);
      } else if ('stack' in item) {
        // Handle stack drop - add all activities from the stack
        const stack = item.stack;
        stack.activities.forEach((activity: Activity) => {
          onActivityAdd(activity);
        });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  // NEW: Handle activity click to open modal
  const handleViewActivityDetails = (activity: Activity, initialResource?: {url: string, title: string, type: string}) => {
    setSelectedActivityDetails(activity);
    if (initialResource) {
      setInitialResource(initialResource);
    } else {
      setInitialResource(null);
    }
  };

  // NEW: Handle activity update
  const handleActivityUpdate = async (updatedActivity: Activity) => {
    try {
      // Convert old level names to new year group names
      updatedActivity.level = mapActivityLevelToYearGroup(updatedActivity.level);
      
      await updateActivity(updatedActivity);
      setEditingActivity(null);
      setSelectedActivityDetails(null);
    } catch (error) {
      console.error('Failed to update activity:', error);
      alert('Failed to update activity. Please try again.');
    }
  };

  // NEW: Handle edit activity - this enables edit mode
  const handleEditActivity = () => {
    if (selectedActivityDetails) {
      // Convert old level names to new year group names
      const activity = { ...selectedActivityDetails };
      activity.level = mapActivityLevelToYearGroup(activity.level);
      
      setEditingActivity(activity);
    }
  };

  // NEW: Handle resource click
  const handleResourceClick = (url: string, title: string, type: string) => {
    setInitialResource({url, title, type});
  };

  const hasActivities = lessonPlan.activities.length > 0;
  const headerPadding = hasActivities ? 'p-4' : 'p-6';
  const headerCompact = hasActivities;

  return (
    <>
      <div className="bg-white rounded-card shadow-soft border border-gray-200 overflow-hidden" style={{ background: 'linear-gradient(to right, #14B8A6, #0D9488)' }}>
        {/* Header - Thinner when activities are present */}
        <div className={`${headerPadding} text-white transition-all duration-200`}>
          <div className={`flex items-start justify-between ${headerCompact ? 'mb-2' : 'mb-4'}`}>
            <div className="flex-1">
              {/* Your Lesson Title */}
              <h2 className={`text-white font-semibold mb-2 ${headerCompact ? 'text-sm' : 'text-base'}`} style={{ opacity: 0.9 }}>
                Your Lesson
              </h2>
              {/* Lesson Name Input */}
              <input
                type="text"
                value={lessonPlan.title || ''}
                onChange={(e) => onLessonPlanFieldUpdate('title', e.target.value)}
                placeholder="Lesson Name"
                className={`w-full font-bold text-white border-b border-white border-opacity-30 focus:border-opacity-100 focus:outline-none bg-transparent placeholder-green-100 ${headerCompact ? 'text-xl mb-1.5' : 'text-2xl mb-3'}`}
              />
              <div className={`flex items-center flex-wrap gap-4 ${headerCompact ? 'mt-1.5' : 'mt-2'}`}>
                <div className="flex items-center space-x-2 text-white text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{lessonPlan.duration} minutes</span>
                </div>
                
                <div className="flex items-center space-x-2 text-white text-sm">
                  <Users className="h-4 w-4" />
                  <span>{lessonPlan.activities.length} activities</span>
                </div>
              </div>
            </div>
            
            {/* Save Lesson Button */}
            {onSave && (
              <button
                onClick={onSave}
                className={`${headerCompact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md ml-4`}
              >
                <Save className={headerCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                <span>Save Lesson</span>
              </button>
            )}
          </div>

          {/* Lesson Notes - Integrated into header - Only show when no activities or explicitly requested */}
          {onNotesChange !== undefined && (!hasActivities || notes) && (
            <div className={headerCompact ? 'mt-2' : 'mt-4'}>
              <label className={`block font-medium text-white opacity-90 ${headerCompact ? 'text-xs mb-1' : 'text-sm mb-2'}`}>
                Lesson Notes & Additional Information
              </label>
              <textarea
                value={notes || ''}
                onChange={(e) => onNotesChange(e.target.value)}
                className={`w-full px-3 py-2 border border-white border-opacity-30 rounded-lg bg-white bg-opacity-10 backdrop-blur-sm text-white placeholder-green-100 resize-none ${headerCompact ? 'text-xs' : 'text-sm'}`}
                style={{ minHeight: headerCompact ? '40px' : '60px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
                placeholder="Add notes, instructions, or additional information about these activities and how they work together in this lesson..."
              />
            </div>
          )}
        </div>

        {/* Activities Section - Integrated */}
        <div className="bg-white">
          {/* Add Activities Button - Slim */}
          {isEditing && onAddActivitiesClick && (
            <div className={`${hasActivities ? 'px-4 py-2' : 'px-6 py-3'} border-b border-gray-200 flex items-center justify-between`}>
              <div className="flex items-center space-x-2">
                <Plus className={`${hasActivities ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-teal-600`} />
                <span className={`${hasActivities ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>Activities</span>
                {lessonPlan.activities.length > 0 && (
                  <span className="text-xs text-gray-500">({lessonPlan.activities.length})</span>
                )}
              </div>
              <button
                onClick={onAddActivitiesClick}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Activities</span>
              </button>
            </div>
          )}

          {/* Drop Zone */}
          <div
            ref={drop}
            className={`transition-colors duration-200 ${
              isOver ? 'bg-gray-50' : ''
            }`}
          >
            {lessonPlan.activities.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className={`mx-auto w-16 h-16 rounded-button flex items-center justify-center mb-3 transition-colors duration-200 ${
                  isOver ? 'bg-teal-100' : 'bg-gray-100'
                }`}>
                  <Plus className={`h-8 w-8 transition-colors duration-200 ${
                    isOver ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                </div>
                <h3 className="text-base font-medium text-gray-700 mb-1">
                  {isOver ? 'Drop activity here' : 'No activities added'}
                </h3>
                <p className="text-sm text-gray-500">
                  {isOver 
                    ? 'Release to add this activity'
                    : 'Add an activity to get started'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {lessonPlan.activities.map((activity, index) => (
                  <DraggableActivity
                    key={activity._uniqueId || `${activity._id || activity.id || activity.activity}-${index}`}
                    activity={activity}
                    index={index}
                    onRemove={() => onActivityRemove(index)}
                    onReorder={onActivityReorder}
                    isEditing={isEditing}
                    onActivityClick={handleViewActivityDetails}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* NEW: Activity Details Modal */}
      {selectedActivityDetails && (
        <ActivityDetails
          activity={selectedActivityDetails}
          onClose={() => {
            setSelectedActivityDetails(null);
            setEditingActivity(null);
            setInitialResource(null);
          }}
          onAddToLesson={undefined} // No "Add to Lesson" button needed - already in lesson
          isEditing={editingActivity !== null && selectedActivityDetails === editingActivity}
          onUpdate={handleActivityUpdate}
          onEdit={handleEditActivity} // This should trigger edit mode
          initialResource={initialResource}
          onDelete={deleteActivity}
        />
      )}
    </>
  );
}