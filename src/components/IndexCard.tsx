import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, BookOpen } from 'lucide-react';
import { LessonLibraryCard } from './LessonLibraryCard';
import type { LessonData } from '../contexts/DataContext';

interface IndexCardProps {
  unitName: string;
  lessons: Array<{ lessonNumber: string; lessonData: LessonData }>;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
  };
  onLessonClick: (lessonNumber: string) => void;
  onLessonEdit?: (lessonNumber: string) => void;
  halfTerms?: Array<{ id: string; name: string; lessons: string[] }>;
}

export function IndexCard({
  unitName,
  lessons,
  theme,
  onLessonClick,
  onLessonEdit,
  halfTerms = []
}: IndexCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Index Card Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
              style={{
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
              }}
            >
              <Folder className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{unitName}</h3>
              <p className="text-sm text-gray-600">
                {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{lessons.length}</span>
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Lessons */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="space-y-2">
            {lessons.map(({ lessonNumber, lessonData }, index) => (
              <LessonLibraryCard
                key={lessonNumber}
                lessonNumber={lessonNumber}
                displayNumber={index + 1}
                lessonData={lessonData}
                viewMode="compact"
                onClick={() => onLessonClick(lessonNumber)}
                onEdit={onLessonEdit ? () => onLessonEdit(lessonNumber) : undefined}
                theme={theme}
                halfTerms={halfTerms}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

