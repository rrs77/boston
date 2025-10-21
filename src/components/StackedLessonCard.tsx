import React, { useState, useRef, useEffect } from 'react';
import { Clock, Users, Edit3, Layers, X, MoreVertical, ChevronDown, ChevronUp, Calendar, Trash2, Settings } from 'lucide-react';
import type { LessonData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';

interface StackedLesson {
  id: string;
  name: string;
  description?: string;
  color: string;
  lessons: string[];
  totalTime: number;
  totalActivities: number;
  created_at: string;
}

interface StackedLessonCardProps {
  stack: StackedLesson;
  allLessonsData: Record<string, LessonData>;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
  };
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRename?: (newName: string) => void;
  onAssignToTerm?: (stackId: string) => void;
  viewMode: 'grid' | 'list' | 'compact' | 'activity-stack-style';
  isExpanded?: boolean;
  onToggleExpansion?: () => void;
}

export function StackedLessonCard({
  stack,
  allLessonsData,
  theme: _theme,
  onClick,
  onEdit,
  onDelete,
  onRename,
  onAssignToTerm,
  viewMode,
  isExpanded = false,
  onToggleExpansion
}: StackedLessonCardProps) {
  const { getCategoryColor } = useSettings();
  
  // State for menu and rename functionality
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(stack.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  
  // Debug: Log the expansion state
  console.log(`🔍 StackedLessonCard ${stack.id} isExpanded:`, isExpanded);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);
  
  // Focus input when renaming starts
  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);
  
  // Handle rename
  const handleRename = () => {
    if (newName.trim() && newName !== stack.name && onRename) {
      onRename(newName.trim());
    }
    setIsRenaming(false);
    setShowMenu(false);
  };
  
  // Handle menu actions
  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    
    switch (action) {
      case 'edit':
        onEdit?.();
        break;
      case 'rename':
        setIsRenaming(true);
        setNewName(stack.name);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete "${stack.name}"?`)) {
          onDelete?.();
        }
        break;
      case 'assign':
        onAssignToTerm?.(stack.id);
        break;
    }
  };

  // Get lesson data for the stack
  const stackLessons = stack.lessons
    .map(lessonNum => ({
      number: lessonNum,
      data: allLessonsData[lessonNum]
    }))
    .filter(lesson => lesson.data)
    .slice(0, 4); // Show max 4 lessons in the stack

  // Debug logging for stacked lesson card
  console.log('🔍 StackedLessonCard Debug:', {
    stackId: stack.id,
    stackName: stack.name,
    stackLessons: stack.lessons,
    stackLessonsLength: stackLessons.length,
    allLessonsDataKeys: Object.keys(allLessonsData),
    stackLessonsData: stackLessons.map(lesson => ({
      number: lesson.number,
      hasData: !!lesson.data,
      dataKeys: lesson.data ? Object.keys(lesson.data) : []
    }))
  });

  // Calculate total categories across all lessons
  const allCategories = new Set<string>();
  stackLessons.forEach(lesson => {
    if (lesson.data.categoryOrder) {
      lesson.data.categoryOrder.forEach(category => allCategories.add(category));
    }
  });

  const handleActionClick = (e: React.MouseEvent, action: 'edit' | 'delete') => {
    e.stopPropagation();
    if (action === 'edit' && onEdit) {
      onEdit();
    } else if (action === 'delete' && onDelete) {
      onDelete();
    }
  };

  // Safety check - if no valid lessons, show empty state
  if (stackLessons.length === 0) {
    console.warn(`⚠️ StackedLessonCard: No valid lessons found for stack ${stack.name}`);
    return (
      <div className="relative group cursor-pointer h-60">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 h-full flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Layers className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No valid lessons in this stack</p>
            <p className="text-xs text-gray-400">Stack: {stack.name}</p>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'activity-stack-style') {
    // Activity Stack Style - Compact horizontal cards matching activity stacks exactly
    return (
      <div 
        className="bg-gray-100 rounded-lg shadow-sm border-2 border-gray-200 hover:border-teal-300 hover:shadow-md transition-all duration-200 cursor-pointer group relative"
        onClick={onClick}
      >
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <Layers className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0 bg-teal-500"
              />
              {isRenaming ? (
                <input
                  ref={renameInputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRename();
                    } else if (e.key === 'Escape') {
                      setIsRenaming(false);
                      setNewName(stack.name);
                    }
                  }}
                  className="font-bold text-sm text-gray-800 bg-transparent border-b border-gray-300 px-1 py-0.5 min-w-0 flex-1"
                  style={{ width: `${Math.max(newName.length * 8, 60)}px` }}
                />
              ) : (
                <h3 className="font-bold text-sm text-gray-800 truncate">{stack.name}</h3>
              )}
            </div>
            
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <Users className="h-3 w-3" />
                <span>{stack.lessons.length} lessons</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <Clock className="h-3 w-3" />
                <span>{stack.totalTime} min</span>
              </div>
              
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Stack options"
                >
                  <MoreVertical className="h-3 w-3" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 top-6 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuAction('edit');
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit Stack</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuAction('rename');
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Settings className="h-3 w-3" />
                      <span>Rename</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuAction('assign');
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Calendar className="h-3 w-3" />
                      <span>Assign to Term</span>
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuAction('delete');
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
              
              {onToggleExpansion && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('🔄 Toggle button clicked for stack:', stack.id, 'current isExpanded:', isExpanded);
                    if (onToggleExpansion) {
                      onToggleExpansion();
                    }
                  }}
                  className="p-1 hover:bg-gray-200 rounded opacity-100 transition-opacity"
                  title={isExpanded ? "Collapse stack" : "Expand stack"}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Expanded content section */}
        {isExpanded && (
          <div className="px-3 pb-3 border-t border-gray-200 bg-gray-50">
            <div className="pt-3">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Lessons in this stack:</h4>
              <div className="space-y-2">
                {stackLessons.map((lesson, index) => (
                  <div key={lesson.number} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-600">#{lesson.number}</span>
                      <span className="text-xs text-gray-800">{lesson.data.title || `Lesson ${lesson.number}`}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{lesson.data.totalTime || 0} min</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'compact') {
    return (
      <div 
        className="relative group cursor-pointer"
        onClick={onClick}
      >
        {/* Stacked visual effect */}
        <div className="relative">
          {stackLessons.map((lesson, index) => (
            <div
              key={lesson.number}
              className="absolute bg-white rounded-lg shadow-sm border-l-4 p-3 transition-all duration-200 hover:shadow-md"
              style={{
                borderLeftColor: stack.color,
                transform: `translate(${index * 2}px, ${index * 2}px)`,
                zIndex: stackLessons.length - index,
                width: '100%',
                height: '100%'
              }}
            >
              <div className="flex items-center justify-between h-full">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Layers className="h-3 w-3 text-gray-500" />
                    <h4 className="font-medium text-gray-900 text-sm truncate" dir="ltr">
                      {index === 0 ? stack.name : `Lesson ${lesson.number}`}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{lesson.data.totalTime} mins</span>
                    <span>•</span>
                    <span>{Object.values(lesson.data.grouped).reduce((sum: number, acts: any) => sum + acts.length, 0)} activities</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="absolute top-0 right-0 h-full flex items-center pr-2 z-20">
            <div className="flex items-center space-x-2">
              {onEdit && (
                <button
                  onClick={(e) => handleActionClick(e, 'edit')}
                  className="p-2 btn-primary text-white rounded-lg shadow-sm flex items-center space-x-1"
                  title="Edit Stack"
                >
                  <Edit3 className="h-4 w-4" />
                  <span className="text-xs">Edit</span>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => handleActionClick(e, 'delete')}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm flex items-center space-x-1"
                  title="Delete Stack"
                >
                  <X className="h-4 w-4" />
                  <span className="text-xs">Delete</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div 
        className="relative group cursor-pointer"
        onClick={onClick}
      >
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 transition-all duration-200 hover:shadow-lg hover:border-blue-300">
          <div className="flex items-start">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mr-4"
              style={{ backgroundColor: stack.color }}
            >
              <Layers className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 text-base truncate" dir="ltr">{stack.name}</h4>
                <span className="text-sm text-gray-500">{stack.lessons.length} lessons</span>
              </div>
              
              <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{stack.totalTime} mins</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>{stack.totalActivities} activities</span>
                </div>
              </div>
              
              <p className="mt-2 text-sm text-gray-600 line-clamp-1" dir="ltr">
                {stack.description || `${stack.lessons.length} lessons combined into a cohesive unit`}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="absolute top-2 right-2 flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={(e) => handleActionClick(e, 'edit')}
                className="p-2 btn-primary text-white rounded-lg shadow-sm flex items-center space-x-1"
                title="Edit Stack"
              >
                <Edit3 className="h-4 w-4" />
                <span className="text-xs">Edit</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => handleActionClick(e, 'delete')}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm flex items-center space-x-1"
                title="Delete Stack"
              >
                <X className="h-4 w-4" />
                <span className="text-xs">Delete</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default grid view with stacking effect
  console.log('🎨 Rendering StackedLessonCard grid view for:', stack.name);
  
  return (
    <div 
      className="relative group cursor-pointer h-60"
      onClick={onClick}
      style={{ minHeight: '240px' }} // Ensure minimum height
    >
      {/* Stacked visual effect */}
      <div className="relative h-full">
        {stackLessons.map((lesson, index) => {
          console.log(`🎨 Rendering stacked lesson ${index}:`, {
            lessonNumber: lesson.number,
            hasData: !!lesson.data,
            index,
            isMainCard: index === 0
          });
          
          return (
          <div
            key={lesson.number}
            className={`absolute bg-white rounded-xl shadow-lg border transition-all duration-300 overflow-hidden hover:scale-[1.02] ${
              index === 0 ? 'h-full' : 'h-[calc(100%-12px)]'
            }`}
            style={{
              borderColor: stack.color,
              borderWidth: '2px',
              transform: `translate(${index * 12}px, ${index * 12}px) rotate(${index * 2}deg)`,
              zIndex: stackLessons.length - index,
              width: '100%'
            }}
          >
            {index === 0 ? (
              // Main card (top of stack)
              <>
                {/* Colorful Header */}
                <div className="p-4 text-gray-900 relative">
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold flex items-center space-x-2">
                        <Layers className="h-5 w-5" />
                        <span>{stack.name}</span>
                      </h3>
                    </div>
                    <p className="text-white text-opacity-90 text-sm font-medium" dir="ltr">
                      {stack.description || `${stack.lessons.length} lessons combined`}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-grow flex flex-col">
                  <div className="flex items-center space-x-4 text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{stack.totalTime} mins</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{stack.totalActivities} activities</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Layers className="h-4 w-4" />
                      <span className="text-sm">{stack.lessons.length} lessons</span>
                    </div>
                  </div>
                  
                  {/* Categories */}
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {Array.from(allCategories).slice(0, 4).map((category: string) => (
                        <span
                          key={category}
                          className="px-2 py-1 rounded-full text-sm font-medium border shadow-sm"
                          style={{
                            backgroundColor: `${getCategoryColor(category)}20`,
                            color: getCategoryColor(category),
                            borderColor: `${getCategoryColor(category)}40`
                          }}
                        >
                          {category}
                        </span>
                      ))}
                      {allCategories.size > 4 && (
                        <span className="px-2 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200 shadow-sm">
                          +{allCategories.size - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Click to open hint */}
                  <div className="mt-auto pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                      Click to open all lessons
                    </p>
                  </div>
                </div>
              </>
            ) : (
              // Background cards (cosmetic layers showing lessons behind)
              <div className="p-3 h-full flex items-center justify-center">
                <div className="text-center">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2 shadow-lg"
                    style={{ 
                      backgroundColor: '#14B8A6'
                    }}
                  >
                    {lesson.number}
                  </div>
                  <p className="text-sm text-gray-700 font-medium">Lesson {lesson.number}</p>
                  <p className="text-xs text-gray-500">{lesson.data.totalTime}m</p>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {lesson.data.title || `Lesson ${lesson.number}`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div className="absolute top-2 right-2 z-20 flex items-center space-x-2">
          {onEdit && (
            <button
              onClick={(e) => handleActionClick(e, 'edit')}
              className="p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg shadow-sm text-teal-600 hover:text-teal-800 transition-colors"
              title="Edit Stack"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => handleActionClick(e, 'delete')}
              className="p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg shadow-sm text-red-600 hover:text-red-800 transition-colors"
              title="Delete Stack"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
