import React, { useState, useRef } from 'react';
import { Settings, Palette, RotateCcw, X, Plus, Trash2, GripVertical, Edit3, Save, Users, Database, AlertTriangle, GraduationCap, Package, Filter, Video, Music, Volume2, FileText, Link as LinkIcon, Image, FileVideo, FileMusic, File, Globe, ExternalLink, Share2, Download, Upload, Eye, Play, Pause, Headphones, Mic, Speaker, Film, Camera, BookOpen, Book, Folder, Cloud, Network } from 'lucide-react';
import { useSettings, Category, ResourceLinkConfig } from '../contexts/SettingsContextNew';
import { DataSourceSettings } from './DataSourceSettings';
import { CustomObjectivesAdmin } from './CustomObjectivesAdmin';
import { ActivityPacksAdmin } from './ActivityPacksAdmin';
import { useAuth } from '../hooks/useAuth';
import { useIsViewOnly } from '../hooks/useIsViewOnly';
import { isSupabaseConfigured } from '../config/supabase';
import { customCategoriesApi } from '../config/api';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Draggable Category Item Component
interface DraggableCategoryProps {
  category: Category;
  index: number;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
  onDragEnd?: () => void;
  children: React.ReactNode;
}

function DraggableCategory({ category, index, onReorder, onDragEnd, children }: DraggableCategoryProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: 'category',
    collect(monitor) {
      return { handlerId: monitor.getHandlerId() };
    },
    hover(item: { index: number }, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      onReorder(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'category',
    item: () => ({ index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    end: () => {
      if (onDragEnd) onDragEnd();
    }
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      data-handler-id={handlerId}
      className={`transition-all ${isDragging ? 'ring-2 ring-teal-400 rounded-lg shadow-lg' : ''}`}
    >
      {children}
    </div>
  );
}

// Helper function to get icon component by name
const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    Video, Music, Volume2, FileText, Palette, LinkIcon, Image, FileVideo, FileMusic, File, Globe, ExternalLink, Share2, Download, Upload, Eye, Play, Pause, Headphones, Mic, Speaker, Film, Camera, Folder, BookOpen, Book, Cloud, Database, Network
  };
  return iconMap[iconName] || FileText; // Default to FileText if icon not found
};

// Helper function to get available icons for selection
const getAvailableIcons = () => {
  return [
    { name: 'Video', label: 'Video' },
    { name: 'Music', label: 'Music' },
    { name: 'Volume2', label: 'Volume' },
    { name: 'FileText', label: 'File Text' },
    { name: 'Palette', label: 'Palette' },
    { name: 'LinkIcon', label: 'Link' },
    { name: 'Image', label: 'Image' },
    { name: 'FileVideo', label: 'File Video' },
    { name: 'FileMusic', label: 'File Music' },
    { name: 'File', label: 'File' },
    { name: 'Globe', label: 'Globe' },
    { name: 'ExternalLink', label: 'External Link' },
    { name: 'Share2', label: 'Share' },
    { name: 'Download', label: 'Download' },
    { name: 'Upload', label: 'Upload' },
    { name: 'Eye', label: 'Eye' },
    { name: 'Play', label: 'Play' },
    { name: 'Pause', label: 'Pause' },
    { name: 'Headphones', label: 'Headphones' },
    { name: 'Mic', label: 'Microphone' },
    { name: 'Speaker', label: 'Speaker' },
    { name: 'Film', label: 'Film' },
    { name: 'Camera', label: 'Camera' },
    { name: 'BookOpen', label: 'Book Open' },
    { name: 'Book', label: 'Book' },
    { name: 'Folder', label: 'Folder' },
    { name: 'Cloud', label: 'Cloud' },
    { name: 'Database', label: 'Database' },
    { name: 'Network', label: 'Network' },
  ];
};

interface UserSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSettings({ isOpen, onClose }: UserSettingsProps) {
  const { user } = useAuth();
  const isViewOnly = useIsViewOnly();
  const { settings, updateSettings, resetToDefaults, categories, updateCategories, resetCategoriesToDefaults, customYearGroups, updateYearGroups, resetYearGroupsToDefaults, forceSyncYearGroups, forceSyncToSupabase, forceRefreshFromSupabase, forceSyncCurrentYearGroups, forceSafariSync, startUserChange, endUserChange, resourceLinks, updateResourceLinks, resetResourceLinksToDefaults } = useSettings();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);
  const [tempCategories, setTempCategories] = useState(categories);
  const [tempYearGroups, setTempYearGroups] = useState(customYearGroups);
  const [tempResourceLinks, setTempResourceLinks] = useState(resourceLinks);
  const [activeTab, setActiveTab] = useState<'yeargroups' | 'categories' | 'purchases' | 'manage-packs' | 'data' | 'admin' | 'resource-links'>('yeargroups');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryYearGroups, setEditingCategoryYearGroups] = useState<string | null>(null); // Track which category's year groups are being edited
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6B7280');
  const [newCategoryYearGroups, setNewCategoryYearGroups] = useState<{[key: string]: boolean}>({
    LKG: false,
    UKG: false,
    Reception: false
  });
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [bulkYearGroupMode, setBulkYearGroupMode] = useState(false); // Bulk assignment mode
  const [selectedCategoriesForBulk, setSelectedCategoriesForBulk] = useState<Set<string>>(new Set()); // Selected categories for bulk assignment
  const [selectedYearGroupsForBulk, setSelectedYearGroupsForBulk] = useState<Set<string>>(new Set()); // Selected year groups for bulk assignment
  const [newYearGroupId, setNewYearGroupId] = useState('');
  const [newYearGroupName, setNewYearGroupName] = useState('');
  const [newYearGroupColor, setNewYearGroupColor] = useState('#3B82F6');
  const [editingYearGroup, setEditingYearGroup] = useState<string | null>(null);
  const [draggedYearGroup, setDraggedYearGroup] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showYearGroupsModal, setShowYearGroupsModal] = useState(false);

  // Check if user is admin
  const isAdmin = user?.email === 'rob.reichstorer@gmail.com' || 
                  user?.role === 'administrator';

  // Update temp settings when settings change
  React.useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  // Update temp categories when categories change
  // BUT: Skip if we're in the middle of a deletion to prevent restoring deleted items
  const [isDeletingCategory, setIsDeletingCategory] = React.useState(false);
  React.useEffect(() => {
    if (!isDeletingCategory) {
    setTempCategories(categories);
    }
  }, [categories, isDeletingCategory]);

  // Update temp classes when classes change
  // BUT: Skip if we're in the middle of a deletion to prevent restoring deleted items
  const [isDeletingYearGroup, setIsDeletingYearGroup] = React.useState(false);
  React.useEffect(() => {
    if (!isDeletingYearGroup) {
    setTempYearGroups(customYearGroups);
    }
  }, [customYearGroups, isDeletingYearGroup]);

  // Update temp resource links when resource links change
  React.useEffect(() => {
    setTempResourceLinks(resourceLinks);
  }, [resourceLinks]);

  // Immediate update for categories to ensure group assignments are saved
  React.useEffect(() => {
    // Skip immediate update if a category is being edited (to prevent losing focus on each keystroke)
    if (editingCategory) {
      return;
    }
    
    // Only update if tempCategories is different from current categories
    // This prevents infinite loops but ensures immediate saves
    if (tempCategories !== categories) {
      console.log('🔄 Immediate update of categories from tempCategories changes');
      updateCategories(tempCategories);
    }
  }, [tempCategories, editingCategory]);

  // Note: Removed automatic refresh when modal opens to prevent race conditions
  // Data should already be up-to-date from the initial load
  // Users can manually refresh if needed using the refresh buttons

  const handleSave = async () => {
    if (isViewOnly) {
      alert('View-only mode: Cannot save settings.');
      return;
    }
    try {
      console.log('🔄 Saving all settings...');
      console.log('📋 Current tempCategories:', tempCategories.map(cat => ({ 
        name: cat.name, 
        groups: cat.groups, 
        group: cat.group 
      })));
      console.log('📋 Current tempYearGroups:', tempYearGroups.map(group => ({
        id: group.id,
        name: group.name,
        color: group.color
      })));
      
      // Save settings (this doesn't need to be async as it's just local state)
    updateSettings(tempSettings);
      
      // Save categories and year groups
      console.log('🔄 Saving categories and year groups...');
      
      // Update the state (this will trigger the useEffect hooks that save to Supabase)
    updateCategories(tempCategories);
    updateYearGroups(tempYearGroups);
      
      // Wait a moment for the async saves to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000); // Hide after 3 seconds
      
      console.log('✅ All settings saved successfully');
      
      // Don't close the modal - let users continue making changes
    } catch (error: unknown) {
      console.error('❌ Failed to save settings:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert('Failed to save settings. Please try again.');
    }
  };

  const handleCancel = () => {
    setTempSettings(settings);
    setTempCategories(categories);
    setTempYearGroups(customYearGroups);
    onClose();
  };


  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      resetToDefaults();
      setTempSettings(settings);
    }
  };

  // Helper function to map year group name to code
  const getYearGroupCode = (yearGroupName: string): string | null => {
    const name = yearGroupName.toLowerCase();
    if (name.includes('lower') || name.includes('lkg')) return 'LKG';
    if (name.includes('upper') || name.includes('ukg')) return 'UKG';
    if (name.includes('reception')) return 'Reception';
    return null;
  };

  const handleYearGroupChange = (yearGroupName: string, checked: boolean) => {
    const code = getYearGroupCode(yearGroupName);
    if (code) {
    setNewCategoryYearGroups(prev => ({
      ...prev,
        [code]: checked
    }));
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    // Check if category already exists
    if (tempCategories.some(cat => cat.name.toLowerCase() === newCategoryName.toLowerCase())) {
      alert('A category with this name already exists.');
      return;
    }
    
    try {
      // Start user change to pause real-time sync
      startUserChange();
      
      // Create new category
      const newCategory: Category = {
        name: newCategoryName,
        color: newCategoryColor,
        position: tempCategories.length,
        yearGroups: {
          LKG: newCategoryYearGroups.LKG || false,
          UKG: newCategoryYearGroups.UKG || false,
          Reception: newCategoryYearGroups.Reception || false
        }
      };
      
      // Add new category to both temp state and persist it
      const updatedCategories = [...tempCategories, newCategory];
      setTempCategories(updatedCategories);
      
      // Immediately persist to global state and Supabase
      console.log('🔄 Adding category and persisting immediately:', newCategory);
      await updateCategories(updatedCategories);
    
    // Reset form
    setNewCategoryName('');
    setNewCategoryColor('#6B7280');
    setNewCategoryYearGroups({ LKG: false, UKG: false, Reception: false });
      
      console.log('✅ Category added and persisted:', newCategory.name);
      
      // End user change after a delay to allow persistence
      endUserChange();
    } catch (error: unknown) {
      console.error('❌ Failed to add category:', error);
      alert('Failed to add category. Please try again.');
      // End user change even on error
      endUserChange();
    }
  };


  const handleDeleteCategory = async (index: number) => {
    if (isViewOnly) {
      alert('View-only mode: Cannot delete categories.');
      return;
    }
    if (confirm('Are you sure you want to delete this category? This may affect existing activities.')) {
      try {
        // Set deletion flag to prevent useEffect from resetting tempCategories
        setIsDeletingCategory(true);
        
        // Start user change to pause real-time sync
        startUserChange();
        
        const categoryToDelete = tempCategories[index];
      const updatedCategories = tempCategories.filter((_, i) => i !== index);
        
      // Update positions
      updatedCategories.forEach((cat, i) => {
        cat.position = i;
      });
      setTempCategories(updatedCategories);
        
        // Check if this is a custom category (not in FIXED_CATEGORIES)
        // FIXED_CATEGORIES are: Welcome, Kodaly Songs, Kodaly Action Songs, Action/Games Songs, 
        // Rhythm Sticks, Scarf Songs, General Game, Core Songs, Parachute Games, Percussion Games,
        // Teaching Units, Goodbye, Kodaly Rhythms, Kodaly Games, IWB Games
        const FIXED_CATEGORY_NAMES = [
          'Welcome', 'Kodaly Songs', 'Kodaly Action Songs', 'Action/Games Songs', 'Rhythm Sticks',
          'Scarf Songs', 'General Game', 'Core Songs', 'Parachute Games', 'Percussion Games',
          'Teaching Units', 'Goodbye', 'Kodaly Rhythms', 'Kodaly Games', 'IWB Games'
        ];
        const isCustomCategory = !FIXED_CATEGORY_NAMES.includes(categoryToDelete.name);
        
        // CRITICAL: Delete from Supabase FIRST before updating local state
        // This ensures the deletion completes before any reloads can happen
        if (isCustomCategory && isSupabaseConfigured()) {
          try {
            console.log('🗑️ Deleting category from Supabase:', categoryToDelete.name);
            await customCategoriesApi.delete(categoryToDelete.name);
            console.log('✅ Successfully deleted category from Supabase:', categoryToDelete.name);
            
            // Wait a moment to ensure Supabase deletion is fully processed
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (deleteError) {
            console.error('❌ Failed to delete category from Supabase:', deleteError);
            // Still continue - the category will be removed from local state
            // The cleanup logic in the useEffect will try to delete it again
          }
        }
        
        // Now update local state (this will trigger the save logic and cleanup)
        console.log('🔄 Updating local categories after Supabase deletion');
        await updateCategories(updatedCategories);
        
        console.log('✅ Category deleted and persisted');
        
        // Wait a bit before clearing the deletion flag to ensure state is stable
        setTimeout(() => {
          setIsDeletingCategory(false);
        }, 1000);
        
        // End user change after a longer delay to ensure all sync operations complete
        // This prevents reloads from Supabase from restoring the deleted category
        setTimeout(() => {
        endUserChange();
        }, 3000); // 3 seconds instead of immediate
      } catch (error: unknown) {
        console.error('❌ Failed to delete category:', error);
        alert('Failed to delete category. Please try again.');
        // Clear deletion flag on error
        setIsDeletingCategory(false);
        // End user change even on error, but after a delay
        setTimeout(() => {
        endUserChange();
        }, 2000);
      }
    }
  };

  const handleDragStart = (category: string) => {
    setDraggedCategory(category);
  };

  const handleDragOver = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedCategory || draggedCategory === targetCategory) return;
    
    const draggedIndex = tempCategories.findIndex(cat => cat.name === draggedCategory);
    const targetIndex = tempCategories.findIndex(cat => cat.name === targetCategory);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    if (draggedIndex === targetIndex) return; // Already in position
    
    // Reorder categories
    const newCategories = [...tempCategories];
    const [removed] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, removed);
    
    // Update positions
    newCategories.forEach((cat, i) => {
      cat.position = i;
    });
    
    setTempCategories(newCategories);
    // Don't call updateCategories here - only on drop to avoid too many updates
  };

  const handleDragEnd = () => {
    setDraggedCategory(null);
  };

  const handleDrop = async (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    if (!draggedCategory || draggedCategory === targetCategory) return;

    try {
      const draggedIndex = tempCategories.findIndex(cat => cat.name === draggedCategory);
      const targetIndex = tempCategories.findIndex(cat => cat.name === targetCategory);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Reorder categories
      const newCategories = [...tempCategories];
      const [removed] = newCategories.splice(draggedIndex, 1);
      newCategories.splice(targetIndex, 0, removed);
      
      // Update positions
      newCategories.forEach((cat, i) => {
        cat.position = i;
      });
      
      setTempCategories(newCategories);
      
      // Immediately persist changes
      console.log('🔄 Reordering categories and persisting immediately');
      await updateCategories(newCategories);
      
      console.log('✅ Categories reordered and persisted');
    } catch (error: unknown) {
      console.error('❌ Failed to reorder categories:', error);
      alert('Failed to reorder categories. Please try again.');
    }
  };

  const handleResetCategories = () => {
    if (confirm('Are you sure you want to reset categories to defaults? This cannot be undone.')) {
      resetCategoriesToDefaults();
      setTempCategories(categories);
    }
  };

  // Class Management
  const handleAddYearGroup = async () => {
    if (!newYearGroupId.trim() || !newYearGroupName.trim()) return;
    
    // Check if year group already exists
    if (tempYearGroups.some(group => group.id.toLowerCase() === newYearGroupId.toLowerCase())) {
      alert('A year group with this ID already exists.');
      return;
    }
    
    const newYearGroup = {
        id: newYearGroupId,
        name: newYearGroupName,
        color: newYearGroupColor
    };
    
    // Add new year group to temp state
    const updatedYearGroups = [...tempYearGroups, newYearGroup];
    setTempYearGroups(updatedYearGroups);
    
    // Immediately persist to global state and Supabase
    console.log('🔄 Adding year group and persisting immediately:', newYearGroup);
    await updateYearGroups(updatedYearGroups);
    
    // Reset form
    setNewYearGroupId('');
    setNewYearGroupName('');
    setNewYearGroupColor('#3B82F6');
    
    console.log('✅ Year group added and persisted:', newYearGroup.name);
  };

  const handleUpdateYearGroup = async (index: number, id: string, name: string, color: string) => {
    const updatedYearGroups = [...tempYearGroups];
    updatedYearGroups[index] = { ...updatedYearGroups[index], id, name, color };
    setTempYearGroups(updatedYearGroups);
    setEditingYearGroup(null);
    
    // Immediately persist changes
    console.log('🔄 Updating year group and persisting immediately:', { id, name, color });
    await updateYearGroups(updatedYearGroups);
    console.log('✅ Year group updated and persisted');
  };

  const handleDeleteYearGroup = async (index: number) => {
    if (confirm('Are you sure you want to delete this year group? This may affect existing lessons.')) {
      try {
        // Set deletion flag to prevent useEffect from resetting tempYearGroups
        setIsDeletingYearGroup(true);
        
      const updatedYearGroups = tempYearGroups.filter((_, i) => i !== index);
      setTempYearGroups(updatedYearGroups);
      
      // Immediately persist changes
      console.log('🔄 Deleting year group and persisting immediately');
      await updateYearGroups(updatedYearGroups);
      console.log('✅ Year group deleted and persisted');
        
        // Wait a bit before clearing the deletion flag to ensure state is stable
        setTimeout(() => {
          setIsDeletingYearGroup(false);
        }, 1000);
      } catch (error) {
        console.error('❌ Failed to delete year group:', error);
        alert('Failed to delete year group. Please try again.');
        // Clear deletion flag on error
        setIsDeletingYearGroup(false);
      }
    }
  };

  const handleYearGroupDragStart = (yearGroupId: string) => {
    setDraggedYearGroup(yearGroupId);
  };

  const handleYearGroupDragOver = (e: React.DragEvent, targetYearGroupId: string) => {
    e.preventDefault();
    if (!draggedYearGroup || draggedYearGroup === targetYearGroupId) return;
    
    const draggedIndex = tempYearGroups.findIndex(group => group.id === draggedYearGroup);
    const targetIndex = tempYearGroups.findIndex(group => group.id === targetYearGroupId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Reorder classes
    const newYearGroups = [...tempYearGroups];
    const [removed] = newYearGroups.splice(draggedIndex, 1);
    newYearGroups.splice(targetIndex, 0, removed);
    
    setTempYearGroups(newYearGroups);
  };

  const handleYearGroupDragEnd = () => {
    setDraggedYearGroup(null);
  };

  const handleYearGroupDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedYearGroup || draggedYearGroup === targetId) return;

    try {
      const draggedIndex = tempYearGroups.findIndex(group => group.id === draggedYearGroup);
      const targetIndex = tempYearGroups.findIndex(group => group.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Reorder year groups
      const newYearGroups = [...tempYearGroups];
      const [removed] = newYearGroups.splice(draggedIndex, 1);
      newYearGroups.splice(targetIndex, 0, removed);

      setTempYearGroups(newYearGroups);
      
      // Immediately persist changes
      console.log('🔄 Reordering year groups and persisting immediately');
      await updateYearGroups(newYearGroups);
      
      console.log('✅ Year groups reordered and persisted');
    } catch (error: unknown) {
      console.error('❌ Failed to reorder year groups:', error);
      alert('Failed to reorder year groups. Please try again.');
    }
  };

  const handleResetYearGroups = () => {
    const warningMessage = `⚠️ DANGER: This will DELETE ALL your custom year groups and reset to only the 3 defaults:

• Lower Kindergarten Music
• Upper Kindergarten Music  
• Reception Music

This action CANNOT be undone. Are you absolutely sure you want to continue?`;
    
    if (confirm(warningMessage)) {
      const doubleConfirm = confirm('🚨 FINAL WARNING: This will permanently delete all your custom year groups. Click OK only if you are 100% certain.');
      if (doubleConfirm) {
      resetYearGroupsToDefaults();
      setTempYearGroups(customYearGroups);
      }
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-[60]">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[98vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600 flex-shrink-0" />
            <h2 
              className="text-lg sm:text-xl font-bold text-gray-900 truncate"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
            >
              User Settings
            </h2>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Tabs - Scrollable on mobile */}
        <div 
          className="flex bg-gray-100 overflow-x-auto relative z-10 border-b border-gray-200 shadow-sm" 
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: '#9CA3AF #F3F4F6',
            minHeight: '48px',
            gap: 0
          }}
        >
          {/* Year Groups */}
          <button
            onClick={() => setActiveTab('yeargroups')}
            className={`px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 focus:outline-none ${
              activeTab === 'yeargroups' 
                ? 'text-white bg-gradient-to-r from-teal-500 to-teal-600' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-teal-50'
            }`}
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', border: 'none', borderLeft: 'none', borderRight: 'none' }}
          >
            Year Groups
          </button>
          
          {/* Categories */}
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 focus:outline-none ${
              activeTab === 'categories' 
                ? 'text-white bg-gradient-to-r from-teal-500 to-teal-600' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-teal-50'
            }`}
            style={{ 
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', 
              border: 'none', 
              borderLeft: 'none', 
              borderRight: 'none',
              borderTop: 'none',
              borderBottom: 'none',
              outline: 'none',
              boxShadow: 'none',
              marginLeft: activeTab === 'categories' ? '-1px' : '0',
              marginRight: activeTab === 'categories' ? '-1px' : '0',
              zIndex: activeTab === 'categories' ? 1 : 0
            }}
          >
            Categories
          </button>
          
          {/* Custom Objectives */}
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 focus:outline-none ${
              activeTab === 'admin' 
                ? 'text-white bg-gradient-to-r from-teal-500 to-teal-600' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-teal-50'
            }`}
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', border: 'none', borderLeft: 'none', borderRight: 'none' }}
          >
            Custom Objectives
          </button>
          
          {/* Data & Backup */}
            <button
              onClick={() => setActiveTab('data')}
            className={`px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 focus:outline-none ${
                activeTab === 'data' 
                ? 'text-white bg-gradient-to-r from-teal-500 to-teal-600' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-teal-50'
              }`}
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', border: 'none', borderLeft: 'none', borderRight: 'none' }}
            >
            Data & Backup
            </button>
          
          {/* Purchases - Different background for admin/seller */}
                          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 focus:outline-none ${
              activeTab === 'purchases' 
                ? 'text-white bg-gradient-to-r from-teal-500 to-teal-600' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-teal-50'
            }`}
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', border: 'none', borderLeft: 'none', borderRight: 'none' }}
          >
            <span className="hidden sm:inline">🛒</span> Purchases
                          </button>
          
          {/* Manage Packs - Admin only, same background color */}
          {isAdmin && (
                          <button
              onClick={() => setActiveTab('manage-packs')}
              className={`px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 focus:outline-none ${
                activeTab === 'manage-packs' 
                  ? 'text-white bg-gradient-to-r from-teal-500 to-teal-600' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-teal-50'
              }`}
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', border: 'none', borderLeft: 'none', borderRight: 'none' }}
            >
              <div className="flex items-center space-x-2">
                <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Manage Packs</span>
              </div>
                          </button>
          )}

          {/* Resource Links */}
          <button
            onClick={() => setActiveTab('resource-links')}
            className={`px-4 sm:px-6 py-3 mr-3 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 focus:outline-none ${
              activeTab === 'resource-links' 
                ? 'text-white bg-gradient-to-r from-teal-500 to-teal-600' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-teal-50'
            }`}
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', border: 'none', borderLeft: 'none', borderRight: 'none' }}
          >
            <div className="flex items-center space-x-2">
              <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Resource Links</span>
            </div>
          </button>
              </div>

        {/* Content - Responsive padding */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-8">

          {activeTab === 'yeargroups' && (
            <>
              {/* Class Management */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6 text-teal-600" />
                    <h3 
                      className="text-lg font-semibold text-gray-900"
                      style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
                    >
                      Class Management
                    </h3>
                  </div>
                  <button
                    onClick={handleResetYearGroups}
                    className="px-3 py-1.5 bg-teal-100 hover:bg-teal-200 text-teal-700 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    title="⚠️ DANGER: This will delete all custom year groups and reset to the 3 defaults!"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset to Default</span>
                  </button>
                </div>

                {/* Add New Year Group */}
                <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
                  <h4 
                    className="font-medium text-gray-900 mb-3"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
                  >
                    Add New Year Group
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="newYearGroupId" className="block text-xs font-medium text-gray-500 mb-1">
                        ID (used in system)
                      </label>
                      <input
                        id="newYearGroupId"
                        name="newYearGroupId"
                        type="text"
                        value={newYearGroupId}
                        onChange={(e) => setNewYearGroupId(e.target.value)}
                        placeholder="e.g., Year1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:outline-none text-sm"
                        style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label htmlFor="newYearGroupName" className="block text-xs font-medium text-gray-500 mb-1">
                        Display Name
                      </label>
                      <input
                        id="newYearGroupName"
                        name="newYearGroupName"
                        type="text"
                        value={newYearGroupName}
                        onChange={(e) => setNewYearGroupName(e.target.value)}
                        placeholder="e.g., Year 1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:outline-none text-sm"
                        style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
                      />
                    </div>
                    <div>
                      <label htmlFor="newYearGroupColor" className="block text-xs font-medium text-gray-500 mb-1">
                        Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          id="newYearGroupColor"
                          name="newYearGroupColor"
                          type="color"
                          value={newYearGroupColor}
                          onChange={(e) => setNewYearGroupColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <button
                          onClick={handleAddYearGroup}
                          disabled={!newYearGroupId.trim() || !newYearGroupName.trim()}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                          style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Year Groups List */}
                <div className="bg-white rounded-lg border border-teal-200 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">Manage Year Groups</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (isRefreshing) return; // Prevent multiple clicks
                          
                          setIsRefreshing(true);
                          try {
                            console.log('🔄 Manual refresh requested...');
                            const success = await forceRefreshFromSupabase();
                            if (success) {
                              console.log('✅ Manual refresh completed');
                              // Update temp state to match refreshed data
                              setTempYearGroups(customYearGroups);
                            }
                          } catch (error) {
                            console.error('❌ Manual refresh failed:', error);
                          } finally {
                            setIsRefreshing(false);
                          }
                        }}
                        disabled={isRefreshing}
                        className={`flex items-center gap-2 px-3 py-1 text-sm rounded-md transition-colors ${
                          isRefreshing 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                        }`}
                        title={isRefreshing ? "Refreshing..." : "Refresh from server"}
                      >
                        <RotateCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Drag and drop to reorder year groups. Changes will affect how year groups are displayed throughout the application.
                  </p>
                  
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {tempYearGroups.map((yearGroup, index) => (
                      <div 
                        key={yearGroup.id}
                        draggable
                        onDragStart={() => handleYearGroupDragStart(yearGroup.id)}
                        onDragOver={(e) => handleYearGroupDragOver(e, yearGroup.id)}
                        onDrop={(e) => handleYearGroupDrop(e, yearGroup.id)}
                        onDragEnd={handleYearGroupDragEnd}
                        className={`p-3 rounded-lg transition-colors duration-200 cursor-move ${
                          draggedYearGroup === yearGroup.id ? 'bg-teal-50 border-2 border-teal-300 opacity-50' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {editingYearGroup === yearGroup.id ? (
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 cursor-move">
                              <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="flex-1 grid grid-cols-3 gap-3">
                              <input
                                id={`editYearGroupId-${index}`}
                                name={`editYearGroupId-${index}`}
                                type="text"
                                value={editingYearGroup === yearGroup.id ? yearGroup.id : ''}
                                onChange={(e) => {
                                  const updatedYearGroups = [...tempYearGroups];
                                  updatedYearGroups[index] = { ...updatedYearGroups[index], id: e.target.value };
                                  setTempYearGroups(updatedYearGroups);
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                dir="ltr"
                              />
                              <input
                                id={`editYearGroupName-${index}`}
                                name={`editYearGroupName-${index}`}
                                type="text"
                                value={editingYearGroup === yearGroup.id ? yearGroup.name : ''}
                                onChange={(e) => {
                                  const updatedYearGroups = [...tempYearGroups];
                                  updatedYearGroups[index] = { ...updatedYearGroups[index], name: e.target.value };
                                  setTempYearGroups(updatedYearGroups);
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                                <input
                                id={`editYearGroupColor-${index}`}
                                name={`editYearGroupColor-${index}`}
                                  type="color"
                                value={editingYearGroup === yearGroup.id ? yearGroup.color : ''}
                                  onChange={(e) => {
                                    const updatedYearGroups = [...tempYearGroups];
                                  updatedYearGroups[index] = { ...updatedYearGroups[index], color: e.target.value };
                                    setTempYearGroups(updatedYearGroups);
                                  }}
                                className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                                />
                            </div>
                                <button
                                  onClick={() => setEditingYearGroup(null)}
                                  className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors duration-200"
                                >
                                  <Save className="h-5 w-5" />
                                </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 cursor-move">
                              <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: yearGroup.color }}
                            ></div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{yearGroup.name}</div>
                              <div className="text-sm text-gray-500">{yearGroup.id}</div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => setEditingYearGroup(yearGroup.id)}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteYearGroup(index)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Warning about changing IDs */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                <div className="flex items-start space-x-3">
                  <div className="text-yellow-600 flex-shrink-0 mt-0.5">⚠️</div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Important Note About Year Group IDs</h4>
                    <p className="text-sm text-gray-600">
                        Changing the ID of an existing year group will break existing lesson assignments and activities. 
                        Only modify IDs for newly created year groups.
                    </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'categories' && (
            <>

              {/* Category Management */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Palette className="h-6 w-6 text-teal-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Activity Categories</h3>
                  </div>
                  <button
                    onClick={handleResetCategories}
                    className="px-3 py-1.5 bg-teal-100 hover:bg-teal-200 text-teal-700 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset to Default</span>
                  </button>
                </div>

                {/* Add New Category */}
                <div className="bg-white rounded-lg border border-teal-200 p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Add New Category</h4>
                  <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <label htmlFor="newCategoryName" className="sr-only">Category name</label>
                      <input
                        id="newCategoryName"
                        name="newCategoryName"
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:outline-none"
                        dir="ltr"
                      />
                    </div>
                    <div className="w-24">
                      <label htmlFor="newCategoryColor" className="sr-only">Category color</label>
                      <input
                        id="newCategoryColor"
                        name="newCategoryColor"
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                    </div>
                    <button
                      onClick={handleAddCategory}
                      disabled={!newCategoryName.trim()}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add</span>
                    </button>
                    </div>
                    
                    {/* Year Groups Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available for Year Groups
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowYearGroupsModal(true)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors flex items-center space-x-2"
                      >
                        <Users className="h-4 w-4" />
                        <span>
                          {Object.values(newCategoryYearGroups).some(v => v) 
                            ? `${Object.values(newCategoryYearGroups).filter(v => v).length} year group(s) selected`
                            : 'Select year groups'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Year Groups Selection Modal */}
                {showYearGroupsModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                      {/* Header - Teal gradient matching other modals */}
                      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600 text-white flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold">Available for Year Groups</h2>
                            <p className="text-sm text-white/90 mt-0.5">
                              Select which year groups this category should be available for
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowYearGroupsModal(false)}
                          className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-6 overflow-y-auto flex-1">
                        <div className="space-y-3">
                          {customYearGroups && Array.isArray(customYearGroups) && customYearGroups.length > 0 ? (
                            customYearGroups.map(yearGroup => {
                              const code = getYearGroupCode(yearGroup.name);
                              const isChecked = code ? (newCategoryYearGroups[code] || false) : false;
                              
                              return (
                                <label 
                                  key={yearGroup.id || yearGroup.name} 
                                  className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                            <input
                              type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (code) {
                                        handleYearGroupChange(yearGroup.name, e.target.checked);
                                      }
                                    }}
                                    className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                  />
                                  <span className="text-sm font-medium text-gray-700 flex-1">{yearGroup.name}</span>
                          </label>
                              );
                            })
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No year groups available</p>
                          )}
                      </div>
                    </div>

                      {/* Footer */}
                      <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            // Clear all selections
                            setNewCategoryYearGroups({
                              LKG: false,
                              UKG: false,
                              Reception: false
                            });
                          }}
                          className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Clear All
                        </button>
                        <button
                          onClick={() => setShowYearGroupsModal(false)}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Done
                        </button>
                  </div>
                </div>
                  </div>
                )}

                {/* Category List */}
                <div className="bg-white rounded-lg border border-teal-200 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">
                      Manage Categories
                      {isRefreshing && (
                        <span className="ml-2 text-sm text-teal-600">(Refreshing...)</span>
                      )}
                    </h4>
                    <button
                      onClick={async () => {
                        console.log('🔄 Manual refresh requested for categories...');
                        setIsRefreshing(true);
                        try {
                          const success = await forceRefreshFromSupabase();
                          if (success) {
                            console.log('✅ Manual refresh completed for categories');
                          } else {
                            console.warn('⚠️ Manual refresh partially failed for categories');
                          }
                        } finally {
                          setIsRefreshing(false);
                        }
                      }}
                      disabled={isRefreshing}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded-md hover:bg-teal-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh categories from server"
                    >
                      <RotateCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Drag and drop to reorder categories. Changes will affect how categories are displayed throughout the application.
                  </p>

                  {/* Bulk Year Group Assignment Section */}
                  {bulkYearGroupMode && (
                    <div className="mb-6 p-5 bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-300 rounded-xl shadow-sm">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 mb-1">Bulk Assign Year Groups</h4>
                          <p className="text-sm text-gray-600">
                            Select categories below, then choose year groups to assign them to
                          </p>
                        </div>
                      <button
                        onClick={() => {
                            setBulkYearGroupMode(false);
                            setSelectedCategoriesForBulk(new Set());
                            setSelectedYearGroupsForBulk(new Set());
                        }}
                          className="ml-4 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                          title="Close bulk assignment"
                      >
                          <X className="h-5 w-5" />
                      </button>
                    </div>

                      {/* Step 1: Year Groups Selection */}
                      <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Step 1: Select Year Groups
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                          {customYearGroups && Array.isArray(customYearGroups) && customYearGroups.length > 0 ? customYearGroups.map(yearGroup => {
                            // Use year group ID as the key, or map to code for legacy support
                            const yearGroupKey = yearGroup.id || 
                              (yearGroup.name.toLowerCase().includes('lower') || yearGroup.name.toLowerCase().includes('lkg') ? 'LKG' :
                               yearGroup.name.toLowerCase().includes('upper') || yearGroup.name.toLowerCase().includes('ukg') ? 'UKG' :
                               yearGroup.name.toLowerCase().includes('reception') ? 'Reception' : yearGroup.name);
                            
                            const isSelected = selectedYearGroupsForBulk.has(yearGroupKey);
                            
                            return (
                      <button
                                key={yearGroup.id}
                                onClick={() => {
                                  // Toggle year group selection
                                  const newSelected = new Set(selectedYearGroupsForBulk);
                                  if (isSelected) {
                                    newSelected.delete(yearGroupKey);
                                  } else {
                                    newSelected.add(yearGroupKey);
                                  }
                                  setSelectedYearGroupsForBulk(newSelected);
                                }}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                                  isSelected 
                                    ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                                }`}
                                title={`${isSelected ? 'Deselect' : 'Select'} ${yearGroup.name}`}
                              >
                                {yearGroup.name}
                      </button>
                            );
                          }) : null}
                    </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {selectedYearGroupsForBulk.size > 0 ? (
                              <span className="text-teal-600 font-semibold">
                                {selectedYearGroupsForBulk.size} year group{selectedYearGroupsForBulk.size !== 1 ? 's' : ''} selected
                              </span>
                            ) : (
                              <span>No year groups selected</span>
                            )}
                          </div>
                          {selectedYearGroupsForBulk.size > 0 && (
                              <button
                              onClick={() => {
                                setSelectedYearGroupsForBulk(new Set());
                              }}
                              className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                            >
                              Clear Selection
                              </button>
                          )}
                            </div>
                      </div>

                      {/* Step 2: Category Selection Status */}
                      <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Step 2: Select Categories Below
                        </label>
                        <div className="text-sm text-gray-600">
                          {selectedCategoriesForBulk.size > 0 ? (
                            <span className="text-teal-600 font-semibold">
                              {selectedCategoriesForBulk.size} categor{selectedCategoriesForBulk.size !== 1 ? 'ies' : 'y'} selected
                                </span>
                          ) : (
                            <span>Click on categories below to select them</span>
                          )}
                        </div>
                      </div>

                      {/* Step 3: Action Buttons */}
                      {selectedCategoriesForBulk.size > 0 && selectedYearGroupsForBulk.size > 0 && (
                        <div className="p-4 bg-white rounded-lg border-2 border-teal-300">
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Step 3: Apply Changes
                          </label>
                          <div className="flex flex-wrap gap-3">
                                <button
                              onClick={() => {
                                // Apply selected year groups to selected categories
                                const updatedCategories = tempCategories.map(cat => {
                                  if (selectedCategoriesForBulk.has(cat.name)) {
                                    const newYearGroups = { ...(cat.yearGroups || {}) };
                                    selectedYearGroupsForBulk.forEach(yearGroupKey => {
                                      newYearGroups[yearGroupKey] = true;
                                    });
                                    return {
                                      ...cat,
                                      yearGroups: newYearGroups
                                    };
                                  }
                                  return cat;
                                });
                                
                                setTempCategories(updatedCategories);
                                updateCategories(updatedCategories);
                                setSelectedCategoriesForBulk(new Set());
                                setSelectedYearGroupsForBulk(new Set());
                                setBulkYearGroupMode(false);
                              }}
                              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Assign Selected Year Groups
                                </button>
                                <button
                              onClick={() => {
                                if (confirm('Remove all selected year groups from selected categories?')) {
                                  const updatedCategories = tempCategories.map(cat => {
                                    if (selectedCategoriesForBulk.has(cat.name)) {
                                      const newYearGroups = { ...(cat.yearGroups || {}) };
                                      selectedYearGroupsForBulk.forEach(yearGroupKey => {
                                        newYearGroups[yearGroupKey] = false;
                                      });
                                      return {
                                        ...cat,
                                        yearGroups: newYearGroups
                                      };
                                    }
                                    return cat;
                                  });
                                  
                                  setTempCategories(updatedCategories);
                                  updateCategories(updatedCategories);
                                  setSelectedCategoriesForBulk(new Set());
                                  setSelectedYearGroupsForBulk(new Set());
                                  setBulkYearGroupMode(false);
                                }
                              }}
                              className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2"
                            >
                              <X className="h-4 w-4" />
                              Remove Selected Year Groups
                                </button>
                              </div>
                        </div>
                          )}
                        </div>
                  )}

                  {/* Bulk Assignment Toggle Button */}
                  {!bulkYearGroupMode && (
                    <div className="mb-4 flex gap-2">
                      <button
                        onClick={() => setBulkYearGroupMode(true)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Filter className="h-4 w-4" />
                        Bulk Assign Year Groups
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to remove ALL year group assignments (LKG, UKG, Reception) from ALL categories? This cannot be undone.')) {
                            const updatedCategories = tempCategories.map(cat => ({
                              ...cat,
                              yearGroups: { LKG: false, UKG: false, Reception: false }
                            }));
                            setTempCategories(updatedCategories);
                            updateCategories(updatedCategories);
                          }
                        }}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                        title="Remove all year group assignments from all categories"
                      >
                        <X className="h-4 w-4" />
                        Clear All Year Groups
                      </button>
                    </div>
                  )}
                  
                  <DndProvider backend={HTML5Backend}>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {tempCategories.map((category, index) => {
                      // Use index as stable identifier for editing state (not name, which changes)
                      const isEditing = editingCategory === `category-index-${index}`;
                      
                      return (
                      <DraggableCategory
                        key={`category-${index}-${category.position || index}`}
                        category={category}
                        index={index}
                        onReorder={(dragIndex, hoverIndex) => {
                          const newCategories = [...tempCategories];
                          const [removed] = newCategories.splice(dragIndex, 1);
                          newCategories.splice(hoverIndex, 0, removed);
                          newCategories.forEach((cat, i) => {
                            cat.position = i;
                          });
                          setTempCategories(newCategories);
                        }}
                        onDragEnd={() => {
                          // Save the new order when drag ends
                          updateCategories(tempCategories);
                        }}
                      >
                      <div 
                        className={`p-3 rounded-lg transition-colors duration-200 ${
                          bulkYearGroupMode && selectedCategoriesForBulk.has(category.name) ? 'bg-teal-100 border-teal-300 border-2' :
                          'bg-gray-50 hover:bg-gray-100'
                        } ${!bulkYearGroupMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      >
                        {isEditing ? (
                          <div className="flex flex-col space-y-3">
                            {/* Name and Color Row */}
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 cursor-move">
                              <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="flex-1 flex items-center space-x-3 min-w-0">
                              <input
                                id={`editCategoryName-${index}`}
                                name={`editCategoryName-${index}`}
                                type="text"
                                  value={tempCategories[index]?.name || ''}
                                onChange={(e) => {
                                  const updatedCategories = [...tempCategories];
                                  updatedCategories[index] = { ...updatedCategories[index], name: e.target.value };
                                  setTempCategories(updatedCategories);
                                    // Keep edit mode open by maintaining the index-based identifier
                                }}
                                onBlur={async () => {
                                  try {
                                    const updatedCategories = [...tempCategories];
                                    updatedCategories[index] = { ...updatedCategories[index], name: updatedCategories[index].name };
                                    setTempCategories(updatedCategories);
                                    await updateCategories(updatedCategories);
                                  } catch (error: unknown) {
                                    console.error('Failed to save category changes:', error);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const updatedCategories = [...tempCategories];
                                    updatedCategories[index] = { ...updatedCategories[index], name: updatedCategories[index].name };
                                    setTempCategories(updatedCategories);
                                    updateCategories(updatedCategories);
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    setEditingCategory(null);
                                    setTempCategories(categories);
                                  }
                                }}
                                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:outline-none"
                                dir="ltr"
                              />
                              <input
                                id={`editCategoryColor-${index}`}
                                name={`editCategoryColor-${index}`}
                                type="color"
                                  value={tempCategories[index]?.color || category.color}
                                onChange={(e) => {
                                  const updatedCategories = [...tempCategories];
                                  updatedCategories[index] = { ...updatedCategories[index], color: e.target.value };
                                  setTempCategories(updatedCategories);
                                  updateCategories(updatedCategories);
                                }}
                                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                              />
                              <button
                                  onClick={() => {
                                    updateCategories(tempCategories);
                                    setEditingCategory(null);
                                  }}
                                className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors duration-200"
                                  title="Save changes"
                              >
                                <Save className="h-5 w-5" />
                              </button>
                              </div>
                            </div>
                            
                            {/* Year Groups Editing Section */}
                            <div className="ml-8 pl-2 border-l-2 border-gray-200">
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Available for Year Groups
                              </label>
                              <div className="flex flex-wrap gap-3">
                                {customYearGroups && Array.isArray(customYearGroups) && customYearGroups.length > 0 ? customYearGroups.map(yearGroup => {
                                  // Use year group ID as the key, or map to code for legacy support
                                  const yearGroupKey = yearGroup.id || 
                                    (yearGroup.name.toLowerCase().includes('lower') || yearGroup.name.toLowerCase().includes('lkg') ? 'LKG' :
                                     yearGroup.name.toLowerCase().includes('upper') || yearGroup.name.toLowerCase().includes('ukg') ? 'UKG' :
                                     yearGroup.name.toLowerCase().includes('reception') ? 'Reception' : yearGroup.name);
                                  
                                  const categoryYearGroups = tempCategories[index]?.yearGroups || {};
                                  const isEnabled = categoryYearGroups[yearGroupKey] || false;
                                  return (
                                    <label key={yearGroup.id} className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={isEnabled}
                                        onChange={(e) => {
                                          const updatedCategories = [...tempCategories];
                                          updatedCategories[index] = {
                                            ...updatedCategories[index],
                                            yearGroups: {
                                              ...(updatedCategories[index].yearGroups || {}),
                                              [yearGroupKey]: e.target.checked
                                            }
                                          };
                                          setTempCategories(updatedCategories);
                                          updateCategories(updatedCategories);
                                        }}
                                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                      />
                                      <span className={`text-sm ${isEnabled ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                        {yearGroup.name}
                                      </span>
                                    </label>
                                  );
                                }) : <span className="text-sm text-gray-500">No year groups available</span>}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0 cursor-move pt-0.5">
                              <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>
                            <div 
                                className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 border border-gray-200"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 mb-2" dir="ltr">{category.name}</div>
                                
                                {/* Year Groups Display */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {editingCategoryYearGroups === `category-index-${index}` ? (
                                  // Edit mode: show checkboxes for year groups - show ALL year groups
                                  <div className="flex flex-wrap gap-2">
                                    {customYearGroups && Array.isArray(customYearGroups) && customYearGroups.length > 0 ? customYearGroups.map(yearGroup => {
                                      // Use year group ID as the key (or name if ID not available)
                                      const yearGroupKey = yearGroup.id || yearGroup.name;
                                      
                                      const categoryYearGroups = category.yearGroups || {};
                                      const isEnabled = categoryYearGroups[yearGroupKey] === true;
                                      
                                      return (
                                        <label key={yearGroup.id || yearGroup.name} className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded hover:bg-gray-50">
                                          <input
                                            type="checkbox"
                                            checked={isEnabled}
                                            onChange={(e) => {
                                          const updatedCategories = [...tempCategories];
                                          updatedCategories[index] = { 
                                            ...updatedCategories[index], 
                                                yearGroups: {
                                                  ...(updatedCategories[index].yearGroups || {}),
                                                  [yearGroupKey]: e.target.checked
                                                }
                                          };
                                          setTempCategories(updatedCategories);
                                          updateCategories(updatedCategories);
                                        }}
                                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                          />
                                          <span className={`text-xs ${isEnabled ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{yearGroup.name}</span>
                                        </label>
                                      );
                                    }) : null}
                                    <div className="flex gap-2 items-center">
                                      <button
                                        onClick={() => {
                                        const updatedCategories = [...tempCategories];
                                          updatedCategories[index] = { 
                                            ...updatedCategories[index], 
                                            yearGroups: {} // Clear all year group assignments
                                          };
                                          setTempCategories(updatedCategories);
                                          updateCategories(updatedCategories);
                                        }}
                                        className="text-xs text-red-600 hover:text-red-800 px-2 py-1 hover:bg-red-50 rounded"
                                        title="Remove all year group assignments"
                                      >
                                        Clear All
                                      </button>
                                      <button
                                        onClick={() => setEditingCategoryYearGroups(null)}
                                        className="text-xs text-teal-600 hover:text-teal-800 px-2 py-1 hover:bg-teal-50 rounded font-medium"
                                      >
                                        Done
                                      </button>
                                </div>
                              </div>
                                ) : (
                                  // View mode: show year group tags (clickable to edit)
                                  <>
                                    {customYearGroups && Array.isArray(customYearGroups) ? customYearGroups
                                      .filter(yearGroup => {
                                        const yearGroupKey = yearGroup.id || 
                                          (yearGroup.name.toLowerCase().includes('lower') || yearGroup.name.toLowerCase().includes('lkg') ? 'LKG' :
                                           yearGroup.name.toLowerCase().includes('upper') || yearGroup.name.toLowerCase().includes('ukg') ? 'UKG' :
                                           yearGroup.name.toLowerCase().includes('reception') ? 'Reception' : yearGroup.name);
                                        return category.yearGroups?.[yearGroupKey] === true;
                                      })
                                      .map(yearGroup => (
                                        <span 
                                          key={yearGroup.id} 
                                          className="px-2 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full cursor-pointer hover:bg-teal-200 transition-colors"
                                          onClick={() => setEditingCategoryYearGroups(`category-index-${index}`)}
                                          title="Click to edit year group assignments"
                                        >
                                          {yearGroup.name}
                                    </span>
                                      )) : null}
                                    {(!category.yearGroups || Object.values(category.yearGroups).every(v => !v)) && (
                                      <button
                                        onClick={() => setEditingCategoryYearGroups(`category-index-${index}`)}
                                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full hover:bg-gray-200 transition-colors"
                                        title="Click to assign year groups"
                                      >
                                        + Assign Year Groups
                                      </button>
                                    )}
                                  </>
                                  )}
                            </div>
                              </div>
                            </div>
                            {/* Edit/Delete Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {bulkYearGroupMode ? (
                                <input
                                  type="checkbox"
                                  checked={selectedCategoriesForBulk.has(category.name)}
                                  onChange={(e) => {
                                    const newSelected = new Set(selectedCategoriesForBulk);
                                    if (e.target.checked) {
                                      newSelected.add(category.name);
                                    } else {
                                      newSelected.delete(category.name);
                                    }
                                    setSelectedCategoriesForBulk(newSelected);
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                />
                              ) : (
                                <>
                              <button
                                    onClick={() => setEditingCategory(`category-index-${index}`)}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(index)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      </DraggableCategory>
                      );
                    })}
                  </div>
                  </DndProvider>
                </div>
              </div>

            </>
          )}

          {activeTab === 'purchases' && (
            <div className="space-y-6">
              {/* Purchases Header */}
              <div className="rounded-lg p-6 bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">🛒</span>
                  <h3 className="text-xl font-bold text-gray-900">Purchase Activity Card Sets</h3>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  Expand your curriculum with specialised activity card sets. Each set includes professionally designed activities tailored to specific subjects and age groups.
                </p>
                <p className="text-xs text-gray-600">
                  Connected account: <span className="font-semibold">{user?.email || 'Not signed in'}</span>
                </p>
              </div>

              {/* Available Card Sets */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Available Card Sets</h4>
                
                {/* Drama Games Card Set */}
                <div className="rounded-lg border border-teal-200 bg-white p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-4xl">🎭</span>
                        <div>
                          <h5 className="text-xl font-bold text-gray-900">Drama Games Activity Pack</h5>
                          <p className="text-sm text-teal-600 font-medium">Unlock 50+ Drama Activities</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-700">
                          Transform your drama lessons with this comprehensive collection of engaging drama games and activities suitable for KS1 and KS2.
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                          <li>• 50+ Professional Drama Activities</li>
                          <li>• Warm-up Games & Icebreakers</li>
                          <li>• Improvisation Exercises</li>
                          <li>• Character Development Activities</li>
                          <li>• Group Performance Projects</li>
                          <li>• Curriculum-Aligned Objectives</li>
                        </ul>
                      </div>

                      <div className="flex items-center space-x-4 mb-4">
                        <span className="text-3xl font-bold text-teal-600">£24.99</span>
                        <span className="text-sm text-gray-500 line-through">£39.99</span>
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">SAVE 38%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <a
                      href="https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=rob.reichstorer@gmail.com&amount=24.99&currency_code=GBP&item_name=Drama%20Games%20Activity%20Pack&return=http://localhost:5173"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-center flex items-center justify-center space-x-2"
                    >
                      <span>💳</span>
                      <span>Purchase Now via PayPal or debit and credit card</span>
                    </a>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    After purchase, the activities will automatically appear in your Activity Library within 24 hours.
                  </p>
                </div>

                {/* Coming Soon - More Card Sets */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 opacity-75">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-4xl grayscale">🎵</span>
                    <div>
                      <h5 className="text-xl font-bold text-gray-700">Music Games Activity Pack</h5>
                      <p className="text-sm text-gray-500 font-medium">Coming Soon</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    50+ Music activities covering rhythm, pitch, ensemble work, and creative composition.
                  </p>
                  </div>
                  
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 opacity-75">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-4xl grayscale">⚽</span>
                    <div>
                      <h5 className="text-xl font-bold text-gray-700">PE Games Activity Pack</h5>
                      <p className="text-sm text-gray-500 font-medium">Coming Soon</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    60+ Physical Education activities including team sports, fitness, and coordination exercises.
                  </p>
                </div>
              </div>

              {/* Support Section */}
              <div className="rounded-lg bg-teal-50 border border-teal-200 p-4 mt-6">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">ℹ️</span>
                  <div className="flex-1">
                    <h6 className="font-semibold text-gray-900 mb-1">Need Help?</h6>
                    <p className="text-sm text-gray-700">
                      If you've purchased a pack but it hasn't appeared in your library, please contact support at{' '}
                      <a href="mailto:support@rhythmstiix.co.uk" className="text-teal-600 hover:text-teal-700 font-medium">
                        support@rhythmstiix.co.uk
                      </a>
                      {' '}with your order number.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <DataSourceSettings embedded={true} />
            </div>
          )}

          {activeTab === 'manage-packs' && (
            <div className="space-y-6">
              {/* Activity Packs Management */}
              <div className="border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <Package className="h-6 w-6 text-teal-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Activity Packs Management</h3>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Create and manage activity packs for purchase. Link categories to packs, set prices, and track purchases.
                </p>
                
                <ActivityPacksAdmin userEmail={user?.email || ''} />
              </div>
            </div>
          )}

          {activeTab === 'resource-links' && (
            <div className="space-y-6">
              <div className="border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <LinkIcon className="h-6 w-6 text-teal-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Resource Links Customisation</h3>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Reset all resource links to defaults?')) {
                        resetResourceLinksToDefaults();
                        setTempResourceLinks(resourceLinks);
                      }
                    }}
                    className="px-3 py-1.5 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-100 rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset to Defaults</span>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Customise the names and icons for resource links in the Activity Creator. You can enable or disable each resource link type.
                </p>

                <div className="space-y-4">
                  {tempResourceLinks.map((link, index) => {
                    // Dynamically import the icon component
                    const IconComponent = getIconComponent(link.iconName);
                    
                    return (
                      <div key={link.key} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2 flex-1">
                            <IconComponent className="h-5 w-5 text-gray-500" />
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) => {
                                const updated = [...tempResourceLinks];
                                updated[index] = { ...updated[index], label: e.target.value };
                                setTempResourceLinks(updated);
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                              placeholder="Resource link label"
                            />
                          </div>
                          <select
                            value={link.iconName}
                            onChange={(e) => {
                              const updated = [...tempResourceLinks];
                              updated[index] = { ...updated[index], iconName: e.target.value };
                              setTempResourceLinks(updated);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          >
                            {getAvailableIcons().map(icon => (
                              <option key={icon.name} value={icon.name}>{icon.label}</option>
                            ))}
                          </select>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={link.enabled}
                              onChange={(e) => {
                                const updated = [...tempResourceLinks];
                                updated[index] = { ...updated[index], enabled: e.target.checked };
                                setTempResourceLinks(updated);
                              }}
                              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            />
                            <span className="text-sm text-gray-700">Enabled</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setTempResourceLinks(resourceLinks);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      updateResourceLinks(tempResourceLinks);
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 3000);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="h-full">
              <CustomObjectivesAdmin embedded={true} />
            </div>
          )}
        </div>

        {/* Footer */}
        {/* Success Message */}
        {saveSuccess && (
          <div className="px-6 py-3 border-t" style={{backgroundColor: '#E6F7F5', borderColor: '#B8E6E0'}}>
            <div className="flex items-center space-x-2" style={{color: '#0BA596'}}>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Settings saved successfully!</span>
            </div>
          </div>
        )}
        
        <div className="flex justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Save Settings
          </button>
        </div>
      </div>

    </div>
  );
}
