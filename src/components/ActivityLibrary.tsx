import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
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
  Type,
} from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { ActivityDetails } from './ActivityDetails';
import { ActivityDetailsModal } from './ActivityDetailsModal';
import { ActivityImporter } from './ActivityImporter';
import { ActivityCreator } from './ActivityCreator';
import { SimpleNestedCategoryDropdown } from './SimpleNestedCategoryDropdown';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { useAuth } from '../hooks/useAuth';
import { useIsViewOnly } from '../hooks/useIsViewOnly';
import { activityPacksApi } from '../config/api';
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
  const isViewOnly = useIsViewOnly();
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
    unstackActivities,
    currentSheetInfo
  } = useData();
  const { getCategoryColor, categories, customYearGroups, mapActivityLevelToYearGroup } = useSettings();
  
  // Get categories assigned to current year group (same logic as LessonPlanBuilder)
  const getCurrentYearGroupKeys = React.useCallback((): string[] => {
    const sheetId = className || currentSheetInfo?.sheet;
    if (!sheetId) return [];
    
    if (!customYearGroups || !Array.isArray(customYearGroups)) {
      return [];
    }
    
    // Try to find by ID first
    let yearGroup = customYearGroups.find(yg => yg.id === sheetId);
    
    // If not found by ID, try to find by name (handles cases like "Example KS1 Maths")
    if (!yearGroup) {
      yearGroup = customYearGroups.find(yg => 
        yg.name === sheetId || 
        yg.name.toLowerCase() === sheetId.toLowerCase() ||
        sheetId.includes(yg.name) ||
        yg.name.includes(sheetId)
      );
    }
    
    if (yearGroup) {
      // Return both ID and name as potential keys for matching
      return [yearGroup.id, yearGroup.name].filter(Boolean);
    }
    return [];
  }, [className, currentSheetInfo, customYearGroups]);
  
  // Get categories available for current year group
  const availableCategoriesForYearGroup = React.useMemo(() => {
    if (!categories || categories.length === 0) {
      console.log('📚 ActivityLibrary: No categories available - showing all activities');
      // Return null to indicate "show all" instead of empty array
      return null;
    }
    
    const yearGroupKeys = getCurrentYearGroupKeys();
    const currentSheet = className || currentSheetInfo?.sheet;
    
    console.log('📚 ActivityLibrary: Filtering categories for year group:', {
      currentSheet,
      yearGroupKeys,
      totalCategories: categories.length
    });
    
    if (yearGroupKeys.length === 0) {
      // If no year group selected, show all categories
      console.log('📚 ActivityLibrary: No year group selected, showing all categories');
      return null; // null means "show all"
    }
    
    // Filter categories that are assigned to this year group
    // Check against all potential keys (ID and name)
    const filteredCategories = categories
      .filter(category => {
        if (!category || !category.yearGroups || Object.keys(category.yearGroups).length === 0) {
          console.log(`❌ Category "${category.name}" has no yearGroups assigned - excluding`);
          return false;
        }
        
        // Check for old defaults (LKG, UKG, Reception all true with only 3 keys)
        const hasOldDefaults = 
          category.yearGroups.LKG === true && 
          category.yearGroups.UKG === true && 
          category.yearGroups.Reception === true &&
          Object.keys(category.yearGroups).length === 3;
        if (hasOldDefaults) {
          console.log(`❌ Category "${category.name}" has old defaults - excluding`);
          return false;
        }
        
        // Check if this category is assigned to any of the year group keys
        // First try exact match
        let isAssigned = yearGroupKeys.some(key => category.yearGroups[key] === true);
        
        // If no exact match, try partial/fuzzy matching
        // This handles cases where year group is "LKG" but category has "Lower Kindergarten Music"
        // BUT: Be strict - only allow specific known matches to avoid false positives
        if (!isAssigned) {
          isAssigned = Object.keys(category.yearGroups).some(catKey => {
            if (category.yearGroups[catKey] !== true) return false;
            
            // Check if any year group key matches this category key (exact or partial)
            return yearGroupKeys.some(key => {
              const keyLower = key.toLowerCase();
              const catKeyLower = catKey.toLowerCase();
              
              // Exact match
              if (keyLower === catKeyLower) return true;
              
              // EXPLICIT EXCLUSIONS: Never match KS2/KS1 categories to Lower Kindergarten
              if ((catKeyLower.includes('ks2') || catKeyLower.includes('key stage 2')) && 
                  (keyLower.includes('lower kindergarten') || keyLower.includes('lkg') || keyLower.includes('reception'))) {
                console.log(`🚫 EXCLUDING: "${category.name}" (KS2) should not match "${key}" (Lower Kindergarten)`);
                return false;
              }
              if ((keyLower.includes('ks2') || keyLower.includes('key stage 2')) && 
                  (catKeyLower.includes('lower kindergarten') || catKeyLower.includes('lkg') || catKeyLower.includes('reception'))) {
                console.log(`🚫 EXCLUDING: "${category.name}" (Lower Kindergarten) should not match "${catKey}" (KS2)`);
                return false;
              }
              
              // Check if key contains catKey (e.g., "Lower Kindergarten Music" contains "Lower Kindergarten")
              // BUT: Only if catKey is a meaningful substring (not just a few characters)
              if (catKeyLower.length >= 5 && catKeyLower.includes(keyLower)) return true;
              
              // Check if catKey contains key (e.g., "LKG" in "Lower Kindergarten Music")
              // BUT: Only if key is a meaningful substring (not just a few characters)
              if (keyLower.length >= 5 && keyLower.includes(catKeyLower)) return true;
              
              // Check for common abbreviations (strict matching only)
              if (keyLower === 'lkg' && (catKeyLower.includes('lower kindergarten') || catKeyLower === 'lower kindergarten music')) return true;
              if (keyLower === 'ukg' && (catKeyLower.includes('upper kindergarten') || catKeyLower === 'upper kindergarten music')) return true;
              if ((keyLower.includes('lower kindergarten') || keyLower === 'lower kindergarten music') && catKeyLower === 'lkg') return true;
              if ((keyLower.includes('upper kindergarten') || keyLower === 'upper kindergarten music') && catKeyLower === 'ukg') return true;
              
              return false;
            });
          });
        }
        
        if (isAssigned) {
          console.log(`✅ Category "${category.name}" is assigned to year group (keys: ${yearGroupKeys.join(', ')})`);
        } else {
          console.log(`❌ Category "${category.name}" is NOT assigned to year group. Available keys in category:`, Object.keys(category.yearGroups).filter(k => category.yearGroups[k] === true));
        }
        
        return isAssigned;
      })
      .map(c => c.name);
    
    console.log(`📚 ActivityLibrary: Found ${filteredCategories.length} categories for year group:`, filteredCategories);
    
    // If no categories are assigned, show all activities (fallback)
    if (filteredCategories.length === 0) {
      console.log('⚠️ ActivityLibrary: No categories assigned to year group - showing ALL activities as fallback');
      return null; // null means "show all"
    }
    
    return filteredCategories;
  }, [categories, getCurrentYearGroupKeys, className, currentSheetInfo]);
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelectedCategory, setLocalSelectedCategory] = useState(selectedCategory);
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'time' | 'level'>('category');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null); // For A-Z index navigation
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedActivityDetails, setSelectedActivityDetails] = useState<Activity | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivityForModal, setSelectedActivityForModal] = useState<Activity | null>(null);
  const [initialResource, setInitialResource] = useState<{url: string, title: string, type: string} | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [userOwnedPacks, setUserOwnedPacks] = useState<string[]>([]);
  

  // Sync local category with prop
  React.useEffect(() => {
    setLocalSelectedCategory(selectedCategory);
  }, [selectedCategory]);

  // Load user's owned packs
  React.useEffect(() => {
    const loadUserPacks = async () => {
      if (user?.email) {
        try {
          const packs = await activityPacksApi.getUserPurchases(user.email);
          setUserOwnedPacks(packs);
          console.log('📦 User owns these packs:', packs);
        } catch (error) {
          console.error('Failed to load user packs:', error);
        }
      }
    };

    loadUserPacks();
  }, [user?.email]);

  // Handle local category change
  const handleCategoryChange = (category: string) => {
    setLocalSelectedCategory(category);
    if (onCategoryChange) {
      onCategoryChange(category);
    }
  };

  // Get unique categories - only show categories assigned to current year group
  const uniqueCategories = useMemo(() => {
    // If availableCategoriesForYearGroup is null, show all categories
    if (availableCategoriesForYearGroup === null) {
      const cats = new Set(allActivities.map(a => a.category));
      return Array.from(cats).sort();
    }
    
    // Filter activities to only those assigned to current year group, then get unique categories
    const filteredActivities = allActivities.filter(activity => 
      availableCategoriesForYearGroup.includes(activity.category)
    );
    const cats = new Set(filteredActivities.map(a => a.category));
    return Array.from(cats).sort();
  }, [allActivities, availableCategoriesForYearGroup]);

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
    // Filter activities - filter by year group AND allow category/level filtering
    let filteredActivities = allActivities.filter(activity => {
      const matchesSearch = activity.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           activity.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by category if one is selected
      const matchesCategory = localSelectedCategory === 'all' || activity.category === localSelectedCategory;
      
      // Level filtering removed - show all levels
      const matchesLevel = true;
      
      // CRITICAL: Only show activities whose categories are assigned to the current year group
      // If availableCategoriesForYearGroup is null, show all activities (fallback)
      const categoryIsAssignedToYearGroup = availableCategoriesForYearGroup === null || 
                                             availableCategoriesForYearGroup.includes(activity.category);
      
      // Check if user owns required pack (if activity requires one)
      const hasPackAccess = !activity.requiredPack || userOwnedPacks.includes(activity.requiredPack);
      
      return matchesSearch && matchesCategory && matchesLevel && categoryIsAssignedToYearGroup && hasPackAccess;
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
      
      // Show ALL stacks regardless of year group
      // Remove year group filtering to show all stacks
      const matchesYearGroup = true;
      
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
  }, [allActivities, activityStacks, searchQuery, localSelectedCategory, sortBy, sortOrder, categories, className, mapActivityLevelToYearGroup, userOwnedPacks, availableCategoriesForYearGroup]);

  // Get available letters for A-Z index (only when sorting by name)
  const availableLetters = useMemo(() => {
    if (sortBy !== 'name') return [];
    const letters = new Set<string>();
    filteredAndSortedActivities.forEach(activity => {
      const firstLetter = activity.activity.charAt(0).toUpperCase();
      if (/[A-Z]/.test(firstLetter)) {
        letters.add(firstLetter);
      }
    });
    return Array.from(letters).sort();
  }, [filteredAndSortedActivities, sortBy]);

  // Scroll to activities starting with a specific letter
  const scrollToLetter = (letter: string) => {
    setSelectedLetter(letter);
    const element = document.querySelector(`[data-letter-index="${letter}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
    if (isViewOnly) {
      alert('View-only mode: Cannot delete activities.');
      return;
    }
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
    if (isViewOnly) {
      alert('View-only mode: Cannot edit activities.');
      return;
    }
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
    if (isViewOnly) {
      alert('View-only mode: Cannot create activities.');
      return;
    }
    const loadingToast = toast.loading('Creating activity...');
    
    try {
      setLoading(true);
      
      // Convert any "EYFS U" levels to "UKG" and ensure yearGroups field exists
      if (newActivity.level === "EYFS U") {
        newActivity.level = "UKG";
      }
      
      // CRITICAL: Preserve yearGroups array - don't overwrite if it exists
      // Only set default if yearGroups is missing or empty
      if (!newActivity.yearGroups || !Array.isArray(newActivity.yearGroups) || newActivity.yearGroups.length === 0) {
        newActivity.yearGroups = newActivity.level ? [newActivity.level] : [];
      }
      
      // Ensure yearGroups is properly formatted as an array
      newActivity.yearGroups = Array.isArray(newActivity.yearGroups) ? newActivity.yearGroups : [];
      
      console.log('💾 Saving activity with yearGroups:', {
        activity: newActivity.activity,
        yearGroups: newActivity.yearGroups,
        yearGroupsLength: newActivity.yearGroups.length
      });
      
      await addActivity(newActivity);
      setShowCreator(false);
      
      toast.success(`Activity "${newActivity.activity}" created successfully!`, {
        id: loadingToast,
      });
    } catch (error) {
      console.error('Failed to create activity:', error);
      toast.error('Failed to create activity. Please try again.', {
        id: loadingToast,
      });
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
              onClick={() => {
                if (isViewOnly) {
                  alert('View-only mode: Cannot create activities.');
                  return;
                }
                setShowCreator(true);
              }}
              disabled={isViewOnly}
              className={`btn-accent px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm ${isViewOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search - Shorter width */}
          <div className="relative" style={{ width: '200px', minWidth: '180px' }}>
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
          <div className="relative" style={{ width: '200px', minWidth: '180px' }}>
            <SimpleNestedCategoryDropdown
              selectedCategory={localSelectedCategory === 'all' ? '' : localSelectedCategory}
              onCategoryChange={(category) => handleCategoryChange(category === '' ? 'all' : category)}
              placeholder="All Categories"
              className="px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent font-semibold"
              showAllCategories={false}
            />
          </div>

          {/* Sort and View Icons - Properly spaced */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSort('category')}
              className={`flex items-center justify-center p-2 rounded-lg transition-colors duration-200 ${
                sortBy === 'category' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
              title="Sort by Category"
            >
              <Tag className="h-4 w-4" />
              {sortBy === 'category' && (sortOrder === 'asc' ? <ArrowUpDown className="h-3 w-3 ml-1" /> : <ArrowDownUp className="h-3 w-3 ml-1" />)}
            </button>
            <button
              onClick={() => toggleSort('time')}
              className={`flex items-center justify-center p-2 rounded-lg transition-colors duration-200 ${
                sortBy === 'time' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
              title="Sort by Time"
            >
              <Clock className="h-4 w-4" />
              {sortBy === 'time' && (sortOrder === 'asc' ? <ArrowUpDown className="h-3 w-3 ml-1" /> : <ArrowDownUp className="h-3 w-3 ml-1" />)}
            </button>
            <button
              onClick={() => {
                toggleSort('name');
                setSortOrder('asc'); // Always A-Z when clicking A-Z button
              }}
              className={`flex items-center justify-center p-2 rounded-lg transition-colors duration-200 ${
                sortBy === 'name' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
              title="Sort A-Z by Name"
            >
              <Type className="h-4 w-4" />
              {sortBy === 'name' && sortOrder === 'asc' && <span className="text-xs ml-1">A-Z</span>}
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'grid' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'list' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="flex relative">
        {/* A-Z Index Sidebar - Only show when sorting by name */}
        {sortBy === 'name' && availableLetters.length > 0 && (
          <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-lg shadow-lg p-2 border border-gray-200">
            <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
              {availableLetters.map(letter => (
                <button
                  key={letter}
                  onClick={() => scrollToLetter(letter)}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    selectedLetter === letter
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'
                  }`}
                  title={`Jump to activities starting with ${letter}`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="p-6 flex-1">
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
              {searchQuery || localSelectedCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No activities available in the library. Create a new activity or import activities to get started.'
              }
            </p>
            {(searchQuery || localSelectedCategory !== 'all') && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  handleCategoryChange('all');
                }}
                className="mt-4 px-4 py-2 btn-primary text-white rounded-lg text-sm"
              >
                Clear Filters
              </button>
            )}
            {!searchQuery && localSelectedCategory === 'all' && (
              <button 
                onClick={() => {
                  if (isViewOnly) {
                    alert('View-only mode: Cannot create activities.');
                    return;
                  }
                  setShowCreator(true);
                }}
                disabled={isViewOnly}
                className={`mt-4 px-4 py-2 btn-primary text-white rounded-lg text-sm flex items-center space-x-2 mx-auto ${isViewOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Plus className="h-4 w-4" />
                <span>Create First Activity</span>
              </button>
            )}
          </div>
        ) : (
          viewMode === 'list' ? (
          // List View - Compact cards in grid layout with full functionality
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {filteredAndSortedActivities.map((activity, index) => {
              const firstLetter = activity.activity.charAt(0).toUpperCase();
              const isNewLetter = index === 0 || 
                filteredAndSortedActivities[index - 1].activity.charAt(0).toUpperCase() !== firstLetter;
              
              return (
                <React.Fragment key={generateActivityKey(activity, index)}>
                  {isNewLetter && sortBy === 'name' && /[A-Z]/.test(firstLetter) && (
                    <div 
                      data-letter-index={firstLetter}
                      className="col-span-full py-2 sticky top-0 bg-white z-10 border-b-2 border-teal-200"
                    >
                      <h3 className="text-lg font-bold text-teal-600">{firstLetter}</h3>
                    </div>
                  )}
                  <div 
                    className="bg-white shadow-soft hover:shadow-hover transition-shadow duration-200 p-2 relative group"
                    style={{
                      borderLeft: `4px solid ${getCategoryColor(activity.category)}`,
                      borderRadius: '4px',
                      minHeight: '60px'
                    }}
                  >

                {/* Activity content */}
                <div 
                  className="h-full flex items-center cursor-pointer"
                  onClick={() => handleActivityClick(activity)}
                >
                  <div className="flex items-center justify-between gap-3 flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 leading-tight flex-1 line-clamp-2 break-words" title={activity.activity}>
                      {activity.activity}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 flex-shrink-0">
                      <span className="flex items-center whitespace-nowrap">
                        <Clock className="h-3 w-3 mr-1" />
                        {activity.time || 0}m
                      </span>
                      {/* Action buttons - positioned next to time */}
                      {!isViewOnly && (
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditActivity(activity);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit activity"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivityDelete(activity._id || activity.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete activity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              </React.Fragment>
            );
            })}
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedActivities.map((activity, index) => {
              const firstLetter = activity.activity.charAt(0).toUpperCase();
              const isNewLetter = index === 0 || 
                filteredAndSortedActivities[index - 1].activity.charAt(0).toUpperCase() !== firstLetter;
              
              return (
                <React.Fragment key={generateActivityKey(activity, index)}>
                  {isNewLetter && sortBy === 'name' && /[A-Z]/.test(firstLetter) && (
                    <div 
                      data-letter-index={firstLetter}
                      className="col-span-full py-2 sticky top-0 bg-white z-10 border-b-2 border-teal-200"
                    >
                      <h3 className="text-lg font-bold text-teal-600">{firstLetter}</h3>
                    </div>
                  )}
                  <div className="h-full">
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
                </React.Fragment>
              );
            })}
          </div>
          )
        )}
        </div>
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

      {/* Activity Details Modal - Simple view for clicking activities */}
      <ActivityDetailsModal
        isOpen={showActivityModal}
        onClose={() => {
          setShowActivityModal(false);
          setSelectedActivityForModal(null);
        }}
        activity={selectedActivityForModal}
        onEdit={(activity) => {
          handleEditActivity(activity);
          setShowActivityModal(false);
          setSelectedActivityForModal(null);
        }}
      />

    </div>
  );
}