import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContextNew';

interface LevelDropdownProps {
  selectedLevel: string;
  onLevelChange: (level: string) => void;
  placeholder?: string;
  className?: string;
}

export function LevelDropdown({
  selectedLevel,
  onLevelChange,
  placeholder = 'All Levels',
  className = ''
}: LevelDropdownProps) {
  const { customYearGroups } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentSelectionName = selectedLevel === 'all' ? placeholder : 
    customYearGroups.find(group => group.name === selectedLevel)?.name || selectedLevel;

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

  const handleSelectLevel = (level: string) => {
    onLevelChange(level);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={`flex justify-between items-center w-full text-left ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-current">
          {currentSelectionName}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 mt-1 w-64 min-w-full rounded-lg shadow-xl max-h-60 overflow-y-auto border border-gray-200"
          style={{ 
            backgroundColor: 'white',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          <ul className="py-1">
            <li
              className={`px-4 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                selectedLevel === 'all' 
                  ? 'bg-gray-100 font-medium' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              style={{
                color: selectedLevel === 'all' ? '#374151' : undefined
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectLevel('all');
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
            {customYearGroups.map(group => (
              <li
                key={group.name}
                className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                  selectedLevel === group.name 
                    ? 'bg-gray-100 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelectLevel(group.name);
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
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
                {group.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
