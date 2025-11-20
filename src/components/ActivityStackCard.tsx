import React, { useState } from 'react';
import { 
  Clock, 
  Tag, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Trash2, 
  Plus,
  Minus,
  Layers,
  MoreVertical
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContextNew';
import { useDrag } from 'react-dnd';
import type { Activity, ActivityStack } from '../contexts/DataContext';

interface ActivityStackCardProps {
  stack: ActivityStack;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (stack: ActivityStack) => void;
  onDelete: (stackId: string) => void;
  onAddActivities: (stackId: string) => void;
  onRemoveActivity: (stackId: string, activityId: string) => void;
  onUnstack: (stackId: string) => void;
  onOpenStack?: (stack: ActivityStack) => void; // New prop to open stack activities
  draggable?: boolean;
  onActivityClick?: (activity: Activity) => void;
  selectable?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (stackId: string, selected: boolean) => void;
}

export function ActivityStackCard({
  stack,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddActivities,
  onRemoveActivity,
  onUnstack,
  onOpenStack,
  draggable = true,
  onActivityClick,
  selectable = false,
  isSelected = false,
  onSelectionChange
}: ActivityStackCardProps) {
  const { getCategoryColor } = useSettings();
  const [showMenu, setShowMenu] = useState(false);
  
  const categoryColor = getCategoryColor(stack.category || '');
  const totalTime = stack.activities.reduce((sum, activity) => sum + (activity.time || 0), 0);

  // Drag and drop for the entire stack
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'activity-stack',
    item: { stack },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: draggable,
  }), [stack, draggable]);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.stack-menu-container')) {
          setShowMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(stack);
    setShowMenu(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(stack.id);
    setShowMenu(false);
  };

  const handleAddActivities = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddActivities(stack.id);
    setShowMenu(false);
  };

  const handleUnstack = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUnstack(stack.id);
    setShowMenu(false);
  };

  if (isExpanded) {
    return (
      <div 
        ref={drag}
        className={`bg-white rounded-xl shadow-lg border border-gray-200 p-4 ${
          isDragging ? 'opacity-50' : ''
        }`}
        style={{ borderColor: categoryColor }}
      >
        {/* Expanded Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: categoryColor }}
            />
            <h3 className="font-bold text-lg text-gray-800">{stack.name}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{totalTime} min</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {selectable && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  if (onSelectionChange) {
                    onSelectionChange(stack.id, e.target.checked);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 text-gray-600 bg-white border-gray-300 rounded-full focus:ring-gray-500 focus:ring-opacity-50 appearance-none checked:bg-gray-600 checked:border-gray-600"
              />
            )}
            <button
              onClick={onToggleExpand}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Collapse stack"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            
            <div className="relative">
              <button
                onClick={handleMenuToggle}
                className="p-2 hover:bg-gray-100 rounded-lg "
                title="Stack options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-3 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-[100] transform translate-y-2">
                  <button
                    onClick={handleEdit}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit Stack</span>
                  </button>
                  <button
                    onClick={handleAddActivities}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Activities</span>
                  </button>
                  <button
                    onClick={handleUnstack}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Layers className="h-4 w-4" />
                    <span>Unstack Activities</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Stack</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stack Description */}
        {stack.description && (
          <p className="text-gray-600 text-sm mb-4">{stack.description}</p>
        )}

        {/* Activities List */}
        <div className="space-y-2">
          {stack.activities.map((activity, index) => (
            <div
              key={activity._id || activity.id || index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <div className="flex items-center space-x-3 flex-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getCategoryColor(activity.category) }}
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{activity.activity}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{activity.time || 0} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Tag className="h-3 w-3" />
                      <span>{activity.category}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {onActivityClick && (
                  <button
                    onClick={() => onActivityClick(activity)}
                    className="p-1 hover:bg-gray-200 rounded "
                    title="View activity details"
                  >
                    <Edit3 className="h-4 w-4 text-gray-600" />
                  </button>
                )}
                <button
                  onClick={() => onRemoveActivity(stack.id, activity._id || activity.id || '')}
                  className="p-1 hover:bg-red-100 rounded "
                  title="Remove from stack"
                >
                  <Minus className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Collapsed Stack View - Compact Design
  return (
    <div 
      ref={drag}
      className={`bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer group ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={() => onOpenStack ? onOpenStack(stack) : onToggleExpand()}
    >
      {/* Header with stack indicator */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: categoryColor }}
            />
            <h3 className="font-semibold text-sm text-gray-800 truncate">{stack.name}</h3>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {stack.activities.length}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMenuToggle(e);
              }}
              className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Stack options"
            >
              <MoreVertical className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{totalTime}m</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{stack.activities.length} activities</span>
            </div>
          </div>
        </div>
        
        {/* Categories - compact */}
        <div className="flex flex-wrap gap-1 mb-2">
          {Array.from(new Set(stack.activities.map(a => a.category))).slice(0, 2).map((category: string) => (
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
          {stack.activities.length > 2 && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
              +{stack.activities.length - 2}
            </span>
          )}
        </div>
        
        {/* Description or activity preview */}
        <p className="text-xs text-gray-500 truncate">
          {stack.description || `${stack.activities.length} activities combined`}
        </p>
      </div>

      {/* Menu dropdown */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-3 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-[100] transform translate-y-2">
          <button
            onClick={handleEdit}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit Stack</span>
          </button>
          <button
            onClick={handleAddActivities}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Activities</span>
          </button>
          <button
            onClick={handleUnstack}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
          >
            <Layers className="h-4 w-4" />
            <span>Unstack Activities</span>
          </button>
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Stack</span>
          </button>
        </div>
      )}
    </div>
  );
}
