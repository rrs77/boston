import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { customObjectivesApi } from '../config/customObjectivesApi';
import type { CustomObjective, CustomObjectiveArea, CustomObjectiveYearGroup } from '../types/customObjectives';

interface CustomObjectivesSelectorProps {
  yearGroupId: string;
  selectedObjectiveIds: string[];
  onObjectivesChange: (objectiveIds: string[]) => void;
  className?: string;
}

export function CustomObjectivesSelector({ 
  yearGroupId, 
  selectedObjectiveIds, 
  onObjectivesChange, 
  className = '' 
}: CustomObjectivesSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [areas, setAreas] = useState<CustomObjectiveArea[]>([]);
  const [objectives, setObjectives] = useState<CustomObjective[]>([]);
  const [loading, setLoading] = useState(false);

  // Load objectives when year group changes
  useEffect(() => {
    if (yearGroupId) {
      loadObjectives();
    }
  }, [yearGroupId]);

  const loadObjectives = async () => {
    setLoading(true);
    try {
      const data = await customObjectivesApi.getByYearGroup(yearGroupId);
      setAreas(data);
      
      // Flatten all objectives for easier searching
      const allObjectives = data.flatMap(area => area.objectives);
      setObjectives(allObjectives);
    } catch (error) {
      console.error('Failed to load custom objectives:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredObjectives = objectives.filter(objective => 
    objective.objective_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    objective.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group filtered objectives by area
  const groupedObjectives: Record<string, CustomObjective[]> = {};
  
  filteredObjectives.forEach(objective => {
    const area = areas.find(a => a.id === objective.area_id);
    const areaName = area?.name || 'Unknown Area';
    
    if (!groupedObjectives[areaName]) {
      groupedObjectives[areaName] = [];
    }
    
    groupedObjectives[areaName].push(objective);
  });

  const handleToggleObjective = (objectiveId: string) => {
    const isSelected = selectedObjectiveIds.includes(objectiveId);
    
    if (isSelected) {
      onObjectivesChange(selectedObjectiveIds.filter(id => id !== objectiveId));
    } else {
      onObjectivesChange([...selectedObjectiveIds, objectiveId]);
    }
  };

  const handleClearAll = () => {
    onObjectivesChange([]);
  };

  const selectedCount = selectedObjectiveIds.length;
  const selectedObjectives = objectives.filter(obj => selectedObjectiveIds.includes(obj.id));

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">
            Custom Objectives
          </span>
          {selectedCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {selectedCount} selected
            </span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Select Objectives</h3>
              {selectedCount > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center space-x-1"
                >
                  <X className="h-3 w-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search objectives..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                dir="ltr"
              />
            </div>
          </div>

          {/* Content */}
          <div className="max-h-60 overflow-y-auto p-2">
            {loading ? (
              <div className="text-center py-4 text-gray-500">
                Loading objectives...
              </div>
            ) : Object.keys(groupedObjectives).length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {searchQuery ? 'No objectives match your search' : 'No objectives available'}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedObjectives).map(([areaName, areaObjectives]) => (
                  <div key={areaName} className="bg-gray-50 rounded-lg p-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-1 px-2">{areaName}</h4>
                    <div className="space-y-1">
                      {areaObjectives.map((objective) => {
                        const isSelected = selectedObjectiveIds.includes(objective.id);
                        
                        return (
                          <div
                            key={objective.id}
                            className="flex items-start space-x-2 p-2 hover:bg-blue-50 rounded-lg cursor-pointer"
                            onClick={() => handleToggleObjective(objective.id)}
                          >
                            <div className={`w-5 h-5 flex-shrink-0 rounded border mt-0.5 ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 flex items-center justify-center'
                                : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 mt-1" dir="ltr">
                                {objective.objective_text}
                              </p>
                              {objective.description && (
                                <p className="text-xs text-gray-500 mt-1" dir="ltr">
                                  {objective.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {selectedCount > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-600">
                <strong>{selectedCount}</strong> objective{selectedCount !== 1 ? 's' : ''} selected
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Objectives Summary */}
      {selectedObjectives.length > 0 && (
        <div className="mt-2 space-y-1">
          {selectedObjectives.slice(0, 3).map((objective) => (
            <div key={objective.id} className="flex items-center space-x-2 text-xs text-gray-600">
              <span className="truncate">{objective.objective_text}</span>
            </div>
          ))}
          {selectedObjectives.length > 3 && (
            <div className="text-xs text-gray-500">
              ... and {selectedObjectives.length - 3} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
