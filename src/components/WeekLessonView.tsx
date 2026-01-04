import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Edit3, Plus, Link as LinkIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns';
import type { LessonPlan } from '../contexts/DataContext';
import { customObjectivesApi } from '../config/customObjectivesApi';
import type { CustomObjective } from '../types/customObjectives';

interface WeekLessonViewProps {
  currentDate: Date;
  lessonPlans: LessonPlan[];
  onDateChange: (date: Date) => void;
  onLessonClick: (plan: LessonPlan) => void;
  onAddLesson: (date: Date) => void;
  className: string;
  timetableClasses?: Array<{
    day: number;
    startTime: string;
    endTime: string;
    className: string;
    color: string;
  }>;
  allLessonsData?: Record<string, any>; // Lesson data from DataContext
}

interface DayNotes {
  [key: string]: string;
}

export function WeekLessonView({
  currentDate,
  lessonPlans,
  onDateChange,
  onLessonClick,
  onAddLesson,
  className,
  timetableClasses = [],
  allLessonsData = {}
}: WeekLessonViewProps) {
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [dayNotes, setDayNotes] = useState<DayNotes>(() => {
    const saved = localStorage.getItem(`day-notes-${className}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [customObjectives, setCustomObjectives] = useState<CustomObjective[]>([]);

  // Load custom objectives
  useEffect(() => {
    const loadObjectives = async () => {
      try {
        const structure = await customObjectivesApi.getCompleteStructure();
        const allObjectives: CustomObjective[] = [];
        structure.forEach(yearGroup => {
          yearGroup.areas.forEach(area => {
            allObjectives.push(...area.objectives);
          });
        });
        setCustomObjectives(allObjectives);
      } catch (error) {
        console.warn('Failed to load custom objectives:', error);
      }
    };
    loadObjectives();
  }, []);

  // Get week dates (Monday to Friday for school week)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).slice(0, 5); // Monday-Friday only

  // Save notes to localStorage
  const saveNotes = (notes: DayNotes) => {
    setDayNotes(notes);
    localStorage.setItem(`day-notes-${className}`, JSON.stringify(notes));
  };

  const handleNoteChange = (dateKey: string, note: string) => {
    const newNotes = { ...dayNotes, [dateKey]: note };
    saveNotes(newNotes);
  };

  const toggleLessonExpanded = (planId: string) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId);
    } else {
      newExpanded.add(planId);
    }
    setExpandedLessons(newExpanded);
  };

  // Get lesson plans for a specific date, sorted by time
  const getPlansForDate = (date: Date): LessonPlan[] => {
    return lessonPlans
      .filter(plan => isSameDay(new Date(plan.date), date))
      .sort((a, b) => {
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
      });
  };

  // Get timetable classes for a specific date
  const getTimetableClassesForDate = (date: Date) => {
    const dayOfWeek = date.getDay();
    return timetableClasses.filter(tClass => tClass.day === dayOfWeek);
  };

  // Format time range
  const formatTimeRange = (startTime: string, endTime?: string) => {
    if (!endTime) {
      const [hour, minute] = startTime.split(':');
      const hourNum = parseInt(hour);
      const ampm = hourNum >= 12 ? 'pm' : 'am';
      const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
      return `${displayHour}:${minute} ${ampm}`;
    }
    
    const formatTime = (time: string) => {
      const [hour, minute] = time.split(':');
      const hourNum = parseInt(hour);
      const ampm = hourNum >= 12 ? 'pm' : 'am';
      const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
      return `${displayHour}:${minute} ${ampm}`;
    };
    
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  // Calculate duration from start and end time
  const calculateDuration = (startTime: string, endTime?: string): number => {
    if (!endTime) return 0;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Week Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onDateChange(subWeeks(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronUp className="h-5 w-5 text-gray-600 rotate-[-90deg]" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Week of {format(weekStart, 'MMMM d, yyyy')}
            </h2>
          </div>
          <button
            onClick={() => onDateChange(addWeeks(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronUp className="h-5 w-5 text-gray-600 rotate-90deg" />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
            Share
          </button>
        </div>
      </div>

      {/* Week Columns */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex h-full min-w-max">
          {weekDays.map((date, index) => {
            const plans = getPlansForDate(date);
            const timetableClassesForDay = getTimetableClassesForDate(date);
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayNote = dayNotes[dateKey] || '';

            return (
              <div
                key={dateKey}
                className="flex-1 min-w-[350px] border-r border-gray-200 bg-white flex flex-col"
              >
                {/* Day Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="text-sm font-medium text-gray-500">
                    Day {index + 1} | {format(date, 'EEE (MMM d)')}
                  </div>
                </div>

                {/* Note Box */}
                <div className="p-3 bg-yellow-50 border-b border-yellow-200">
                  <textarea
                    value={dayNote}
                    onChange={(e) => handleNoteChange(dateKey, e.target.value)}
                    placeholder="Type a note..."
                    className="w-full bg-transparent border-none outline-none resize-none text-sm text-gray-700 placeholder-gray-400"
                    rows={2}
                  />
                </div>

                {/* Lessons */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {/* Combine timetable classes and lesson plans */}
                  {[...timetableClassesForDay, ...plans].map((item, idx) => {
                    const isTimetableClass = 'startTime' in item;
                    const plan = isTimetableClass ? null : item as LessonPlan;
                    const tClass = isTimetableClass ? item : null;
                    
                    const blockColor = isTimetableClass 
                      ? tClass!.color 
                      : plan!.unitId 
                        ? '#8B5CF6' // Purple for units
                        : '#EC4899'; // Pink for regular lessons
                    
                    const startTime = isTimetableClass ? tClass!.startTime : plan!.time || '';
                    const endTime = isTimetableClass ? tClass!.endTime : '';
                    const title = isTimetableClass ? tClass!.className : plan!.title || `Lesson ${plan!.lessonNumber || ''}`;
                    const isExpanded = plan ? expandedLessons.has(plan.id) : false;
                    const itemId = isTimetableClass ? `timetable-${tClass!.className}-${idx}` : plan!.id;

                    return (
                      <div
                        key={itemId}
                        className="rounded-lg border-2 overflow-hidden"
                        style={{ borderColor: blockColor }}
                      >
                        {/* Lesson Header */}
                        <div
                          className="p-3 cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: `${blockColor}15` }}
                          onClick={() => {
                            if (plan) {
                              toggleLessonExpanded(plan.id);
                            } else {
                              onAddLesson(date);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="text-xs font-medium text-gray-600 mb-1">
                                {formatTimeRange(startTime, endTime)}
                              </div>
                              <div className="font-semibold text-gray-900 mb-2">{title}</div>
                              {plan && (
                                <div className="flex items-center space-x-2 text-xs">
                                  {plan.unitName && (
                                    <button className="px-2 py-0.5 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-medium">
                                      Unit {plan.unitName}
                                    </button>
                                  )}
                                  {plan.lessonNumber && (
                                    <span className="text-gray-600">Lesson {plan.lessonNumber}</span>
                                  )}
                                  {plan.week && (
                                    <span className="text-gray-500">Week {plan.week}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            {plan && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLessonExpanded(plan.id);
                                }}
                                className="p-1 hover:bg-white/50 rounded"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-gray-600" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-600" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expandable Content Area */}
                        {plan && (
                          <div className="bg-white border-t border-gray-200 relative">
                            {/* Collapsed state - show down arrow */}
                            {!isExpanded && (
                              <div className="p-3 flex items-center justify-end">
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                            
                            {/* Expanded Content */}
                            {isExpanded && (
                              <div className="p-4">
                                {/* Learning Objectives */}
                                {plan.lessonNumber && allLessonsData[plan.lessonNumber] && (
                                  (() => {
                                    const lessonData = allLessonsData[plan.lessonNumber];
                                    const hasObjectives = lessonData.customObjectives && lessonData.customObjectives.length > 0;
                                    const hasEyfs = lessonData.lessonStandards && lessonData.lessonStandards.length > 0;
                                    
                                    if (hasObjectives || hasEyfs) {
                                      return (
                                        <div className="mb-4">
                                          <h4 className="text-xs font-semibold text-gray-700 mb-2">
                                            {lessonData.curriculumType === 'CUSTOM' ? 'Learning Objectives' : 'EYFS Standards'}
                                          </h4>
                                          <div className="text-sm text-gray-700">
                                            <p className="mb-2 font-medium">By the end of the lesson, children will be able to:</p>
                                            <ul className="space-y-1.5">
                                              {hasObjectives && lessonData.customObjectives?.map((objId: string, idx: number) => {
                                                const objective = customObjectives.find(obj => obj.id === objId);
                                                return (
                                                  <li key={idx} className="flex items-start">
                                                    <span className="mr-2 text-gray-500">•</span>
                                                    <span>{objective?.objective_text || objId}</span>
                                                  </li>
                                                );
                                              })}
                                              {hasEyfs && lessonData.lessonStandards?.map((standard: string, idx: number) => (
                                                <li key={idx} className="flex items-start">
                                                  <span className="mr-2 text-gray-500">•</span>
                                                  <span>{standard}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()
                                )}

                                {/* Lesson Content/Notes */}
                                {plan.notes && (
                                  <div className="mb-4">
                                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{plan.notes}</div>
                                  </div>
                                )}

                                {/* Activity Descriptions */}
                                {plan.activities && plan.activities.length > 0 && plan.activities.some(a => a.description) && (
                                  <div className="mb-4 space-y-2">
                                    {plan.activities.map((activity, actIdx) => (
                                      activity.description && (
                                        <div key={actIdx} className="text-sm text-gray-700">
                                          <div dangerouslySetInnerHTML={{ __html: activity.description }} />
                                        </div>
                                      )
                                    ))}
                                  </div>
                                )}

                                {/* Resource Links */}
                                {plan.activities && plan.activities.some(a => 
                                  a.videoLink || a.musicLink || a.link || a.canvaLink || a.resourceLink
                                ) && (
                                  <div className="mb-4 space-y-1">
                                    {plan.activities.map((activity, actIdx) => (
                                      <div key={actIdx} className="space-y-1">
                                        {activity.videoLink && (
                                          <a href={activity.videoLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline block">
                                            {activity.videoLink}
                                          </a>
                                        )}
                                        {activity.canvaLink && (
                                          <a href={activity.canvaLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline block">
                                            {activity.canvaLink}
                                          </a>
                                        )}
                                        {activity.link && (
                                          <a href={activity.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline block">
                                            {activity.link}
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Empty state for timetable classes */}
                        {isTimetableClass && (
                          <div className="p-3 bg-white border-t border-gray-200">
                            <div className="text-xs text-gray-400 text-center py-2">
                              Click to add lesson
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Empty state */}
                  {timetableClassesForDay.length === 0 && plans.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Plus className="h-8 w-8 mb-2" />
                      <p className="text-sm">No lessons scheduled</p>
                      <button
                        onClick={() => onAddLesson(date)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Add lesson
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

