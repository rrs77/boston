import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSettings, Category } from '../contexts/SettingsContextNew';
import { useData } from '../contexts/DataContext';
import { ChevronDown, ChevronRight, X } from 'lucide-react';

interface SimpleNestedCategoryDropdownProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  placeholder?: string;
  className?: string;
  dropdownBackgroundColor?: string;
  textColor?: string;
  showAllCategories?: boolean; // If true, show all categories regardless of year group filtering
}

export function SimpleNestedCategoryDropdown({
  selectedCategory,
  onCategoryChange,
  placeholder = 'Select Category',
  className = '',
  dropdownBackgroundColor,
  textColor,
  showAllCategories = false
}: SimpleNestedCategoryDropdownProps) {
  const { categories, categoryGroups, customYearGroups } = useSettings();
  const { currentSheetInfo } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper function to get the year group key(s) to check in category.yearGroups
  // This matches the EXACT logic used in UserSettings when saving categories (line 1557-1560)
  // IMPORTANT: Only return the PRIMARY key used when saving - don't include backward compatibility keys
  // This ensures we only show categories explicitly assigned to this year group
  const getCurrentYearGroupKeys = (): string[] => {
    const sheetId = currentSheetInfo?.sheet;
    if (!sheetId) return [];

    // Find the year group - match by ID first (since currentSheetInfo.sheet is the ID)
    const yearGroup = customYearGroups.find(yg => yg.id === sheetId);
    
    if (yearGroup) {
      // Use the EXACT same logic as UserSettings (line 1557-1560)
      // This is the PRIMARY key that was used when saving
      const primaryKey = yearGroup.id || 
        (yearGroup.name.toLowerCase().includes('lower') || yearGroup.name.toLowerCase().includes('lkg') ? 'LKG' :
         yearGroup.name.toLowerCase().includes('upper') || yearGroup.name.toLowerCase().includes('ukg') ? 'UKG' :
         yearGroup.name.toLowerCase().includes('reception') ? 'Reception' : yearGroup.name);
      
      console.log('🔑 Year group PRIMARY key:', {
        sheetId,
        yearGroupName: yearGroup.name,
        yearGroupId: yearGroup.id,
        primaryKey
      });
      
      // Return ONLY the primary key - this is what was used when saving
      return [primaryKey];
    } else {
      // If no year group found by ID, try by name
      const yearGroupByName = customYearGroups.find(yg => yg.name === sheetId);
      if (yearGroupByName) {
        const primaryKey = yearGroupByName.id || 
          (yearGroupByName.name.toLowerCase().includes('lower') || yearGroupByName.name.toLowerCase().includes('lkg') ? 'LKG' :
           yearGroupByName.name.toLowerCase().includes('upper') || yearGroupByName.name.toLowerCase().includes('ukg') ? 'UKG' :
           yearGroupByName.name.toLowerCase().includes('reception') ? 'Reception' : yearGroupByName.name);
        console.log('🔑 Year group PRIMARY key (by name):', {
          sheetId,
          yearGroupName: yearGroupByName.name,
          yearGroupId: yearGroupByName.id,
          primaryKey
        });
        return [primaryKey];
      } else {
        // Fallback: use sheetId as-is
        console.log('🔑 Year group PRIMARY key (fallback):', sheetId);
        return [sheetId];
      }
    }
  };

  // Get current year group display name for visual indicator
  const getCurrentYearGroupName = (): string | null => {
    const sheetId = currentSheetInfo?.sheet;
    if (!sheetId) return null;
    
    const yearGroup = customYearGroups.find(yg => yg.id === sheetId);
    return yearGroup ? yearGroup.name : currentSheetInfo?.display || null;
  };

  // Filter categories based on current year group
  const filteredCategories = useMemo(() => {
    // If showAllCategories is true, skip filtering and show all categories
    if (showAllCategories) {
      console.log('📋 Showing all categories (showAllCategories=true)');
      return categories;
    }
    
    const yearGroupKeys = getCurrentYearGroupKeys();
    
    console.log('🔍 Category filtering:', {
      sheetId: currentSheetInfo?.sheet,
      yearGroupKeys,
      totalCategories: categories.length
    });
    
    // If no year group keys found, show all categories (backward compatibility)
    if (yearGroupKeys.length === 0) {
      console.log('⚠️ No year group keys found, showing all categories');
      return categories;
    }

    // Filter categories to only show those enabled for the current year group
    const filtered = categories.filter(category => {
      // If category doesn't have yearGroups property or it's empty, don't show it (must be explicitly assigned)
      if (!category.yearGroups || Object.keys(category.yearGroups).length === 0) {
        return false;
      }

      // Check if this category has old default assignments (all legacy keys set to true)
      // This indicates it was never properly assigned and should be ignored
      const hasOldDefaults = 
        category.yearGroups.LKG === true && 
        category.yearGroups.UKG === true && 
        category.yearGroups.Reception === true &&
        Object.keys(category.yearGroups).length === 3;
      
      if (hasOldDefaults) {
        // This category has old default values - ignore it unless explicitly assigned to current year group
        const categoryIndex = categories.indexOf(category);
        if (categoryIndex < 3) {
          console.log(`⚠️ Category "${category.name}" has old default assignments (LKG, UKG, Reception all true) - ignoring`);
        }
        return false;
      }

      // Get all keys stored in this category's yearGroups
      const storedKeys = Object.keys(category.yearGroups);
      const storedValues = Object.entries(category.yearGroups).map(([k, v]) => `${k}:${v}`);
      
      // Check if this category is enabled for the PRIMARY year group key
      // We only check the primary key to ensure strict matching
      const primaryKey = yearGroupKeys[0];
      const value = category.yearGroups[primaryKey];
      const isEnabled = value === true;
      
      // Log detailed info for debugging (only first 5 categories to avoid spam)
      const categoryIndex = categories.indexOf(category);
      if (categoryIndex < 5) {
        console.log(`📋 Category "${category.name}":`, {
          storedKeys,
          storedValues,
          primaryKey,
          value,
          isEnabled
        });
      }
      
      return isEnabled;
    });
    
    // Log summary with detailed breakdown
    const categoriesWithYearGroups = categories.filter(c => c.yearGroups && Object.keys(c.yearGroups).length > 0);
    const categoriesWithoutYearGroups = categories.filter(c => !c.yearGroups || Object.keys(c.yearGroups).length === 0);
    
    console.log(`📊 Category filtering summary:`, {
      yearGroup: getCurrentYearGroupName() || currentSheetInfo?.sheet,
      yearGroupKeys,
      totalCategories: categories.length,
      categoriesWithYearGroups: categoriesWithYearGroups.length,
      categoriesWithoutYearGroups: categoriesWithoutYearGroups.length,
      filteredCount: filtered.length,
      filteredCategories: filtered.map(c => c.name).slice(0, 10)
    });
    
    return filtered;
  }, [categories, currentSheetInfo, customYearGroups, showAllCategories]);

  // Check if filtering is active
  const isFilteringActive = useMemo(() => {
    const yearGroupKeys = getCurrentYearGroupKeys();
    return yearGroupKeys.length > 0;
  }, [currentSheetInfo, customYearGroups]);

  // Get count of filtered vs total categories
  const filteredCount = filteredCategories.length;
  const totalCount = categories.length;

  const getCategoryNameById = (name: string) => {
    if (!name) return name;
    // Try exact match first in filtered categories
    const exactMatch = filteredCategories.find(c => c.name === name);
    if (exactMatch) return exactMatch.name;
    // Try case-insensitive match
    const caseInsensitiveMatch = filteredCategories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (caseInsensitiveMatch) return caseInsensitiveMatch.name;
    // Return original if no match found (might be a deleted/renamed category)
    return name;
  };
  const getCategoryColorById = (name: string) => {
    if (!name) return '#ccc';
    const exactMatch = filteredCategories.find(c => c.name === name);
    if (exactMatch) return exactMatch.color;
    const caseInsensitiveMatch = filteredCategories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (caseInsensitiveMatch) return caseInsensitiveMatch.color;
    return '#ccc';
  };

  const currentSelectionName = selectedCategory ? getCategoryNameById(selectedCategory) : placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectCategory = (categoryName: string) => {
    onCategoryChange(categoryName);
    setIsOpen(false);
  };

  const toggleGroupExpansion = (groupName: string) => {
    console.log('🔄 Toggling group expansion for:', groupName);
    console.log('🔄 Current expanded groups:', Array.from(expandedGroups));
    
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
      console.log('🔄 Collapsing group:', groupName);
    } else {
      newExpanded.add(groupName);
      console.log('🔄 Expanding group:', groupName);
    }
    
    console.log('🔄 New expanded groups:', Array.from(newExpanded));
    setExpandedGroups(newExpanded);
  };

  // Group filtered categories by their group(s)
  const groupedCategories = filteredCategories.reduce((acc, category) => {
    // Handle multiple groups (new functionality)
    if (category.groups && category.groups.length > 0) {
      category.groups.forEach(group => {
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(category);
      });
    } else {
      // Handle single group (backward compatibility)
      const group = category.group || 'Ungrouped';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(category);
    }
    return acc;
  }, {} as Record<string, Category[]>);

  // Sort groups: Ungrouped first, then alphabetically
  const sortedGroups = Object.keys(groupedCategories).sort((a, b) => {
    if (a === 'Ungrouped') return -1;
    if (b === 'Ungrouped') return 1;
    return a.localeCompare(b);
  });

  const currentYearGroupName = getCurrentYearGroupName();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={`flex justify-between items-center w-full text-left ${className}`}
        style={{ color: textColor }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-current truncate">
          {currentSelectionName}
        </span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} style={{ color: textColor }} />
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 mt-1 w-96 min-w-full rounded-lg shadow-xl max-h-80 overflow-y-auto border border-gray-200"
          style={{ 
            backgroundColor: dropdownBackgroundColor || 'white',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          <ul className="py-1">
            {/* When filtering is active, show simple flat list */}
            {isFilteringActive ? (
              // Simple flat list of filtered categories
              filteredCategories.map(category => (
                <li
                  key={category.name}
                  className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                    selectedCategory === category.name 
                      ? 'bg-teal-100 font-medium' 
                      : 'text-gray-700 hover:bg-teal-50'
                  }`}
                  style={{
                    color: selectedCategory === category.name ? '#374151' : undefined
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectCategory(category.name);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                  <span className="truncate">{category.name}</span>
                </li>
              ))
            ) : (
              // Original grouped structure when not filtering
              <>
                {/* Placeholder/All Categories Option */}
            <li
              className={`px-4 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                selectedCategory === '' 
                  ? 'bg-gray-100 font-medium' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              style={{
                color: selectedCategory === '' ? '#374151' : undefined
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectCategory('');
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {placeholder}
            </li>
            {sortedGroups.map(groupName => (
              <React.Fragment key={groupName}>
                <li 
                  className="px-2 py-2 bg-gray-50 border-t border-b border-gray-200 text-sm font-semibold text-gray-800 flex items-center justify-between cursor-pointer hover:bg-teal-50 transition-all duration-150"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Group clicked:', groupName);
                    toggleGroupExpansion(groupName);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-gray-500">
                      {expandedGroups.has(groupName) ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </div>
                    {groupName}
                  </div>
                  <span className="text-xs text-gray-500">{groupedCategories[groupName].length}</span>
                </li>
                {expandedGroups.has(groupName) && groupedCategories[groupName].map(category => (
                  <li
                    key={category.name}
                    className={`flex items-center gap-2 px-6 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                      selectedCategory === category.name 
                        ? 'bg-teal-100 font-medium' 
                        : 'text-gray-700 hover:bg-teal-50'
                    }`}
                    style={{
                      color: selectedCategory === category.name ? '#374151' : undefined
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectCategory(category.name);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseUp={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                    {category.name}
                  </li>
                ))}
              </React.Fragment>
            ))}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
