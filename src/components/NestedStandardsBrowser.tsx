import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, ChevronUp, Tag, Check, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { customObjectivesApi } from '../config/customObjectivesApi';
import type { CustomObjectiveYearGroup, CustomObjectiveArea, CustomObjective } from '../types/customObjectives';

interface NestedStandardsBrowserProps {
  lessonNumber?: string;
  className?: string;
  // Standalone mode props
  isOpen?: boolean;
  onClose?: () => void;
  selectedObjectives?: string[];
  onAddObjective?: (objectiveId: string) => void;
  onRemoveObjective?: (objectiveId: string) => void;
}

export function NestedStandardsBrowser({ 
  lessonNumber, 
  className = '',
  isOpen: controlledIsOpen,
  onClose,
  selectedObjectives: controlledSelectedObjectives,
  onAddObjective,
  onRemoveObjective
}: NestedStandardsBrowserProps) {
  const { allLessonsData, addCustomObjectiveToLesson, removeCustomObjectiveFromLesson } = useData();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [expandedYearGroups, setExpandedYearGroups] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedAreas, setExpandedAreas] = useState<string[]>([]);
  
  // Custom objectives state
  const [customYearGroups, setCustomYearGroups] = useState<CustomObjectiveYearGroup[]>([]);
  const [customAreas, setCustomAreas] = useState<CustomObjectiveArea[]>([]);
  const [customObjectives, setCustomObjectives] = useState<CustomObjective[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine if we're in controlled mode (standalone) or uncontrolled mode (lesson-bound)
  const isControlledMode = controlledIsOpen !== undefined;
  const isOpen = isControlledMode ? controlledIsOpen : internalIsOpen;
  const setIsOpen = isControlledMode ? onClose || (() => {}) : setInternalIsOpen;

  // Load custom objectives
  useEffect(() => {
    const loadCustomObjectives = async () => {
      try {
        const [yearGroups, areas, objectives] = await Promise.all([
          customObjectivesApi.yearGroups.getAll(),
          customObjectivesApi.areas.getAll(),
          customObjectivesApi.objectives.getAll()
        ]);
        setCustomYearGroups(yearGroups);
        setCustomAreas(areas);
        setCustomObjectives(objectives);
      } catch (error) {
        console.error('Failed to load custom objectives:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCustomObjectives();
  }, []);

  // Get selected objectives - either from controlled props or from lesson data
  const lessonData = lessonNumber ? allLessonsData?.[lessonNumber] : null;
  const selectedObjectiveIds = isControlledMode 
    ? (controlledSelectedObjectives || [])
    : ((lessonData?.customObjectives || []) as string[]);

  const toggleYearGroup = (yearGroupId: string) => {
    setExpandedYearGroups(prev => 
      prev.includes(yearGroupId) 
        ? prev.filter(id => id !== yearGroupId)
        : [...prev, yearGroupId]
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const toggleArea = (areaId: string) => {
    setExpandedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  const handleToggleObjective = async (objectiveId: string) => {
    // If in controlled mode (standalone), use callback functions
    if (isControlledMode) {
      const isCurrentlySelected = selectedObjectiveIds.includes(objectiveId);
      if (isCurrentlySelected && onRemoveObjective) {
        onRemoveObjective(objectiveId);
      } else if (!isCurrentlySelected && onAddObjective) {
        onAddObjective(objectiveId);
      }
      return;
    }
    
    // Otherwise, use lesson-bound mode
    if (!lessonData) {
      console.error('Cannot toggle objective: lesson data not found for', lessonNumber);
      alert('Error: Lesson data not found. Please refresh the page.');
      return;
    }
    
    const currentObjectives = (lessonData.customObjectives || []) as string[];
    
    try {
      if (currentObjectives.includes(objectiveId)) {
        // Remove the objective
        await removeCustomObjectiveFromLesson(lessonNumber!, objectiveId);
        console.log('✅ Objective removed successfully');
      } else {
        // Add the objective
        await addCustomObjectiveToLesson(lessonNumber!, objectiveId);
        console.log('✅ Objective added successfully');
      }
    } catch (error) {
      console.error('❌ Failed to toggle objective:', error);
      alert(`Failed to save objective: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Note: Changes are saved locally even if Supabase fails
    }
  };

  // Group areas by section
  const getAreasGroupedBySection = (yearGroupId: string) => {
    const yearGroupAreas = customAreas.filter(area => area.year_group_id === yearGroupId);
    const grouped: { [section: string]: CustomObjectiveArea[] } = {};
    
    yearGroupAreas.forEach(area => {
      const section = area.section || 'Other';
      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push(area);
    });
    
    return grouped;
  };

  // Get objectives for an area
  const getObjectivesForArea = (areaId: string) => {
    return customObjectives.filter(obj => obj.area_id === areaId);
  };

  const getStandardsLabel = () => {
    const totalSelected = selectedObjectiveIds.length;
    return `Standards ${totalSelected > 0 ? `(${totalSelected})` : ''}`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Only show toggle button in uncontrolled mode */}
      {!isControlledMode && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg hover:from-teal-100 hover:to-blue-100 transition-all duration-200 shadow-sm"
        >
          <div className="flex items-center space-x-2">
            <Tag className="h-5 w-5 text-teal-600" />
            <span className="text-sm font-semibold text-teal-800">
              {getStandardsLabel()}
            </span>
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-teal-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-teal-600" />
          )}
        </button>
      )}

      {isOpen && (
        <div className={`${isControlledMode ? '' : 'absolute'} z-[60] ${isControlledMode ? '' : 'mt-2'} w-full bg-white rounded-xl shadow-2xl border border-teal-200 overflow-hidden`}>
          {/* Header */}
          <div className="p-4 border-b border-teal-100 bg-gradient-to-r from-teal-500 to-teal-600">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2 text-white">
                <Tag className="h-5 w-5" />
                <span className="text-base font-bold">Browse Standards</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading standards...</div>
            ) : customYearGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No standards available.</p>
                <p className="text-sm mt-2">Add custom objectives in Settings → Custom Objectives</p>
              </div>
            ) : (
              <div className="space-y-3">
                {customYearGroups.map(yearGroup => {
                  const sectionsMap = getAreasGroupedBySection(yearGroup.id);
                  const sections = Object.keys(sectionsMap);
                  
                  return (
                    <div key={yearGroup.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Year Group Header */}
                      <button
                        onClick={() => toggleYearGroup(yearGroup.id)}
                        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          {expandedYearGroups.includes(yearGroup.id) ? (
                            <ChevronDown className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          )}
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: yearGroup.color }}
                          />
                          <span className="font-bold text-blue-900">{yearGroup.name}</span>
                        </div>
                      </button>

                      {/* Sections */}
                      {expandedYearGroups.includes(yearGroup.id) && (
                        <div className="bg-white">
                          {sections.map(section => {
                            const areas = sectionsMap[section];
                            const sectionKey = `${yearGroup.id}-${section}`;
                            
                            return (
                              <div key={sectionKey} className="border-t border-gray-100">
                                {/* Section Header */}
                                <button
                                  onClick={() => toggleSection(sectionKey)}
                                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center space-x-2">
                                    {expandedSections.includes(sectionKey) ? (
                                      <ChevronDown className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                    )}
                                    <span className="font-semibold text-gray-800">{section}</span>
                                  </div>
                                </button>

                                {/* Areas */}
                                {expandedSections.includes(sectionKey) && (
                                  <div className="bg-white">
                                    {areas.map(area => {
                                      const objectivesForArea = getObjectivesForArea(area.id);
                                      
                                      return (
                                        <div key={area.id} className="border-t border-gray-100">
                                          {/* Area Header */}
                                          <button
                                            onClick={() => toggleArea(area.id)}
                                            className="w-full flex items-center justify-between p-3 pl-8 hover:bg-blue-50 transition-colors"
                                          >
                                            <div className="flex items-center space-x-2">
                                              {expandedAreas.includes(area.id) ? (
                                                <ChevronDown className="h-4 w-4 text-teal-600 flex-shrink-0" />
                                              ) : (
                                                <ChevronRight className="h-4 w-4 text-teal-600 flex-shrink-0" />
                                              )}
                                              <span className="font-medium text-gray-700">{area.name}</span>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                              {objectivesForArea.length} objective{objectivesForArea.length !== 1 ? 's' : ''}
                                            </span>
                                          </button>

                                          {/* Objectives */}
                                          {expandedAreas.includes(area.id) && (
                                            <div className="bg-gray-50 p-3 pl-12 space-y-2">
                                              {objectivesForArea.map(objective => {
                                                const isSelected = selectedObjectiveIds.includes(objective.id);
                                                
                                                return (
                                                  <div
                                                    key={objective.id}
                                                    className="flex items-start space-x-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                                                    onClick={() => handleToggleObjective(objective.id)}
                                                  >
                                                    <div className={`w-5 h-5 flex-shrink-0 rounded border-2 mt-0.5 ${
                                                      isSelected
                                                        ? 'bg-teal-600 border-teal-600 flex items-center justify-center'
                                                        : 'border-gray-300 bg-white'
                                                    }`}>
                                                      {isSelected && (
                                                        <Check className="h-3 w-3 text-white" />
                                                      )}
                                                    </div>
                                                    <span className="text-sm text-gray-700 flex-1">
                                                      {objective.objective_text}
                                                    </span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-teal-100 bg-gradient-to-r from-teal-50 to-blue-50">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-teal-700">
                {selectedObjectiveIds.length} standard{selectedObjectiveIds.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-md transition-colors duration-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Standards Preview - only in uncontrolled mode */}
      {!isControlledMode && selectedObjectiveIds.length > 0 && !isOpen && (
        <div className="mt-3 p-3 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-100">
          <div className="flex flex-wrap gap-2">
            {selectedObjectiveIds.map((objectiveId) => {
              const objective = customObjectives.find(obj => obj.id === objectiveId);
              if (!objective) return null;
              
              return (
                <div
                  key={objectiveId}
                  className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white border border-teal-200 text-teal-800 text-sm rounded-full shadow-sm"
                >
                  <span className="truncate max-w-[250px]">{objective.objective_text}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleObjective(objectiveId);
                    }}
                    className="hover:text-teal-900 p-0.5 hover:bg-teal-100 rounded-full transition-colors duration-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
