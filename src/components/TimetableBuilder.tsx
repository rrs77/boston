import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Save, Trash2, Clock, MapPin, GripVertical, Edit3, Users, BookOpen, Settings, Calendar } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContextNew';
import { useDrop, useDrag, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { supabase, TABLES, isSupabaseConfigured } from '../config/supabase';

interface TimetableClass {
  id: string;
  day: number; // 0-6 for Sunday-Saturday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  className: string; // Year group name or club name
  location: string;
  color: string;
  type: 'curriculum' | 'non-curriculum' | 'club'; // Type of class
  yearGroupId?: string; // If linked to a year group
  recurringUnitId?: string;
}

interface TimetableBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  className: string; // Current class/sheet name
  onTimetableUpdate?: (classes: TimetableClass[]) => void;
  initialEditClass?: TimetableClass | null; // Optional class to edit when opening
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Use Monday-Friday for school days (Day 1-5)
const SCHOOL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SCHOOL_DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Generate time slots from 7am to 6pm (every hour for cleaner grid)
const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 7; // Start at 7:00am
  return {
    hour,
    minute: 0,
    label: `${hour}:00`,
    value: `${hour}:00`,
    totalMinutes: hour * 60
  };
});

export function TimetableBuilder({
  isOpen,
  onClose,
  className,
  onTimetableUpdate,
  initialEditClass
}: TimetableBuilderProps) {
  const { customYearGroups, getThemeForClass } = useSettings();
  const [timetableClasses, setTimetableClasses] = useState<TimetableClass[]>([]);
  const [editingClass, setEditingClass] = useState<TimetableClass | null>(initialEditClass || null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{day: number, time: string} | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'days'>('days'); // 'week' shows Mon-Fri, 'days' shows all days

  // Load timetable from Supabase
  useEffect(() => {
    if (!isOpen) return;
    
    loadTimetable();
    
    // If initialEditClass is provided, set it for editing
    if (initialEditClass) {
      setEditingClass(initialEditClass);
    } else {
      setEditingClass(null);
    }
  }, [isOpen, className, initialEditClass]);

  const loadTimetable = async () => {
    try {
      // Try Supabase first
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from(TABLES.TIMETABLE_CLASSES || 'timetable_classes')
          .select('*')
          .eq('class_name', className);
        
        if (!error && data) {
          const classes = data.map((item: any) => ({
            id: item.id,
            day: item.day,
            startTime: item.start_time,
            endTime: item.end_time,
            className: item.class_name_display || item.class_name,
            location: item.location || '',
            color: item.color || getThemeForClass(className).primary,
            type: item.type || 'curriculum',
            yearGroupId: item.year_group_id,
            recurringUnitId: item.recurring_unit_id
          }));
          setTimetableClasses(classes);
          return;
        }
      }
      
      // Fallback to localStorage
      const saved = localStorage.getItem(`timetable-${className}`);
      if (saved) {
        setTimetableClasses(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading timetable:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem(`timetable-${className}`);
      if (saved) {
        setTimetableClasses(JSON.parse(saved));
      }
    }
  };

  const saveTimetable = async (classes: TimetableClass[]) => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(`timetable-${className}`, JSON.stringify(classes));
      
      // Save to Supabase
      if (isSupabaseConfigured()) {
        // Delete existing classes for this class name
        await supabase
          .from(TABLES.TIMETABLE_CLASSES || 'timetable_classes')
          .delete()
          .eq('class_name', className);
        
        // Insert new classes
        if (classes.length > 0) {
          const insertData = classes.map(cls => ({
            class_name: className,
            day: cls.day,
            start_time: cls.startTime,
            end_time: cls.endTime,
            class_name_display: cls.className,
            location: cls.location || '',
            color: cls.color,
            type: cls.type || 'curriculum',
            year_group_id: cls.yearGroupId || null,
            recurring_unit_id: cls.recurringUnitId || null
          }));
          
          await supabase
            .from(TABLES.TIMETABLE_CLASSES || 'timetable_classes')
            .insert(insertData);
        }
      }
      
      setTimetableClasses(classes);
      if (onTimetableUpdate) {
        onTimetableUpdate(classes);
      }
    } catch (error) {
      console.error('Error saving timetable:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddYearGroup = (day: number, timeSlot: string, yearGroup: any) => {
    const newClass: TimetableClass = {
      id: `class-${Date.now()}`,
      day,
      startTime: timeSlot,
      endTime: `${parseInt(timeSlot.split(':')[0]) + 1}:${timeSlot.split(':')[1] || '00'}`,
      className: yearGroup.name,
      location: '',
      color: yearGroup.color || getThemeForClass(className).primary,
      type: 'curriculum',
      yearGroupId: yearGroup.id
    };
    
    saveTimetable([...timetableClasses, newClass]);
  };

  const handleAddNonCurriculum = (day: number, timeSlot: string) => {
    const name = prompt('Enter name for non-curriculum time (e.g., Break, Lunch, Club):');
    if (!name) return;
    
    const newClass: TimetableClass = {
      id: `class-${Date.now()}`,
      day,
      startTime: timeSlot,
      endTime: `${parseInt(timeSlot.split(':')[0]) + 1}:${timeSlot.split(':')[1] || '00'}`,
      className: name,
      location: '',
      color: '#9CA3AF', // Gray for non-curriculum
      type: name.toLowerCase().includes('club') ? 'club' : 'non-curriculum'
    };
    
    saveTimetable([...timetableClasses, newClass]);
  };

  const handleDeleteClass = (classId: string) => {
    if (confirm('Are you sure you want to delete this timetable entry?')) {
      saveTimetable(timetableClasses.filter(c => c.id !== classId));
      if (editingClass?.id === classId) {
        setEditingClass(null);
      }
    }
  };

  const handleUpdateClass = (updatedClass: TimetableClass) => {
    saveTimetable(timetableClasses.map(c => c.id === updatedClass.id ? updatedClass : c));
    setEditingClass(null);
  };

  // Get classes for a specific day and time slot
  const getClassesForSlot = (day: number, timeSlot: string) => {
    return timetableClasses.filter(cls => {
      if (cls.day !== day) return false;
      const slotHour = parseInt(timeSlot.split(':')[0]);
      const slotMinute = parseInt(timeSlot.split(':')[1] || '0');
      const slotTotalMinutes = slotHour * 60 + slotMinute;
      
      const startHour = parseInt(cls.startTime.split(':')[0]);
      const startMinute = parseInt(cls.startTime.split(':')[1] || '0');
      const startTotalMinutes = startHour * 60 + startMinute;
      
      const endHour = parseInt(cls.endTime.split(':')[0]);
      const endMinute = parseInt(cls.endTime.split(':')[1] || '0');
      const endTotalMinutes = endHour * 60 + endMinute;
      
      return slotTotalMinutes >= startTotalMinutes && slotTotalMinutes < endTotalMinutes;
    });
  };

  // Get all unique classes with their scheduled days
  const classList = useMemo(() => {
    const classMap = new Map<string, { class: TimetableClass; days: number[] }>();
    
    timetableClasses.forEach(cls => {
      if (!classMap.has(cls.className)) {
        classMap.set(cls.className, { class: cls, days: [] });
      }
      const entry = classMap.get(cls.className)!;
      if (!entry.days.includes(cls.day)) {
        entry.days.push(cls.day);
      }
    });
    
    return Array.from(classMap.values()).map(({ class: cls, days }) => ({
      ...cls,
      scheduledDays: days.sort()
    }));
  }, [timetableClasses]);

  // Get days to display based on view mode
  const displayDays = viewMode === 'days' ? SCHOOL_DAYS : DAY_NAMES;
  const displayDayIndices = viewMode === 'days' 
    ? [1, 2, 3, 4, 5] // Monday-Friday
    : [0, 1, 2, 3, 4, 5, 6]; // All days

  if (!isOpen) return null;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
        <div className="bg-white rounded-lg shadow-xl max-w-[95vw] w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600 text-white">
          <div>
            <h2 className="text-2xl font-bold">Timetable Builder</h2>
            <p className="text-teal-100 mt-1">{className}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'days' ? 'week' : 'days')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-colors text-sm"
            >
              {viewMode === 'days' ? 'Show All Days' : 'School Days Only'}
            </button>
            {isSaving && (
              <span className="text-sm">Saving...</span>
            )}
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Sidebar - Class List */}
          <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
            {/* Semester/Term Selection */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Semester</h3>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>Autumn 1</option>
                <option>Autumn 2</option>
                <option>Spring 1</option>
                <option>Spring 2</option>
                <option>Summer 1</option>
                <option>Summer 2</option>
              </select>
            </div>

            {/* Class List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Class List</h3>
                <button
                  onClick={() => {
                    setEditingClass({
                      id: `new-${Date.now()}`,
                      day: 1,
                      startTime: '9:00',
                      endTime: '10:00',
                      className: '',
                      location: '',
                      color: getThemeForClass(className).primary,
                      type: 'curriculum'
                    });
                  }}
                  className="p-1.5 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                  title="Add a Class"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              {/* Year Groups for Dragging */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Drag to Add</h4>
                <div className="space-y-2">
                  {customYearGroups.map(yearGroup => (
                    <DraggableYearGroup key={yearGroup.id} yearGroup={yearGroup} />
                  ))}
                </div>
              </div>

              {/* Scheduled Classes */}
              {classList.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <p>No classes scheduled</p>
                  <p className="text-xs mt-1">Drag year groups or click + to add</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {classList.map((cls) => {
                    const daysText = cls.scheduledDays.length === 0 
                      ? 'Unscheduled'
                      : cls.scheduledDays.length === 1
                        ? `Day ${cls.scheduledDays[0] + 1}`
                        : `Days ${cls.scheduledDays.map(d => d + 1).join(', ')}`;
                    
                    return (
                      <div
                        key={cls.id}
                        className="bg-white border-2 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group"
                        style={{ borderLeftColor: cls.color, borderLeftWidth: '4px' }}
                        onClick={() => setEditingClass(cls)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">{cls.className}</div>
                            <div className="text-xs text-gray-500 mt-1">{daysText}</div>
                            {cls.location && (
                              <div className="text-xs text-gray-400 mt-1 flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {cls.location}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingClass(cls);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClass(cls.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Non-Curriculum Button */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    if (selectedSlot) {
                      handleAddNonCurriculum(selectedSlot.day, selectedSlot.time);
                    } else {
                      alert('Please select a time slot first');
                    }
                  }}
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Add Break/Club</span>
                </button>
              </div>
            </div>
          </div>

          {/* Timetable Grid */}
          <div className="flex-1 overflow-auto bg-white">
            {/* Grid Container */}
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white z-10 border-b-2 border-gray-300">
                  <tr>
                    <th className="w-24 p-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-300 bg-gray-50 sticky left-0 z-20">
                      <button className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
                        Rotation
                      </button>
                    </th>
                    {displayDayIndices.map((dayIndex, index) => (
                      <th key={dayIndex} className="p-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-300 bg-gray-50">
                        {viewMode === 'days' ? `Day ${index + 1}` : displayDays[index]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot, slotIndex) => (
                    <tr key={slotIndex} className="border-b border-gray-200">
                      {/* Time Column */}
                      <td className="sticky left-0 bg-white z-20 border-r border-gray-300 px-3 py-2 text-xs text-gray-600 font-medium w-24">
                        {slot.label}
                      </td>
                      {/* Day Columns */}
                      {displayDayIndices.map((dayIndex) => (
                        <TimetableGridCell
                          key={`${dayIndex}-${slotIndex}`}
                          day={dayIndex}
                          timeSlot={slot.value}
                          slotHour={slot.hour}
                          slotMinute={slot.minute}
                          classes={getClassesForSlot(dayIndex, slot.value)}
                          onAddYearGroup={(yearGroup) => handleAddYearGroup(dayIndex, slot.value, yearGroup)}
                          onAddNonCurriculum={() => handleAddNonCurriculum(dayIndex, slot.value)}
                          onEdit={(cls) => setEditingClass(cls)}
                          onDelete={handleDeleteClass}
                          onSelect={() => setSelectedSlot({ day: dayIndex, time: slot.value })}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {editingClass && (
          <EditTimetableClassModal
            class={editingClass}
            onSave={handleUpdateClass}
            onClose={() => setEditingClass(null)}
            onDelete={() => editingClass.id.startsWith('new-') ? setEditingClass(null) : handleDeleteClass(editingClass.id)}
            yearGroups={customYearGroups}
            theme={getThemeForClass(className)}
            isNew={editingClass.id.startsWith('new-')}
          />
        )}
        </div>
      </div>
    </DndProvider>
  );
}

// Draggable Year Group Component
function DraggableYearGroup({ yearGroup }: { yearGroup: any }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'year-group',
    item: { yearGroup },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [yearGroup]);

  return (
    <div
      ref={drag}
      className={`p-2 bg-white border border-gray-200 rounded-lg cursor-move hover:shadow-md transition-shadow flex items-center space-x-2 text-sm ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{ borderLeftColor: yearGroup.color, borderLeftWidth: '3px' }}
    >
      <GripVertical className="h-4 w-4 text-gray-400" />
      <div className="flex-1 font-medium text-gray-900">{yearGroup.name}</div>
    </div>
  );
}

// Timetable Grid Cell Component with Drop Zone
function TimetableGridCell({
  day,
  timeSlot,
  slotHour,
  slotMinute,
  classes,
  onAddYearGroup,
  onAddNonCurriculum,
  onEdit,
  onDelete,
  onSelect
}: {
  day: number;
  timeSlot: string;
  slotHour: number;
  slotMinute: number;
  classes: TimetableClass[];
  onAddYearGroup: (yearGroup: any) => void;
  onAddNonCurriculum: () => void;
  onEdit: (cls: TimetableClass) => void;
  onDelete: (id: string) => void;
  onSelect: () => void;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'year-group',
    drop: (item: any) => {
      onAddYearGroup(item.yearGroup);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }), [day, timeSlot, onAddYearGroup]);

  // Find classes that start at this exact time slot
  const startingClasses = classes.filter(cls => {
    const startHour = parseInt(cls.startTime.split(':')[0]);
    const startMinute = parseInt(cls.startTime.split(':')[1] || '0');
    return startHour === slotHour && startMinute === slotMinute;
  });

  return (
    <td
      ref={drop}
      className={`border-r border-gray-200 relative min-h-[60px] ${
        isOver ? 'bg-teal-50 border-2 border-teal-300' : 'bg-white hover:bg-gray-50'
      } transition-colors cursor-pointer`}
      onClick={onSelect}
    >
      {/* Render class blocks that start at this time slot */}
      {startingClasses.map((cls) => {
        const startHour = parseInt(cls.startTime.split(':')[0]);
        const startMinute = parseInt(cls.startTime.split(':')[1] || '0');
        const endHour = parseInt(cls.endTime.split(':')[0]);
        const endMinute = parseInt(cls.endTime.split(':')[1] || '0');
        
        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;
        const durationMinutes = endTotalMinutes - startTotalMinutes;
        const heightPx = (durationMinutes / 60) * 60; // Each hour is 60px
        
        return (
          <div
            key={cls.id}
            className="absolute left-0 right-0 rounded px-2 py-1 text-xs font-medium text-white cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-between z-10"
            style={{
              backgroundColor: cls.color,
              top: '2px',
              height: `${heightPx - 4}px`,
              minHeight: '58px'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(cls);
            }}
            title={`${cls.className} (${cls.startTime} - ${cls.endTime})`}
          >
            <span className="truncate flex-1">{cls.className}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(cls.id);
              }}
              className="ml-2 opacity-0 hover:opacity-100 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
      
      {/* Show drop indicator when dragging */}
      {classes.length === 0 && (
        <div className="h-full min-h-[60px] flex items-center justify-center">
          {isOver ? (
            <div className="text-xs text-teal-600 font-medium">Drop here</div>
          ) : (
            <div className="text-xs text-gray-300 opacity-0 hover:opacity-100 transition-opacity">Drop here</div>
          )}
        </div>
      )}
    </td>
  );
}

// Edit Modal Component
function EditTimetableClassModal({
  class: cls,
  onSave,
  onClose,
  onDelete,
  yearGroups,
  theme,
  isNew = false
}: {
  class: TimetableClass;
  onSave: (cls: TimetableClass) => void;
  onClose: () => void;
  onDelete: () => void;
  yearGroups: any[];
  theme: any;
  isNew?: boolean;
}) {
  const [editedClass, setEditedClass] = useState<TimetableClass>(cls);

  const handleSave = () => {
    if (!editedClass.className.trim()) {
      alert('Please enter a class name');
      return;
    }
    
    if (isNew) {
      // Generate new ID for new classes
      editedClass.id = `class-${Date.now()}`;
    }
    
    onSave(editedClass);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{isNew ? 'Add' : 'Edit'} Timetable Entry</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
            <input
              type="text"
              value={editedClass.className}
              onChange={(e) => setEditedClass({ ...editedClass, className: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="e.g., Reception Music"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={editedClass.type}
              onChange={(e) => setEditedClass({ ...editedClass, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="curriculum">Curriculum</option>
              <option value="non-curriculum">Non-Curriculum</option>
              <option value="club">Club</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
            <select
              value={editedClass.day}
              onChange={(e) => setEditedClass({ ...editedClass, day: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              {DAY_NAMES.map((day, index) => (
                <option key={index} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={editedClass.startTime}
                onChange={(e) => setEditedClass({ ...editedClass, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={editedClass.endTime}
                onChange={(e) => setEditedClass({ ...editedClass, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={editedClass.location}
              onChange={(e) => setEditedClass({ ...editedClass, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="e.g., Music Room"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <input
              type="color"
              value={editedClass.color}
              onChange={(e) => setEditedClass({ ...editedClass, color: e.target.value })}
              className="w-full h-10 rounded border border-gray-300"
            />
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          {!isNew && (
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Delete
            </button>
          )}
          <div className="space-x-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
            >
              {isNew ? 'Add' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
