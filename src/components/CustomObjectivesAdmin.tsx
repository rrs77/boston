import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  Save, 
  X, 
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock,
  GripVertical,
  Link2,
  Check
} from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { customObjectivesApi } from '../config/customObjectivesApi';
import { seedReceptionDramaObjectives } from '../utils/seedReceptionDrama';
import type { 
  CustomObjectiveYearGroupWithAreas, 
  CustomObjectiveFormData,
  CustomObjectiveCSVRow 
} from '../types/customObjectives';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../contexts/SettingsContextNew';

// Draggable Year Group Item
interface DraggableYearGroupProps {
  yearGroup: CustomObjectiveYearGroupWithAreas;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
  onDragEnd: () => void;
  children: React.ReactNode;
}

function DraggableYearGroup({ yearGroup, index, isSelected, onSelect, onReorder, onDragEnd, children }: DraggableYearGroupProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: 'yearGroup',
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
    type: 'yearGroup',
    item: () => ({ index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    end: () => onDragEnd()
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

interface CustomObjectivesAdminProps {
  isOpen?: boolean;
  onClose?: () => void;
  embedded?: boolean;
}

export function CustomObjectivesAdmin({ isOpen, onClose, embedded = false }: CustomObjectivesAdminProps) {
  const { user } = useAuth();
  const { customYearGroups } = useSettings();
  const isAdmin = user?.email === 'rob.reichstorer@gmail.com' || user?.role === 'administrator';
  
  // Get available year group names for linking
  const availableYearGroups = (customYearGroups || []).map(yg => yg.name);
  
  const [yearGroups, setYearGroups] = useState<CustomObjectiveYearGroupWithAreas[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYearGroup, setSelectedYearGroup] = useState<string | null>(null);
  const [editingYearGroup, setEditingYearGroup] = useState<string | null>(null);
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CustomObjectiveFormData>({
    year_group: { name: '', description: '', color: '#3B82F6', linked_year_groups: [] },
    areas: []
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [cloneData, setCloneData] = useState({ sourceId: '', targetName: '', targetColor: '#3B82F6' });

  // Helper function to auto-resize textarea
  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  // Parse objectives from text using # as delimiter OR newlines
  const parseObjectivesFromText = (text: string) => {
    if (!text || !text.trim()) return [];
    
    // First try splitting by # delimiter
    if (text.includes('#')) {
      const objectives = text
        .split('#')
        .map(obj => obj.trim())
        .filter(obj => obj.length > 0)
        .map((obj, index) => ({
          code: '',
          text: obj,
          description: ''
        }));
      return objectives;
    }
    
    // If no # found, split by newlines (Enter key)
    const objectives = text
      .split('\n')
      .map(obj => obj.trim())
      .filter(obj => obj.length > 0) // Filter out empty lines
      .map((obj, index) => ({
        code: '',
        text: obj,
        description: ''
      }));
    
    return objectives;
  };

  // Handle objective text change with auto-parsing
  const handleObjectiveTextChange = (areaIndex: number, objectiveIndex: number, text: string) => {
    const parsedObjectives = parseObjectivesFromText(text || '');
    
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.map((a, i) => 
        i === areaIndex ? {
          ...a,
          objectives: parsedObjectives.length > 0 ? parsedObjectives : [{
            code: `OBJ${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            text: text || '',
            description: ''
          }]
        } : a
      )
    }));
  };

  useEffect(() => {
    if (isOpen || embedded) {
      loadData();
    }
  }, [isOpen, embedded]);

  // Auto-expand all areas when a year group is selected
  useEffect(() => {
    if (selectedYearGroup) {
      const yearGroup = yearGroups.find(yg => yg.id === selectedYearGroup);
      if (yearGroup) {
        const allAreaIds = new Set(yearGroup.areas.map(area => area.id));
        setExpandedAreas(allAreaIds);
      }
    }
  }, [selectedYearGroup, yearGroups]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await customObjectivesApi.getCompleteStructure();
      setYearGroups(data);
      
      // Expand first year group by default
      if (data.length > 0 && !selectedYearGroup) {
        setSelectedYearGroup(data[0].id);
        setExpandedAreas(new Set(data[0].areas.map(area => area.id)));
      }
    } catch (error) {
      console.error('Failed to load custom objectives:', error);
      setMessage({ type: 'error', text: 'Failed to load custom objectives' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateYearGroup = () => {
    setFormData({
      year_group: { name: '', description: '', color: '#3B82F6', linked_year_groups: [] },
      areas: []
    });
    setEditingYearGroup(null);
    setShowForm(true);
  };

  const handleEditYearGroup = (yearGroup: CustomObjectiveYearGroupWithAreas) => {
    setFormData({
      year_group: {
        name: yearGroup.name,
        description: yearGroup.description || '',
        color: yearGroup.color,
        linked_year_groups: yearGroup.linked_year_groups || []
      },
      areas: yearGroup.areas.map(area => ({
        id: area.id,
        section: area.section || '', // Include section field
        name: area.name,
        description: area.description || '',
        objectives: area.objectives.map(obj => ({
          id: obj.id,
          code: obj.objective_code || '',
          text: obj.objective_text,
          description: obj.description || ''
        }))
      }))
    });
    setEditingYearGroup(yearGroup.id);
    setShowForm(true);
  };

  const handleSaveYearGroup = async () => {
    try {
      console.log('🔄 Saving year group...', { editingYearGroup, formData });
      console.log('🔄 Areas in formData:', formData.areas);
      console.log('🔄 Number of areas:', formData.areas.length);
      
      // Check for duplicate objective codes within areas
      for (const area of formData.areas) {
        const codes = area.objectives.map(obj => obj.code || '').filter(code => code.trim() !== '');
        const uniqueCodes = new Set(codes);
        if (codes.length !== uniqueCodes.size) {
          const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
          setMessage({ type: 'error', text: `Duplicate objective codes found in area "${area.name}": ${[...new Set(duplicates)].join(', ')}. Please ensure all objective codes are unique within each area.` });
          return;
        }
      }
      
      if (editingYearGroup) {
        // Update existing year group
        console.log('🔄 Updating existing year group:', editingYearGroup);
        await customObjectivesApi.yearGroups.update(editingYearGroup, {
          name: formData.year_group.name,
          description: formData.year_group.description,
          color: formData.year_group.color,
          linked_year_groups: formData.year_group.linked_year_groups || []
        });

        // Update areas and objectives for existing year group
        console.log('🔄 Updating areas for existing year group:', formData.areas);
        for (const areaData of formData.areas) {
          console.log('🔄 Processing area for update:', areaData);
          
          if (areaData.id) {
            // Update existing area
            console.log('🔄 Updating existing area:', areaData.id);
            await customObjectivesApi.areas.update(areaData.id, {
              section: areaData.section,
              name: areaData.name,
              description: areaData.description,
              sort_order: formData.areas.indexOf(areaData)
            });
            
            // Update objectives for this area
            for (const objectiveData of areaData.objectives) {
              if (objectiveData.id) {
                console.log('🔄 Updating existing objective:', objectiveData.id);
                await customObjectivesApi.objectives.update(objectiveData.id, {
                  objective_code: objectiveData.code,
                  objective_text: objectiveData.text,
                  description: objectiveData.description,
                  sort_order: areaData.objectives.indexOf(objectiveData)
                });
                     } else {
                       console.log('🔄 Creating new objective for existing area:', objectiveData);
                       await customObjectivesApi.objectives.create({
                         area_id: areaData.id,
                         objective_code: objectiveData.code,
                         objective_text: objectiveData.text,
                         description: objectiveData.description,
                         sort_order: areaData.objectives.indexOf(objectiveData)
                       });
                     }
            }
          } else {
            // Create new area
            console.log('🔄 Creating new area for existing year group:', areaData);
            const newArea = await customObjectivesApi.areas.create({
              year_group_id: editingYearGroup,
              section: areaData.section,
              name: areaData.name,
              description: areaData.description,
              sort_order: formData.areas.indexOf(areaData)
            });
            console.log('✅ New area created:', newArea);
            
            // Create objectives for new area
                   for (const objectiveData of areaData.objectives) {
                     console.log('🔄 Creating objective for new area:', objectiveData);
                     await customObjectivesApi.objectives.create({
                       area_id: newArea.id,
                       objective_code: objectiveData.code,
                       objective_text: objectiveData.text,
                       description: objectiveData.description,
                       sort_order: areaData.objectives.indexOf(objectiveData)
                     });
                   }
          }
        }
        
        setMessage({ type: 'success', text: 'Year group updated successfully' });
      } else {
        // Create new year group
        const newYearGroup = await customObjectivesApi.yearGroups.create({
          name: formData.year_group.name,
          description: formData.year_group.description,
          color: formData.year_group.color,
          sort_order: yearGroups.length,
          linked_year_groups: formData.year_group.linked_year_groups || []
        });

        // Create areas and objectives
        console.log('🔄 Creating areas:', formData.areas);
        for (const areaData of formData.areas) {
          console.log('🔄 Creating area:', areaData);
          const newArea = await customObjectivesApi.areas.create({
            year_group_id: newYearGroup.id,
            section: areaData.section,
            name: areaData.name,
            description: areaData.description,
            sort_order: formData.areas.indexOf(areaData)
          });
          console.log('✅ Area created:', newArea);

          for (const objectiveData of areaData.objectives) {
            await customObjectivesApi.objectives.create({
              area_id: newArea.id,
              objective_code: objectiveData.code,
              objective_text: objectiveData.text,
              description: objectiveData.description,
              sort_order: areaData.objectives.indexOf(objectiveData)
            });
          }
        }

        setMessage({ type: 'success', text: 'Year group created successfully' });
      }

      console.log('✅ Year group saved successfully');
      setShowForm(false);
      setEditingYearGroup(null);
      await loadData();
    } catch (error) {
      console.error('❌ Failed to save year group:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      setMessage({ type: 'error', text: `Failed to save year group: ${error.message}` });
    }
  };

  const handleDeleteYearGroup = async (id: string) => {
    // Check if year group is locked
    const yearGroup = yearGroups.find(yg => yg.id === id);
    if (yearGroup?.is_locked) {
      setMessage({ type: 'error', text: 'Cannot delete locked year group. Only admins can unlock it first.' });
      return;
    }
    
    if (confirm('Are you sure you want to delete this year group? This will also delete all associated areas and objectives.')) {
      try {
        await customObjectivesApi.yearGroups.delete(id);
        setMessage({ type: 'success', text: 'Year group deleted successfully' });
        await loadData();
      } catch (error) {
        console.error('Failed to delete year group:', error);
        setMessage({ type: 'error', text: 'Failed to delete year group' });
      }
    }
  };

  const handleToggleLock = async (id: string) => {
    if (!isAdmin) {
      setMessage({ type: 'error', text: 'Only administrators can lock/unlock year groups.' });
      return;
    }
    
    const yearGroup = yearGroups.find(yg => yg.id === id);
    if (!yearGroup) return;
    
    const newLockStatus = !yearGroup.is_locked;
    
    try {
      await customObjectivesApi.yearGroups.update(id, { is_locked: newLockStatus });
      setMessage({ 
        type: 'success', 
        text: `Year group ${newLockStatus ? 'locked' : 'unlocked'} successfully` 
      });
      await loadData();
    } catch (error) {
      console.error('Failed to toggle lock status:', error);
      setMessage({ type: 'error', text: 'Failed to update lock status' });
    }
  };

  const handleCloneYearGroup = async () => {
    try {
      await customObjectivesApi.bulkOperations.cloneYearGroup(
        cloneData.sourceId,
        cloneData.targetName,
        cloneData.targetColor
      );
      setMessage({ type: 'success', text: 'Year group cloned successfully' });
      setShowCloneDialog(false);
      await loadData();
    } catch (error) {
      console.error('Failed to clone year group:', error);
      setMessage({ type: 'error', text: 'Failed to clone year group' });
    }
  };

  const handleExportCSV = async (yearGroupId?: string) => {
    try {
      const csvData = await customObjectivesApi.bulkOperations.exportToCSV(yearGroupId);
      
      // Convert to CSV string
      const headers = [
        'year_group',
        'year_group_description', 
        'year_group_color',
        'area',
        'area_description',
        'objective_text',
        'objective_description'
      ];
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header as keyof CustomObjectiveCSVRow] || ''}"`).join(','))
      ].join('\n');
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `custom-objectives${yearGroupId ? `-${yearGroups.find(yg => yg.id === yearGroupId)?.name}` : ''}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'CSV exported successfully' });
    } catch (error) {
      console.error('Failed to export CSV:', error);
      setMessage({ type: 'error', text: 'Failed to export CSV' });
    }
  };

  const toggleAreaExpansion = (areaId: string) => {
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(areaId)) {
      newExpanded.delete(areaId);
    } else {
      newExpanded.add(areaId);
    }
    setExpandedAreas(newExpanded);
  };

  const addArea = () => {
    setFormData(prev => ({
      ...prev,
      areas: [...prev.areas, { 
        section: '', // Add section field
        name: '', 
        description: '', 
        objectives: [{ 
          code: '',
          text: '', 
          description: '' 
        }] 
      }]
    }));
  };

  const removeArea = (index: number) => {
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.filter((_, i) => i !== index)
    }));
  };

  const addObjective = (areaIndex: number) => {
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.map((area, index) => 
        index === areaIndex 
          ? { ...area, objectives: [...area.objectives, { 
              code: `OBJ${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              text: '', 
              description: '' 
            }] }
          : area
      )
    }));
  };

  const removeObjective = (areaIndex: number, objectiveIndex: number) => {
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.map((area, index) => 
        index === areaIndex 
          ? { 
              ...area, 
              objectives: area.objectives.filter((_, i) => i !== objectiveIndex).length > 0 
                ? area.objectives.filter((_, i) => i !== objectiveIndex)
                : [{ 
                    code: `OBJ${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    text: '', 
                    description: '' 
                  }]
            }
          : area
      )
    }));
  };

  if (!isOpen && !embedded) return null;

  const content = (
    <>
      {/* Header */}
      {!embedded && (
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-600 to-teal-700 text-white">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold">Custom Objectives Admin</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-teal-100 hover:text-white hover:bg-teal-800 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}

        {/* Message */}
        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-current hover:opacity-70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar - Subject Areas List */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Subject Areas</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateYearGroup}
                    className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200"
                    title="Create New Subject Area"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleExportCSV()}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                    title="Export All to CSV"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Quick Add Reception Drama Button */}
              {!yearGroups.some(yg => yg.name === 'Reception Drama') && (
                <button
                  onClick={async () => {
                    try {
                      setMessage({ type: 'success', text: 'Adding Reception Drama objectives...' });
                      await seedReceptionDramaObjectives();
                      await loadData();
                      setMessage({ type: 'success', text: 'Reception Drama objectives added successfully!' });
                    } catch (error) {
                      setMessage({ type: 'error', text: 'Failed to add Reception Drama objectives' });
                    }
                  }}
                  className="w-full mb-4 p-3 bg-purple-100 border-2 border-dashed border-purple-300 text-purple-700 rounded-lg hover:bg-purple-200 hover:border-purple-400 transition-colors duration-200 text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <span>🎭</span>
                  <span>Add Reception Drama Objectives</span>
                </button>
              )}

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : (
                <DndProvider backend={HTML5Backend}>
                <div className="space-y-2">
                  {yearGroups.map((yearGroup, index) => (
                    <DraggableYearGroup
                      key={yearGroup.id}
                      yearGroup={yearGroup}
                      index={index}
                      isSelected={selectedYearGroup === yearGroup.id}
                      onSelect={() => setSelectedYearGroup(yearGroup.id)}
                      onReorder={(dragIndex, hoverIndex) => {
                        const newYearGroups = [...yearGroups];
                        const [removed] = newYearGroups.splice(dragIndex, 1);
                        newYearGroups.splice(hoverIndex, 0, removed);
                        newYearGroups.forEach((yg, i) => {
                          yg.sort_order = i;
                        });
                        setYearGroups(newYearGroups);
                      }}
                      onDragEnd={async () => {
                        // Save the new order
                        try {
                          for (const yg of yearGroups) {
                            await customObjectivesApi.yearGroups.update(yg.id, { sort_order: yg.sort_order });
                          }
                          setMessage({ type: 'success', text: 'Subject areas reordered successfully' });
                        } catch (error) {
                          console.error('Failed to save order:', error);
                          setMessage({ type: 'error', text: 'Failed to save new order' });
                        }
                      }}
                    >
                    <div
                      className={`p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-colors duration-200 ${
                        selectedYearGroup === yearGroup.id
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedYearGroup(yearGroup.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1">
                          <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: yearGroup.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-medium text-gray-900 truncate">{yearGroup.name}</h4>
                              {yearGroup.is_locked && (
                                <Lock className="h-3 w-3 text-amber-500 flex-shrink-0" title="Locked - Read Only" />
                              )}
                              {yearGroup.linked_year_groups && yearGroup.linked_year_groups.length > 0 && (
                                <Link2 className="h-3 w-3 text-teal-500 flex-shrink-0" title={`Linked to: ${yearGroup.linked_year_groups.join(', ')}`} />
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {yearGroup.areas.length} areas, {yearGroup.areas.reduce((sum, area) => sum + area.objectives.length, 0)} objectives
                            </p>
                            {yearGroup.linked_year_groups && yearGroup.linked_year_groups.length > 0 && (
                              <p className="text-xs text-teal-600 truncate" title={yearGroup.linked_year_groups.join(', ')}>
                                → {yearGroup.linked_year_groups.slice(0, 3).join(', ')}{yearGroup.linked_year_groups.length > 3 ? ` +${yearGroup.linked_year_groups.length - 3}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-1 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCloneData({ sourceId: yearGroup.id, targetName: `${yearGroup.name} Copy`, targetColor: yearGroup.color });
                              setShowCloneDialog(true);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Clone"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleLock(yearGroup.id);
                              }}
                              className={`p-1 ${yearGroup.is_locked ? 'text-amber-500 hover:text-amber-600' : 'text-gray-400 hover:text-gray-600'}`}
                              title={yearGroup.is_locked ? 'Unlock (Admin only)' : 'Lock (Admin only)'}
                            >
                              {yearGroup.is_locked ? (
                                <Lock className="h-3 w-3" />
                              ) : (
                                <Unlock className="h-3 w-3" />
                              )}
                            </button>
                          )}
                          {!yearGroup.is_locked && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditYearGroup(yearGroup);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title="Edit"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteYearGroup(yearGroup.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    </DraggableYearGroup>
                  ))}
                </div>
                </DndProvider>
              )}
            </div>
          </div>

          {/* Main Content - Areas and Objectives */}
          <div className="flex-1 overflow-y-auto">
            {selectedYearGroup ? (
              <div className="p-6">
                {(() => {
                  const yearGroup = yearGroups.find(yg => yg.id === selectedYearGroup);
                  if (!yearGroup) return null;

                  return (
                    <div>
                      <div className="mb-6">
                        {/* Title and Buttons Row */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: yearGroup.color }}
                            />
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{yearGroup.name}</h3>
                          </div>
                          <div className="flex space-x-2 flex-shrink-0">
                            <button
                              onClick={() => handleExportCSV(yearGroup.id)}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center space-x-1"
                              title="Export to CSV"
                            >
                              <Download className="h-3 w-3" />
                              <span className="hidden sm:inline">Export CSV</span>
                            </button>
                            <button
                              onClick={() => handleEditYearGroup(yearGroup)}
                              className="px-2 py-1 bg-teal-600 text-white text-xs rounded-md hover:bg-teal-700 transition-colors duration-200 flex items-center space-x-1"
                              title="Edit"
                            >
                              <Edit2 className="h-3 w-3" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                          </div>
                        </div>
                        {/* Description Row */}
                        {yearGroup.description && (
                          <p className="text-xs text-gray-600 italic">{yearGroup.description}</p>
                        )}
                      </div>

                      <div className="space-y-6">
                        {(() => {
                          // Group areas by section
                          const groupedBySection: Record<string, typeof yearGroup.areas> = {};
                          yearGroup.areas.forEach(area => {
                            const section = area.section || 'Other';
                            if (!groupedBySection[section]) {
                              groupedBySection[section] = [];
                            }
                            groupedBySection[section].push(area);
                          });

                          return Object.entries(groupedBySection).map(([section, areas]) => (
                            <div key={section} className="space-y-3">
                              {/* Section Header */}
                              {section !== 'Other' && (
                                <div className="bg-gradient-to-r from-teal-50 to-blue-50 border-l-4 border-teal-500 px-4 py-3 rounded-lg">
                                  <h3 className="text-lg font-bold text-teal-900">{section}</h3>
                                </div>
                              )}
                              
                              {/* Areas within this section */}
                              {areas.map((area) => (
                                <div key={area.id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-teal-300 transition-colors">
                                  <div
                                    className="p-4 bg-gradient-to-r from-gray-50 to-white cursor-pointer flex items-center justify-between hover:from-teal-50 hover:to-blue-50 transition-colors"
                                    onClick={() => toggleAreaExpansion(area.id)}
                                  >
                                    <div>
                                      <h4 className="font-semibold text-gray-900 text-base">{area.name}</h4>
                                      {area.description && (
                                        <p className="text-sm text-gray-600 mt-1">{area.description}</p>
                                      )}
                                      <p className="text-xs text-teal-600 font-medium mt-1">{area.objectives.length} objectives</p>
                                    </div>
                                    {expandedAreas.has(area.id) ? (
                                      <ChevronDown className="h-5 w-5 text-teal-600" />
                                    ) : (
                                      <ChevronRight className="h-5 w-5 text-gray-400" />
                                    )}
                                  </div>
                                  
                                  {expandedAreas.has(area.id) && (
                                    <div className="p-4 bg-white border-t border-gray-100">
                                      <div className="space-y-2">
                                        {area.objectives.map((objective, idx) => (
                                          <div key={objective.id} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-100">
                                            <div className="flex-shrink-0 w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                              {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                              <p className="text-sm text-gray-900 leading-relaxed">{objective.objective_text}</p>
                                              {objective.description && (
                                                <p className="text-xs text-gray-600 mt-1">{objective.description}</p>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a year group to view its objectives
              </div>
            )}
          </div>
        </div>

        {/* Clone Dialog */}
        {showCloneDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[75]">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Clone Year Group</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Name
                  </label>
                  <input
                    type="text"
                    value={cloneData.targetName}
                    onChange={(e) => setCloneData(prev => ({ ...prev, targetName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={cloneData.targetColor}
                    onChange={(e) => setCloneData(prev => ({ ...prev, targetColor: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowCloneDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloneYearGroup}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                >
                  Clone
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Dialog */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[75]">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
              {/* Header with close button */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-600 to-teal-700 text-white">
                <h3 className="text-lg font-semibold">
                  {editingYearGroup ? 'Edit Main Heading (Subject Area)' : 'Create New Main Heading (Subject Area)'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingYearGroup(null);
                  }}
                  className="p-2 text-teal-100 hover:text-white hover:bg-teal-800 rounded-lg transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                {/* Main Heading Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Area Name *
                    </label>
                    <input
                      type="text"
                      value={formData.year_group.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        year_group: { ...prev.year_group, name: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="e.g., Communication and Language, Mathematics"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <input
                      type="color"
                      value={formData.year_group.color}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        year_group: { ...prev.year_group, color: e.target.value }
                      }))}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.year_group.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      year_group: { ...prev.year_group, description: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    rows={2}
                    placeholder="Brief description of this subject area (e.g., age group, context)"
                  />
                </div>

                {/* Linked Year Groups */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center space-x-2">
                      <Link2 className="h-4 w-4 text-teal-600" />
                      <span>Link to Year Groups</span>
                    </div>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Select which year groups these objectives apply to. If none selected, objectives will be available to all year groups.
                  </p>
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {availableYearGroups.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No year groups configured in Settings</p>
                    ) : (
                      availableYearGroups.map((ygName) => {
                        const isLinked = formData.year_group.linked_year_groups?.includes(ygName) || false;
                        return (
                          <button
                            key={ygName}
                            type="button"
                            onClick={() => {
                              const currentLinked = formData.year_group.linked_year_groups || [];
                              const newLinked = isLinked
                                ? currentLinked.filter(yg => yg !== ygName)
                                : [...currentLinked, ygName];
                              setFormData(prev => ({
                                ...prev,
                                year_group: { ...prev.year_group, linked_year_groups: newLinked }
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center space-x-1.5 ${
                              isLinked
                                ? 'bg-teal-600 text-white ring-2 ring-teal-300'
                                : 'bg-white text-gray-700 border border-gray-300 hover:border-teal-400 hover:bg-teal-50'
                            }`}
                          >
                            {isLinked && <Check className="h-3 w-3" />}
                            <span>{ygName}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                  {(formData.year_group.linked_year_groups?.length || 0) > 0 && (
                    <p className="text-xs text-teal-600 mt-1">
                      Linked to {formData.year_group.linked_year_groups?.length} year group{formData.year_group.linked_year_groups?.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {/* Subheadings */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium text-gray-900">Subheadings (Focus Areas)</h4>
                    <button
                      onClick={addArea}
                      className="px-3 py-1 bg-teal-600 text-white text-sm rounded-md hover:bg-teal-700"
                    >
                      Add Subheading
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.areas.map((area, areaIndex) => (
                      <div key={areaIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">Subheading {areaIndex + 1}</h5>
                          <button
                            onClick={() => removeArea(areaIndex)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Section (Optional)
                            </label>
                            <input
                              type="text"
                              value={area.section || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                areas: prev.areas.map((a, i) => 
                                  i === areaIndex ? { ...a, section: e.target.value } : a
                                )
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              placeholder="e.g., Communication and Language, Physical Development"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              💡 Overall section that groups multiple subheadings together
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Subheading *
                            </label>
                            <input
                              type="text"
                              value={area.name}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                areas: prev.areas.map((a, i) => 
                                  i === areaIndex ? { ...a, name: e.target.value } : a
                                )
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              placeholder="e.g., Listening, Attention and Understanding"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              💡 Specific subheading under the section (if you entered one above)
                            </p>
                          </div>
                        </div>

                        {/* Objectives */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h6 className="text-sm font-medium text-gray-700">Objectives</h6>
                          </div>
                          
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Objectives *
                            </label>
                            <textarea
                              value={area.objectives.length === 1 ? area.objectives[0].text : area.objectives.map(obj => obj.text).join('\n')}
                              onChange={(e) => {
                                autoResizeTextarea(e.target);
                                handleObjectiveTextChange(areaIndex, 0, e.target.value);
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none overflow-hidden"
                              rows={Math.max(3, area.objectives.length)}
                              placeholder="Enter objectives here. Press Enter after each objective to separate them:&#10;&#10;Objective 1 text&#10;Objective 2 text&#10;Objective 3 text&#10;&#10;Or use # to separate:&#10;Objective 1 # Objective 2 # Objective 3"
                              style={{ minHeight: '5rem' }}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              💡 Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">Enter</kbd> after each objective to auto-separate, or use <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">#</kbd> as a delimiter.
                            </p>
                          </div>
                          
                          {area.objectives.length > 1 && (
                            <div className="space-y-2 mb-4">
                              <p className="text-sm font-medium text-gray-700">Parsed Objectives:</p>
                              {area.objectives.map((objective, objectiveIndex) => (
                                <div key={objectiveIndex} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="text-sm text-gray-800 font-medium mb-1">
                                        Objective {objectiveIndex + 1}
                                      </div>
                                      <div className="text-sm text-gray-700">
                                        {objective.text}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const remainingObjectives = area.objectives.filter((_, idx) => idx !== objectiveIndex);
                                        setFormData(prev => ({
                                          ...prev,
                                          areas: prev.areas.map((a, i) => 
                                            i === areaIndex ? {
                                              ...a,
                                              objectives: remainingObjectives.length > 0 ? remainingObjectives : [{ 
                                                code: `OBJ${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                                                text: '', 
                                                description: '' 
                                              }]
                                            } : a
                                          )
                                        }));
                                      }}
                                      className="text-red-600 hover:text-red-800 p-1 ml-2"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              </div>

              {/* Footer buttons - fixed at bottom */}
              <div className="flex justify-end space-x-2 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingYearGroup(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveYearGroup}
                  disabled={!formData.year_group.name || formData.areas.length === 0}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {editingYearGroup ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );

  // Embedded mode - render directly without modal wrapper
  if (embedded) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden" style={{ height: '600px' }}>
        {content}
      </div>
    );
  }

  // Modal mode
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {content}
      </div>
    </div>
  );
}
