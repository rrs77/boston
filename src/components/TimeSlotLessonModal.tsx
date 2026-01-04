import React, { useState, useMemo } from 'react';
import { X, Clock, BookOpen, Search, Check } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import type { LessonData, LessonPlan } from '../contexts/DataContext';

interface TimeSlotLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  hour: number;
  className: string;
  onAddLesson: (plan: LessonPlan) => void;
  timetableClasses?: Array<{
    day: number;
    startTime: string;
    endTime: string;
    className: string;
    yearGroupId?: string;
  }>;
}

// Helper function to determine which half-term a date belongs to
const getHalfTermForDate = (date: Date): string => {
  const month = date.getMonth(); // 0-11
  const day = date.getDate();
  
  // Academic year runs Sep-Aug
  // A1: Sep-Oct (months 8-9)
  // A2: Nov-Dec (months 10-11)
  // SP1: Jan-Feb (months 0-1)
  // SP2: Mar-Apr (months 2-3)
  // SM1: Apr-May (months 3-4)
  // SM2: Jun-Jul (months 5-6)
  
  if (month >= 8 && month <= 9) return 'A1'; // Sep-Oct
  if (month >= 10 && month <= 11) return 'A2'; // Nov-Dec
  if (month >= 0 && month <= 1) return 'SP1'; // Jan-Feb
  if (month >= 2 && month <= 3) {
    // Mar-Apr - need to check if it's SP2 or SM1
    if (month === 2 || (month === 3 && day <= 15)) return 'SP2'; // Mar or early Apr
    return 'SM1'; // Late Apr
  }
  if (month >= 4 && month <= 5) {
    // Apr-May - need to check if it's SM1 or SM2
    if (month === 4 || (month === 5 && day <= 15)) return 'SM1'; // Apr or early May
    return 'SM2'; // Late May
  }
  if (month >= 6 && month <= 7) return 'SM2'; // Jun-Jul
  
  // Default to A1 if somehow outside range
  return 'A1';
};

export function TimeSlotLessonModal({
  isOpen,
  onClose,
  date,
  hour,
  className,
  onAddLesson,
  timetableClasses = []
}: TimeSlotLessonModalProps) {
  const { allLessonsData, halfTerms, getLessonsForHalfTerm, currentAcademicYear } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Get the timetable class for this time slot
  const dayOfWeek = date.getDay();
  const timetableClassForSlot = timetableClasses.find(tClass => {
    if (tClass.day !== dayOfWeek) return false;
    const startHour = parseInt(tClass.startTime.split(':')[0]);
    const endHour = parseInt(tClass.endTime.split(':')[0]);
    return hour >= startHour && hour < endHour;
  });

  const halfTermId = useMemo(() => getHalfTermForDate(date), [date]);
  const halfTerm = useMemo(() => halfTerms.find(term => term.id === halfTermId), [halfTerms, halfTermId]);
  
  // Get all lessons for this half-term
  const lessonNumbers = useMemo(() => {
    if (!halfTerm) return [];
    return getLessonsForHalfTerm(halfTermId);
  }, [halfTerm, halfTermId, getLessonsForHalfTerm]);

  // Filter lessons based on search query
  const filteredLessons = useMemo(() => {
    if (!searchQuery.trim()) return lessonNumbers;
    
    const query = searchQuery.toLowerCase();
    return lessonNumbers.filter(lessonNum => {
      const lessonData = allLessonsData[lessonNum];
      if (!lessonData) return false;
      
      const title = lessonData.title?.toLowerCase() || '';
      const lessonNumStr = lessonNum.toLowerCase();
      
      return title.includes(query) || lessonNumStr.includes(query);
    });
  }, [lessonNumbers, searchQuery, allLessonsData]);

  // Get lesson data for display
  const lessonsWithData = useMemo(() => {
    return filteredLessons
      .map(lessonNum => ({
        lessonNumber: lessonNum,
        lessonData: allLessonsData[lessonNum]
      }))
      .filter(item => item.lessonData) // Only include lessons with data
      .sort((a, b) => {
        // Sort by lesson number (numeric)
        const numA = parseInt(a.lessonNumber) || 0;
        const numB = parseInt(b.lessonNumber) || 0;
        return numA - numB;
      });
  }, [filteredLessons, allLessonsData]);

  const handleSelectLesson = async (lessonNumber: string) => {
    const lessonData = allLessonsData[lessonNumber];
    if (!lessonData) return;

    setIsAdding(true);
    
    try {
      // Calculate duration from activities
      let activities = Object.values(lessonData.grouped || {}).flat();
      
      // Link activities to year group if timetable class has one
      if (timetableClassForSlot?.yearGroupId) {
        activities = activities.map(activity => ({
          ...activity,
          yearGroups: [...new Set([...(activity.yearGroups || []), timetableClassForSlot.className])]
        }));
      }
      
      const duration = activities.reduce((sum, activity) => sum + (activity.time || 0), 0);
      
      // Create lesson plan
      const newPlan: LessonPlan = {
        id: `plan-${Date.now()}`,
        date: date,
        week: Math.ceil(date.getDate() / 7), // Simple week calculation
        className: timetableClassForSlot?.className || className, // Use timetable class name if available
        activities: activities,
        duration: duration,
        notes: '',
        status: 'planned',
        lessonNumber: lessonNumber,
        title: lessonData.title || `Lesson ${lessonNumber}`,
        time: `${hour}:00`, // Set the time
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add the lesson plan
      await onAddLesson(newPlan);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error adding lesson:', error);
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  const timeString = `${hour}:00`;
  const dateString = format(date, 'EEEE, MMMM d, yyyy');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Select Lesson</h2>
            <p className="text-sm text-gray-600 mt-1">
              {dateString} at {timeString}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {halfTerm?.name || `Half-term ${halfTermId}`} • {lessonsWithData.length} {lessonsWithData.length === 1 ? 'lesson' : 'lessons'} available
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>

        {/* Lesson List */}
        <div className="flex-1 overflow-y-auto p-4">
          {lessonsWithData.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'No lessons found matching your search' : 'No lessons available for this half-term'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {lessonsWithData.map(({ lessonNumber, lessonData }) => {
                const activities = Object.values(lessonData.grouped || {}).flat();
                const duration = activities.reduce((sum, activity) => sum + (activity.time || 0), 0);
                const categories = Object.keys(lessonData.grouped || {});

                return (
                  <button
                    key={lessonNumber}
                    onClick={() => handleSelectLesson(lessonNumber)}
                    disabled={isAdding}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-semibold text-teal-600 bg-teal-100 px-2 py-1 rounded">
                            Lesson {lessonNumber}
                          </span>
                          {duration > 0 && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {duration}m
                            </div>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {lessonData.title || `Lesson ${lessonNumber}`}
                        </h3>
                        {categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {categories.slice(0, 3).map(category => (
                              <span
                                key={category}
                                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                              >
                                {category}
                              </span>
                            ))}
                            {categories.length > 3 && (
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                +{categories.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                          <Check className="h-4 w-4 text-teal-600" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Click on a lesson to add it to the daily planner
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

