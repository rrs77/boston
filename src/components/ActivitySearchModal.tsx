import React, { useState, useMemo } from 'react';
import { X, Search, Plus, Check, GripVertical, ChevronRight, Clock } from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { SimpleNestedCategoryDropdown } from './SimpleNestedCategoryDropdown';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import type { Activity } from '../contexts/DataContext';

interface ActivitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectActivity: (activity: Activity) => void;
  onRemoveActivity?: (activity: Activity) => void;
  selectedActivities?: Activity[];
}

export function ActivitySearchModal({
  isOpen,
  onClose,
  onSelectActivity,
  onRemoveActivity,
  selectedActivities = []
}: ActivitySearchModalProps) {
  const { allActivities } = useData();
  const { categories, getCategoryColor } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter activities based on search and category
  const filteredActivities = useMemo(() => {
    let filtered = allActivities;
    
    // Filter by category if selected
    if (selectedCategory) {
      filtered = filtered.filter(activity => activity.category === selectedCategory);
    }
    
    // Filter by search query if provided
    if (searchQuery.trim()) {
      filtered = filtered.filter(activity => {
        const matchesSearch = 
          activity.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (activity.description && activity.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (activity.category && activity.category.toLowerCase().includes(searchQuery.toLowerCase()));
        
        return matchesSearch;
      });
    }
    
    return filtered;
  }, [allActivities, searchQuery, selectedCategory]);

  const handleActivityClick = (activity: Activity, e?: React.MouseEvent) => {
    // Prevent event bubbling if clicking on remove button
    if (e && (e.target as HTMLElement).closest('button')) {
      return;
    }
    
    // Check if already added
    const isAlreadyAdded = selectedActivities.some(
      selected => (selected._id || selected.id) === (activity._id || activity.id)
    );
    
    // Toggle selection: remove if already added, add if not
    if (isAlreadyAdded && onRemoveActivity) {
      onRemoveActivity(activity);
    } else if (!isAlreadyAdded) {
      onSelectActivity(activity);
    }
  };

  const handleRemoveClick = (activity: Activity, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveActivity) {
      onRemoveActivity(activity);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-card shadow-soft w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header - Teal gradient matching other modals */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Add Activities</h2>
              <p className="text-sm text-white/90 mt-0.5">
                Search and select activities to add to your lesson
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
                autoFocus
              />
            </div>
            
            {/* Category Filter */}
            <div className="w-full sm:w-64">
              <SimpleNestedCategoryDropdown
                selectedCategory={selectedCategory || ''}
                onCategoryChange={(category) => setSelectedCategory(category || null)}
                placeholder="All Categories"
              />
            </div>
          </div>
          
          {/* Active Filters Display */}
          {(selectedCategory || searchQuery) && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {selectedCategory && (
                <span className="inline-flex items-center px-3 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full">
                  {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="ml-2 hover:text-teal-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded-full">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-2 hover:text-gray-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Activity List - Slim List View */}
        <div className="flex-1 overflow-y-auto">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12 px-6">
              <p className="text-gray-500 text-lg">No activities found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchQuery ? 'Try a different search term' : 'Start typing to search activities'}
              </p>
            </div>
          ) : (
            <div className="bg-white divide-y divide-gray-200">
              {filteredActivities.map((activity, index) => {
                const isSelected = selectedActivities.some(
                  selected => (selected._id || selected.id) === (activity._id || activity.id)
                );
                const categoryColor = getCategoryColor(activity.category);
                
                return (
                  <div
                    key={activity._id || activity.id || index}
                    onClick={(e) => handleActivityClick(activity, e)}
                    className={`relative flex items-center py-2.5 px-4 transition-all duration-200 group ${
                      isSelected 
                        ? 'bg-teal-50' 
                        : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    {/* Colored left border */}
                    <div 
                      className="w-1 h-full absolute left-0 top-0 bottom-0 flex-shrink-0"
                      style={{ backgroundColor: categoryColor }}
                    />
                    
                    {/* Drag handle icon */}
                    <div className="flex items-center mr-2 text-gray-400">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    
                    {/* Chevron icon */}
                    <div className="flex items-center mr-2 text-gray-400">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                    
                    {/* Activity content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 leading-tight">
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
                    
                    {/* Selection indicator / Remove button */}
                    {isSelected ? (
                      <button
                        onClick={(e) => handleRemoveClick(activity, e)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Remove activity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : (
                      <div className="w-6 h-6 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-gray-300 rounded transition-colors group-hover:border-teal-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {filteredActivities.length > 0 && searchQuery && (
            <div className="px-6 py-3 text-center text-sm text-gray-500 bg-gray-50 border-t border-gray-200">
              Showing {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'} matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedActivities.length > 0 && (
              <span>{selectedActivities.length} {selectedActivities.length === 1 ? 'activity' : 'activities'} selected</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

