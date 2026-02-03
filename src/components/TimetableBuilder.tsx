import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Save, Trash2, Clock, MapPin, GripVertical, Edit3, Users, BookOpen, Settings, Calendar, ChevronDown, Copy, CopyPlus } from 'lucide-react';
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

// Terms in order (for "previous term" and "same for year")
const TERM_IDS = ['A1', 'A2', 'SP1', 'SP2', 'SM1', 'SM2'] as const;
const TERM_LABELS: Record<string, string> = {
  A1: 'Autumn 1',
  A2: 'Autumn 2',
  SP1: 'Spring 1',
  SP2: 'Spring 2',
  SM1: 'Summer 1',
  SM2: 'Summer 2'
};

const DRAG_TYPE_TIMETABLE_BLOCK = 'timetable-block';

// Continuous time strip: 7:00–18:00, 1.5px per minute (660 min = 990px)
const DAY_START_MINUTES = 7 * 60;   // 7:00
const DAY_END_MINUTES = 18 * 60;   // 18:00
const TOTAL_MINUTES = DAY_END_MINUTES - DAY_START_MINUTES;
const PX_PER_MINUTE = 1.5;
const GRID_HEIGHT_PX = TOTAL_MINUTES * PX_PER_MINUTE;

// Hour labels for the time ruler
const HOUR_LABELS = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 7;
  return { hour, label: `${hour}:00`, topPx: (hour * 60 - DAY_START_MINUTES) * PX_PER_MINUTE };
});

export function TimetableBuilder({
  isOpen,
  onClose,
  className,
  onTimetableUpdate,
  initialEditClass
}: TimetableBuilderProps) {
  const { customYearGroups, getThemeForClass } = useSettings();
  const [selectedTermId, setSelectedTermId] = useState<string>('A1');
  const [timetableClasses, setTimetableClasses] = useState<TimetableClass[]>([]);
  const [editingClass, setEditingClass] = useState<TimetableClass | null>(initialEditClass || null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{day: number, time: string} | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'days'>('days');

  const getStorageKey = (termId: string) => `timetable-${className}-${termId}`;
  const globalFlagKey = () => `timetable-${className}-global`;

  const [isGlobalTimetable, setIsGlobalTimetable] = useState<boolean>(() => {
    try {
      return localStorage.getItem(globalFlagKey()) === 'true';
    } catch {
      return false;
    }
  });

  const loadTimetable = React.useCallback(async (termId: string) => {
    try {
      const useGlobal = localStorage.getItem(globalFlagKey()) === 'true';
      let saved: string | null;
      if (useGlobal) {
        saved = localStorage.getItem(`timetable-${className}`);
      } else {
        saved = localStorage.getItem(getStorageKey(termId));
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        setTimetableClasses(Array.isArray(parsed) ? parsed : []);
        return;
      }
      if (!useGlobal) {
        const legacy = localStorage.getItem(`timetable-${className}`);
        if (legacy) {
          const parsed = JSON.parse(legacy);
          const classes = Array.isArray(parsed) ? parsed : [];
          setTimetableClasses(classes);
          localStorage.setItem(getStorageKey(termId), JSON.stringify(classes));
          return;
        }
        if (isSupabaseConfigured()) {
          const { data, error } = await supabase
            .from(TABLES.TIMETABLE_CLASSES || 'timetable_classes')
            .select('*')
            .eq('class_name', className);
          if (!error && data?.length) {
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
            localStorage.setItem(getStorageKey(termId), JSON.stringify(classes));
            return;
          }
        }
      }
      setTimetableClasses([]);
    } catch (error) {
      console.error('Error loading timetable:', error);
      setTimetableClasses([]);
    }
  }, [className, getThemeForClass]);

  useEffect(() => {
    if (!isOpen) return;
    loadTimetable(selectedTermId);
    if (initialEditClass) setEditingClass(initialEditClass);
    else setEditingClass(null);
  }, [isOpen, className, selectedTermId, initialEditClass, loadTimetable]);

  useEffect(() => {
    const flag = localStorage.getItem(globalFlagKey()) === 'true';
    setIsGlobalTimetable(flag);
  }, [isOpen, className]);

  const saveTimetable = async (classes: TimetableClass[], termId?: string) => {
    const useGlobal = localStorage.getItem(globalFlagKey()) === 'true';
    const term = termId ?? selectedTermId;
    setIsSaving(true);
    try {
      if (useGlobal) {
        localStorage.setItem(`timetable-${className}`, JSON.stringify(classes));
      } else {
        localStorage.setItem(getStorageKey(term), JSON.stringify(classes));
      }
      if (termId === undefined) {
        setTimetableClasses(classes);
      }
      if (onTimetableUpdate && termId === undefined) {
        onTimetableUpdate(classes);
      }
      if (isSupabaseConfigured()) {
        await supabase
          .from(TABLES.TIMETABLE_CLASSES || 'timetable_classes')
          .delete()
          .eq('class_name', className);
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
    } catch (error) {
      console.error('Error saving timetable:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const copyFromPreviousTerm = () => {
    if (isGlobalTimetable) {
      alert('Turn off "Same timetable for all terms" first to copy from a specific term.');
      return;
    }
    const idx = TERM_IDS.indexOf(selectedTermId as any);
    if (idx <= 0) {
      alert('There is no previous term. Autumn 1 is the first term.');
      return;
    }
    const prevTermId = TERM_IDS[idx - 1];
    const saved = localStorage.getItem(getStorageKey(prevTermId));
    if (!saved) {
      alert(`No timetable saved for ${TERM_LABELS[prevTermId]}. Set that term first or add classes here.`);
      return;
    }
    const classes = JSON.parse(saved);
    const withNewIds = classes.map((c: TimetableClass) => ({ ...c, id: `class-${Date.now()}-${Math.random().toString(36).slice(2)}` }));
    saveTimetable(withNewIds).then(() => {
      setTimetableClasses(withNewIds);
      if (onTimetableUpdate) onTimetableUpdate(withNewIds);
    });
  };

  const setSameForWholeYear = () => {
    const classes = timetableClasses.length
      ? timetableClasses.map(c => ({ ...c, id: `class-${Date.now()}-${Math.random().toString(36).slice(2)}` }))
      : [];
    if (classes.length === 0) {
      alert('Add or copy a timetable first, then use "Same timetable for all terms".');
      return;
    }
    localStorage.setItem(globalFlagKey(), 'true');
    localStorage.setItem(`timetable-${className}`, JSON.stringify(classes));
    setIsGlobalTimetable(true);
    setTimetableClasses(classes);
    if (onTimetableUpdate) onTimetableUpdate(classes);
    alert('Timetable is now used for all terms. Changing the semester will not change the grid; edits apply to the whole year. Turn off "Same timetable for all terms" to edit per term again.');
  };

  const setPerTermTimetable = () => {
    const current = timetableClasses.map(c => ({ ...c, id: `class-${Date.now()}-${Math.random().toString(36).slice(2)}` }));
    localStorage.setItem(globalFlagKey(), 'false');
    setIsGlobalTimetable(false);
    localStorage.setItem(getStorageKey(selectedTermId), JSON.stringify(current));
    loadTimetable(selectedTermId);
    alert('Each term now has its own timetable. Change the semester to see or edit that term\'s timetable.');
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

  // Get all classes for a day (for continuous time column)
  const getClassesForDay = (day: number) => {
    return timetableClasses.filter(cls => cls.day === day);
  };

  // Parse time string to total minutes from midnight
  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Update class end time (for resize handle)
  const handleResizeClass = (classId: string, newEndTime: string) => {
    const cls = timetableClasses.find(c => c.id === classId);
    if (!cls) return;
    const startMin = timeToMinutes(cls.startTime);
    const endMin = timeToMinutes(newEndTime);
    if (endMin <= startMin) return; // at least 1 min duration
    saveTimetable(timetableClasses.map(c => c.id === classId ? { ...c, endTime: newEndTime } : c));
  };

  // Move a class to a new day and/or new start time (drag-and-drop)
  const handleMoveClass = (classId: string, newDay: number, newStartTime: string) => {
    const cls = timetableClasses.find(c => c.id === classId);
    if (!cls) return;
    const durationMin = timeToMinutes(cls.endTime) - timeToMinutes(cls.startTime);
    const newStartMin = timeToMinutes(newStartTime);
    const newEndMin = Math.min(DAY_END_MINUTES, newStartMin + Math.max(5, durationMin));
    const newEndTime = minutesToTime(newEndMin);
    saveTimetable(timetableClasses.map(c =>
      c.id === classId ? { ...c, day: newDay, startTime: newStartTime, endTime: newEndTime } : c
    ));
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
              <select
                value={selectedTermId}
                onChange={(e) => setSelectedTermId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
              >
                {TERM_IDS.map(id => (
                  <option key={id} value={id}>{TERM_LABELS[id]}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGlobalTimetable}
                  onChange={(e) => {
                    if (e.target.checked) setSameForWholeYear();
                    else setPerTermTimetable();
                  }}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Same timetable for all terms</span>
              </label>
              {!isGlobalTimetable && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={copyFromPreviousTerm}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    Copy from previous term
                  </button>
                  <button
                    type="button"
                    onClick={setSameForWholeYear}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <CopyPlus className="h-4 w-4" />
                    Apply this timetable to whole year
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {isGlobalTimetable
                  ? 'One timetable for the whole year. Uncheck above to edit per term.'
                  : 'Each term has its own timetable. Change semester to view or edit that term.'}
              </p>
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

          {/* Timetable Grid - continuous time strip */}
          <div className="flex-1 overflow-auto bg-white flex flex-col">
            {/* Header row: Rotation | Day 1 | Day 2 ... */}
            <div className="flex flex-shrink-0 border-b-2 border-gray-300 bg-gray-50 sticky top-0 z-30">
              <div className="w-20 flex-shrink-0 p-3 border-r border-gray-300 flex items-center">
                <button className="px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex items-center">
                  Rotation
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
              </div>
              {displayDayIndices.map((dayIndex, index) => (
                <div key={dayIndex} className="flex-1 min-w-[140px] p-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-300">
                  {viewMode === 'days' ? `Day ${index + 1}` : displayDays[index]}
                </div>
              ))}
            </div>
            <div className="flex flex-1 overflow-auto min-h-0">
              {/* Time ruler column */}
              <div className="w-20 flex-shrink-0 sticky left-0 z-20 bg-gray-50 border-r border-gray-300" style={{ height: GRID_HEIGHT_PX }}>
                <div className="relative" style={{ height: GRID_HEIGHT_PX }}>
                  {HOUR_LABELS.map(({ hour, label, topPx }) => (
                    <div key={hour} className="absolute left-1 text-xs text-gray-600 font-medium" style={{ top: topPx }}>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
              {/* Day columns */}
              {displayDayIndices.map((dayIndex, index) => (
              <TimetableDayColumn
                key={dayIndex}
                day={dayIndex}
                dayLabel={viewMode === 'days' ? `Day ${index + 1}` : displayDays[index]}
                classes={getClassesForDay(dayIndex)}
                dayStartMinutes={DAY_START_MINUTES}
                dayEndMinutes={DAY_END_MINUTES}
                pxPerMinute={PX_PER_MINUTE}
                gridHeightPx={GRID_HEIGHT_PX}
                onAddYearGroup={(timeSlot) => (yearGroup: any) => handleAddYearGroup(dayIndex, timeSlot, yearGroup)}
                onAddNonCurriculum={(timeSlot) => () => handleAddNonCurriculum(dayIndex, timeSlot)}
                onEdit={(cls) => setEditingClass(cls)}
                onDelete={handleDeleteClass}
                onResize={handleResizeClass}
                onMoveClass={handleMoveClass}
                onSelectSlot={(timeSlot) => setSelectedSlot({ day: dayIndex, time: timeSlot })}
                timeToMinutes={timeToMinutes}
                minutesToTime={minutesToTime}
              />
            ))}
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

// Format minutes from midnight as HH:MM
function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

// Single day column with continuous time and stretchable blocks
function TimetableDayColumn({
  day,
  dayLabel,
  classes,
  dayStartMinutes,
  dayEndMinutes,
  pxPerMinute,
  gridHeightPx,
  onAddYearGroup,
  onAddNonCurriculum,
  onEdit,
  onDelete,
  onResize,
  onMoveClass,
  onSelectSlot,
  timeToMinutes,
  minutesToTime
}: {
  day: number;
  dayLabel: string;
  classes: TimetableClass[];
  dayStartMinutes: number;
  dayEndMinutes: number;
  pxPerMinute: number;
  gridHeightPx: number;
  onAddYearGroup: (timeSlot: string) => (yearGroup: any) => void;
  onAddNonCurriculum: (timeSlot: string) => () => void;
  onEdit: (cls: TimetableClass) => void;
  onDelete: (id: string) => void;
  onResize: (classId: string, newEndTime: string) => void;
  onMoveClass: (classId: string, newDay: number, newStartTime: string) => void;
  onSelectSlot: (timeSlot: string) => void;
  timeToMinutes: (time: string) => number;
  minutesToTime: (totalMinutes: number) => string;
}) {
  const [resizingId, setResizingId] = useState<string | null>(null);
  const columnRef = React.useRef<HTMLDivElement>(null);

  const [{ isOver, isDraggingBlock }, drop] = useDrop(() => ({
    accept: [DRAG_TYPE_TIMETABLE_BLOCK, 'year-group'],
    drop: (item: any, monitor) => {
      const offset = monitor.getSourceClientOffset();
      const clientOffset = monitor.getClientOffset();
      const dropY = (clientOffset?.y ?? offset?.y) ?? 0;
      if (!columnRef.current) return;
      const rect = columnRef.current.getBoundingClientRect();
      const scrollEl = columnRef.current.closest('.overflow-auto') as HTMLElement | null;
      const scrollTop = scrollEl?.scrollTop ?? 0;
      const y = dropY - rect.top + scrollTop;
      const minutes = dayStartMinutes + Math.round(y / pxPerMinute);
      const clamped = Math.max(dayStartMinutes, Math.min(dayEndMinutes - 5, minutes));
      const timeSlot = minutesToTime(clamped);

      if (item.type === DRAG_TYPE_TIMETABLE_BLOCK && item.class) {
        onMoveClass(item.class.id, day, timeSlot);
      } else if (item.yearGroup) {
        onAddYearGroup(timeSlot)(item.yearGroup);
      }
    },
    collect: (monitor) => {
      const item = monitor.getItem() as any;
      const isBlock = item?.type === DRAG_TYPE_TIMETABLE_BLOCK;
      return {
        isOver: monitor.isOver(),
        isDraggingBlock: isBlock
      };
    }
  }), [day, onAddYearGroup, onMoveClass, pxPerMinute, dayStartMinutes, dayEndMinutes]);

  const showDropHint = isOver && isDraggingBlock;

  const handleColumnClick = (e: React.MouseEvent) => {
    if (!columnRef.current || (e.target as HTMLElement).closest('[data-class-block]')) return;
    const rect = columnRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top - 40;
    const minutes = dayStartMinutes + Math.round(y / pxPerMinute);
    const clamped = Math.max(dayStartMinutes, Math.min(dayEndMinutes - 30, minutes));
    onSelectSlot(minutesToTime(clamped));
  };

  return (
    <div
      ref={drop}
      data-day-column
      className={`flex-1 min-w-[140px] border-r border-gray-200 relative transition-colors ${
        showDropHint ? 'bg-teal-100 ring-2 ring-teal-400 ring-inset' : isOver ? 'bg-teal-50' : 'bg-white'
      }`}
      style={{ height: gridHeightPx }}
    >
      <div
        ref={columnRef}
        className="relative cursor-pointer"
        style={{ height: gridHeightPx }}
        onClick={handleColumnClick}
      >
        {classes.map((cls) => {
          const startMin = timeToMinutes(cls.startTime);
          const endMin = timeToMinutes(cls.endTime);
          const topPx = (startMin - dayStartMinutes) * pxPerMinute;
          const heightPx = (endMin - startMin) * pxPerMinute;
          const minHeight = 24;
          if (heightPx < 2) return null;
          return (
            <TimetableClassBlock
              key={cls.id}
              class={cls}
              currentDay={day}
              topPx={topPx}
              heightPx={Math.max(heightPx, minHeight)}
              onEdit={() => onEdit(cls)}
              onDelete={() => onDelete(cls.id)}
              onResize={(newEndTime) => onResize(cls.id, newEndTime)}
              resizing={resizingId === cls.id}
              onResizeStart={() => setResizingId(cls.id)}
              onResizeEnd={() => setResizingId(null)}
              pxPerMinute={pxPerMinute}
              dayStartMinutes={dayStartMinutes}
              dayEndMinutes={dayEndMinutes}
              timeToMinutes={timeToMinutes}
              minutesToTime={minutesToTime}
            />
          );
        })}
      </div>
    </div>
  );
}

// One class block with start time label, draggable, and bottom resize handle
function TimetableClassBlock({
  class: cls,
  currentDay,
  topPx,
  heightPx,
  onEdit,
  onDelete,
  onResize,
  resizing,
  onResizeStart,
  onResizeEnd,
  pxPerMinute,
  dayStartMinutes,
  dayEndMinutes,
  timeToMinutes,
  minutesToTime
}: {
  class: TimetableClass;
  currentDay: number;
  topPx: number;
  heightPx: number;
  onEdit: () => void;
  onDelete: () => void;
  onResize: (newEndTime: string) => void;
  resizing: boolean;
  onResizeStart: () => void;
  onResizeEnd: () => void;
  pxPerMinute: number;
  dayStartMinutes: number;
  dayEndMinutes: number;
  timeToMinutes: (time: string) => number;
  minutesToTime: (min: number) => string;
}) {
  const blockRef = React.useRef<HTMLDivElement>(null);
  const startMin = timeToMinutes(cls.startTime);
  const endMin = timeToMinutes(cls.endTime);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: DRAG_TYPE_TIMETABLE_BLOCK,
    item: () => ({ type: DRAG_TYPE_TIMETABLE_BLOCK, class: cls }),
    canDrag: () => !resizing,
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  }), [cls, resizing]);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onResizeStart();
    const move = (ev: MouseEvent) => {
      const parentEl = blockRef.current?.parentElement;
      const scrollEl = parentEl?.closest('.overflow-auto') as HTMLElement | null;
      if (!parentEl) return;
      const parent = parentEl.getBoundingClientRect();
      const scrollTop = scrollEl?.scrollTop ?? 0;
      const y = ev.clientY - parent.top + scrollTop;
      const minutes = dayStartMinutes + y / pxPerMinute;
      const newEnd = Math.max(startMin + 5, Math.min(dayEndMinutes, Math.round(minutes)));
      onResize(minutesToTime(newEnd));
    };
    const up = () => {
      onResizeEnd();
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  return (
    <div
      data-class-block
      ref={blockRef}
      className={`absolute left-0.5 right-0.5 rounded px-2 py-1 text-xs font-medium text-white flex flex-col z-10 ${
        isDragging ? 'opacity-50 shadow-lg' : 'hover:opacity-95 transition-opacity'
      }`}
      style={{
        backgroundColor: cls.color,
        top: `${topPx}px`,
        height: `${heightPx}px`,
        minHeight: 20
      }}
      onClick={(e) => { e.stopPropagation(); onEdit(); }}
      title={`${cls.className} (${cls.startTime} - ${cls.endTime}). Drag to move; drag bottom edge to resize.`}
    >
      <div
        ref={drag}
        className={`flex items-center justify-between flex-1 min-h-0 cursor-grab active:cursor-grabbing ${isDragging ? 'cursor-grabbing' : ''}`}
      >
        <div className="truncate flex-1">
          <span className="font-semibold text-white/90">{cls.startTime}</span>
          <span className="ml-1 truncate">{cls.className}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="ml-1 opacity-80 hover:opacity-100 p-0.5 shrink-0"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center group"
        onMouseDown={handleResizeMouseDown}
        title="Drag to change duration"
      >
        {resizing && <div className="absolute inset-0 bg-white/30 rounded-b" />}
        <div className="w-8 h-0.5 bg-white/60 group-hover:bg-white rounded" />
      </div>
    </div>
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

// Normalize time to HH:MM for <input type="time"> (e.g. "9:0" -> "09:00")
function normalizeTimeForInput(time: string | undefined): string {
  if (!time) return '09:00';
  const [h, m] = time.split(':').map(s => parseInt(s, 10) || 0);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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
  const [editedClass, setEditedClass] = useState<TimetableClass>(() => ({
    ...cls,
    startTime: normalizeTimeForInput(cls.startTime) || '09:00',
    endTime: normalizeTimeForInput(cls.endTime) || '10:00'
  }));

  // Always default form to the class being edited (what shows on the timetable)
  useEffect(() => {
    setEditedClass({
      ...cls,
      startTime: normalizeTimeForInput(cls.startTime) || '09:00',
      endTime: normalizeTimeForInput(cls.endTime) || '10:00'
    });
  }, [cls.id, cls.startTime, cls.endTime, cls.className, cls.day, cls.type, cls.location, cls.color]);

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
                value={normalizeTimeForInput(editedClass.startTime)}
                onChange={(e) => setEditedClass({ ...editedClass, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={normalizeTimeForInput(editedClass.endTime)}
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
