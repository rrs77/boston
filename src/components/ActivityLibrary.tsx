import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Plus, 
  BookOpen, 
  Clock, 
  Tag,
  ArrowUpDown,
  ArrowDownUp,
  Eye,
  Upload,
  Download,
  Trash2,
  RotateCcw,
  Edit3,
  Copy,
} from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { ActivityDetails } from './ActivityDetails';
import { ActivityDetailsModal } from './ActivityDetailsModal';
import { ActivityImporter } from './ActivityImporter';
import { ActivityCreator } from './ActivityCreator';
import { SimpleNestedCategoryDropdown } from './SimpleNestedCategoryDropdown';
import { LevelDropdown } from './LevelDropdown';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import type { Activity, ActivityStack } from '../contexts/DataContext';

interface ActivityLibraryProps {
  onActivitySelect: (activity: Activity) => void;
  selectedActivities: Activity[];
  className: string;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export function ActivityLibrary({ 
  onActivitySelect, 
  selectedActivities, 
  className,
  selectedCategory = 'all',
  onCategoryChange
}: ActivityLibraryProps) {
  const { 
    allActivities, 
    addActivity, 
    updateActivity, 
    deleteActivity, 
    loading: dataLoading, 
    refreshData,
    activityStacks,
    createActivityStack,
    updateActivityStack,
    deleteActivityStack,
    addActivitiesToStack,
    removeActivityFromStack,
    unstackActivities
  } = useData();
  const { getCategoryColor, categories, customYearGroups, mapActivityLevelToYearGroup } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelectedCategory, setLocalSelectedCategory] = useState(selectedCategory);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'time' | 'level'>('category');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedActivityDetails, setSelectedActivityDetails] = useState<Activity | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivityForModal, setSelectedActivityForModal] = useState<Activity | null>(null);
  const [initialResource, setInitialResource] = useState<{url: string, title: string, type: string} | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  

  // Sync local category with prop
  React.useEffect(() => {
    setLocalSelectedCategory(selectedCategory);
  }, [selectedCategory]);

  // Handle local category change
  const handleCategoryChange = (category: string) => {
    setLocalSelectedCategory(category);
    if (onCategoryChange) {
      onCategoryChange(category);
    }
  };

  // Get unique categories and levels
  const uniqueCategories = useMemo(() => {
    const cats = new Set(allActivities.map(a => a.category));
    return Array.from(cats).sort();
  }, [allActivities]);

  const uniqueLevels = useMemo(() => {
    // Use custom year groups from settings instead of database levels
    return customYearGroups.map(group => group.name);
  }, [customYearGroups]);

  // Generate stable unique key for each activity - FIXED
  const generateActivityKey = (activity: Activity, index: number) => {
    // Priority: Use database ID, then fallback ID, then create stable key
    if (activity._id) return `activity-${activity._id}`;
    if (activity.id) return `activity-${activity.id}`;
    
    // Create a stable key based on activity content and index
    // Use a hash of the activity name and category for consistency
    const stableHash = btoa(`${activity.activity}${activity.category}${activity.description || ''}${activity.time}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    return `activity-${stableHash}-${index}`;
  };

  // Helper function to get activity identifier - FIXED
  const getActivityId = (activity: Activity) => {
    return activity._id || activity.id || `${activity.activity}-${activity.category}-${activity.description || ''}`;
  };

  // Filter and sort activities and stacks
  const { filteredAndSortedActivities, filteredAndSortedStacks } = useMemo(() => {
    // Filter activities - show all activities but allow category filtering
    let filteredActivities = allActivities.filter(activity => {
      const matchesSearch = activity.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           activity.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by category if one is selected
      const matchesCategory = localSelectedCategory === 'all' || activity.category === localSelectedCategory;
      
      // Filter by level if one is selected
      const matchesLevel = selectedLevel === 'all' || activity.level === selectedLevel;
      
      return matchesSearch && matchesCategory && matchesLevel;
    });

    // Filter stacks - only show stacks with activities for the current year group
    let filteredStacks = activityStacks.filter(stack => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = query === '' || 
                           stack.name.toLowerCase().includes(query) ||
                           stack.description?.toLowerCase().includes(query) ||
                           stack.activities.some(activity => 
                             activity.activity.toLowerCase().includes(query) ||
                             activity.description.toLowerCase().includes(query) ||
                             activity.category.toLowerCase().includes(query)
                           );
      
      // Filter by current year group - stack must contain activities for this year group
      const matchesYearGroup = stack.activities.some(activity => 
        activity.level === className || 
        mapActivityLevelToYearGroup(activity.level) === className ||
        (activity.yearGroups && activity.yearGroups.includes(className))
      );
      
      return matchesSearch && matchesYearGroup;
    });

    // Sort activities
    filteredActivities.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.activity.localeCompare(b.activity);
          break;
        case 'category':
          // Get the position of each category from the settings
          const catA = categories.find(c => c.name === a.category);
          const catB = categories.find(c => c.name === b.category);
          const posA = catA ? catA.position : 999;
          const posB = catB ? catB.position : 999;
          comparison = posA - posB;
          break;
        case 'time':
          comparison = a.time - b.time;
          break;
        case 'level':
          comparison = a.level.localeCompare(b.level);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Sort stacks
    filteredStacks.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          const catA = categories.find(c => c.name === a.category);
          const catB = categories.find(c => c.name === b.category);
          const posA = catA ? catA.position : 999;
          const posB = catB ? catB.position : 999;
          comparison = posA - posB;
          break;
        case 'time':
          comparison = a.totalTime - b.totalTime;
          break;
        case 'level':
          // For stacks, compare by first activity's level
          const levelA = a.activities[0]?.level || '';
          const levelB = b.activities[0]?.level || '';
          comparison = levelA.localeCompare(levelB);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return { filteredAndSortedActivities: filteredActivities, filteredAndSortedStacks: filteredStacks };
  }, [allActivities, activityStacks, searchQuery, localSelectedCategory, selectedLevel, sortBy, sortOrder, categories, mapActivityLevelToYearGroup]);

  const toggleSort = (field: 'name' | 'category' | 'time' | 'level') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleActivityUpdate = async (updatedActivity: Activity) => {
    try {
      // Convert any "EYFS U" levels to "UKG"
      if (updatedActivity.level === "EYFS U") {
        updatedActivity.level = "UKG";
      }
      
      await updateActivity(updatedActivity);
      setEditingActivity(null);
      setSelectedActivityDetails(null);
    } catch (error) {
      console.error('Failed to update activity:', error);
      alert('Failed to update activity. Please try again.');
    }
  };

  const handleActivityDelete = async (activityId: string) => {
    setShowDeleteConfirm(activityId);
  };

  const confirmDeleteActivity = async () => {
    if (!showDeleteConfirm) return;
    
    try {
      await deleteActivity(showDeleteConfirm);
      setShowDeleteConfirm(null);
      
      // If the deleted activity was being viewed, close the details modal
      if (selectedActivityDetails && (selectedActivityDetails._id === showDeleteConfirm || selectedActivityDetails.id === showDeleteConfirm)) {
        setSelectedActivityDetails(null);
      }
    } catch (error) {
      console.error('Failed to delete activity:', error);
      alert('Failed to delete activity. Please try again.');
      setShowDeleteConfirm(null);
    }
  };

  // Duplicate activity removed by request

  const handleRefreshActivities = async () => {
    try {
      setLoading(true);
      console.log('🔄 Refreshing activities from Supabase...');
      await refreshData();
      console.log('✅ Activities refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh activities:', error);
      alert('Failed to refresh activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewActivityDetails = (activity: Activity, initialResource?: {url: string, title: string, type: string}) => {
    // Convert any "EYFS U" levels to "UKG"
    if (activity.level === "EYFS U") {
      activity.level = "UKG";
    }
    
    setSelectedActivityDetails(activity);
    if (initialResource) {
      setInitialResource(initialResource);
    } else {
      setInitialResource(null);
    }
  };

  const handleActivityClick = (activity: Activity) => {
    // Convert any "EYFS U" levels to "UKG"
    if (activity.level === "EYFS U") {
      activity.level = "UKG";
    }
    
    setSelectedActivityForModal(activity);
    setShowActivityModal(true);
  };

  const handleResourceClick = (url: string, title: string, type: string) => {
    // If we have a selected activity, open the resource in the ActivityDetails modal
    if (selectedActivityDetails) {
      setInitialResource({url, title, type});
    } else {
      // Find the activity that contains this resource
      const activity = allActivities.find(a => 
        a.videoLink === url || 
        a.musicLink === url || 
        a.backingLink === url || 
        a.resourceLink === url || 
        a.link === url || 
        a.vocalsLink === url || 
        a.imageLink === url
      );
      
      if (activity) {
        // Open the activity details with this resource
        handleViewActivityDetails(activity, {url, title, type});
      }
    }
  };

  const handleEditActivity = (activity: Activity) => {
    // Convert any "EYFS U" levels to "UKG"
    if (activity.level === "EYFS U") {
      activity.level = "UKG";
    }
    
    setEditingActivity(activity);
    setSelectedActivityDetails(activity);
  };

  const handleImportActivities = async (activities: Activity[]) => {
    try {
      setLoading(true);
      
      // Convert any "EYFS U" levels to "UKG" and ensure yearGroups field exists
      const normalizedActivities = activities.map(activity => {
        if (activity.level === "EYFS U") {
          return { 
            ...activity, 
            level: "UKG",
            yearGroups: activity.yearGroups || (activity.level ? [activity.level] : [])
          };
        }
        return {
          ...activity,
          yearGroups: activity.yearGroups || (activity.level ? [activity.level] : [])
        };
      });
      
      // Add each activity using the centralized function
      for (const activity of normalizedActivities) {
        await addActivity(activity);
      }
      
      setShowImporter(false);
    } catch (error) {
      console.error('Failed to import activities:', error);
      alert('Failed to import activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async (newActivity: Activity) => {
    try {
      setLoading(true);
      
      // Convert any "EYFS U" levels to "UKG" and ensure yearGroups field exists
      if (newActivity.level === "EYFS U") {
        newActivity.level = "UKG";
      }
      // Ensure yearGroups field exists
      if (!newActivity.yearGroups) {
        newActivity.yearGroups = newActivity.level ? [newActivity.level] : [];
      }
      
      await addActivity(newActivity);
      setShowCreator(false);
    } catch (error) {
      console.error('Failed to create activity:', error);
      alert('Failed to create activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check if an activity is being edited - FIXED
  const isActivityBeingEdited = (activity: Activity) => {
    if (!editingActivity) return false;
    
    // First try to match by ID
    if (editingActivity._id && activity._id) {
      return editingActivity._id === activity._id;
    }
    if (editingActivity.id && activity.id) {
      return editingActivity.id === activity.id;
    }
    
    // If no IDs match, use content-based matching as fallback
    return getActivityId(editingActivity) === getActivityId(activity);
  };


  return (
    <div className="bg-white rounded-xl shadow-lg  overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 text-white" style={{ background: 'linear-gradient(to right, #14B8A6, #0D9488)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-4">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">Activity Library</h2>
              <p className="text-white text-xs sm:text-sm">
                {filteredAndSortedActivities.length} of {allActivities.length} activities
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-2">
            <button
              onClick={() => setShowCreator(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Create Activity</span>
              <span className="sm:hidden">Create</span>
            </button>
            
            <button
              onClick={handleRefreshActivities}
              disabled={loading}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
              title="Refresh activities from Supabase"
            >
              <RotateCcw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            <button
              onClick={() => setShowImporter(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors duration-200 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
            >
              <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Import/Export</span>
              <span className="sm:hidden">Import</span>
            </button>
          </div>
        </div>

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1 sm:max-w-md">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
              style={{ color: '#FFFFFF' }}
            />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg font-semibold text-sm placeholder-white"
              style={{
                color: '#FFFFFF',
                '--tw-placeholder-color': '#FFFFFF',
                '::placeholder': { color: '#FFFFFF' }
              } as React.CSSProperties}
              dir="ltr"
            />
          </div>

          {/* Category Filter Dropdown */}
          <div className="relative" style={{ minWidth: '250px' }}>
            <SimpleNestedCategoryDropdown
              selectedCategory={localSelectedCategory === 'all' ? '' : localSelectedCategory}
              onCategoryChange={(category) => handleCategoryChange(category === '' ? 'all' : category)}
              placeholder="All Categories"
              className="px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent font-semibold"
            />
          </div>

          {/* Level Filter Dropdown */}
          <div className="relative" style={{ minWidth: '200px' }}>
            <LevelDropdown
              selectedLevel={selectedLevel}
              onLevelChange={setSelectedLevel}
              placeholder="All Levels"
              className="px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent font-semibold"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => toggleSort('category')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                sortBy === 'category' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Tag className="h-4 w-4" />
              {sortBy === 'category' && (sortOrder === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowDownUp className="h-4 w-4" />)}
            </button>
            <button
              onClick={() => toggleSort('time')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
                sortBy === 'time' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Clock className="h-4 w-4" />
              {sortBy === 'time' && (sortOrder === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowDownUp className="h-4 w-4" />)}
            </button>
            
            <div className="flex items-center space-x-2 ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'grid' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                }`}
                title="Grid View - Normal sized activity cards"
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'list' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                }`}
                title="List View - 4-column table layout with horizontal rows"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="p-6">
        {loading || dataLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading activities...</p>
          </div>
        ) : filteredAndSortedActivities.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-600">
              {searchQuery || localSelectedCategory !== 'all' || selectedLevel !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No activities available in the library. Create a new activity or import activities to get started.'
              }
            </p>
            {(searchQuery || localSelectedCategory !== 'all' || selectedLevel !== 'all') && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  handleCategoryChange('all');
                  setSelectedLevel('all');
                }}
                className="mt-4 px-4 py-2 btn-primary text-white rounded-lg text-sm"
              >
                Clear Filters
              </button>
            )}
            {!searchQuery && localSelectedCategory === 'all' && selectedLevel === 'all' && (
              <button 
                onClick={() => setShowCreator(true)}
                className="mt-4 px-4 py-2 btn-primary text-white rounded-lg text-sm flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Create First Activity</span>
              </button>
            )}
          </div>
        ) : (
          viewMode === 'list' ? (
          // List View - Compact cards in grid layout with full functionality
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredAndSortedActivities.map((activity, index) => (
              <div 
                key={generateActivityKey(activity, index)}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-3 relative group"
                style={{
                  borderLeft: `4px solid ${getCategoryColor(activity.category)}`,
                  minHeight: '120px'
                }}
              >

                {/* Activity content */}
                <div 
                  className="h-full flex flex-col cursor-pointer"
                  onClick={() => handleActivityClick(activity)}
                >
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                      {activity.activity}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {activity.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {activity.time || 0}m
                        </span>
                        {/* Action buttons - positioned next to time */}
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditActivity(activity);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Edit activity"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivityDelete(activity._id || activity.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete activity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <span>{activity.level || 'All'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedActivities.map((activity, index) => (
              <div key={generateActivityKey(activity, index)} className="h-full">
                <ActivityCard
                  activity={activity}
                  onUpdate={handleActivityUpdate}
                  onDelete={handleActivityDelete}
                  isEditing={isActivityBeingEdited(activity)}
                  onEditToggle={() => handleEditActivity(activity)}
                  categoryColor={getCategoryColor(activity.category)}
                  viewMode="grid"
                  onActivityClick={handleActivityClick}
                  onResourceClick={handleResourceClick}
                  draggable={true}
                  selectable={false}
                  isSelected={false}
                  onSelectionChange={() => {}}
                />
              </div>
            ))}
          </div>
          )
        )}
      </div>

      {/* Activity Details Modal */}
      {selectedActivityDetails && (
        <ActivityDetails
          activity={selectedActivityDetails}
          onClose={() => {
            setSelectedActivityDetails(null);
            setEditingActivity(null);
            setInitialResource(null);
          }}
          onAddToLesson={() => {
            onActivitySelect(selectedActivityDetails);
            setSelectedActivityDetails(null);
          }}
          isEditing={selectedActivityDetails === editingActivity}
          onUpdate={(updatedActivity) => {
            handleActivityUpdate(updatedActivity);
            setEditingActivity(null);
            setSelectedActivityDetails(null);
          }}
          initialResource={initialResource}
          onDelete={deleteActivity}
        />
      )}

      {/* Activity Creator Modal */}
      {showCreator && (
        <ActivityCreator 
          onSave={handleCreateActivity}
          onClose={() => setShowCreator(false)}
          categories={uniqueCategories}
          levels={uniqueLevels}
        />
      )}

      {/* Activity Importer Modal */}
      {showImporter && (
        <ActivityImporter 
          onImport={handleImportActivities}
          onClose={() => setShowImporter(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Activity</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this activity? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteActivity}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Activity</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Details Modal */}
      <ActivityDetailsModal
        isOpen={showActivityModal}
        onClose={() => {
          setShowActivityModal(false);
          setSelectedActivityForModal(null);
        }}
        activity={selectedActivityForModal}
      />

    </div>
  );
}