import React, { useState } from 'react';
import { Settings, Palette, RotateCcw, X, Plus, Trash2, GripVertical, Edit3, Save, Users, Database, AlertTriangle, GraduationCap, Package } from 'lucide-react';
import { useSettings, Category } from '../contexts/SettingsContextNew';
import { DataSourceSettings } from './DataSourceSettings';
import { CustomObjectivesAdmin } from './CustomObjectivesAdmin';
import { ActivityPacksAdmin } from './ActivityPacksAdmin';
import { useAuth } from '../hooks/useAuth';

interface UserSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSettings({ isOpen, onClose }: UserSettingsProps) {
  const { user } = useAuth();
  const { settings, updateSettings, resetToDefaults, categories, updateCategories, resetCategoriesToDefaults, customYearGroups, updateYearGroups, resetYearGroupsToDefaults, categoryGroups, addCategoryGroup, removeCategoryGroup, updateCategoryGroup, forceSyncYearGroups, forceSyncToSupabase, forceRefreshFromSupabase, forceSyncCurrentYearGroups, forceSafariSync, startUserChange, endUserChange } = useSettings();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);
  const [tempCategories, setTempCategories] = useState(categories);
  const [tempYearGroups, setTempYearGroups] = useState(customYearGroups);
  const [activeTab, setActiveTab] = useState<'yeargroups' | 'categories' | 'purchases' | 'manage-packs' | 'data' | 'admin'>('yeargroups');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6B7280');
  const [newCategoryGroup, setNewCategoryGroup] = useState<string | undefined>(undefined);
  const [newCategoryGroups, setNewCategoryGroups] = useState<string[]>([]);
  const [newCategoryYearGroups, setNewCategoryYearGroups] = useState<{[key: string]: boolean}>({
    LKG: true,
    UKG: true,
    Reception: true
  });
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [newYearGroupId, setNewYearGroupId] = useState('');
  const [newYearGroupName, setNewYearGroupName] = useState('');
  const [newYearGroupColor, setNewYearGroupColor] = useState('#3B82F6');
  const [editingYearGroup, setEditingYearGroup] = useState<string | null>(null);
  const [draggedYearGroup, setDraggedYearGroup] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showCustomObjectivesAdmin, setShowCustomObjectivesAdmin] = useState(false);

  // Check if user is admin
  const isAdmin = user?.email === 'rob.reichstorer@gmail.com' || 
                  user?.role === 'administrator';

  // Update temp settings when settings change
  React.useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  // Update temp categories when categories change
  React.useEffect(() => {
    setTempCategories(categories);
  }, [categories]);

  // Update temp classes when classes change
  React.useEffect(() => {
    setTempYearGroups(customYearGroups);
  }, [customYearGroups]);

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

  const handleYearGroupChange = (yearGroup: string, checked: boolean) => {
    setNewCategoryYearGroups(prev => ({
      ...prev,
      [yearGroup]: checked
    }));
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
        group: newCategoryGroup, // Keep for backward compatibility
        groups: newCategoryGroups.length > 0 ? newCategoryGroups : undefined, // New multiple groups
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
      setNewCategoryGroup(undefined);
      setNewCategoryGroups([]);
      setNewCategoryYearGroups({ LKG: true, UKG: true, Reception: true });
      
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
    if (confirm('Are you sure you want to delete this category? This may affect existing activities.')) {
      try {
        // Start user change to pause real-time sync
        startUserChange();
      const updatedCategories = tempCategories.filter((_, i) => i !== index);
      // Update positions
      updatedCategories.forEach((cat, i) => {
        cat.position = i;
      });
      setTempCategories(updatedCategories);
        
        // Immediately persist changes
        console.log('🔄 Deleting category and persisting immediately');
        await updateCategories(updatedCategories);
        
        console.log('✅ Category deleted and persisted');
        
        // End user change after a delay to allow persistence
        endUserChange();
      } catch (error: unknown) {
        console.error('❌ Failed to delete category:', error);
        alert('Failed to delete category. Please try again.');
        // End user change even on error
        endUserChange();
      }
    }
  };

  const handleDragStart = (category: string) => {
    setDraggedCategory(category);
  };

  const handleDragOver = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    if (!draggedCategory || draggedCategory === targetCategory) return;
    
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
    updateCategories(newCategories);
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
      const updatedYearGroups = tempYearGroups.filter((_, i) => i !== index);
      setTempYearGroups(updatedYearGroups);
      
      // Immediately persist changes
      console.log('🔄 Deleting year group and persisting immediately');
      await updateYearGroups(updatedYearGroups);
      console.log('✅ Year group deleted and persisted');
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

  // Group management handlers
  const handleAddGroup = async () => {
    if (newGroupName.trim() && !categoryGroups.groups.includes(newGroupName.trim())) {
      await addCategoryGroup(newGroupName.trim());
      setNewGroupName('');
    }
  };

  const handleEditGroup = (groupName: string) => {
    setEditingGroup(groupName);
    setEditingGroupName(groupName);
  };

  const handleSaveGroupEdit = async () => {
    if (editingGroup && editingGroupName.trim() && editingGroupName.trim() !== editingGroup) {
      await updateCategoryGroup(editingGroup, editingGroupName.trim());
      setEditingGroup(null);
      setEditingGroupName('');
    }
  };

  const handleCancelGroupEdit = () => {
    setEditingGroup(null);
    setEditingGroupName('');
  };

  const handleDeleteGroup = async (groupName: string) => {
    if (window.confirm(`Are you sure you want to delete the group "${groupName}"? Categories in this group will become ungrouped.`)) {
      await removeCategoryGroup(groupName);
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
            minHeight: '48px'
          }}
        >
          {/* Year Groups */}
          <button
            onClick={() => setActiveTab('yeargroups')}
            className={`px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 focus:outline-none ${
              activeTab === 'yeargroups' 
                ? 'text-white bg-teal-500' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-teal-100'
            }`}
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            Year Groups
          </button>
          
          {/* Categories */}
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 focus:outline-none ${
              activeTab === 'categories' 
                ? 'text-white bg-teal-500' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-teal-100'
            }`}
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            Categories
          </button>
          
          {/* Custom Objectives */}
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 focus:outline-none ${
              activeTab === 'admin' 
                ? 'text-white bg-teal-500' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-teal-100'
            }`}
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            Custom Objectives
          </button>
          
          {/* Data & Backup */}
            <button
              onClick={() => setActiveTab('data')}
            className={`px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 focus:outline-none ${
                activeTab === 'data' 
                ? 'text-white bg-teal-500' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-teal-100'
              }`}
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
            >
            Data & Backup
            </button>
          
          {/* Purchases - Different background for admin/seller */}
                          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 focus:outline-none ${
              activeTab === 'purchases' 
                ? 'text-white bg-amber-500' 
                : 'text-gray-600 hover:text-gray-900 bg-amber-50 hover:bg-amber-200'
            }`}
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            <span className="hidden sm:inline">🛒</span> Purchases
                          </button>
          
          {/* Manage Packs - Admin only, same background color */}
          {isAdmin && (
                          <button
              onClick={() => setActiveTab('manage-packs')}
              className={`px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 transition-all duration-200 focus:outline-none ${
                activeTab === 'manage-packs' 
                  ? 'text-white bg-amber-500' 
                  : 'text-gray-600 hover:text-gray-900 bg-amber-50 hover:bg-amber-200'
              }`}
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
            >
              <div className="flex items-center space-x-2">
                <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Manage Packs</span>
              </div>
                          </button>
          )}
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
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-sm"
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
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none text-sm"
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
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
                        dir="ltr"
                      />
                    </div>
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex flex-wrap gap-1 min-h-[40px] px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500">
                          {newCategoryGroups.map((groupName, groupIndex) => (
                            <span
                              key={groupIndex}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-md"
                            >
                              {groupName}
                              <button
                                onClick={() => {
                                  setNewCategoryGroups(newCategoryGroups.filter(g => g !== groupName));
                                }}
                                className="text-teal-600 hover:text-teal-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <select
                            id="newCategoryGroupSelect"
                            name="newCategoryGroupSelect"
                            onChange={(e) => {
                              if (e.target.value && !newCategoryGroups.includes(e.target.value)) {
                                setNewCategoryGroups([...newCategoryGroups, e.target.value]);
                                e.target.value = ''; // Reset select
                              }
                            }}
                            className="border-0 outline-none text-sm bg-transparent flex-1"
                            defaultValue=""
                          >
                            <option value="" disabled>Add group...</option>
                            {categoryGroups.groups.filter(group => !newCategoryGroups.includes(group)).map((group, index) => (
                              <option key={`${group}-${index}`} value={group}>{group}</option>
                            ))}
                          </select>
                        </div>
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
                      <div className="flex flex-wrap gap-4">
                        {customYearGroups.map(yearGroup => (
                          <label key={yearGroup.name} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newCategoryYearGroups[yearGroup.name] || false}
                              onChange={(e) => handleYearGroupChange(yearGroup.name, e.target.checked)}
                              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{yearGroup.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

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

                  {/* Category Groups Management */}
                  <div className="bg-gray-50 rounded-lg  p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Category Groups</h4>
                      <button
                        onClick={() => {
                          console.log('💾 Manually saving category group assignments...');
                          updateCategories(tempCategories);
                        }}
                        className="flex items-center gap-2 px-3 py-1 text-sm rounded-md transition-colors"
                        style={{backgroundColor: '#E6F7F5', color: '#0BA596'}}
                        title="Save category group assignments"
                      >
                        <Database className="h-4 w-4" />
                        Save Groups
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Create groups to organize categories in dropdowns. Categories can be assigned to groups when creating or editing them.
                    </p>
                    
                    {/* Add New Group */}
                    <div className="flex gap-2 mb-4">
                      <label htmlFor="newGroupName" className="sr-only">Group name</label>
                      <input
                        id="newGroupName"
                        name="newGroupName"
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Group name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddGroup()}
                      />
                      <button
                        onClick={handleAddGroup}
                        disabled={!newGroupName.trim()}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Group</span>
                      </button>
                    </div>

                    {/* Groups List */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {categoryGroups.groups.map((groupName, index) => (
                        <div
                          key={`${groupName}-${index}`}
                          className="flex items-center justify-between p-3 bg-white  rounded-lg"
                        >
                          {editingGroup === groupName ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                id={`editGroupName-${groupName}`}
                                name={`editGroupName-${groupName}`}
                                type="text"
                                value={editingGroupName}
                                onChange={(e) => setEditingGroupName(e.target.value)}
                                className="flex-1 px-2 py-1 border-2 border-gray-300 rounded focus:border-teal-500 focus:outline-none"
                                onKeyPress={(e) => e.key === 'Enter' && handleSaveGroupEdit()}
                                autoFocus
                              />
                              <button
                                onClick={handleSaveGroupEdit}
                                className="px-2 py-1 text-white rounded text-sm"
                                style={{backgroundColor: '#0BA596'}}
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelGroupEdit}
                                className="px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="font-medium text-gray-900">{groupName}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                  {tempCategories.filter(cat => 
                                    cat.group === groupName || 
                                    (cat.groups && cat.groups.includes(groupName))
                                  ).length} categories
                                </span>
                                <button
                                  onClick={() => handleEditGroup(groupName)}
                                  className="px-2 py-1 text-teal-600 hover:bg-teal-100 rounded text-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteGroup(groupName)}
                                  className="px-2 py-1 text-red-600 hover:bg-red-100 rounded text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      {categoryGroups.groups.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4">
                          No groups created yet. Create a group to organize your categories.
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {tempCategories.map((category, index) => (
                      <div 
                        key={category.name}
                        draggable
                        onDragStart={() => handleDragStart(category.name)}
                        onDragOver={(e) => handleDragOver(e, category.name)}
                        onDrop={(e) => handleDrop(e, category.name)}
                        className={`p-3  rounded-lg transition-colors duration-200 ${
                          draggedCategory === category.name ? 'bg-teal-50 border-teal-300' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {editingCategory === category.name ? (
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 cursor-move">
                              <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="flex-1 flex items-center space-x-3 min-w-0">
                              <input
                                id={`editCategoryName-${index}`}
                                name={`editCategoryName-${index}`}
                                type="text"
                                value={editingCategory === category.name ? category.name : ''}
                                onChange={(e) => {
                                  const updatedCategories = [...tempCategories];
                                  updatedCategories[index] = { ...updatedCategories[index], name: e.target.value };
                                  setTempCategories(updatedCategories);
                                }}
                                onBlur={async () => {
                                  try {
                                    const updatedCategories = [...tempCategories];
                                    updatedCategories[index] = { ...updatedCategories[index], name: updatedCategories[index].name };
                                    setTempCategories(updatedCategories);
                                    await updateCategories(updatedCategories);
                                    setEditingCategory(null);
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
                                    setEditingCategory(null);
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    setEditingCategory(null);
                                    // Reset temp categories to original state
                                    setTempCategories(categories);
                                  }
                                }}
                                className="flex-1 px-2 py-1 border-2 border-gray-300 rounded text-sm focus:border-teal-500 focus:outline-none"
                                dir="ltr"
                              />
                              <div className="relative">
                                <div className="flex flex-wrap gap-1 min-h-[32px] px-2 py-1 border border-gray-300 rounded text-sm bg-white focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500">
                                  {(category.groups || (category.group ? [category.group] : [])).map((groupName, groupIndex) => (
                                    <span
                                      key={groupIndex}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-md"
                                    >
                                      {groupName}
                                      <button
                                        onClick={() => {
                                          const updatedCategories = [...tempCategories];
                                          const currentGroups = category.groups || (category.group ? [category.group] : []);
                                          const newGroups = currentGroups.filter(g => g !== groupName);
                                          updatedCategories[index] = { 
                                            ...updatedCategories[index], 
                                            groups: newGroups.length > 0 ? newGroups : undefined,
                                            group: undefined // Clear single group when using multiple groups
                                          };
                                          setTempCategories(updatedCategories);
                                          updateCategories(updatedCategories);
                                        }}
                                        className="text-teal-600 hover:text-teal-800"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                  <select
                                    id={`editCategoryGroupSelect-${index}`}
                                    name={`editCategoryGroupSelect-${index}`}
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        console.log('🎯 User selecting group:', e.target.value, 'for category:', category.name);
                                        
                                        // Start user change to pause real-time sync
                                        startUserChange();
                                        
                                        const updatedCategories = [...tempCategories];
                                        const currentGroups = category.groups || (category.group ? [category.group] : []);
                                        console.log('🎯 Current groups before:', currentGroups);
                                        
                                        if (!currentGroups.includes(e.target.value)) {
                                          const newGroups = [...currentGroups, e.target.value];
                                          console.log('🎯 New groups after adding:', newGroups);
                                          
                                          updatedCategories[index] = { 
                                            ...updatedCategories[index], 
                                            groups: newGroups,
                                            group: undefined // Clear single group when using multiple groups
                                          };
                                          
                                          console.log('🎯 Setting temp categories with updated group:', updatedCategories[index]);
                                          console.log('🎯 Full updated categories array:', updatedCategories.map(cat => ({
                                            name: cat.name,
                                            groups: cat.groups,
                                            group: cat.group
                                          })));
                                          setTempCategories(updatedCategories);
                                          // Don't call updateCategories immediately - let the useEffect handle it
                                          // This prevents race conditions when assigning multiple categories quickly
                                          
                                          // End user change after a delay to allow persistence
                                          endUserChange();
                                        } else {
                                          console.log('🎯 Group already exists, not adding');
                                        }
                                        e.target.value = ''; // Reset select
                                      }
                                    }}
                                    className="border-0 outline-none text-sm bg-transparent w-24"
                                    defaultValue=""
                                  >
                                    <option value="" disabled>Add group...</option>
                                    {categoryGroups.groups.filter(group => 
                                      !(category.groups || (category.group ? [category.group] : [])).includes(group)
                                    ).map(group => (
                                      <option key={group} value={group}>{group}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <input
                                id={`editCategoryColor-${index}`}
                                name={`editCategoryColor-${index}`}
                                type="color"
                                value={category.color}
                                onChange={(e) => {
                                  const updatedCategories = [...tempCategories];
                                  updatedCategories[index] = { ...updatedCategories[index], color: e.target.value };
                                  setTempCategories(updatedCategories);
                                  updateCategories(updatedCategories);
                                }}
                                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                              />
                              <button
                                onClick={() => setEditingCategory(null)}
                                className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors duration-200"
                              >
                                <Save className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 cursor-move">
                              <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900" dir="ltr">{category.name}</div>
                              {(category.groups && category.groups.length > 0) ? (
                                <div className="text-xs text-gray-500 break-words">
                                  Groups: {category.groups.join(', ')}
                                </div>
                              ) : category.group ? (
                                <div className="text-xs text-gray-500 break-words">
                                  Group: {category.group}
                                </div>
                              ) : null}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(category.yearGroups || {}).map(([yearGroup, isEnabled]) => (
                                  isEnabled && (
                                    <span key={yearGroup} className="px-2 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full">
                                      {yearGroup}
                                    </span>
                                  )
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center justify-end space-x-2 flex-shrink-0">
                              <div className="relative">
                                <div className="flex flex-wrap gap-1 min-h-[32px] px-2 py-1 border border-gray-300 rounded text-sm bg-white focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500">
                                  {(category.groups || (category.group ? [category.group] : [])).map((groupName, groupIndex) => (
                                    <span
                                      key={groupIndex}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-md"
                                    >
                                      {groupName}
                                      <button
                                        onClick={() => {
                                          const updatedCategories = [...tempCategories];
                                          const currentGroups = category.groups || (category.group ? [category.group] : []);
                                          const newGroups = currentGroups.filter(g => g !== groupName);
                                          updatedCategories[index] = { 
                                            ...updatedCategories[index], 
                                            groups: newGroups.length > 0 ? newGroups : undefined,
                                            group: undefined // Clear single group when using multiple groups
                                          };
                                          setTempCategories(updatedCategories);
                                          updateCategories(updatedCategories);
                                        }}
                                        className="text-teal-600 hover:text-teal-800"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                  <select
                                    id={`viewCategoryGroupSelect-${index}`}
                                    name={`viewCategoryGroupSelect-${index}`}
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        console.log('🎯 User selecting group:', e.target.value, 'for category:', category.name);
                                        
                                        // Start user change to pause real-time sync
                                        startUserChange();
                                        
                                        const updatedCategories = [...tempCategories];
                                        const currentGroups = category.groups || (category.group ? [category.group] : []);
                                        console.log('🎯 Current groups before:', currentGroups);
                                        
                                        if (!currentGroups.includes(e.target.value)) {
                                          const newGroups = [...currentGroups, e.target.value];
                                          console.log('🎯 New groups after adding:', newGroups);
                                          
                                          updatedCategories[index] = { 
                                            ...updatedCategories[index], 
                                            groups: newGroups,
                                            group: undefined // Clear single group when using multiple groups
                                          };
                                          
                                          console.log('🎯 Setting temp categories with updated group:', updatedCategories[index]);
                                          console.log('🎯 Full updated categories array:', updatedCategories.map(cat => ({
                                            name: cat.name,
                                            groups: cat.groups,
                                            group: cat.group
                                          })));
                                          setTempCategories(updatedCategories);
                                          // Don't call updateCategories immediately - let the useEffect handle it
                                          // This prevents race conditions when assigning multiple categories quickly
                                          
                                          // End user change after a delay to allow persistence
                                          endUserChange();
                                        } else {
                                          console.log('🎯 Group already exists, not adding');
                                        }
                                        e.target.value = ''; // Reset select
                                      }
                                    }}
                                    className="border-0 outline-none text-sm bg-transparent w-24"
                                    defaultValue=""
                                  >
                                    <option value="" disabled>Add group...</option>
                                    {categoryGroups.groups.filter(group => 
                                      !(category.groups || (category.group ? [category.group] : [])).includes(group)
                                    ).map(group => (
                                      <option key={group} value={group}>{group}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <button
                                onClick={() => setEditingCategory(category.name)}
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
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </>
          )}

          {activeTab === 'purchases' && (
            <div className="space-y-6">
              {/* Purchases Header */}
              <div className="rounded-lg p-6 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">🛒</span>
                  <h3 className="text-xl font-bold text-gray-900">Purchase Activity Card Sets</h3>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  Expand your curriculum with specialized activity card sets. Each set includes professionally designed activities tailored to specific subjects and age groups.
                </p>
                <p className="text-xs text-gray-600">
                  Connected account: <span className="font-semibold">{user?.email || 'Not signed in'}</span>
                </p>
              </div>

              {/* Available Card Sets */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Available Card Sets</h4>
                
                {/* Drama Games Card Set */}
                <div className="rounded-lg border-2 border-teal-200 bg-white p-6 hover:shadow-lg transition-shadow">
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
                <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6 opacity-75">
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
                  
                <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-6 opacity-75">
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
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mt-6">
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
              <div className="border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <Package className="h-6 w-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Activity Packs Management</h3>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Create and manage activity packs for purchase. Link categories to packs, set prices, and track purchases.
                </p>
                
                <ActivityPacksAdmin userEmail={user?.email || ''} />
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="space-y-6">
              {/* Custom Objectives Management */}
              <div className="border border-teal-200 bg-teal-50 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <GraduationCap className="h-6 w-6 text-teal-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Curriculum Objectives</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Create and manage curriculum objectives for any year group or subject.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 border border-teal-200">
                    <h4 className="font-medium text-teal-900 mb-2">Year Groups</h4>
                    <p className="text-sm text-teal-700">
                      Add curriculum groups (Y1 Drama, Y2 Music, etc.)
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-teal-200">
                    <h4 className="font-medium text-teal-900 mb-2">Learning Areas</h4>
                    <p className="text-sm text-teal-700">
                      Create learning areas (Performance, Technical Skills, etc.)
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-teal-200">
                    <h4 className="font-medium text-teal-900 mb-2">Objectives</h4>
                    <p className="text-sm text-teal-700">
                      Define objectives with codes and descriptions
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-teal-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Objectives Manager</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Create, edit, and organize objectives
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCustomObjectivesAdmin(true)}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <GraduationCap className="h-4 w-4" />
                      <span>Open Admin Panel</span>
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Example Structure:</h5>
                    <div className="text-sm text-gray-700 space-y-1">
                      <div><strong>Y1 Drama</strong> (Teal)</div>
                      <div className="ml-4">• <strong>Performance Skills</strong></div>
                      <div className="ml-8">- Y1D-P-01: Use voice expressively</div>
                      <div className="ml-8">- Y1D-P-02: Use movement effectively</div>
                      <div className="ml-4">• <strong>Creative Expression</strong></div>
                      <div className="ml-8">- Y1D-C-01: Develop simple narratives</div>
                      <div className="ml-8">- Y1D-C-02: Work collaboratively in groups</div>
                    </div>
                  </div>
                </div>
              </div>
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

      {/* Custom Objectives Admin Modal */}
      <CustomObjectivesAdmin
        isOpen={showCustomObjectivesAdmin}
        onClose={() => setShowCustomObjectivesAdmin(false)}
      />
      
    </div>
  );
}
