import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSettings, Category } from '../contexts/SettingsContextNew';
import { useData } from '../contexts/DataContext';
import { ChevronDown, ChevronRight, Filter, X } from 'lucide-react';

interface SimpleNestedCategoryDropdownProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  placeholder?: string;
  className?: string;
  dropdownBackgroundColor?: string;
  textColor?: string;
}

export function SimpleNestedCategoryDropdown({
  selectedCategory,
  onCategoryChange,
  placeholder = 'Select Category',
  className = '',
  dropdownBackgroundColor,
  textColor
}: SimpleNestedCategoryDropdownProps) {
  const { categories, categoryGroups, customYearGroups } = useSettings();
  const { currentSheetInfo } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper function to get the year group key(s) to check in category.yearGroups
  // This matches the EXACT logic used in UserSettings when saving categories (line 1557-1560)
  const getCurrentYearGroupKeys = (): string[] => {
    const sheetId = currentSheetInfo?.sheet;
    if (!sheetId) return [];

    const keys: string[] = [];

    // Find the year group - match by ID first (since currentSheetInfo.sheet is the ID)
    const yearGroup = customYearGroups.find(yg => yg.id === sheetId);
    
    if (yearGroup) {
      // Use the EXACT same logic as UserSettings (line 1557-1560)
      // This is the PRIMARY key that was used when saving
      const primaryKey = yearGroup.id || 
        (yearGroup.name.toLowerCase().includes('lower') || yearGroup.name.toLowerCase().includes('lkg') ? 'LKG' :
         yearGroup.name.toLowerCase().includes('upper') || yearGroup.name.toLowerCase().includes('ukg') ? 'UKG' :
         yearGroup.name.toLowerCase().includes('reception') ? 'Reception' : yearGroup.name);
      
      // Primary key (what was used when saving) - check this FIRST
      keys.push(primaryKey);
      
      // Also check yearGroup.id if it's different (for UUIDs)
      if (yearGroup.id && yearGroup.id !== primaryKey) {
        keys.push(yearGroup.id);
      }
      
      // Also check yearGroup.name if it's different (for backward compatibility)
      if (yearGroup.name && yearGroup.name !== primaryKey && yearGroup.name !== yearGroup.id) {
        keys.push(yearGroup.name);
      }
      
      // Add mapped codes for backward compatibility ONLY if they're different
      const name = yearGroup.name.toLowerCase().trim();
      if (name.includes('lower') || name.includes('lkg')) {
        if (!keys.includes('LKG')) keys.push('LKG');
      }
      if (name.includes('upper') || name.includes('ukg')) {
        if (!keys.includes('UKG')) keys.push('UKG');
      }
      if (name.includes('reception')) {
        if (!keys.includes('Reception')) keys.push('Reception');
      }
    } else {
      // If no year group found by ID, try by name
      const yearGroupByName = customYearGroups.find(yg => yg.name === sheetId);
      if (yearGroupByName) {
        const primaryKey = yearGroupByName.id || 
          (yearGroupByName.name.toLowerCase().includes('lower') || yearGroupByName.name.toLowerCase().includes('lkg') ? 'LKG' :
           yearGroupByName.name.toLowerCase().includes('upper') || yearGroupByName.name.toLowerCase().includes('ukg') ? 'UKG' :
           yearGroupByName.name.toLowerCase().includes('reception') ? 'Reception' : yearGroupByName.name);
        keys.push(primaryKey);
        if (yearGroupByName.id && yearGroupByName.id !== primaryKey) {
          keys.push(yearGroupByName.id);
        }
        if (yearGroupByName.name && yearGroupByName.name !== primaryKey && yearGroupByName.name !== yearGroupByName.id) {
          keys.push(yearGroupByName.name);
        }
      } else {
        // Fallback: use sheetId as-is
        keys.push(sheetId);
      }
    }

    // Remove duplicates and log for debugging
    const uniqueKeys = [...new Set(keys)];
    console.log('🔑 Year group keys to check:', {
      sheetId,
      yearGroupName: yearGroup?.name,
      yearGroupId: yearGroup?.id,
      primaryKey: uniqueKeys[0],
      allKeys: uniqueKeys
    });
    
    return uniqueKeys;
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
        console.log(`❌ Category "${category.name}" has no yearGroups assigned`);
        return false;
      }

      // Debug: Log the category's yearGroups structure (only for first few categories to avoid spam)
      const categoryIndex = categories.indexOf(category);
      if (categoryIndex < 3) {
        console.log(`📋 Category "${category.name}" yearGroups:`, JSON.stringify(category.yearGroups), 'keys:', Object.keys(category.yearGroups || {}));
      }
      
      // Check if this category is enabled for any of the year group keys
      const isEnabled = yearGroupKeys.some(key => {
        const value = category.yearGroups[key];
        const result = value === true;
        if (result && categoryIndex < 3) {
          console.log(`✅ Category "${category.name}" enabled for key "${key}"`);
        } else if (value !== undefined && categoryIndex < 3) {
          console.log(`⚠️ Category "${category.name}" has key "${key}" but value is:`, value);
        }
        return result;
      });
      
      if (!isEnabled && categoryIndex < 3) {
        console.log(`❌ Category "${category.name}" not enabled. yearGroups keys:`, Object.keys(category.yearGroups || {}), 'keys checked:', yearGroupKeys);
      }
      
      return isEnabled;
    });
    
    console.log(`📊 Category filtering result: ${filtered.length} of ${categories.length} categories shown for year group "${getCurrentYearGroupName() || currentSheetInfo?.sheet}"`);
    console.log(`📊 Categories shown:`, filtered.map(c => c.name).slice(0, 10));
    
    return filtered;
  }, [categories, currentSheetInfo, customYearGroups]);

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
            {/* Filter Status Indicator */}
            {isFilteringActive && (
              <li className="px-4 py-2 border-b border-gray-200 bg-teal-50">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-teal-600" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-700">
                      Filtered for {currentYearGroupName || 'current year group'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {filteredCount} of {totalCount} categories
                    </span>
                  </div>
                </div>
              </li>
            )}
            
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
          </ul>
        </div>
      )}
    </div>
  );
}
