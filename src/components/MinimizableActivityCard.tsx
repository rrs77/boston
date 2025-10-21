import React, { useState, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { X, ChevronRight, ChevronDown, GripVertical, Clock } from 'lucide-react';
import { Activity } from '../types';
import { useSettings } from '../contexts/SettingsContextNew';

interface MinimizableActivityCardProps {
  activity: Activity;
  index: number;
  onRemove: (index: number) => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
  onActivityClick?: (activity: Activity) => void;
}

export function MinimizableActivityCard({ 
  activity, 
  index, 
  onRemove, 
  onReorder,
  onActivityClick 
}: MinimizableActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [isDragStarted, setIsDragStarted] = useState(false);
  const { getCategoryColor } = useSettings();

  // Set up drag and drop
  const [{ handlerId }, drop] = useDrop({
    accept: 'editable-activity',
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
    type: 'editable-activity',
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

  // Handle activity click with drag prevention
  const handleActivityClick = (e: React.MouseEvent) => {
    if (isDragStarted) {
      e.preventDefault();
      return;
    }
    
    // Don't expand if clicking on action buttons or drag handle
    if ((e.target as HTMLElement).closest('button') || 
        (e.target as HTMLElement).closest('[class*="cursor-move"]')) {
      return;
    }
    
    // Always toggle expansion when clicking on the card
    setIsExpanded(!isExpanded);
    
    // Also call the optional activity click handler if provided
    if (onActivityClick) {
      onActivityClick(activity);
    }
  };

  // Render HTML content safely
  const renderHtmlContent = (htmlString: string) => {
    if (!htmlString) return '';
    return { __html: htmlString };
  };

  // Get category color from settings
  const categoryColor = getCategoryColor(activity.category) || '#6B7280';

  return (
    <div
      ref={ref}
      className={`bg-white rounded-lg border-l-4 shadow-sm transition-all duration-200 hover:shadow-md ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{ borderLeftColor: categoryColor, opacity }}
    >
      {/* Minimized Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleActivityClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Drag Handle */}
            <div className="flex-shrink-0 text-gray-400 hover:text-gray-600 cursor-move">
              <GripVertical className="h-5 w-5" />
            </div>
            
            {/* Expand/Collapse Icon */}
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </div>
            
            {/* Activity Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-base truncate">
                {activity.activity}
              </h4>
              <div className="flex items-center space-x-3 mt-1">
                <span 
                  className="text-sm px-2 py-1 rounded-full font-medium text-white"
                  style={{ backgroundColor: categoryColor }}
                >
                  {activity.category}
                </span>
                {activity.time > 0 && (
                  <span className="text-sm text-gray-600 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {activity.time}m
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Delete Button */}
          <div className="flex items-center ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete activity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="pt-4">
            <div 
              className="text-sm text-gray-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={renderHtmlContent(activity.description)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
