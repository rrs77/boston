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
      className={`relative bg-white border-b border-gray-200 transition-all duration-200 hover:bg-gray-50 ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{ opacity }}
    >
      {/* Colored left border */}
      <div 
        className="w-1 h-full absolute left-0 top-0 bottom-0 flex-shrink-0"
        style={{ backgroundColor: categoryColor }}
      />
      
      {/* Activity Row */}
      <div 
        className="flex items-center py-3 px-4"
        onClick={handleActivityClick}
      >
        {/* Drag handle */}
        <div className="flex items-center mr-3 cursor-move text-gray-400 hover:text-gray-600">
          <GripVertical className="h-5 w-5" />
        </div>
        
        {/* Chevron icon */}
        <div className="flex items-center mr-3 text-gray-400">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200"
          title="Remove Activity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
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
