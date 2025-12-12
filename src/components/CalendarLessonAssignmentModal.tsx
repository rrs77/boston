import React, { useState, useMemo } from 'react';
import { X, BookOpen, Layers, Calendar, Clock, ChevronRight, Search } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useLessonStacks, type StackedLesson } from '../hooks/useLessonStacks';
import { format, addDays, isSameDay, getDay } from 'date-fns';

interface TimetableClass {
  id: string;
  day: number; // 0-6 for Sunday-Saturday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  className: string;
  location: string;
  color: string;
}

interface CalendarLessonAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  className: string;
  onAssignLesson: (lessonNumber: string, dates: Date[]) => void;
  onAssignStack: (stackId: string, dates: Date[]) => void;
  timetableClasses: TimetableClass[];
}

export function CalendarLessonAssignmentModal({
  isOpen,
  onClose,
  selectedDate,
  className,
  onAssignLesson,
  onAssignStack,
  timetableClasses
}: CalendarLessonAssignmentModalProps) {
  const { lessonNumbers, allLessonsData } = useData();
  const { stacks } = useLessonStacks();
  const [activeTab, setActiveTab] = useState<'lesson' | 'stack'>('lesson');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [selectedStack, setSelectedStack] = useState<string | null>(null);
  const [spreadDays, setSpreadDays] = useState<number>(1);

  // Filter lessons based on search
  const filteredLessons = useMemo(() => {
    if (!searchQuery) return lessonNumbers;
    
    return lessonNumbers.filter(lessonNumber => {
      const lessonData = allLessonsData[lessonNumber];
      if (!lessonData) return false;
      
      const title = lessonData.title || `Lesson ${lessonNumber}`;
      return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             lessonNumber.includes(searchQuery);
    });
  }, [lessonNumbers, allLessonsData, searchQuery]);

  // Filter stacks based on search
  const filteredStacks = useMemo(() => {
    if (!searchQuery) return stacks;
    
    return stacks.filter(stack =>
      stack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stack.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stacks, searchQuery]);

  // Calculate dates based on timetable and spread days
  const calculateDates = (startDate: Date, daysToSpread: number): Date[] => {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    let daysAdded = 0;
    const maxDays = 30; // Prevent infinite loops

    // Get timetable days for this class
    const classTimetableDays = timetableClasses
      .filter(t => t.className === className)
      .map(t => t.day)
      .sort();

    if (classTimetableDays.length === 0) {
      // If no timetable, just add consecutive days
      for (let i = 0; i < daysToSpread; i++) {
        dates.push(new Date(addDays(startDate, i)));
      }
      return dates;
    }

    // Find the next timetable day from start date
    const startDay = getDay(startDate);
    let nextTimetableIndex = classTimetableDays.findIndex(day => day >= startDay);
    
    if (nextTimetableIndex === -1) {
      // If no timetable day found this week, start from first day next week
      nextTimetableIndex = 0;
      const daysUntilNext = (7 - startDay) + classTimetableDays[0];
      currentDate = addDays(startDate, daysUntilNext);
    } else {
      const daysUntilNext = classTimetableDays[nextTimetableIndex] - startDay;
      if (daysUntilNext > 0) {
        currentDate = addDays(startDate, daysUntilNext);
      }
    }

    // Add dates based on timetable
    while (daysAdded < daysToSpread && daysAdded < maxDays) {
      dates.push(new Date(currentDate));
      daysAdded++;

      // Move to next timetable day
      nextTimetableIndex = (nextTimetableIndex + 1) % classTimetableDays.length;
      const currentDay = getDay(currentDate);
      const nextTimetableDay = classTimetableDays[nextTimetableIndex];
      
      let daysToAdd = nextTimetableDay - currentDay;
      if (daysToAdd <= 0) {
        daysToAdd += 7; // Move to next week
      }
      
      currentDate = addDays(currentDate, daysToAdd);
    }

    return dates;
  };

  const handleAssign = () => {
    if (activeTab === 'lesson' && selectedLesson) {
      const dates = calculateDates(selectedDate, spreadDays);
      onAssignLesson(selectedLesson, dates);
      handleClose();
    } else if (activeTab === 'stack' && selectedStack) {
      const stack = stacks.find(s => s.id === selectedStack);
      if (stack) {
        // Spread stack lessons over the days
        const dates = calculateDates(selectedDate, spreadDays);
        onAssignStack(selectedStack, dates);
        handleClose();
      }
    }
  };

  const handleClose = () => {
    setSelectedLesson(null);
    setSelectedStack(null);
    setSearchQuery('');
    setSpreadDays(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70] animate-fade-in">
      <div className="bg-white rounded-card shadow-soft w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 text-white" style={{ background: 'linear-gradient(to right, #14B8A6, #0D9488)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Add to Calendar</h2>
              <p className="text-white/90 text-sm mt-1">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-button transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab('lesson');
              setSelectedLesson(null);
              setSelectedStack(null);
            }}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'lesson'
                ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Lesson from Library</span>
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('stack');
              setSelectedLesson(null);
              setSelectedStack(null);
            }}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'stack'
                ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Layers className="h-5 w-5" />
              <span>Stack</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'lesson' ? 'Search lessons...' : 'Search stacks...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Spread Days Input */}
          <div className="mb-6 p-4 bg-teal-50 rounded-card border border-teal-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Spread over how many sessions?
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                min="1"
                max="20"
                value={spreadDays}
                onChange={(e) => setSpreadDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-button focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-600">
                {spreadDays === 1 ? 'session' : 'sessions'}
                {timetableClasses.length > 0 && (
                  <span className="text-teal-600 ml-2">
                    (Based on your timetable)
                  </span>
                )}
              </span>
            </div>
            {timetableClasses.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ No timetable configured. Lessons will be added on consecutive days.
              </p>
            )}
          </div>

          {/* Lesson List */}
          {activeTab === 'lesson' && (
            <div className="space-y-2">
              {filteredLessons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No lessons found matching your search.' : 'No lessons available.'}
                </div>
              ) : (
                filteredLessons.map(lessonNumber => {
                  const lessonData = allLessonsData[lessonNumber];
                  const title = lessonData?.title || `Lesson ${lessonNumber}`;
                  const isSelected = selectedLesson === lessonNumber;

                  return (
                    <button
                      key={lessonNumber}
                      onClick={() => setSelectedLesson(lessonNumber)}
                      className={`w-full text-left p-4 rounded-card border-2 transition-all ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50 shadow-soft'
                          : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <BookOpen className="h-4 w-4 text-teal-600" />
                            <span className="font-semibold text-gray-900">{title}</span>
                          </div>
                          {lessonData && (
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{lessonData.totalTime || 0} mins</span>
                              </div>
                              <span>
                                {Object.values(lessonData.grouped || {}).flat().length} activities
                              </span>
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center">
                            <ChevronRight className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Stack List */}
          {activeTab === 'stack' && (
            <div className="space-y-2">
              {filteredStacks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No stacks found matching your search.' : 'No stacks available.'}
                </div>
              ) : (
                filteredStacks.map(stack => {
                  const isSelected = selectedStack === stack.id;

                  return (
                    <button
                      key={stack.id}
                      onClick={() => setSelectedStack(stack.id)}
                      className={`w-full text-left p-4 rounded-card border-2 transition-all ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50 shadow-soft'
                          : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Layers className="h-4 w-4 text-teal-600" />
                            <span className="font-semibold text-gray-900">{stack.name}</span>
                          </div>
                          {stack.description && (
                            <p className="text-sm text-gray-600 mb-2">{stack.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{stack.lessons.length} lessons</span>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{stack.totalTime} mins</span>
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center">
                            <ChevronRight className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {activeTab === 'lesson' && selectedLesson && (
              <span>Selected: Lesson {selectedLesson}</span>
            )}
            {activeTab === 'stack' && selectedStack && (
              <span>Selected: {stacks.find(s => s.id === selectedStack)?.name}</span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-button hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedLesson && !selectedStack}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-button transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Add to Calendar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

