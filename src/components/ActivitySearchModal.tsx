import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { useData } from '../contexts/DataContext';
import type { Activity } from '../contexts/DataContext';

interface ActivitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectActivity: (activity: Activity) => void;
  selectedActivities?: Activity[];
}

export function ActivitySearchModal({
  isOpen,
  onClose,
  onSelectActivity,
  selectedActivities = []
}: ActivitySearchModalProps) {
  const { allActivities } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter activities based on search - show all when no search query
  const filteredActivities = useMemo(() => {
    if (!searchQuery.trim()) {
      return allActivities; // Show all activities when no search
    }
    
    return allActivities.filter(activity => {
      const matchesSearch = 
        activity.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (activity.description && activity.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (activity.category && activity.category.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesSearch;
    });
  }, [allActivities, searchQuery]);

  const handleActivityClick = (activity: Activity) => {
    // Check if already added
    const isAlreadyAdded = selectedActivities.some(
      selected => (selected._id || selected.id) === (activity._id || activity.id)
    );
    
    // Only add if not already added
    if (!isAlreadyAdded) {
      onSelectActivity(activity);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Activities</h2>
            <p className="text-sm text-gray-600 mt-1">
              Search and select activities to add to your lesson
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Activity List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No activities found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchQuery ? 'Try a different search term' : 'Start typing to search activities'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredActivities.map((activity, index) => {
                const isSelected = selectedActivities.some(
                  selected => (selected._id || selected.id) === (activity._id || activity.id)
                );
                
                return (
                  <div
                    key={activity._id || activity.id || index}
                    onClick={() => handleActivityClick(activity)}
                    className={`cursor-pointer transition-all duration-200 rounded-lg p-1 ${
                      isSelected 
                        ? 'ring-2 ring-teal-500 bg-teal-50' 
                        : 'hover:shadow-md hover:ring-2 hover:ring-teal-300'
                    }`}
                  >
                    <ActivityCard
                      activity={activity}
                      viewMode="compact"
                      onActivityClick={(activity) => {
                        // Prevent default card click behavior - just add to lesson
                        handleActivityClick(activity);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
          
          {filteredActivities.length > 0 && searchQuery && (
            <div className="mt-4 text-center text-sm text-gray-500">
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

