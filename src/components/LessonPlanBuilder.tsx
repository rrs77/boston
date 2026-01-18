import React, { useState, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Save, 
  Clock, 
  Users, 
  Search,
  Grid,
  List,
  Tag,
  ArrowUpDown,
  ArrowDownUp,
  MoreVertical,
  Plus,
  Check,
  Filter,
  Edit3,
  FolderOpen,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { ActivityStackCard } from './ActivityStackCard';
import { LessonDropZone } from './LessonDropZone';
import { ActivityDetailsModal } from './ActivityDetailsModal';
import { ActivityDetails } from './ActivityDetails';
import { SimpleNestedCategoryDropdown } from './SimpleNestedCategoryDropdown';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { useIsViewOnly } from '../hooks/useIsViewOnly';
import type { Activity, LessonPlan, ActivityStack } from '../contexts/DataContext';

// Define half-term periods
const HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct' },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec' },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb' },
  { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr' },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May' },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul' },
];

interface LessonPlanBuilderProps {
  editingLessonNumber?: string;
  onEditComplete?: () => void;
  onUnsavedChangesChange?: (hasChanges: boolean) => void;
}

export function LessonPlanBuilder({ 
  editingLessonNumber, 
  onEditComplete,
  onUnsavedChangesChange 
}: LessonPlanBuilderProps = {}) {
  const isViewOnly = useIsViewOnly();
  const { currentSheetInfo, allLessonsData, addOrUpdateUserLessonPlan, userCreatedLessonPlans, allActivities, activityStacks } = useData();
  const { categories, customYearGroups, mapActivityLevelToYearGroup } = useSettings();
  
  // Early return if essential data is not loaded
  if (!currentSheetInfo || !categories || !Array.isArray(categories) || !Array.isArray(allActivities)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lesson builder...</p>
        </div>
      </div>
    );
  }
  
  // Get categories assigned to current year group
  const getCurrentYearGroupKeys = (): string[] => {
    const sheetId = currentSheetInfo?.sheet;
    if (!sheetId) return [];
    
    if (!customYearGroups || !Array.isArray(customYearGroups)) {
      return [];
    }
    
    // Try exact match first
    let yearGroup = customYearGroups.find(yg => yg.id === sheetId);
    
    // If no exact match, try to find by name match (e.g., "Reception Music" contains "Reception")
    if (!yearGroup) {
      yearGroup = customYearGroups.find(yg => {
        // Check if sheet name contains year group name or vice versa
        const sheetLower = sheetId.toLowerCase();
        const ygNameLower = yg.name.toLowerCase();
        const ygIdLower = yg.id.toLowerCase();
        return sheetLower.includes(ygNameLower) || 
               sheetLower.includes(ygIdLower) ||
               ygNameLower.includes(sheetLower) ||
               ygIdLower.includes(sheetLower);
      });
    }
    
    if (yearGroup) {
      // Return both the ID and name as potential keys to check
      // This handles cases where category.yearGroups might use either format
      const keys = [yearGroup.id];
      // Also add common year group names that might be in category.yearGroups
      if (yearGroup.name.toLowerCase().includes('reception')) {
        keys.push('Reception');
      }
      if (yearGroup.name.toLowerCase().includes('lower kindergarten') || yearGroup.name.toLowerCase().includes('lkg')) {
        keys.push('LKG');
      }
      if (yearGroup.name.toLowerCase().includes('upper kindergarten') || yearGroup.name.toLowerCase().includes('ukg')) {
        keys.push('UKG');
      }
      return keys;
    }
    return [];
  };
  
  // Get categories available for current year group
  const availableCategoriesForYearGroup = React.useMemo(() => {
    // Safety check - ensure categories array exists
    if (!categories || categories.length === 0) {
      console.warn('📋 Lesson Builder: No categories available');
      return [];
    }
    
    const yearGroupKeys = getCurrentYearGroupKeys();
    if (yearGroupKeys.length === 0) {
      // If no year group selected, show all categories
      console.log('📋 Lesson Builder: No year group selected, showing all categories');
      return categories.map(c => c.name);
    }
    
    console.log('📋 Lesson Builder: Filtering categories for year group:', {
      yearGroupKeys,
      currentSheet: currentSheetInfo?.sheet,
      totalCategories: categories.length,
      categoriesWithYearGroups: categories.filter(c => c.yearGroups && Object.keys(c.yearGroups).length > 0).length
    });
    
    // Filter categories that are assigned to this year group
    const filteredCategories = categories
      .filter(category => {
        // CRITICAL: Categories without yearGroups assigned should NEVER be shown
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
          console.log(`❌ Category "${category.name}" has old default assignments - excluding`);
          return false;
        }
        
        // Check if this category is assigned to ANY of the year group keys
        // This handles cases where the sheet name is "Reception Music" but category.yearGroups uses "Reception"
        // Also handles "Lower Kindergarten" vs "Lower Kindergarten Music"
        let isAssigned = yearGroupKeys.some(key => {
          // Check exact match first
          if (category.yearGroups[key] === true) {
            return true;
          }
          
          // Also check if any key in category.yearGroups matches any of our year group keys
          return Object.keys(category.yearGroups).some(catKey => {
            if (category.yearGroups[catKey] !== true) return false;
            
            const keyLower = key.toLowerCase();
            const catKeyLower = catKey.toLowerCase();
            
            // Exact match
            if (catKeyLower === keyLower) return true;
            
            // Partial match: if key contains catKey (e.g., "Reception Music" contains "Reception")
            if (catKeyLower.includes(keyLower)) return true;
            
            // Reverse partial match: if catKey contains key (e.g., "Reception" in "Reception Music")
            if (keyLower.includes(catKeyLower)) return true;
            
            // Check for common abbreviations and full names
            // "LKG" should match "Lower Kindergarten Music" or "Lower Kindergarten"
            if (keyLower === 'lkg' && catKeyLower.includes('lower kindergarten')) return true;
            if (keyLower.includes('lower kindergarten') && catKeyLower === 'lkg') return true;
            
            // "UKG" should match "Upper Kindergarten Music" or "Upper Kindergarten"
            if (keyLower === 'ukg' && catKeyLower.includes('upper kindergarten')) return true;
            if (keyLower.includes('upper kindergarten') && catKeyLower === 'ukg') return true;
            
            return false;
          });
        });
        
        if (isAssigned) {
          console.log(`✅ Category "${category.name}" is assigned to year group`, {
            yearGroupKeys,
            categoryYearGroupKeys: Object.keys(category.yearGroups).filter(k => category.yearGroups[k] === true)
          });
          return true;
        }
        
        console.log(`❌ Category "${category.name}" is NOT assigned to any of ${yearGroupKeys.join(', ')}`, {
          categoryYearGroupKeys: Object.keys(category.yearGroups),
          categoryYearGroupValues: Object.keys(category.yearGroups).filter(k => category.yearGroups[k] === true)
        });
        return false;
      })
      .map(c => c.name);
    
    console.log('📋 Lesson Builder: Filtered categories:', {
      yearGroupKeys: yearGroupKeys,
      matchedCategories: filteredCategories.length,
      categoryNames: filteredCategories
    });
    
    return filteredCategories;
  }, [categories, currentSheetInfo, customYearGroups]);
  
  // Helper function to get storage key
  const getStorageKeyHelper = (className: string) => `lesson-builder-draft-${className}`;

  // Initialize currentLessonPlan with a default value instead of null
  const [currentLessonPlan, setCurrentLessonPlan] = useState<LessonPlan>(() => {
    // If editing an existing lesson
    if (editingLessonNumber && allLessonsData[editingLessonNumber]) {
      const existingLesson = allLessonsData[editingLessonNumber];
      
      // Convert database lesson format to builder format
      const activities = Object.values(existingLesson.grouped).flat().map(activity => ({
        ...activity,
        _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
      }));

      return {
        id: crypto.randomUUID(),
        date: new Date(),
        week: parseInt(editingLessonNumber),
        className: currentSheetInfo?.sheet || '',
        activities: activities,
        duration: existingLesson.totalTime,
        notes: '',
        status: 'draft',
        title: existingLesson.title || `Lesson ${editingLessonNumber}`,
        term: '',
        lessonNumber: editingLessonNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEditingExisting: true
      };
    }
    
    // Check for draft in localStorage
    const className = currentSheetInfo?.sheet || 'default';
    const storageKey = getStorageKeyHelper(className);
    try {
      const draftData = localStorage.getItem(storageKey);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        return {
          ...parsed,
          date: new Date(parsed.date),
          createdAt: new Date(parsed.createdAt),
          updatedAt: new Date(parsed.updatedAt),
        };
      }
    } catch (error) {
      console.error('Failed to load draft from localStorage:', error);
    }
    
    // Default new lesson
    return {
      id: crypto.randomUUID(),
      date: new Date(),
      week: 1,
      className: currentSheetInfo?.sheet || '',
      activities: [],
      duration: 0,
      notes: '',
      status: 'draft',
      title: '',
      term: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'time' | 'level'>('category');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lessonNumber, setLessonNumber] = useState<string>('');
  
  // Activity preview and edit states
  const [activityToView, setActivityToView] = useState<Activity | null>(null);
  const [showActivityPreview, setShowActivityPreview] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  
  // Stack-related state
  const [expandedStacks, setExpandedStacks] = useState<Set<string>>(new Set());
  const [showStacks, setShowStacks] = useState(true);
  const [selectedStackIds, setSelectedStackIds] = useState<Set<string>>(new Set());

  // Ref to track if we're intentionally clearing (to avoid prompts)
  const isClearingRef = useRef(false);
  // Ref to track if we've shown the restore prompt
  const hasShownRestorePromptRef = useRef(false);

  // Get localStorage key for this class
  const getStorageKey = () => {
    const className = currentSheetInfo?.sheet || 'default';
    return `lesson-builder-draft-${className}`;
  };

  // Save lesson draft to localStorage
  const saveDraftToStorage = (lessonPlan: LessonPlan) => {
    try {
      const storageKey = getStorageKey();
      const draftData = {
        ...lessonPlan,
        date: lessonPlan.date.toISOString(),
        createdAt: lessonPlan.createdAt.toISOString(),
        updatedAt: lessonPlan.updatedAt.toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(draftData));
    } catch (error) {
      console.error('Failed to save draft to localStorage:', error);
    }
  };

  // Load lesson draft from localStorage
  const loadDraftFromStorage = (): LessonPlan | null => {
    try {
      const storageKey = getStorageKey();
      const draftData = localStorage.getItem(storageKey);
      if (!draftData) return null;

      const parsed = JSON.parse(draftData);
      return {
        ...parsed,
        date: new Date(parsed.date),
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
      };
    } catch (error) {
      console.error('Failed to load draft from localStorage:', error);
      return null;
    }
  };

  // Clear draft from localStorage
  const clearDraftFromStorage = () => {
    try {
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear draft from localStorage:', error);
    }
  };

  // Check for draft on mount and prompt user if found
  useEffect(() => {
    // Only check for draft if not editing an existing lesson
    if (!editingLessonNumber && !hasShownRestorePromptRef.current) {
      const draft = loadDraftFromStorage();
      // Check if we loaded a draft in initial state (has activities or title)
      const hasDraftInState = currentLessonPlan.activities.length > 0 || currentLessonPlan.title !== '';
      
      if (draft && (draft.activities.length > 0 || draft.title !== '')) {
        // If we already loaded it in initial state, silently restore it (no prompt needed)
        // User can continue working seamlessly
        if (hasDraftInState) {
          hasShownRestorePromptRef.current = true;
          // Check if there are actual changes compared to what's loaded
          // If draft matches what's already loaded, no need to set unsaved changes
          const hasChanges = 
            draft.activities.length !== currentLessonPlan.activities.length ||
            draft.title !== currentLessonPlan.title ||
            draft.notes !== currentLessonPlan.notes ||
            draft.duration !== currentLessonPlan.duration;
          
          if (hasChanges) {
            setHasUnsavedChanges(true);
          }
        }
      }
      hasShownRestorePromptRef.current = true;
    }
  }, []); // Only run on mount

  // Save draft whenever lesson plan changes (even after saving, so user can continue working)
  useEffect(() => {
    // Always save draft if not editing an existing lesson, so user can switch tabs and continue
    if (!editingLessonNumber) {
      saveDraftToStorage(currentLessonPlan);
    }
  }, [currentLessonPlan, editingLessonNumber]);

  // Handle beforeunload (browser close/navigation) - only warn on actual page close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only warn if there are unsaved changes AND user is actually leaving the page
      // Don't warn on tab switches since we auto-save drafts
      if (hasUnsavedChanges && !isClearingRef.current) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle visibility change (tab switch) - silently save draft, no prompts
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isClearingRef.current) {
        // Silently save draft when tab becomes hidden - no prompts
        saveDraftToStorage(currentLessonPlan);
      } else if (!document.hidden && !editingLessonNumber) {
        // When tab becomes visible, restore draft if needed
        const draft = loadDraftFromStorage();
        if (draft && (draft.activities.length > 0 || draft.title !== '')) {
          // Check if current lesson is different from draft
          const isDifferent = 
            draft.activities.length !== currentLessonPlan.activities.length ||
            draft.title !== currentLessonPlan.title ||
            draft.notes !== currentLessonPlan.notes ||
            draft.duration !== currentLessonPlan.duration ||
            draft.lessonNumber !== currentLessonPlan.lessonNumber;
          
          if (isDifferent) {
            // Restore the draft silently
            setCurrentLessonPlan(draft);
            setLessonNumber(draft.lessonNumber || lessonNumber);
            // Only mark as unsaved if there are actual changes
            if (draft.activities.length > 0 || draft.title !== '') {
              setHasUnsavedChanges(true);
            }
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentLessonPlan, editingLessonNumber, lessonNumber]);

  // Generate a lesson number when component mounts
  useEffect(() => {
    if (!editingLessonNumber) {
      generateNextLessonNumber();
    }
  }, [allLessonsData, currentSheetInfo?.sheet, editingLessonNumber]);

  // Generate the next available lesson number
  const generateNextLessonNumber = () => {
    const lessonNumbers = Object.keys(allLessonsData).map(num => parseInt(num));
    if (lessonNumbers.length === 0) {
      setLessonNumber('1');
      return;
    }
    
    const maxLessonNumber = Math.max(...lessonNumbers);
    setLessonNumber((maxLessonNumber + 1).toString());
    
    // Also update the current lesson plan
    setCurrentLessonPlan(prev => ({
      ...prev,
      lessonNumber: (maxLessonNumber + 1).toString()
    }));
  };

  // Notify parent component about unsaved changes
  useEffect(() => {
    if (onUnsavedChangesChange) {
      onUnsavedChangesChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChangesChange]);

  const handleUpdateLessonPlan = (updatedPlan: LessonPlan) => {
    if (isViewOnly) {
      alert('View-only mode: Cannot save lesson plans.');
      return;
    }
    try {
      // Validate that the plan has a title
      if (!updatedPlan.title.trim()) {
        alert('Please provide a lesson title');
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        return false;
      }
      
      // Make sure the lesson has a lesson number
      if (!updatedPlan.lessonNumber) {
        updatedPlan.lessonNumber = lessonNumber;
      }
      
      // Save the lesson plan using the context function
      addOrUpdateUserLessonPlan(updatedPlan);
      
      setCurrentLessonPlan(updatedPlan);
      setSaveStatus('success');
      setHasUnsavedChanges(false);
      // Keep draft saved so user can continue editing after saving
      saveDraftToStorage(updatedPlan);
      setTimeout(() => setSaveStatus('idle'), 3000);
      return true;
    } catch (error) {
      console.error('Failed to update lesson plan:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return false;
    }
  };

  const handleActivityAdd = (activity: Activity) => {
    // Create a deep copy of the activity to avoid reference issues
    const activityCopy = JSON.parse(JSON.stringify(activity));
    
    // Generate a unique ID for this activity instance to ensure it's treated as unique
    const uniqueActivity = {
      ...activityCopy,
      _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
    };
    
    const updatedPlan = {
      ...currentLessonPlan,
      activities: [...currentLessonPlan.activities, uniqueActivity],
      duration: currentLessonPlan.duration + (uniqueActivity.time || 0),
    };
    
    setCurrentLessonPlan(updatedPlan);
    setHasUnsavedChanges(true);
  };


  // Handle activity preview from library
  const handleActivityPreview = (activity: Activity) => {
    setActivityToView(activity);
    setShowActivityPreview(true);
  };

  // Handle adding activity from preview modal
  const handleAddActivityFromPreview = (activity: Activity, isModified: boolean = false) => {
    // If the activity was modified, create a customized version
    if (isModified) {
      // Create a deep copy with a new ID to distinguish it from the original
      const customizedActivity = {
        ...JSON.parse(JSON.stringify(activity)),
        _id: undefined, // Remove original ID
        id: undefined,  // Remove original ID
        activity: activity.activity + ' (Customised)', // Mark as customised
        _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9),
        _isCustomized: true // Flag to indicate this is a customized version
      };
      handleActivityAdd(customizedActivity);
    } else {
      // Add the original activity
      handleActivityAdd(activity);
    }
    
    // Close the preview modal
    setShowActivityPreview(false);
    setActivityToView(null);
  };
  const handleActivityRemove = (activityIndex: number) => {
    const removedActivity = currentLessonPlan.activities[activityIndex];
    const updatedPlan = {
      ...currentLessonPlan,
      activities: currentLessonPlan.activities.filter((_, index) => index !== activityIndex),
      duration: currentLessonPlan.duration - (removedActivity.time || 0),
    };
    setCurrentLessonPlan(updatedPlan);
    setHasUnsavedChanges(true);
  };

  const handleActivityReorder = (dragIndex: number, hoverIndex: number) => {
    const draggedActivity = currentLessonPlan.activities[dragIndex];
    const newActivities = [...currentLessonPlan.activities];
    newActivities.splice(dragIndex, 1);
    newActivities.splice(hoverIndex, 0, draggedActivity);
    
    const updatedPlan = {
      ...currentLessonPlan,
      activities: newActivities,
    };
    
    setCurrentLessonPlan(updatedPlan);
    setHasUnsavedChanges(true);
  };

  const handleLessonPlanFieldUpdate = (field: string, value: any) => {
    const updatedPlan = {
      ...currentLessonPlan,
      [field]: value
    };
    setCurrentLessonPlan(updatedPlan);
    setHasUnsavedChanges(true);
  };

  // Stack Management Functions
  const handleToggleStackExpansion = (stackId: string) => {
    setExpandedStacks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stackId)) {
        newSet.delete(stackId);
      } else {
        newSet.add(stackId);
      }
      return newSet;
    });
  };

  const handleStackSelection = (stackId: string, selected: boolean) => {
    setSelectedStackIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(stackId);
      } else {
        newSet.delete(stackId);
      }
      return newSet;
    });
  };

  const handleStackDrop = (stack: ActivityStack) => {
    // Add all activities from the stack to the lesson
    const activitiesToAdd = stack.activities.map(activity => ({
      ...activity,
      _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
    }));

    const updatedPlan = {
      ...currentLessonPlan,
      activities: [...currentLessonPlan.activities, ...activitiesToAdd],
      duration: currentLessonPlan.duration + activitiesToAdd.reduce((sum, activity) => sum + (activity.time || 0), 0),
    };
    
    setCurrentLessonPlan(updatedPlan);
    setHasUnsavedChanges(true);
  };

  const handleSaveLessonPlan = () => {
    // Make sure the lesson has a lesson number
    if (!currentLessonPlan.lessonNumber) {
      const updatedPlan = {
        ...currentLessonPlan,
        lessonNumber
      };
      setCurrentLessonPlan(updatedPlan);
      const success = handleUpdateLessonPlan(updatedPlan);
      if (success) {
        setHasUnsavedChanges(false);
        // Keep draft saved so user can continue working after switching tabs
        saveDraftToStorage(updatedPlan);
        if (currentLessonPlan.isEditingExisting && onEditComplete) {
          onEditComplete();
        }
      }
    } else {
      const success = handleUpdateLessonPlan(currentLessonPlan);
      if (success) {
        setHasUnsavedChanges(false);
        // Keep draft saved so user can continue working after switching tabs
        saveDraftToStorage(currentLessonPlan);
        if (currentLessonPlan.isEditingExisting && onEditComplete) {
          onEditComplete();
        }
      }
    }
  };

  // Handle refresh/clear button
  const handleRefresh = () => {
    if (hasUnsavedChanges) {
      const confirmClear = window.confirm(
        'Are you sure you want to clear your current lesson? All unsaved changes will be lost.'
      );
      if (!confirmClear) {
        return;
      }
    }

    isClearingRef.current = true;
    
    // Clear draft from storage
    clearDraftFromStorage();
    
    // Reset to a new empty lesson
    const newPlan: LessonPlan = {
      id: crypto.randomUUID(),
      date: new Date(),
      week: 1,
      className: currentSheetInfo?.sheet || '',
      activities: [],
      duration: 0,
      notes: '',
      status: 'draft',
      title: '',
      term: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setCurrentLessonPlan(newPlan);
    setHasUnsavedChanges(false);
    generateNextLessonNumber();
    
    // Reset clearing flag after a short delay
    setTimeout(() => {
      isClearingRef.current = false;
    }, 100);
  };

  // Create a new lesson plan after saving the current one
  const handleCreateNewAfterSave = () => {
    // First save the current plan
    const planToSave = {
      ...currentLessonPlan,
      lessonNumber: currentLessonPlan.lessonNumber || lessonNumber
    };
    
    const success = handleUpdateLessonPlan(planToSave);
    
    if (success) {
      // Generate a new lesson number
      const newLessonNumber = (parseInt(lessonNumber) + 1).toString();
      setLessonNumber(newLessonNumber);
      
      // Create a new empty plan
      const newPlan: LessonPlan = {
        id: crypto.randomUUID(),
        date: new Date(),
        week: currentLessonPlan.week + 1, // Increment week number
        className: currentSheetInfo?.sheet || '',
        activities: [],
        duration: 0,
        notes: '',
        status: 'draft',
        title: '',
        term: '',
        lessonNumber: newLessonNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setCurrentLessonPlan(newPlan);
      setHasUnsavedChanges(false);
      
      if (onEditComplete) {
        onEditComplete();
      }
    }
  };

  // Navigation between lessons
  const navigateToLesson = (direction: 'prev' | 'next') => {
    // Check for unsaved changes
    if (hasUnsavedChanges) {
      const confirmNavigation = window.confirm('You have unsaved changes. Do you want to continue without saving?');
      if (!confirmNavigation) {
        return;
      }
    }
    
    // Find all user-created lesson plans for this class
    const classLessonPlans = userCreatedLessonPlans
      .filter(plan => plan.className === currentSheetInfo?.sheet)
      .sort((a, b) => {
        // Sort by lesson number if available, otherwise by date
        if (a.lessonNumber && b.lessonNumber) {
          return parseInt(a.lessonNumber) - parseInt(b.lessonNumber);
        }
        return a.date.getTime() - b.date.getTime();
      });
    
    // Find the current lesson in the list
    const currentIndex = classLessonPlans.findIndex(plan => plan.id === currentLessonPlan.id);
    
    if (currentIndex === -1) {
      // Current lesson is not saved yet
      if (direction === 'prev' && classLessonPlans.length > 0) {
        // Navigate to the last saved lesson
        setCurrentLessonPlan(classLessonPlans[classLessonPlans.length - 1]);
      } else if (direction === 'next') {
        // Create a new lesson
        handleCreateNewAfterSave();
      }
    } else {
      // Current lesson is in the list
      if (direction === 'prev' && currentIndex > 0) {
        setCurrentLessonPlan(classLessonPlans[currentIndex - 1]);
      } else if (direction === 'next' && currentIndex < classLessonPlans.length - 1) {
        setCurrentLessonPlan(classLessonPlans[currentIndex + 1]);
      } else if (direction === 'next' && currentIndex === classLessonPlans.length - 1) {
        // Create a new lesson
        handleCreateNewAfterSave();
      }
    }
    
    setHasUnsavedChanges(false);
  };

  // State for expanded categories
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set());

  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  // Group and filter activities by category
  const groupedActivitiesByCategory = React.useMemo(() => {
    // Safety check - ensure allActivities is an array
    if (!allActivities || !Array.isArray(allActivities)) {
      console.warn('📋 Lesson Builder: allActivities is not an array:', allActivities);
      return {};
    }
    
    // Filter activities by search query, category, AND year group assignment
    let filtered = allActivities.filter(activity => {
      const matchesSearch = searchQuery === '' || 
        activity.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by selected category if one is chosen (but still show all if 'all' is selected)
      const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
      
      // CRITICAL: Only show activities whose categories are assigned to the current year group
      const categoryIsAssignedToYearGroup = availableCategoriesForYearGroup.includes(activity.category);
      
      return matchesSearch && matchesCategory && categoryIsAssignedToYearGroup;
    });

    // Sort activities within each category
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.activity.localeCompare(b.activity);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'time':
          comparison = a.time - b.time;
          break;
        case 'level':
          comparison = (a.level || '').localeCompare(b.level || '');
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Group by category
    const grouped: Record<string, typeof filtered> = {};
    filtered.forEach(activity => {
      const category = activity.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(activity);
    });

    // Sort categories by the order they appear in availableCategoriesForYearGroup
    // Only show categories that are assigned to the current year group
    const sortedCategories = availableCategoriesForYearGroup
      .filter(categoryName => grouped[categoryName] && grouped[categoryName].length > 0)
      .concat(
        Object.keys(grouped).filter(cat => 
          !availableCategoriesForYearGroup.includes(cat) &&
          !categories.some(c => c.name === cat)
        )
      );

    return { grouped, sortedCategories };
  }, [allActivities, searchQuery, selectedCategory, sortBy, sortOrder, availableCategoriesForYearGroup, categories]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Toggle activity selection
  const toggleActivitySelection = (activityId: string) => {
    if (selectedActivities.includes(activityId)) {
      setSelectedActivities(prev => prev.filter(id => id !== activityId));
    } else {
      setSelectedActivities(prev => [...prev, activityId]);
    }
  };

  // Add selected activities to lesson plan
  const addSelectedActivities = () => {
    // Find all selected activities
    const activitiesToAdd = allActivities.filter(activity => {
      const activityId = `${activity.activity}-${activity.category}`;
      return selectedActivities.includes(activityId);
    });
    
    if (activitiesToAdd.length === 0) return;
    
    // Create a new array of activities with unique IDs
    const newActivities = activitiesToAdd.map(activity => {
      // Create a deep copy of the activity
      const activityCopy = JSON.parse(JSON.stringify(activity));
      
      // Add a unique ID
      return {
        ...activityCopy,
        _uniqueId: Date.now() + Math.random().toString(36).substring(2, 9)
      };
    });
    
    // Calculate new total duration
    const additionalDuration = newActivities.reduce((sum, activity) => sum + (activity.time || 0), 0);
    
    // Update the lesson plan
    const updatedPlan = {
      ...currentLessonPlan,
      activities: [...currentLessonPlan.activities, ...newActivities],
      duration: currentLessonPlan.duration + additionalDuration,
    };
    
    setCurrentLessonPlan(updatedPlan);
    setHasUnsavedChanges(true);
    
    // Clear selections after adding
    setSelectedActivities([]);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Main Content */}
          
          {/* Editing Mode Header */}
          {currentLessonPlan.isEditingExisting && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <Edit3 className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-blue-900">Editing:</span>
                      <input
                        type="text"
                        value={currentLessonPlan.title || ''}
                        onChange={(e) => handleLessonPlanFieldUpdate('title', e.target.value)}
                        className="flex-1 font-medium text-blue-900 bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Lesson Title"
                      />
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Make changes to activities and lesson details
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={handleSaveLessonPlan}
                    className="px-4 py-2 btn-primary text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={onEditComplete}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Library Panel */}
            <div className="lg:col-span-1 flex flex-col">
              <div className="bg-white rounded-card shadow-soft overflow-hidden sticky top-8 flex flex-col max-h-[calc(100vh-4rem)]">
                {/* Library Header */}
                <div className="p-6 border-b border-gray-200 text-white h-[180px] flex flex-col justify-between" style={{ background: 'linear-gradient(to right, #14B8A6, #0D9488)' }}>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">Activity Library - Build Your Lesson</h3>
                  </div>
                  
                  {/* Search and Category Filter - On one line */}
                  <div className="flex space-x-2">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search 
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                        style={{ color: '#FFFFFF' }}
                      />
                      <input
                        type="text"
                        placeholder="Search activities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-sm font-semibold text-white placeholder:text-white placeholder:opacity-90"
                      />
                    </div>
                    
                    {/* Category Filter */}
                    <SimpleNestedCategoryDropdown
                      selectedCategory={selectedCategory === 'all' ? '' : selectedCategory}
                      onCategoryChange={(category) => setSelectedCategory(category || 'all')}
                      placeholder="All Categories"
                      className="flex-1 px-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent text-sm truncate font-semibold"
                      dropdownBackgroundColor="#D6F2EE"
                      showAllCategories={true}
                    />
                  </div>
                  
                  {/* Add Selected Button */}
                  {selectedActivities.length > 0 && (
                    <div className="mt-3 mb-8" style={{ position: 'relative', zIndex: 30 }}>
                      <button
                        type="button"
                        onClick={addSelectedActivities}
                        className="w-full py-3 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 shadow-md"
                        style={{
                          backgroundColor: '#065F5B',
                          border: 'none',
                          cursor: 'pointer',
                          pointerEvents: 'auto'
                        }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0D9488'}
                        onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#065F5B'}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add {selectedActivities.length} Selected {selectedActivities.length === 1 ? 'Activity' : 'Activities'}</span>
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Stacks Section */}
                {activityStacks.length > 0 && (
                  <div className="border-b border-gray-200 bg-gray-50">
                    <div className="p-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>📚</span>
                          <h4 className="text-sm font-semibold text-gray-700">Activity Stacks</h4>
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                            {activityStacks.length}
                          </span>
                        </div>
                        <button
                          onClick={() => setShowStacks(!showStacks)}
                          className="px-3 py-1 btn-primary text-white rounded-md text-xs transition-colors"
                        >
                          {showStacks ? 'Hide Stacks' : 'Show Stacks'}
                        </button>
                      </div>
                    </div>
                    
                    {showStacks && (
                      <div className="p-3">
                        <div className="space-y-2">
                          {activityStacks.map((stack) => (
                            <ActivityStackCard
                              key={stack.id}
                              stack={stack}
                              isExpanded={expandedStacks.has(stack.id)}
                              onToggleExpand={() => handleToggleStackExpansion(stack.id)}
                              onEdit={() => {}} // Not needed in lesson builder
                              onDelete={() => {}} // Not needed in lesson builder
                              onAddActivities={() => {}} // Not needed in lesson builder
                              onRemoveActivity={() => {}} // Not needed in lesson builder
                              onUnstack={() => {}} // Not needed in lesson builder
                              draggable={true}
                              selectable={true}
                              isSelected={selectedStackIds.has(stack.id)}
                              onSelectionChange={handleStackSelection}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Activity List - Grouped by Category */}
                <div className="p-3 pt-6 flex-1 overflow-y-auto min-h-0">
                  {groupedActivitiesByCategory.sortedCategories.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No matching activities found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {groupedActivitiesByCategory.sortedCategories.map((categoryName) => {
                        const categoryActivities = groupedActivitiesByCategory.grouped[categoryName] || [];
                        const categoryInfo = categories.find(cat => cat.name === categoryName);
                        const categoryColor = categoryInfo?.color || '#6B7280';
                        const isExpanded = expandedCategories.has(categoryName);
                        
                        return (
                          <div key={categoryName} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Category Header */}
                            <div className="w-full bg-gray-50" style={{ borderLeft: `4px solid ${categoryColor}` }}>
                              <button
                                onClick={() => toggleCategory(categoryName)}
                                className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-gray-100 transition-colors"
                              >
                                <ChevronRight 
                                  className={`h-4 w-4 text-gray-600 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
                                />
                                <span 
                                  className="text-xs font-semibold px-2 py-1 rounded-full text-white whitespace-nowrap"
                                  style={{ backgroundColor: categoryColor }}
                                >
                                  {categoryName}
                                </span>
                                <span className="text-sm text-gray-600 whitespace-nowrap">
                                  {categoryActivities.length} {categoryActivities.length === 1 ? 'activity' : 'activities'}
                                </span>
                              </button>
                            </div>
                            
                            {/* Category Activities - One per line */}
                            {isExpanded && (
                              <div className="bg-white border-t border-gray-200">
                                <div className="grid grid-cols-1 gap-2 p-2">
                                  {categoryActivities.map((activity, index) => {
                                    const activityId = `${activity.activity}-${activity.category}`;
                                    const isSelected = selectedActivities.includes(activityId);
                                    
                                    return (
                                      <div 
                                        key={`${activity._id || activity.id || activityId}-${index}`}
                                      >
                                        <ActivityCard
                                          activity={activity}
                                          draggable={true}
                                          selectable={true}
                                          isSelected={isSelected}
                                          onSelectionChange={(id, selected) => {
                                            if (selected) {
                                              toggleActivitySelection(activityId);
                                            } else {
                                              toggleActivitySelection(activityId);
                                            }
                                          }}
                                          onActivityClick={handleActivityPreview}
                                          viewMode="compact"
                                          categoryColor={categoryColor}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lesson Plan Details */}
            <div className="lg:col-span-1 flex flex-col">
              <div className="flex-1">
                <LessonDropZone
                  lessonPlan={currentLessonPlan}
                  onActivityAdd={handleActivityAdd}
                  onActivityRemove={handleActivityRemove}
                  onActivityReorder={handleActivityReorder}
                  onLessonPlanFieldUpdate={handleLessonPlanFieldUpdate}
                  isEditing={true}
                  onActivityClick={(activity) => setSelectedActivity(activity)}
                  onSave={handleSaveLessonPlan}
                  onRefresh={handleRefresh}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Details Modal - Simple view for quick preview */}
      {selectedActivity && !editingActivity && (
        <ActivityDetailsModal
          isOpen={true}
          onClose={() => setSelectedActivity(null)}
          activity={selectedActivity}
          onEdit={(activity) => {
            // Open full editing modal
            setEditingActivity(activity);
          }}
        />
      )}

      {/* Activity Preview Modal - Simple view for quick preview */}
      {showActivityPreview && activityToView && !editingActivity && (
        <ActivityDetailsModal
          isOpen={true}
          onClose={() => {
            setShowActivityPreview(false);
            setActivityToView(null);
          }}
          activity={activityToView}
          onEdit={(activity) => {
            // Open full editing modal
            setEditingActivity(activity);
          }}
        />
      )}

      {/* Activity Editing Modal - Full featured editing */}
      {editingActivity && (
        <ActivityDetails
          activity={editingActivity}
          onClose={() => {
            setEditingActivity(null);
            setSelectedActivity(null);
            setShowActivityPreview(false);
            setActivityToView(null);
          }}
          isEditing={true}
          onUpdate={(updatedActivity) => {
            // Activity is updated in global context by ActivityDetails
            setEditingActivity(null);
            setSelectedActivity(null);
            setShowActivityPreview(false);
            setActivityToView(null);
          }}
        />
      )}

      {/* Save Status Message */}
      {saveStatus !== 'idle' && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className={`max-w-md w-full mx-auto px-6 py-4 rounded-lg shadow-xl transition-all duration-300 transform ${
            saveStatus === 'success' ? 'bg-teal-50 border border-teal-200' :
            'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center space-x-3">
              {saveStatus === 'success' ? (
                <>
                  <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    <Check className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-teal-800">Lesson saved successfully!</h3>
                    <p className="text-sm text-teal-600">Your lesson plan has been saved.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-red-800">Failed to save lesson</h3>
                    <p className="text-sm text-red-600">Please provide a lesson title.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </DndProvider>
  );
}