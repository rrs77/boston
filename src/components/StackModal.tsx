import React from 'react';
import { X } from 'lucide-react';
import type { StackedLesson } from '../hooks/useLessonStacks';
import { LessonLibraryCard } from './LessonLibraryCard';
import { useData } from '../contexts/DataContext';

interface StackModalProps {
  isOpen: boolean;
  onClose: () => void;
  stack: StackedLesson | null;
  onOpenLesson: (lessonNumber: string) => void;
}

export function StackModal({ isOpen, onClose, stack, onOpenLesson }: StackModalProps) {
  const { allLessonsData } = useData();

  if (!isOpen || !stack) return null;

  const lessonNumbers = stack.lessons.filter(l => typeof l === 'string') as string[];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-5xl max-h-[85vh] rounded-card shadow-soft overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600">
          <div>
            <h3 className="text-white text-lg font-semibold">{stack.name} — Lessons</h3>
            <p className="text-white/80 text-sm">{stack.lessons.length} lessons • {stack.totalTime} minutes</p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={onClose} className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          {stack.description && (
            <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
              <p className="text-gray-700 text-sm">{stack.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
            {lessonNumbers.map((lessonNumber, idx) => {
              const lessonData = allLessonsData[lessonNumber];
              if (!lessonData) return null;
              return (
                <LessonLibraryCard
                  key={lessonNumber}
                  lessonNumber={lessonNumber}
                  displayNumber={idx + 1}
                  lessonData={lessonData}
                  viewMode="grid"
                  onClick={() => {
                    onClose(); // Close the stack modal first
                    onOpenLesson(lessonNumber); // Then open the lesson details
                  }}
                  theme={{ primary: '#14B8A6', secondary: '#0D9488', accent: '#0F766E', gradient: '' }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


