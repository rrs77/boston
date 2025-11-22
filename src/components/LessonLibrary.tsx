import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
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
  MoreVertical,
  Edit3,
  Download,
  Calendar,
  ChevronUp,
  ChevronDown,
  X,
  Check,
  Layers,
  Copy,
  FileText
} from 'lucide-react';
import { LessonLibraryCard } from './LessonLibraryCard';
import { StackedLessonCard } from './StackedLessonCard';
import { LessonStackBuilder } from './LessonStackBuilder';
import { MinimizableActivityCard } from './MinimizableActivityCard';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { useLessonStacks, type StackedLesson } from '../hooks/useLessonStacks';
import { LessonExporter } from './LessonExporter';
import { SimpleNestedCategoryDropdown } from './SimpleNestedCategoryDropdown';
import { LessonDetailsModal } from './LessonDetailsModal';
import { AssignToHalfTermModal } from './AssignToHalfTermModal';
import { ClassCopyModal } from './ClassCopyModal';
import { StandaloneLessonCreator } from './StandaloneLessonCreator';

// Helper function to safely render HTML content
const renderHtmlContent = (htmlContent) => {
  if (!htmlContent) return { __html: '' };
  return { __html: htmlContent };
};

// Helper function to get plain text from HTML (for search purposes)
const getPlainTextFromHtml = (html) => {
  if (!html) return '';
  
  const temp = document.createElement('div');
  temp.innerHTML = html;
  let text = temp.textContent || temp.innerText || '';
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
};

interface LessonLibraryProps {
  onLessonSelect?: (lessonNumber: string) => void;
  onLessonEdit?: (lessonNumber: string) => void;
  className?: string;
  onAssignToUnit?: (lessonNumber: string, halfTermId: string) => void;
}

// Define half-term periods
const HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct' },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec' },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb' },
  { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr' },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May' },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul' },
];

export function LessonLibrary({ 
  onLessonSelect, 
  onLessonEdit,
  className = '', 
  onAssignToUnit 
}: LessonLibraryProps) {
  const { 
    lessonNumbers, 
    allLessonsData, 
    currentSheetInfo, 
    halfTerms, 
    getLessonsForHalfTerm,
    updateLessonData,
    addOrUpdateUserLessonPlan,
    allActivities,
    loading,
    updateHalfTerm,
    copyLessonsToClass
  } = useData();
  const { getThemeForClass, categories, customYearGroups } = useSettings();
  const {
    stacks,
    createStack,
    updateStack,
    deleteStack,
    getAvailableLessons
  } = useLessonStacks();
  
  // DEBUG: Log allLessonsData to verify it's loaded
  console.log('📚 LessonLibrary - Render state:', {
    currentSheet: currentSheetInfo.sheet,
    loading,
    lessonNumbersCount: lessonNumbers?.length || 0,
    lessonNumbersSample: lessonNumbers?.slice(0, 3) || [],
    allLessonsDataKeys: Object.keys(allLessonsData),
    allLessonsDataCount: Object.keys(allLessonsData).length,
    stacksCount: stacks.length
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHalfTerm, setSelectedHalfTerm] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'number' | 'title' | 'activities' | 'time'>('number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [selectedLessonForExport, setSelectedLessonForExport] = useState<string | null>(null);
  const [selectedLessonForDetails, setSelectedLessonForDetails] = useState<string | null>(null);
  
  // New editing states
  const [editingLessonNumber, setEditingLessonNumber] = useState<string | null>(null);
  const [editingLessonActivities, setEditingLessonActivities] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHeaderFooterEdit, setShowHeaderFooterEdit] = useState(false);
  const [customHeader, setCustomHeader] = useState<string>('');
  const [customFooter, setCustomFooter] = useState<string>('');
  
  // Add Activity Modal State
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Stack Management State
  const [showStackBuilder, setShowStackBuilder] = useState(false);
  const [editingStack, setEditingStack] = useState<StackedLesson | null>(null);
  const [showStacksSection, setShowStacksSection] = useState(false); // Always start collapsed
  const [expandedStacks, setExpandedStacks] = useState<Set<string>>(new Set());
  const [showAssignToTermModal, setShowAssignToTermModal] = useState(false);
  const [selectedStackForAssignment, setSelectedStackForAssignment] = useState<StackedLesson | null>(null);
  
  // Class Copy State
  const [showClassCopyModal, setShowClassCopyModal] = useState(false);
  
  // Standalone Lesson Creator State
  const [showStandaloneLessonCreator, setShowStandaloneLessonCreator] = useState(false);
  
  // Lesson stacks section starts collapsed by default - user can expand it manually
  
  // Debug: Log expanded stacks state (removed to reduce console spam)
  
  // Get theme colors for current class
  const theme = getThemeForClass(className);

  // Get which half-term a lesson is assigned to (using dynamic data)
  const getLessonHalfTerm = (lessonNumber: string): string | null => {
    for (const halfTerm of halfTerms) {
      if (halfTerm.lessons.includes(lessonNumber)) {
        return halfTerm.id;
      }
    }
    return null; // Lesson not assigned to any half-term
  };

  // Start editing a lesson
  const handleStartEditing = (lessonNumber: string) => {
    const lessonData = allLessonsData[lessonNumber];
    if (lessonData) {
      // NEW: Use orderedActivities if available (preserves exact order across categories)
      // Otherwise fall back to categoryOrder method (for backward compatibility)
      let activities: any[];
      
      if (lessonData.orderedActivities && Array.isArray(lessonData.orderedActivities)) {
        // Use the flat ordered array - this preserves exact order including cross-category ordering
        activities = lessonData.orderedActivities.map((activity: any, index: number) => ({
          ...activity,
          _editId: `${lessonNumber}-${index}-${Date.now()}`
        }));
        console.log('📖 Loading lesson with orderedActivities (exact order preserved)');
      } else {
        // Fallback to old method using categoryOrder
        const categoryOrder = lessonData.categoryOrder || Object.keys(lessonData.grouped);
        activities = categoryOrder
          .filter(category => lessonData.grouped[category])
          .flatMap(category => lessonData.grouped[category] || [])
          .map((activity: any, index: number) => ({
            ...activity,
            _editId: `${lessonNumber}-${index}-${Date.now()}`
          }));
        console.log('📖 Loading lesson with categoryOrder (legacy method)');
      }
      
      console.log('📖 Loading lesson for editing:', {
        lessonNumber,
        activityCount: activities.length,
        activitiesOrder: activities.map((a, i) => `${i + 1}. ${a.activity} (${a.category})`)
      });
      
      // Load custom header and footer if they exist
      setCustomHeader(lessonData.customHeader || '');
      setCustomFooter(lessonData.customFooter || '');
      setShowHeaderFooterEdit(!!(lessonData.customHeader || lessonData.customFooter));
      
      setEditingLessonActivities(activities);
      setEditingLessonNumber(lessonNumber);
      setShowEditModal(true);
    }
  };

  // Save edited lesson
  const handleSaveEditing = async () => {
    console.log('💾 SAVE BUTTON CLICKED - Current state:', {
      lessonNumber: editingLessonNumber,
      activitiesCount: editingLessonActivities.length,
      currentOrder: editingLessonActivities.map((a, i) => `${i + 1}. ${a.activity} (${a.category})`)
    });
    
    if (editingLessonNumber && editingLessonActivities.length >= 0) {
      // Clean activities by removing temporary edit IDs
      const cleanedActivities = editingLessonActivities.map(activity => {
        const { _editId, ...cleanActivity } = activity;
        return cleanActivity;
      });

      // Group activities back by category while preserving order
      const grouped: Record<string, any[]> = {};
      const categoryOrder: string[] = [];
      
      cleanedActivities.forEach(activity => {
        const category = activity.category || 'Other';
        if (!grouped[category]) {
          grouped[category] = [];
          categoryOrder.push(category);
        }
        grouped[category].push(activity);
      });

      // Update lesson data - IMPORTANT: Save orderedActivities to preserve exact order
      const updatedLessonData = {
        ...allLessonsData[editingLessonNumber],
        grouped,
        categoryOrder,
        orderedActivities: cleanedActivities, // NEW: Store flat ordered array
        totalTime: cleanedActivities.reduce((sum: number, act: any) => sum + (act.time || 0), 0),
        customHeader: customHeader || undefined, // Only save if not empty
        customFooter: customFooter || undefined  // Only save if not empty
      };

      console.log('💾 Saving lesson with order:', {
        lessonNumber: editingLessonNumber,
        categoryOrder,
        activityCount: cleanedActivities.length,
        categories: Object.keys(grouped).map(cat => `${cat}: ${grouped[cat].length} activities`),
        orderedActivities: cleanedActivities.map((a, i) => `${i + 1}. ${a.activity} (${a.category})`),
        customHeader: customHeader || '(using default)',
        customFooter: customFooter || '(using default)'
      });

      // Update in context and wait for it to complete
      if (updateLessonData) {
        await updateLessonData(editingLessonNumber, updatedLessonData);
        console.log('✅ Lesson save complete');
      }
      
      cancelEditing();
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingLessonNumber(null);
    setEditingLessonActivities([]);
    setShowEditModal(false);
    setShowActivityPicker(false);
    setActivitySearchQuery('');
    setSelectedCategory('all');
    setShowHeaderFooterEdit(false);
    setCustomHeader('');
    setCustomFooter('');
  };

  // Delete activity
  const handleDeleteActivity = (activityIndex: number) => {
    setEditingLessonActivities(prev => prev.filter((_, index) => index !== activityIndex));
  };

  // Reorder activities
  const handleReorderActivity = (fromIndex: number, toIndex: number) => {
    console.log(`🔄 Reordering activity: from index ${fromIndex} to ${toIndex}`);
    setEditingLessonActivities(prev => {
      const newActivities = [...prev];
      const [movedActivity] = newActivities.splice(fromIndex, 1);
      newActivities.splice(toIndex, 0, movedActivity);
      console.log('📝 New activity order:', newActivities.map((a, i) => `${i + 1}. ${a.activity}`));
      return newActivities;
    });
  };

  // Add activity to editing lesson
  const handleAddActivity = (activity: any) => {
    const newActivity = {
      ...activity,
      _editId: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };
    setEditingLessonActivities(prev => [...prev, newActivity]);
    setShowActivityPicker(false);
    setActivitySearchQuery('');
    setSelectedCategory('all');
  };

  // Filter activities for the picker
  const filteredActivities = useMemo(() => {
    if (!allActivities) return [];
    
    return allActivities.filter((activity: any) => {
      const matchesSearch = !activitySearchQuery || 
        activity.activity.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
        getPlainTextFromHtml(activity.description).toLowerCase().includes(activitySearchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allActivities, activitySearchQuery, selectedCategory]);

  // Stack management functions
  const handleCreateStack = () => {
    setEditingStack(null);
    setShowStackBuilder(true);
  };

  const handleEditStack = (stack: StackedLesson) => {
    setEditingStack(stack);
    setShowStackBuilder(true);
  };

  const handleSaveStack = (stackData: Omit<StackedLesson, 'id' | 'created_at'>) => {
    if (editingStack) {
      updateStack(editingStack.id, stackData);
    } else {
      createStack(stackData);
    }
    setShowStackBuilder(false);
    setEditingStack(null);
  };

  const handleDeleteStack = (stackId: string) => {
    if (confirm('Are you sure you want to delete this lesson stack? This action cannot be undone.')) {
      deleteStack(stackId);
    }
  };

  const handleRenameStack = (stackId: string, newName: string) => {
    updateStack(stackId, { name: newName });
  };

  const handleAssignStackToTerm = (stackId: string) => {
    const stack = stacks.find(s => s.id === stackId);
    if (stack) {
      setSelectedStackForAssignment(stack);
      setShowAssignToTermModal(true);
    }
  };

  const handleStackAssignment = async (termId: string) => {
    if (!selectedStackForAssignment) {
      console.error('❌ STACK ASSIGNMENT - No stack selected for assignment');
      return;
    }

    const stackId = selectedStackForAssignment.id;
    console.log('🔄 STACK ASSIGNMENT - Starting assignment:', {
      stackId,
      stackName: selectedStackForAssignment.name,
      termId,
      stackLessons: selectedStackForAssignment.lessons
    });
    
    try {
      const stack = stacks.find(s => s.id === stackId);
      if (!stack) {
        console.error('❌ STACK ASSIGNMENT - Stack not found:', stackId);
        return;
      }

      // Get the current half-term data
      // termId might be a fallback ID like "SP1" or "A1", so we need to match by name too
      const termNameMap: Record<string, string> = {
        'A1': 'Autumn 1',
        'A2': 'Autumn 2',
        'SP1': 'Spring 1',
        'SP2': 'Spring 2',
        'SM1': 'Summer 1',
        'SM2': 'Summer 2'
      };
      
      const currentHalfTerm = halfTerms.find(term => 
        term.id === termId || term.name === termNameMap[termId]
      );
      
      if (!currentHalfTerm) {
        console.error('❌ STACK ASSIGNMENT - Half-term not found:', {
          termId,
          availableTerms: halfTerms.map(t => ({ id: t.id, name: t.name }))
        });
        return;
      }
      
      console.log('✅ STACK ASSIGNMENT - Found half-term:', {
        id: currentHalfTerm.id,
        name: currentHalfTerm.name,
        currentStacks: currentHalfTerm.stacks,
        currentLessons: currentHalfTerm.lessons
      });

      // Get current stacks assigned to this half-term
      const currentStacks = currentHalfTerm.stacks || [];
      
      // Add stack to the half-term (avoid duplicates)
      const newStacks = [...new Set([...currentStacks, stackId])];
      
      console.log('🔄 STACK ASSIGNMENT - Updating half-term:', {
        termId,
        termName: currentHalfTerm.name,
        oldStacks: currentStacks,
        newStacks,
        wasAlreadyAssigned: currentStacks.includes(stackId)
      });

      // Update the half-term with the new stack assignment
      await updateHalfTerm(termId, currentHalfTerm.lessons, currentHalfTerm.isComplete, newStacks);
      
      console.log('✅ STACK ASSIGNMENT - Successfully called updateHalfTerm');
      console.log('📋 STACK ASSIGNMENT - Half-term should now have stacks:', newStacks);
      
      setShowAssignToTermModal(false);
      setSelectedStackForAssignment(null);
      
      alert(`✅ Stack "${stack.name}" has been assigned to ${termNameMap[termId] || termId}!`);
      console.log('✅ STACK ASSIGNMENT - Assignment completed successfully');
    } catch (error) {
      console.error('❌ STACK ASSIGNMENT - Failed to assign stack to term:', error);
      alert(`❌ Failed to assign stack: ${error.message}`);
    }
  };

  const handleStackClick = (stack: StackedLesson) => {
    // You could implement stack viewing functionality here
    console.log('Stack clicked:', stack);
  };

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

  // Copy lessons to another class
  const handleCopyLessonsToClass = async (lessonNumbers: string[], targetClassId: string) => {
    try {
      await copyLessonsToClass(lessonNumbers, targetClassId);
      const targetClassName = customYearGroups.find(g => g.id === targetClassId)?.name || targetClassId;
      alert(`✅ Successfully copied ${lessonNumbers.length} ${lessonNumbers.length === 1 ? 'lesson' : 'lessons'} to ${targetClassName}!`);
    } catch (error) {
      console.error('Failed to copy lessons:', error);
      alert(`❌ Failed to copy lessons: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Save standalone lesson
  const handleSaveStandaloneLesson = async (lessonData: any) => {
    // Show loading toast
    const loadingToast = toast.loading('Saving lesson...');
    
    try {
      console.log('💾 Saving standalone lesson:', lessonData);
      
      // Generate next lesson number
      const maxLessonNumber = Math.max(
        0,
        ...Object.keys(allLessonsData).map(num => {
          const numStr = num.replace('lesson', '');
          return parseInt(numStr) || 0;
        })
      );
      const newLessonNumber = `lesson${maxLessonNumber + 1}`;
      
      console.log('📝 Generated lesson number:', newLessonNumber);
      
      // Mark as user-created lesson and ensure academic year is set
      const lessonDataWithFlag = {
        ...lessonData,
        isUserCreated: true,
        academicYear: currentSheetInfo.sheet // Use current sheet context
      };
      
      // Use updateLessonData for proper Supabase and localStorage sync
      if (!updateLessonData) {
        throw new Error('Save function not available');
      }
      
      // Save to both localStorage and Supabase
      await updateLessonData(newLessonNumber, lessonDataWithFlag);
      console.log('✅ Lesson saved via updateLessonData');
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Close modal
      setShowStandaloneLessonCreator(false);
      
      // Show success toast
      toast.success(`Lesson "${lessonData.title || newLessonNumber}" created successfully!`, {
        id: loadingToast,
        duration: 3000,
      });
      
      // The lesson should now appear automatically due to state updates
      // No page reload needed - React will re-render with the new lesson
      
    } catch (error) {
      console.error('❌ Failed to create standalone lesson:', error);
      
      // Show error toast
      toast.error(
        error instanceof Error ? error.message : 'Failed to create lesson. Please try again.',
        { id: loadingToast, duration: 5000 }
      );
      
      setShowStandaloneLessonCreator(false);
    }
  };

  // Duplicate lesson functionality
  const handleDuplicateLesson = (lessonNumber: string) => {
    console.log('🔄 handleDuplicateLesson called for:', lessonNumber);
    console.log('🔍 Available lesson numbers:', Object.keys(allLessonsData));
    console.log('🔍 All lessons data:', allLessonsData);
    
    const originalLesson = allLessonsData[lessonNumber];
    if (!originalLesson) {
      console.error('❌ Original lesson not found:', lessonNumber);
      console.error('❌ Available lessons:', Object.keys(allLessonsData));
      return;
    }

    console.log('📋 Original lesson data:', originalLesson);
    console.log('📋 Original lesson grouped activities:', originalLesson.grouped);
    console.log('📋 Original lesson categoryOrder:', originalLesson.categoryOrder);

    // Find the next available lesson number
    let newLessonNumber = lessonNumber;
    let counter = 1;
    while (allLessonsData[`${newLessonNumber}-copy-${counter}`]) {
      counter++;
    }
    newLessonNumber = `${lessonNumber}-copy-${counter}`;

    console.log('🆕 New lesson number will be:', newLessonNumber);

    // Create duplicated lesson data with "dupe" indicator and preserve original name
    const duplicatedLesson = {
      ...originalLesson,
      title: `${originalLesson.title || `Lesson ${lessonNumber}`} (Copy)`,
      // Ensure all activities are preserved - explicitly copy grouped activities
      grouped: originalLesson.grouped ? { ...originalLesson.grouped } : {},
      categoryOrder: originalLesson.categoryOrder ? [...originalLesson.categoryOrder] : [],
      standards: originalLesson.standards ? [...originalLesson.standards] : [],
      // Keep all other properties the same (totalTime, etc.)
    };

    console.log('📝 Duplicated lesson data:', duplicatedLesson);

    // Update the lesson data in the context
    if (updateLessonData) {
      console.log('💾 Calling updateLessonData...');
      console.log('💾 New lesson number:', newLessonNumber);
      console.log('💾 Duplicated lesson data:', duplicatedLesson);
      
      updateLessonData(newLessonNumber, duplicatedLesson)
        .then(() => {
          console.log('✅ updateLessonData completed successfully');
        })
        .catch((error) => {
          console.error('❌ updateLessonData failed:', error);
        });
    } else {
      console.error('❌ updateLessonData function not available');
    }

    // Also create a lesson plan entry for the duplicated lesson
    if (addOrUpdateUserLessonPlan) {
      const duplicatedLessonPlan = {
        id: `lesson-${newLessonNumber}`,
        lessonNumber: newLessonNumber,
        title: duplicatedLesson.title,
        activities: [], // Will be populated from the lesson data
        duration: duplicatedLesson.totalTime || 0,
        standards: duplicatedLesson.standards || [],
        notes: `Duplicated from ${originalLesson.title || `Lesson ${lessonNumber}`}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('💾 Creating lesson plan for duplicated lesson...');
      addOrUpdateUserLessonPlan(duplicatedLessonPlan);
      console.log('✅ Lesson plan created for duplicated lesson');
    }

    console.log(`✅ Duplicated lesson ${lessonNumber} as ${newLessonNumber}`);
  };

  // Filter and sort lessons
  const filteredAndSortedLessons = useMemo(() => {
    try {
      if (!allLessonsData || typeof allLessonsData !== 'object') {
        console.warn('LessonLibrary: allLessonsData is not an object:', allLessonsData);
        return [];
      }
      
      // Safety check: Include all lessons from allLessonsData, even if not in lessonNumbers
      // This ensures no lessons are missed due to sync issues
      const allAvailableLessons = new Set<string>();
      
      // Add lessons from lessonNumbers array
      if (lessonNumbers && Array.isArray(lessonNumbers)) {
        lessonNumbers.forEach(num => allAvailableLessons.add(num));
      }
      
      // Add any lessons that exist in allLessonsData but might be missing from lessonNumbers
      Object.keys(allLessonsData).forEach(lessonNum => {
        if (allLessonsData[lessonNum]) {
          allAvailableLessons.add(lessonNum);
        }
      });
      
      // Convert to array and filter
      let filtered = Array.from(allAvailableLessons).filter(lessonNum => {
        const lessonData = allLessonsData[lessonNum];
        if (!lessonData) return false;
      
      // Filter by search query
      if (searchQuery) {
        const matchesSearch = 
          lessonNum.includes(searchQuery) || 
          (lessonData.title && lessonData.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          Object.values(lessonData.grouped).some((activities: any) => 
            activities.some((activity: any) => 
              activity.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
              getPlainTextFromHtml(activity.description).toLowerCase().includes(searchQuery.toLowerCase())
            )
          );
        
        if (!matchesSearch) return false;
      }
      
      // Filter by half-term using dynamic data instead of static mapping
      if (selectedHalfTerm !== 'all') {
        const lessonHalfTerm = getLessonHalfTerm(lessonNum);
        if (lessonHalfTerm !== selectedHalfTerm) return false;
      }
      
      return true;
    });

    // Sort lessons
    filtered.sort((a, b) => {
      const lessonA = allLessonsData[a];
      const lessonB = allLessonsData[b];
      
      if (!lessonA || !lessonB) return 0;
      
      let comparison = 0;
      
      switch (sortBy) {
        case 'number':
          // Handle both "1" and "lesson1" formats
          const numA = parseInt(a.replace('lesson', '')) || 0;
          const numB = parseInt(b.replace('lesson', '')) || 0;
          comparison = numA - numB;
          break;
        case 'title':
          comparison = (lessonA.title || `Lesson ${a}`).localeCompare(lessonB.title || `Lesson ${b}`);
          break;
        case 'activities':
          const activitiesA = Object.values(lessonA.grouped).reduce((sum: number, acts: any) => sum + acts.length, 0);
          const activitiesB = Object.values(lessonB.grouped).reduce((sum: number, acts: any) => sum + acts.length, 0);
          comparison = activitiesA - activitiesB;
          break;
        case 'time':
          comparison = lessonA.totalTime - lessonB.totalTime;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
    } catch (error) {
      console.error('LessonLibrary: Error filtering lessons:', error);
      return [];
    }
  }, [lessonNumbers, allLessonsData, searchQuery, selectedHalfTerm, sortBy, sortOrder, halfTerms]);

  const toggleSort = (field: 'number' | 'title' | 'activities' | 'time') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleLessonClick = (lessonNumber: string) => {
    if (onLessonSelect) {
      onLessonSelect(lessonNumber);
    } else {
      setSelectedLessonForDetails(lessonNumber);
    }
  };

  const handleAssignToHalfTerm = (lessonNumber: string, halfTermId: string) => {
    console.log('LessonLibrary: Assigning lesson', lessonNumber, 'to half-term', halfTermId);
    if (onAssignToUnit) {
      onAssignToUnit(lessonNumber, halfTermId);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg  overflow-hidden ${className}`}>
        <div className="p-6 border-b border-gray-200 text-white"
style={{ background: 'linear-gradient(to right, #2DD4BF, #14B8A6)' }}>
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6" />
            <h2 className="text-xl font-bold">Lesson Library</h2>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lessons...</p>
        </div>
      </div>
    );
  }

  // Show error state if no data (but only after loading is complete)
  if (!loading && (!lessonNumbers || lessonNumbers.length === 0 || !allLessonsData || Object.keys(allLessonsData).length === 0)) {
    console.log('📚 LessonLibrary - Showing no data message:', {
      loading,
      hasLessonNumbers: !!lessonNumbers,
      lessonNumbersLength: lessonNumbers?.length,
      hasAllLessonsData: !!allLessonsData,
      allLessonsDataLength: Object.keys(allLessonsData || {}).length
    });
    
    return (
      <div className={`bg-white rounded-xl shadow-lg  overflow-hidden ${className}`}>
        <div className="p-6 border-b border-gray-200 text-white"
style={{ background: 'linear-gradient(to right, #2DD4BF, #14B8A6)' }}>
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6" />
            <h2 className="text-xl font-bold">Lesson Library</h2>
          </div>
        </div>
        <div className="p-8 text-center">
          <p className="text-gray-600">No lessons found for {currentSheetInfo.display}.</p>
          <p className="text-sm text-gray-500 mt-2">Switch to Lesson Builder to create your first lesson.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg  overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 text-white"
style={{ backgroundColor: '#10A293' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Lesson Library</h2>
              <p className="text-teal-100 text-sm">
                {filteredAndSortedLessons.length} of {lessonNumbers.length} lessons
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setViewMode('compact')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'compact' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'list' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'grid' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>


      <div className="p-8">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none"
              dir="ltr"
            />
          </div>
          
          <select
            value={selectedHalfTerm}
            onChange={(e) => setSelectedHalfTerm(e.target.value)}
            className="h-10 px-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-teal-500 focus:outline-none w-48"
            dir="ltr"
          >
            <option value="all" className="text-gray-900">All Half-Terms</option>
            {HALF_TERMS.map(term => (
              <option key={term.id} value={term.id} className="text-gray-900">
                {term.name} ({term.months})
              </option>
            ))}
          </select>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleSort('number')}
              className={`flex items-center justify-center space-x-1 h-10 px-3 rounded-lg transition-colors duration-200 ${
                sortBy === 'number' ? 'bg-teal-600 text-white border border-teal-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <span className="text-sm">#</span>
              {sortBy === 'number' && (sortOrder === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowDownUp className="h-4 w-4" />)}
            </button>
            <button
              onClick={() => toggleSort('time')}
              className={`flex items-center justify-center space-x-1 h-10 px-3 rounded-lg transition-colors duration-200 ${
                sortBy === 'time' ? 'bg-teal-600 text-white border border-teal-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <Clock className="h-4 w-4" />
              {sortBy === 'time' && (sortOrder === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowDownUp className="h-4 w-4" />)}
            </button>
            <button
              onClick={() => toggleSort('activities')}
              className={`flex items-center justify-center space-x-1 h-10 px-3 rounded-lg transition-colors duration-200 ${
                sortBy === 'activities' ? 'bg-teal-600 text-white border border-teal-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <Tag className="h-4 w-4" />
              {sortBy === 'activities' && (sortOrder === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowDownUp className="h-4 w-4" />)}
            </button>
            
            {/* Create Lesson Button */}
            <button
              onClick={() => setShowStandaloneLessonCreator(true)}
              className="flex items-center justify-center space-x-2 h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 whitespace-nowrap"
              title="Create a standalone lesson plan"
            >
              <FileText className="h-4 w-4" />
              <span>Create Lesson</span>
            </button>

            {/* Copy Lesson Button */}
            <button
              onClick={() => setShowClassCopyModal(true)}
              className="flex items-center justify-center space-x-2 h-10 px-5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200 whitespace-nowrap"
              title="Copy lessons to another class"
            >
              <Copy className="h-4 w-4" />
              <span>Copy Lesson</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stacked Lessons Section */}
      {(stacks.length > 0 || true) && (
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-800">Lesson Stacks</h3>
                <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                  {stacks.length} of {stacks.length}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCreateStack}
                  className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors"
                  title="Create New Lesson Stack"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowStacksSection(!showStacksSection)}
                  className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors"
                  title={showStacksSection ? `Hide Stacks (${stacks.length})` : `Show Stacks (${stacks.length})`}
                >
                  {showStacksSection ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {showStacksSection && (
            <div className="p-4">
              {stacks.length === 0 ? (
                <div className="text-center py-8">
                  <Layers className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-4">No lesson stacks yet</p>
                  <p className="text-xs text-gray-400 mb-4">
                    Create lesson stacks to organize multiple lessons together
                  </p>
                  <button
                    onClick={handleCreateStack}
                    className="px-4 py-2 btn-primary text-white rounded-lg text-sm transition-colors"
                  >
                    Create Your First Stack
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {stacks.map((stack) => (
                    <StackedLessonCard
                      key={stack.id}
                      stack={stack}
                      allLessonsData={allLessonsData}
                      theme={theme}
                      viewMode="activity-stack-style"
                      onClick={() => handleStackClick(stack)}
                      onEdit={() => handleEditStack(stack)}
                      onDelete={() => handleDeleteStack(stack.id)}
                      onRename={(newName) => handleRenameStack(stack.id, newName)}
                      onAssignToTerm={() => handleAssignStackToTerm(stack.id)}
                      isExpanded={expandedStacks.has(stack.id)}
                      onToggleExpansion={() => {
                        handleToggleStackExpansion(stack.id);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Regular Lessons Section */}
      <div className="p-6">
        {filteredAndSortedLessons.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedHalfTerm !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No lessons available in the library'
                }
              </p>
              {(searchQuery || selectedHalfTerm !== 'all') && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedHalfTerm('all');
                  }}
                  className="mt-4 px-4 py-2 btn-primary text-white rounded-lg text-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className={`
              ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8' :
                viewMode === 'list' ? 'space-y-4 sm:space-y-6' :
                'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6'
              }
            `}>
              {filteredAndSortedLessons.map((lessonNum, index) => {
                const lessonData = allLessonsData[lessonNum];
                
                // Debug logging removed (was logging for every lesson on every render)
                // Uncomment if you need to debug a specific lesson issue:
                // console.log(`Lesson ${lessonNum}:`, lessonData?.title);
                
                if (!lessonData) {
                  console.warn(`❌ Missing lesson data for lesson ${lessonNum}`);
                  return null;
                }
                
                return (
                  <LessonLibraryCard
                    key={lessonNum}
                    lessonNumber={lessonNum}
                    displayNumber={index + 1}
                    lessonData={lessonData}
                    viewMode={viewMode}
                    onClick={() => handleLessonClick(lessonNum)}
                    theme={theme}
                    onAssignToUnit={handleAssignToHalfTerm}
                    halfTerms={halfTerms}
                    onEdit={() => handleStartEditing(lessonNum)}
                    onDuplicate={() => handleDuplicateLesson(lessonNum)}
                  />
                );
              })}
            </div>
        )}
      </div>

      {/* Activity Picker Modal */}
      {showActivityPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 text-white"
style={{ background: 'linear-gradient(to right, #2DD4BF, #14B8A6)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add Activity to Lesson</h3>
                <button
                  onClick={() => setShowActivityPicker(false)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Search and Filter */}
              <div className="flex space-x-3 mt-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={activitySearchQuery}
                    onChange={(e) => setActivitySearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div className="relative" style={{ minWidth: '250px' }}>
                  <SimpleNestedCategoryDropdown
                    selectedCategory={selectedCategory === 'all' ? '' : selectedCategory}
                    onCategoryChange={(category) => setSelectedCategory(category || 'all')}
                    placeholder="All Categories"
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredActivities.map((activity: any, index: number) => (
                  <button
                    key={`${activity.id || index}-${activity.activity}`}
                    onClick={() => handleAddActivity(activity)}
                    className="text-left p-4 bg-gray-50 hover:bg-blue-50 rounded-lg  hover:border-blue-300 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm mb-1">
                          {activity.activity}
                        </h4>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xs px-2 py-1 bg-gray-200 rounded-full text-gray-600">
                            {activity.category}
                          </span>
                          {activity.time > 0 && (
                            <span className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {activity.time}m
                            </span>
                          )}
                        </div>
                        <div 
                          className="text-xs text-gray-600 line-clamp-2 prose prose-xs max-w-none"
                          dangerouslySetInnerHTML={renderHtmlContent(activity.description)}
                        />
                      </div>
                      <Plus className="h-5 w-5 text-blue-600 ml-2 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
              
              {filteredActivities.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No activities found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lesson Edit Modal */}
      {showEditModal && editingLessonNumber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Edit Header */}
            <div className="p-4 border-b border-gray-200 text-white"
style={{ background: 'linear-gradient(to right, #2DD4BF, #14B8A6)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Edit3 className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">
                    Editing: {allLessonsData[editingLessonNumber]?.title || `Lesson ${editingLessonNumber}`}
                  </h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveEditing}
                    className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 bg-transparent hover:bg-white hover:bg-opacity-10 text-white font-medium rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Header/Footer Toggle */}
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHeaderFooterEdit}
                  onChange={(e) => setShowHeaderFooterEdit(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">
                  Edit header and footer text
                </span>
              </label>
            </div>

            {/* Header/Footer Edit Section - Collapsible */}
            {showHeaderFooterEdit && (
              <div className="border-b border-gray-200 bg-blue-50 px-6 py-4">
                <div className="space-y-4">
                  {/* Header Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Header
                    </label>
                    <input
                      type="text"
                      value={customHeader}
                      onChange={(e) => setCustomHeader(e.target.value)}
                      placeholder={`Leave blank for default: "Lesson ${editingLessonNumber}"`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Default: Lesson {editingLessonNumber}
                    </p>
                  </div>

                  {/* Footer Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Footer
                    </label>
                    <input
                      type="text"
                      value={customFooter}
                      onChange={(e) => setCustomFooter(e.target.value)}
                      placeholder="Leave blank for default footer"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Default: Creative Curriculum Designer • Lesson {editingLessonNumber} • {currentSheetInfo.display} • © Rhythmstix 2025
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Activities List - Editable with Drag & Drop */}
            <div className="flex-1 overflow-hidden">
              <div className="p-6 max-h-[55vh] overflow-y-auto">
                <DndProvider backend={HTML5Backend}>
                  <div className="space-y-3">
                    {editingLessonActivities.map((activity: any, activityIndex: number) => (
                      <MinimizableActivityCard
                        key={activity._editId || `activity-${activityIndex}`}
                        activity={activity}
                        index={activityIndex}
                        onRemove={handleDeleteActivity}
                        onReorder={handleReorderActivity}
                        onActivityClick={(activity) => {
                          // Optional: Could open activity details modal here
                          console.log('Activity clicked:', activity.activity);
                        }}
                      />
                    ))}
                  </div>
                </DndProvider>
                
                {editingLessonActivities.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg">No activities in this lesson</p>
                    <p className="text-sm">Add activities to build your lesson</p>
                  </div>
                )}
              </div>

              {/* Add Activity Button */}
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <button
                  onClick={() => setShowActivityPicker(true)}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Activity to Lesson</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Exporter */}
      {selectedLessonForExport && (
        <LessonExporter
          lessonNumber={selectedLessonForExport}
          onClose={() => setSelectedLessonForExport(null)}
        />
      )}

      {/* Lesson Details Modal */}
      {selectedLessonForDetails && (
        <LessonDetailsModal
          lessonNumber={selectedLessonForDetails}
          onClose={() => setSelectedLessonForDetails(null)}
          theme={theme}
          onExport={() => {
            setSelectedLessonForExport(selectedLessonForDetails);
            setSelectedLessonForDetails(null);
          }}
          onEdit={() => handleStartEditing(selectedLessonForDetails)}
        />
      )}

      {/* Stack Builder Modal */}
      {showStackBuilder && (
        <LessonStackBuilder
          isOpen={showStackBuilder}
          onClose={() => {
            setShowStackBuilder(false);
            setEditingStack(null);
          }}
          onSave={handleSaveStack}
          editingStack={editingStack}
          allLessonsData={allLessonsData}
          lessonNumbers={lessonNumbers}
          existingStacks={stacks}
        />
      )}

      {/* Assign Stack to Term Modal */}
      {selectedStackForAssignment && (
        <AssignToHalfTermModal
          isOpen={showAssignToTermModal}
          onClose={() => {
            setShowAssignToTermModal(false);
            setSelectedStackForAssignment(null);
          }}
          lessonNumber={selectedStackForAssignment.name}
          halfTerms={halfTerms}
          onAssign={handleStackAssignment}
        />
      )}

      {/* Class Copy Modal */}
      <ClassCopyModal
        isOpen={showClassCopyModal}
        onClose={() => setShowClassCopyModal(false)}
        onCopy={handleCopyLessonsToClass}
        availableClasses={customYearGroups}
        currentClass={currentSheetInfo.sheet}
        allLessonsData={allLessonsData}
      />

      {/* Standalone Lesson Creator Modal */}
      {showStandaloneLessonCreator && (
        <StandaloneLessonCreator
          onClose={() => setShowStandaloneLessonCreator(false)}
          onSave={handleSaveStandaloneLesson}
        />
      )}

    </div>
  );
}