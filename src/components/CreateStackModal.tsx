import React, { useState } from 'react';
import { X, Layers, Plus, AlertCircle, CheckCircle, Search, Clock, Tag } from 'lucide-react';
import { SimpleNestedCategoryDropdown } from './SimpleNestedCategoryDropdown';
import { LevelDropdown } from './LevelDropdown';
import { useSettings } from '../contexts/SettingsContextNew';
import type { Activity } from '../contexts/DataContext';

interface CreateStackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStack: (name: string, description: string, selectedActivities: Activity[]) => void;
  availableActivities: Activity[];
  selectedActivityIds: string[];
  onActivitySelectionChange: (activityId: string, selected: boolean) => void;
}

export function CreateStackModal({
  isOpen,
  onClose,
  onCreateStack,
  availableActivities,
  selectedActivityIds,
  onActivitySelectionChange
}: CreateStackModalProps) {
  const { getCategoryColor, customYearGroups } = useSettings();
  const [stackName, setStackName] = useState('');
  const [stackDescription, setStackDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

  if (!isOpen) return null;

  const selectedActivities = availableActivities.filter(activity => 
    selectedActivityIds.includes(activity._id || activity.id || '')
  );

  const totalTime = selectedActivities.reduce((sum, activity) => sum + (activity.time || 0), 0);

  // Get unique categories for filtering
  const uniqueCategories = Array.from(new Set(availableActivities.map(a => a.category))).sort();

  // Filter available activities based on search, category, and level
  const filteredActivities = availableActivities.filter(activity => {
    const matchesSearch = activity.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || activity.level === selectedLevel;
    
    // Also filter out activities with invalid levels
    const hasValidLevel = !activity.level?.includes(',') && 
                         !activity.level?.includes('EYFS L') && 
                         !activity.level?.includes('EYFS U');
    
    return matchesSearch && matchesCategory && matchesLevel && hasValidLevel;
  });

  const handleCreate = async () => {
    if (!stackName.trim()) return;
    if (selectedActivities.length === 0) return;

    setIsCreating(true);
    try {
      await onCreateStack(stackName.trim(), stackDescription.trim(), selectedActivities);
      setStackName('');
      setStackDescription('');
      onClose();
    } catch (error) {
      console.error('Failed to create stack:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setStackName('');
    setStackDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 text-white flex items-center justify-between" style={{ background: 'linear-gradient(to right, #2DD4BF, #14B8A6)' }}>
          <div className="flex items-center space-x-2">
            <Layers className="h-6 w-6" />
            <h3 className="text-lg font-semibold">Create Activity Stack</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
            disabled={isCreating}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Stack Name */}
          <div>
            <label htmlFor="stackName" className="block text-sm font-medium text-gray-700 mb-2">
              Stack Name *
            </label>
            <input
              id="stackName"
              type="text"
              value={stackName}
              onChange={(e) => setStackName(e.target.value)}
              placeholder="e.g., Photosynthesis Unit, Week 3 Lessons"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
              disabled={isCreating}
            />
          </div>

          {/* Stack Description */}
          <div>
            <label htmlFor="stackDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="stackDescription"
              value={stackDescription}
              onChange={(e) => setStackDescription(e.target.value)}
              placeholder="Brief description of this activity stack..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
              disabled={isCreating}
            />
          </div>

          {/* Activity Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Activities
            </label>
            
            {/* Search and Filter Controls */}
            <div className="flex space-x-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                  disabled={isCreating}
                />
              </div>
              <div className="relative" style={{ minWidth: '250px' }}>
                <SimpleNestedCategoryDropdown
                  selectedCategory={selectedCategory === 'all' ? '' : selectedCategory}
                  onCategoryChange={(category) => setSelectedCategory(category === '' ? 'all' : category)}
                  placeholder="All Categories"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div className="relative" style={{ minWidth: '200px' }}>
                <LevelDropdown
                  selectedLevel={selectedLevel}
                  onLevelChange={setSelectedLevel}
                  placeholder="All Levels"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Activities List */}
            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              {filteredActivities.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No activities found matching your criteria</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredActivities.map((activity) => {
                    const isSelected = selectedActivityIds.includes(activity._id || activity.id || '');
                    return (
                      <div
                        key={activity._id || activity.id}
                        className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-teal-50 border-l-4 border-l-teal-500' : ''
                        }`}
                        onClick={() => onActivitySelectionChange(activity._id || activity.id || '', !isSelected)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Handled by parent div onClick
                              className="w-4 h-4 text-teal-600 bg-gray-100 border-gray-300 rounded focus:outline-none"
                              disabled={isCreating}
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{activity.activity}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <div 
                                    className="w-3 h-3 rounded-full flex-shrink-0" 
                                    style={{ backgroundColor: getCategoryColor(activity.category) }}
                                  />
                                  <span>{activity.category}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{activity.time || 0} min</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-teal-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              Showing {filteredActivities.length} of {availableActivities.length} activities
            </div>
          </div>

          {/* Selected Activities Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-800">Selected Activities</h4>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{selectedActivities.length} activities</span>
                <span>{totalTime} min total</span>
              </div>
            </div>

            {selectedActivities.length === 0 ? (
              <div className="flex items-center space-x-2 text-gray-500">
                <AlertCircle className="h-4 w-4" />
                <span>No activities selected</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedActivities.map((activity, index) => (
                  <div
                    key={activity._id || activity.id || index}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: getCategoryColor(activity.category) }}
                      />
                      <span className="text-sm font-medium">{activity.activity}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{activity.time || 0} min</span>
                      <button
                        onClick={() => onActivitySelectionChange(activity._id || activity.id || '', false)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                        disabled={isCreating}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Validation Messages */}
          {stackName.trim() && selectedActivities.length > 0 && (
            <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Ready to create stack</span>
            </div>
          )}

          {stackName.trim() && selectedActivities.length === 0 && (
            <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Please select at least one activity</span>
            </div>
          )}

          {!stackName.trim() && selectedActivities.length > 0 && (
            <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Please enter a stack name</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors duration-200"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!stackName.trim() || selectedActivities.length === 0 || isCreating}
            className="px-4 py-2 btn-primary disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Create Stack</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
