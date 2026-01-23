import React, { useState, useEffect } from 'react';
import { X, Search, ChevronDown, ChevronRight, Check, Target, Plus } from 'lucide-react';
import { customObjectivesApi } from '../config/customObjectivesApi';
import { useSettings } from '../contexts/SettingsContextNew';
import type { CustomObjectiveYearGroupWithAreas } from '../types/customObjectives';

interface ObjectiveSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (objectiveText: string) => void;
  selectedObjectives?: string[];
  multiSelect?: boolean;
  onMultiSelect?: (objectives: string[]) => void;
  filterByYearGroup?: string; // Filter to only show objectives linked to this year group
}

export function ObjectiveSelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedObjectives = [],
  multiSelect = false,
  onMultiSelect,
  filterByYearGroup
}: ObjectiveSelectorProps) {
  const { customYearGroups } = useSettings();
  const [yearGroups, setYearGroups] = useState<CustomObjectiveYearGroupWithAreas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedYearGroups, setExpandedYearGroups] = useState<Set<string>>(new Set());
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [localSelected, setLocalSelected] = useState<string[]>(selectedObjectives);
  const [showAllObjectives, setShowAllObjectives] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadObjectives();
      setLocalSelected(selectedObjectives);
    }
  }, [isOpen, selectedObjectives]);

  const loadObjectives = async () => {
    setLoading(true);
    setError(null);
    try {
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const dataPromise = customObjectivesApi.getCompleteStructure();
      
      const data = await Promise.race([dataPromise, timeoutPromise]) as CustomObjectiveYearGroupWithAreas[];
      setYearGroups(data);
      
      // Auto-expand first year group
      if (data.length > 0) {
        setExpandedYearGroups(new Set([data[0].id]));
      }
    } catch (err) {
      console.error('Failed to load objectives:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load objectives';
      setError(errorMessage);
      setYearGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleYearGroup = (id: string) => {
    const newExpanded = new Set(expandedYearGroups);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedYearGroups(newExpanded);
  };

  const toggleArea = (id: string) => {
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAreas(newExpanded);
  };

  const handleSelectObjective = (objectiveText: string) => {
    if (multiSelect) {
      const newSelected = localSelected.includes(objectiveText)
        ? localSelected.filter(o => o !== objectiveText)
        : [...localSelected, objectiveText];
      setLocalSelected(newSelected);
    } else {
      onSelect(objectiveText);
      onClose();
    }
  };

  const handleConfirmMultiSelect = () => {
    if (onMultiSelect) {
      onMultiSelect(localSelected);
    }
    onClose();
  };

  // Filter objectives based on search
  const filterObjectives = (yearGroup: CustomObjectiveYearGroupWithAreas) => {
    if (!searchTerm) return yearGroup;
    
    const searchLower = searchTerm.toLowerCase();
    const filteredAreas = yearGroup.areas
      .map(area => ({
        ...area,
        objectives: area.objectives.filter(obj => 
          obj.objective_text.toLowerCase().includes(searchLower) ||
          (obj.objective_code && obj.objective_code.toLowerCase().includes(searchLower)) ||
          area.name.toLowerCase().includes(searchLower)
        )
      }))
      .filter(area => area.objectives.length > 0);
    
    return { ...yearGroup, areas: filteredAreas };
  };

  // Helper function to normalize strings for comparison (case-insensitive, handle spaces)
  const normalizeString = (str: string): string => {
    return str.toLowerCase().trim().replace(/\s+/g, ' ');
  };

  // Get all possible identifiers for the filter year group (ID, name, normalized versions)
  const getYearGroupIdentifiers = (filterValue: string): string[] => {
    const identifiers = [filterValue];
    
    // Find the year group in customYearGroups to get both ID and name
    if (customYearGroups) {
      const matchingYearGroup = customYearGroups.find(yg => 
        yg.id === filterValue || 
        yg.name === filterValue ||
        normalizeString(yg.id) === normalizeString(filterValue) ||
        normalizeString(yg.name) === normalizeString(filterValue)
      );
      
      if (matchingYearGroup) {
        identifiers.push(matchingYearGroup.id, matchingYearGroup.name);
      }
    }
    
    // Add normalized versions
    identifiers.push(normalizeString(filterValue));
    
    // Remove duplicates
    return [...new Set(identifiers)];
  };

  // Filter by linked year group first, then by search term
  // Only show objectives that are EXPLICITLY linked to the current year group
  const yearGroupFiltered = filterByYearGroup && !showAllObjectives
    ? yearGroups.filter(yg => {
        // Must have linked_year_groups AND include the current year group
        if (!yg.linked_year_groups || yg.linked_year_groups.length === 0) return false;
        
        // Get all possible identifiers for the filter year group
        const filterIdentifiers = getYearGroupIdentifiers(filterByYearGroup);
        
        // Check if any linked year group matches any of the identifiers (case-insensitive, flexible matching)
        return yg.linked_year_groups.some(linked => {
          const normalizedLinked = normalizeString(linked);
          return filterIdentifiers.some(filterId => 
            normalizeString(filterId) === normalizedLinked ||
            normalizedLinked.includes(normalizeString(filterId)) ||
            normalizeString(filterId).includes(normalizedLinked)
          );
        });
      })
    : yearGroups;

  const filteredYearGroups = yearGroupFiltered
    .map(filterObjectives)
    .filter(yg => yg.areas.length > 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[120]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="flex items-center space-x-3">
            <Target className="h-6 w-6 text-white" />
            <h2 className="text-lg font-bold text-white">Select Learning Objective</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search objectives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {filterByYearGroup && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Showing objectives for <span className="font-medium text-blue-600">{filterByYearGroup}</span>
              </span>
              <button
                onClick={() => setShowAllObjectives(!showAllObjectives)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showAllObjectives ? 'Show linked only' : 'Show all objectives'}
              </button>
            </div>
          )}
          {multiSelect && localSelected.length > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {localSelected.length} objective{localSelected.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setLocalSelected([])}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-sm text-gray-500">Loading objectives...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-red-300 mx-auto mb-4" />
              <p className="text-red-600 font-medium">Failed to load objectives</p>
              <p className="text-sm text-gray-500 mt-2">{error}</p>
              <button
                onClick={loadObjectives}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredYearGroups.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No objectives match your search' : 'No objectives available yet'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Create objectives in Settings → Custom Objectives Admin
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredYearGroups.map((yearGroup) => (
                <div key={yearGroup.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Year Group Header */}
                  <button
                    onClick={() => toggleYearGroup(yearGroup.id)}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-blue-25 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: yearGroup.color }}
                      />
                      <span className="font-semibold text-gray-900">{yearGroup.name}</span>
                      <span className="text-xs text-gray-500">
                        ({yearGroup.areas.reduce((sum, area) => sum + area.objectives.length, 0)} objectives)
                      </span>
                    </div>
                    {expandedYearGroups.has(yearGroup.id) ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </button>

                  {/* Areas */}
                  {expandedYearGroups.has(yearGroup.id) && (
                    <div className="border-t border-gray-100">
                      {yearGroup.areas.map((area) => (
                        <div key={area.id} className="border-b border-gray-100 last:border-b-0">
                          {/* Area Header */}
                          <button
                            onClick={() => toggleArea(area.id)}
                            className="w-full flex items-center justify-between px-6 py-3 bg-white hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              {expandedAreas.has(area.id) ? (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              )}
                              <span className="font-medium text-gray-800">{area.name}</span>
                              <span className="text-xs text-gray-500">
                                ({area.objectives.length})
                              </span>
                            </div>
                          </button>

                          {/* Objectives */}
                          {expandedAreas.has(area.id) && (
                            <div className="px-6 pb-3 space-y-2">
                              {area.objectives.map((objective) => {
                                const isSelected = localSelected.includes(objective.objective_text);
                                return (
                                  <button
                                    key={objective.id}
                                    onClick={() => handleSelectObjective(objective.objective_text)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                                      isSelected
                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                        : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-25'
                                    }`}
                                  >
                                    <div className="flex items-start space-x-3">
                                      <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                                        isSelected 
                                          ? 'border-blue-500 bg-blue-500' 
                                          : 'border-gray-300 bg-white'
                                      }`}>
                                        {isSelected && <Check className="h-3 w-3 text-white" />}
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-sm text-gray-800 leading-relaxed">
                                          {objective.objective_text}
                                        </p>
                                        {objective.description && (
                                          <p className="text-xs text-gray-500 mt-1">
                                            {objective.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          {multiSelect && (
            <button
              onClick={handleConfirmMultiSelect}
              disabled={localSelected.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Add {localSelected.length} Objective{localSelected.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
