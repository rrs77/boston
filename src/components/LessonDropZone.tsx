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
  X
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
      className="bg-white rounded-lg border-2 border-gray-200 p-4 transition-all duration-200 hover:shadow-md group cursor-pointer"
      onClick={handleActivityClick} // NEW: Add click handler
    >
      <div className="flex items-start space-x-3">
        {isEditing && (
          <div className="flex flex-col space-y-1 pt-1">
            <div className="cursor-move text-gray-400 hover:text-gray-600">
              <GripVertical className="h-5 w-5" />
            </div>
          </div>
        )}
        
        <div 
          className="w-1 h-full rounded-full flex-shrink-0"
          style={{ backgroundColor: categoryColor, minHeight: '60px' }}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-base leading-tight">
                {activity.activity}
              </h4>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-sm text-gray-600">{activity.category}</span>
                {activity.level && (
                  <span 
                    className="px-2 py-1 text-white text-xs font-medium rounded-full"
                    style={{ backgroundColor: categoryColor }}
                  >
                    {activity.level}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-3">
              {activity.time > 0 && (
                <div className="flex items-center space-x-1 text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">{activity.time}m</span>
                </div>
              )}
              

              
              {isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200 opacity-0 group-hover:opacity-100"
                  title="Remove Activity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          {activity.description && (
            <div 
              className="text-sm text-gray-600 leading-relaxed line-clamp-2"
              dangerouslySetInnerHTML={{ __html: activity.description }}
            />
          )}
        </div>
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
            <div className="space-y-4">
              {lessonPlan.activities.map((activity, index) => (
                <DraggableActivity
                  key={`${activity.activity}-${index}`}
                  activity={activity}
                  index={index}
                  onRemove={() => onActivityRemove(index)}
                  onReorder={onActivityReorder}
                  isEditing={isEditing}
                  onActivityClick={handleViewActivityDetails} // NEW: Pass click handler
                />
              ))}
              
              {isEditing && (
                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                  isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <Plus className={`h-8 w-8 mx-auto mb-2 transition-colors duration-200 ${
                    isOver ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <p className={`font-medium transition-colors duration-200 ${
                    isOver ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {isOver ? 'Drop to add activity' : 'Select more activities to add to your lesson.'}
                  </p>
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