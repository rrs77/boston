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

    // Prevent click if target is a button
    if ((e.target as HTMLElement).closest('button')) {
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
      className="relative bg-white border-b border-gray-200 transition-all duration-200 hover:bg-gray-50 group"
      onClick={handleActivityClick}
    >
      <div className="flex items-center py-3 px-4">
        {/* Colored left border */}
        <div 
          className="w-1 h-full absolute left-0 top-0 bottom-0 flex-shrink-0"
          style={{ backgroundColor: categoryColor }}
        />
        
        {/* Drag handle */}
        {isEditing && (
          <div className="flex items-center mr-3 cursor-move text-gray-400 hover:text-gray-600">
            <GripVertical className="h-5 w-5" />
          </div>
        )}
        
        {/* Chevron icon */}
        <div className="flex items-center mr-3 text-gray-400">
          <ChevronRight className="h-5 w-5" />
        </div>
        
        {/* Activity content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-base leading-tight mb-1">
            {activity.activity}
          </h4>
        </div>
        
        {/* Category tag */}
        <div className="mx-3">
          <span 
            className="px-3 py-1 text-white text-xs font-medium rounded-full whitespace-nowrap"
            style={{ backgroundColor: categoryColor }}
          >
            {activity.category}
          </span>
        </div>
        
        {/* Duration */}
        {activity.time > 0 && (
          <div className="flex items-center space-x-1 text-gray-500 mr-3">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">{activity.time}m</span>
          </div>
        )}
        
        {/* Remove button */}
        {isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200"
            title="Remove Activity"
          >
            <X className="h-4 w-4" />
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
  onSave // NEW: Add save functionality
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

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 text-white h-[180px] flex flex-col justify-between" style={{ backgroundColor: '#109D90' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              {/* Lesson Name Input */}
              <input
                type="text"
                value={lessonPlan.title || ''}
                onChange={(e) => onLessonPlanFieldUpdate('title', e.target.value)}
                placeholder="Lesson Name"
                className="w-full text-2xl font-bold text-white border-b border-white border-opacity-30 focus:border-opacity-100 focus:outline-none bg-transparent placeholder-green-100"
              />
              <div className="flex items-center flex-wrap gap-3 mt-2">
                <div className="flex items-center space-x-2 text-white">
                  <span>{lessonPlan.className}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-white">
                  <Clock className="h-4 w-4" />
                  <span>{lessonPlan.duration} minutes</span>
                </div>
                
                <div className="flex items-center space-x-2 text-white">
                  <Users className="h-4 w-4" />
                  <span>{lessonPlan.activities.length} activities</span>
                </div>
              </div>
            </div>
            
            {/* NEW: Save Lesson Button */}
            {onSave && (
              <button
                onClick={onSave}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md ml-4"
              >
                <Save className="h-4 w-4" />
                <span>Save Lesson</span>
              </button>
            )}
          </div>
        </div>

        {/* Drop Zone */}
        <div
          ref={drop}
          className={`p-6 min-h-[400px] transition-colors duration-200 ${
            isOver ? 'bg-gray-50 border-gray-300' : ''
          }`}
        >
          {lessonPlan.activities.length === 0 ? (
            <div className="text-center py-16">
              <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-colors duration-200 ${
                isOver ? 'bg-gray-200' : 'bg-gray-100'
              }`}>
                <Plus className={`h-12 w-12 transition-colors duration-200 ${
                  isOver ? 'text-gray-600' : 'text-gray-400'
                }`} />
              </div>
              <h3 className="text-lg font-medium text-teal-800 mb-2">
                {isOver ? 'Drop activity here' : 'No activities planned'}
              </h3>
              <p className="text-teal-600">
                {isOver 
                  ? 'Release to add this activity to your lesson plan'
                  : 'Select activities from the library to build your lesson plan'
                }
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
              
              {isEditing && (
                <div className="p-4 border-t border-gray-200">
                  <button
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                      isOver 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Activity to Lesson</span>
                  </button>
                </div>
              )}
            </div>
          )}
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