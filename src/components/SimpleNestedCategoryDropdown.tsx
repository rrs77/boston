import React, { useState, useRef, useEffect } from 'react';
import { useSettings, Category } from '../contexts/SettingsContextNew';
import { ChevronDown, ChevronRight } from 'lucide-react';

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
  const { categories, categoryGroups } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getCategoryNameById = (name: string) => {
    if (!name) return name;
    // Try exact match first
    const exactMatch = categories.find(c => c.name === name);
    if (exactMatch) return exactMatch.name;
    // Try case-insensitive match
    const caseInsensitiveMatch = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (caseInsensitiveMatch) return caseInsensitiveMatch.name;
    // Return original if no match found (might be a deleted/renamed category)
    return name;
  };
  const getCategoryColorById = (name: string) => {
    if (!name) return '#ccc';
    const exactMatch = categories.find(c => c.name === name);
    if (exactMatch) return exactMatch.color;
    const caseInsensitiveMatch = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
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

  // Group categories by their group(s)
  const groupedCategories = categories.reduce((acc, category) => {
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={`flex justify-between items-center w-full text-left ${className}`}
        style={{ color: textColor }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-current">
          {currentSelectionName}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} style={{ color: textColor }} />
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
