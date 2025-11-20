import React, { useState, useRef, useEffect } from 'react';
import { 
  Clock, 
  Video, 
  Music, 
  FileText, 
  Link as LinkIcon, 
  Image, 
  Volume2, 
  Save, 
  X, 
  GripVertical,
  Trash2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Tag,
  Edit3
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContextNew';
import { useDrag } from 'react-dnd';
import { RichTextEditor } from './RichTextEditor';
import type { Activity } from '../contexts/DataContext';

interface ActivityCardProps {
  activity: Activity;
  onUpdate?: (updatedActivity: Activity) => void;
  onDelete?: (activityId: string) => void;
  onDuplicate?: (activity: Activity) => void;
  isEditing?: boolean;
  onEditToggle?: () => void;
  categoryColor?: string;
  viewMode?: 'compact' | 'detailed' | 'minimal' | 'grid';
  onResourceClick?: (url: string, title: string, type: string) => void;
  onActivityClick?: (activity: Activity) => void;
  draggable?: boolean;
  selectable?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (activityId: string, selected: boolean) => void;
}

// Character limit for truncated description
const DESCRIPTION_CHAR_LIMIT = 150;

export function ActivityCard({ 
  activity, 
  onUpdate, 
  onDelete, 
  onDuplicate, 
  isEditing = false, 
  onEditToggle,
  categoryColor,
  viewMode = 'detailed',
  onResourceClick,
  onActivityClick,
  draggable = false,
  selectable = false,
  isSelected = false,
  onSelectionChange
}: ActivityCardProps) {
  const { getCategoryColor, categories } = useSettings();
  const [editedActivity, setEditedActivity] = useState<Activity>(activity);
  const [showResources, setShowResources] = useState(false);
  
  // Normalize category name to match what's in the categories list (same logic as dropdown)
  const getNormalizedCategoryName = (categoryName: string) => {
    if (!categoryName) return categoryName;
    // Try exact match first
    const exactMatch = categories.find(c => c.name === categoryName);
    if (exactMatch) return exactMatch.name;
    // Try case-insensitive match
    const caseInsensitiveMatch = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    if (caseInsensitiveMatch) return caseInsensitiveMatch.name;
    // Return original if no match found (might be a deleted/renamed category)
    return categoryName;
  };
  
  const normalizedCategory = getNormalizedCategoryName(activity.category);
  // Removed isExpanded state - always use modal instead

  // Set up drag and drop
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'activity',
    item: { activity },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: () => draggable
  }), [activity, draggable]);
  
  useEffect(() => {
    setEditedActivity(activity);
  }, [activity]);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedActivity);
    }
    if (onEditToggle) {
      onEditToggle();
    }
  };

  const handleCancel = () => {
    setEditedActivity(activity);
    if (onEditToggle) {
      onEditToggle();
    }
  };

  // Format description with line breaks
  const formatDescription = (text: string) => {
    if (!text) return '';
    
    // If already HTML, return as is
    if (text.includes('<')) {
      return text;
    }
    
    // Replace newlines with <br> tags
    return text.replace(/\n/g, '<br>');
  };

  // Check if description is long enough to truncate
  const isDescriptionLong = activity.description && 
    (activity.description.length > DESCRIPTION_CHAR_LIMIT || 
     activity.description.includes('\n') || 
     activity.description.includes('<br>') ||
     activity.description.includes('<li>'));

  // Get truncated description
  const getTruncatedDescription = () => {
    if (!activity.description) return '';
    
    // If it's HTML, try to extract text
    if (activity.description.includes('<')) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = activity.description;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      return textContent.substring(0, DESCRIPTION_CHAR_LIMIT) + (textContent.length > DESCRIPTION_CHAR_LIMIT ? '...' : '');
    }
    
    // Otherwise just truncate the text
    return activity.description.substring(0, DESCRIPTION_CHAR_LIMIT) + 
           (activity.description.length > DESCRIPTION_CHAR_LIMIT ? '...' : '');
  };

  const resources = [
    { label: 'Video', url: activity.videoLink, icon: Video, color: 'text-red-600 bg-red-50 border-red-200', type: 'video' },
    { label: 'Music', url: activity.musicLink, icon: Music, color: 'text-teal-600 bg-teal-50 border-teal-200', type: 'music' },
    { label: 'Backing', url: activity.backingLink, icon: Volume2, color: 'text-teal-600 bg-teal-50 border-teal-200', type: 'backing' },
    { label: 'Resource', url: activity.resourceLink, icon: FileText, color: 'text-teal-600 bg-teal-50 border-teal-200', type: 'resource' },
    { label: 'Link', url: activity.link, icon: LinkIcon, color: 'text-gray-600 bg-gray-50 border-gray-200', type: 'link' },
    { label: 'Vocals', url: activity.vocalsLink, icon: Volume2, color: 'text-orange-600 bg-orange-50 border-orange-200', type: 'vocals' },
    { label: 'Image', url: activity.imageLink, icon: Image, color: 'text-teal-600 bg-teal-50 border-teal-200', type: 'image' },
  ].filter(resource => resource.url && resource.url.trim());

  // Get category color from context or use provided color (use normalized category)
  const cardColor = getCategoryColor(normalizedCategory) || categoryColor || '#6B7280';

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on a button or link
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }
    
    // Always open the modal if onActivityClick is provided, otherwise do nothing
    if (onActivityClick) {
      onActivityClick(activity);
    }
  };

  if (viewMode === 'minimal') {
    return (
      <div
        ref={draggable ? drag : undefined}
className={`bg-white rounded-lg shadow-sm border-l-4 p-3 transition-all duration-200 hover:shadow-md cursor-pointer h-full ${
          isDragging ? 'opacity-50' : ''
        }`}
        style={{ borderLeftColor: cardColor }}
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between h-full">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm truncate" dir="ltr">{activity.activity}</h4>
            <p className="text-xs text-gray-500" dir="ltr">{normalizedCategory}</p>
          </div>
          <div className="flex items-center space-x-2">
            {selectable && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  if (onSelectionChange) {
                    onSelectionChange(activity._id || activity.id || '', e.target.checked);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 text-gray-600 bg-white border-gray-300 rounded-full focus:ring-gray-500 focus:ring-opacity-50 appearance-none checked:bg-gray-600 checked:border-gray-600"
              />
            )}
            {activity.time > 0 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {activity.time}m
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'compact') {
    return (
      <div
        ref={draggable ? drag : undefined}
        className={`bg-white rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${
          isEditing ? 'ring-2 ring-blue-300' : 'border-gray-200 hover:border-gray-300'
        } ${isDragging ? 'opacity-50' : ''} h-full flex flex-col`}
        style={{ borderLeftColor: cardColor, borderLeftWidth: '4px' }}
        onClick={handleCardClick}
      >
        <div className="flex-1 p-3 flex flex-col">
          <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1" dir="ltr">
            {activity.activity}
          </h4>
          <p className="text-xs text-gray-600 mb-2" dir="ltr">{normalizedCategory}</p>
          
          <div className="mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {activity.time > 0 && (
                  <span className="text-xs text-gray-500">
                    {activity.time}m
                  </span>
                )}
                {resources.length > 0 && (
                  <div className="flex items-center space-x-1">
                    {resources.slice(0, 2).map((resource, index) => {
                      const IconComponent = resource.icon;
                      return (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onResourceClick) onResourceClick(resource.url, `${activity.activity} - ${resource.label}`, resource.type);
                          }}
                          className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                          title={`${resource.label} - Click to open`}
                        >
                          <IconComponent className="h-3 w-3 text-gray-600" />
                        </button>
                      );
                    })}
                    {resources.length > 2 && (
                      <span className="text-xs text-gray-500">+{resources.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {onEditToggle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onEditToggle) onEditToggle();
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200"
                    title="Edit activity"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDelete) onDelete(activity._id || activity.id || '');
                    }}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
                    title="Delete activity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div
        ref={draggable ? drag : undefined}
        className={`bg-white rounded-lg shadow-md border transition-all duration-200 hover:shadow-lg ${draggable ? 'cursor-move' : 'cursor-pointer'} ${
          isEditing ? 'ring-2 ring-blue-300' : 'border-gray-200 hover:border-gray-300'
        } ${isDragging ? 'opacity-50' : ''} h-full flex flex-col`}
        style={{ cursor: draggable ? 'move' : 'pointer', borderLeftColor: cardColor, borderLeftWidth: '4px' }}
        onClick={handleCardClick}
      >
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-900 text-base leading-tight" dir="ltr">{activity.activity}</h4>
            <div className="flex items-center space-x-2 ml-2">
              {activity.time > 0 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {activity.time}m
                </span>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-2" dir="ltr">{normalizedCategory}</p>
          
          {activity.yearGroups && activity.yearGroups.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {activity.yearGroups.map(yearGroup => {
                // Create abbreviation: "Lower Kindergarten Music" → "LKG M"
                // Also handles old labels like "EYFS U", "EYFS L", etc.
                // Handles comma-separated values like "EYFS U, Reception"
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
                  <span 
                    key={yearGroup} 
                    className="px-2 py-1 bg-[#D4F1EF] text-[#17A697] text-xs font-medium rounded-full whitespace-nowrap"
                  >
                    {abbreviate(yearGroup)}
                  </span>
                );
              })}
            </div>
          )}
          
          {activity.description && (
            <div 
              className="text-sm text-gray-600 leading-relaxed flex-grow overflow-y-auto max-h-16 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              dangerouslySetInnerHTML={{ __html: activity.description }}
              style={{ cursor: 'pointer' }}
            />
          )}
          
          <div className="mt-auto">
            {/* Action buttons */}
            <div className="flex items-center justify-between space-x-1 mt-2 pt-2 border-t border-gray-100">
              {/* HTML Links */}
              {resources.length > 0 && (
                <div className="flex items-center space-x-2">
                  {resources.slice(0, 2).map((resource, index) => {
                    const IconComponent = resource.icon;
                    return (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onResourceClick) onResourceClick(resource.url, `${activity.activity} - ${resource.label}`, resource.type);
                        }}
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                        title={`${resource.label} - Click to open`}
                      >
                        <IconComponent className="h-4 w-4 text-gray-600" />
                      </button>
                    );
                  })}
                  {resources.length > 2 && (
                    <span className="text-sm text-gray-500 font-medium">+{resources.length - 2}</span>
                  )}
                </div>
              )}
              
              {/* Edit/Delete buttons */}
              <div className="flex items-center space-x-1">
                {onEditToggle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditToggle();
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Edit activity"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                )}
                {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(activity._id || activity.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete activity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

// Detailed view (default)
return (
  <div
    ref={draggable ? drag : undefined}
    className={`bg-white rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl ${draggable ? 'cursor-move' : 'cursor-pointer'} overflow-hidden ${
      isEditing ? 'ring-4 ring-blue-300' : 'border-gray-200 hover:border-gray-300'
    } ${isDragging ? 'opacity-50' : ''} h-full flex flex-col`}
    style={{ borderLeftColor: cardColor, borderLeftWidth: '6px', cursor: 'pointer' }}
    onClick={handleCardClick}
    >
      {/* Card Header */}
      <div className="p-4 text-gray-900 relative">
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editedActivity.activity}
                  onChange={(e) => setEditedActivity(prev => ({ ...prev, activity: e.target.value }))}
                  className="w-full bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-70 border border-white border-opacity-30 rounded-lg px-3 py-2 text-lg font-bold"
                  placeholder="Activity name"
                  onClick={(e) => e.stopPropagation()}
                  dir="ltr"
                />
              ) : (
                <h3 className="text-lg font-bold leading-tight" dir="ltr">{activity.activity}</h3>
              )}
              
              <div className="flex items-center space-x-2 mt-2 flex-wrap">
                {activity.yearGroups && activity.yearGroups.length > 0 ? (
                  activity.yearGroups.map(yearGroup => {
                    // Create abbreviation: "Lower Kindergarten Music" → "LKG M"
                    // Also handles old labels like "EYFS U", "EYFS L", etc.
                    // Handles comma-separated values like "EYFS U, Reception"
                    const abbreviate = (label: string) => {
                      if (!label) return label;
                      
                      // Handle comma-separated values (e.g., "EYFS U, Reception")
                      if (label.includes(',')) {
                        return label.split(',').map(part => abbreviate(part.trim())).join(', ');
                      }
                      
                      // Handle old "EYFS U" format → "UKG"
                      if (label === 'EYFS U' || label === 'Upper EYFS' || label.startsWith('EYFS U')) {
                        // Try to extract category if present (e.g., "EYFS U Music" → "UKG M")
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
                        // Try to extract category if present (e.g., "EYFS L Music" → "LKG M")
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
                      // Fallback: return original (but this shouldn't happen with proper data)
                      return label;
                    };
                    
                    return (
                      <span 
                        key={yearGroup} 
                        className="px-2 py-1 bg-white bg-opacity-20 text-white text-xs font-medium rounded-full whitespace-nowrap"
                      >
                        {abbreviate(yearGroup)}
                      </span>
                    );
                  })
                ) : activity.level && (
                  <span className="px-2 py-1 bg-white bg-opacity-20 text-xs font-medium rounded-full">
                    {activity.level}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-3">
              {selectable && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (onSelectionChange) {
                      onSelectionChange(activity._id || activity.id || '', e.target.checked);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 text-white bg-white bg-opacity-20 border-white border-opacity-50 rounded-full focus:ring-white focus:ring-opacity-50 appearance-none checked:bg-white checked:border-white"
                />
              )}
              {activity.time > 0 && (
                <div className="flex items-center space-x-1 bg-white bg-opacity-20 px-2 py-1 rounded-full">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">{activity.time}m</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-grow flex flex-col">
        {/* Description */}
        <div className="mb-4 flex-grow">
          {isEditing ? (
            <div onClick={(e) => e.stopPropagation()}>
              <RichTextEditor
                value={editedActivity.description}
                onChange={(value) => setEditedActivity(prev => ({ ...prev, description: value }))}
                placeholder="Enter activity description..."
                minHeight="100px"
              />
            </div>
          ) : (
            <>
              <div 
                className="text-gray-700 leading-relaxed prose prose-sm max-w-none overflow-y-auto max-h-32 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                dangerouslySetInnerHTML={{ __html: formatDescription(activity.description) }}
                dir="ltr"
                style={{ cursor: 'pointer' }}
              />
            </>
          )}
        </div>

        {/* Unit Name */}
        {(activity.unitName || isEditing) && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Unit
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedActivity.unitName}
                onChange={(e) => setEditedActivity(prev => ({ ...prev, unitName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:outline-none"
                placeholder="Unit name"
                onClick={(e) => e.stopPropagation()}
                dir="ltr"
              />
            ) : (
              <p className="text-sm text-gray-700 font-medium" dir="ltr">{activity.unitName}</p>
            )}
          </div>
        )}

        {/* Standards */}
        {activity.eyfsStandards && activity.eyfsStandards.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center space-x-1">
              <Tag className="h-3 w-3" />
              <span>Standards</span>
            </label>
            <div className="flex flex-wrap gap-1">
              {activity.eyfsStandards.slice(0, 2).map((standard, index) => (
                <span key={index} className="inline-block px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full" dir="ltr">
                  {standard.split(':')[1] || standard}
                </span>
              ))}
              {activity.eyfsStandards.length > 2 && (
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                  +{activity.eyfsStandards.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Resources */}
        {(showResources || isEditing || resources.length > 0) && (
          <div className="space-y-3 mt-auto">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Resources</h4>
              {!isEditing && resources.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowResources(!showResources);
                  }}
                  className="text-xs text-teal-600 hover:text-teal-800"
                >
                  {showResources ? 'Hide' : 'Show'}
                </button>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                {[
                  { key: 'videoLink', label: 'Video', icon: Video },
                  { key: 'musicLink', label: 'Music', icon: Music },
                  { key: 'backingLink', label: 'Backing', icon: Volume2 },
                  { key: 'resourceLink', label: 'Resource', icon: FileText },
                  { key: 'link', label: 'Link', icon: LinkIcon },
                  { key: 'vocalsLink', label: 'Vocals', icon: Volume2 },
                  { key: 'imageLink', label: 'Image', icon: Image },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <input
                      type="url"
                      value={editedActivity[key as keyof Activity] as string}
                      onChange={(e) => setEditedActivity(prev => ({ ...prev, [key]: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:outline-none text-sm"
                      placeholder={`${label} URL`}
                      dir="ltr"
                    />
                  </div>
                ))}
              </div>
            ) : (
              showResources && (
                <div className="grid grid-cols-2 gap-2">
                  {resources.map((resource, index) => {
                    const IconComponent = resource.icon;
                    return (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onResourceClick) {
                            onResourceClick(resource.url, `${activity.activity} - ${resource.label}`, resource.type);
                          }
                        }}
                        className={`flex items-center space-x-2 p-2 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-sm ${resource.color}`}
                      >
                        <IconComponent className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-medium truncate" dir="ltr">{resource.label}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60" />
                      </button>
                    );
                  })}
                </div>
              )
            )}
          </div>
        )}

        {/* Action buttons for non-editing mode */}
        {!isEditing && (
          <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
            {onEditToggle && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditToggle();
                }}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Edit activity"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(activity._id || activity.id);
                }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Delete activity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            {/* Duplicate removed by request */}
          </div>
        )}

        {/* Edit Actions */}
        {isEditing && onEditToggle && (
          <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}