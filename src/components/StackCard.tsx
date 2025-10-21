import React from 'react';
import { BookOpen, Clock, Users, ChevronRight, Target, Printer } from 'lucide-react';
import type { StackedLesson } from '../hooks/useLessonStacks';

interface StackCardProps {
  stack: StackedLesson;
  onClick: () => void;
  onPrint?: (stack: StackedLesson) => void;
}

export function StackCard({ stack, onClick, onPrint }: StackCardProps) {
  
  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the stack modal
    if (onPrint) {
      onPrint(stack);
    }
  };
  return (
    <div
      className="relative cursor-pointer h-full"
      onClick={onClick}
    >
      {/* Layer 2 (back) - Teal */}
      <div
        className="absolute inset-0 translate-x-2 translate-y-2 rounded-xl bg-[#0D9488] opacity-40 shadow-md"
        aria-hidden
      />
      {/* Layer 1 (middle) - Teal/Blue */}
      <div
        className="absolute inset-0 translate-x-1 translate-y-1 rounded-xl bg-[#10A293] opacity-70 shadow-lg"
        aria-hidden
      />
      {/* Top card */}
      <div 
        className="relative bg-white rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl overflow-hidden hover:scale-[1.02] h-full flex flex-col"
        style={{ borderColor: '#10A293', borderWidth: '1px' }}
      >
      {/* Header with teal/blue gradient for stacks */}
      <div 
        className="p-4 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #10A293 0%, #0EA5E9 100%)' }}
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              {stack.name}
            </h3>
            <div className="flex items-center space-x-2">
              {onPrint && (
                <button
                  onClick={handlePrint}
                  className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                  title="Print Stack"
                >
                  <Printer className="h-4 w-4" />
                </button>
              )}
              <span className="px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium">
                Stack
              </span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              <span>{stack.lessons.length} lessons</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-1" />
              <span>{stack.totalTime} min</span>
            </div>
            {stack.customObjectives && stack.customObjectives.length > 0 && (
              <div className="flex items-center text-sm text-teal-600 font-medium">
                <Target className="h-4 w-4 mr-1" />
                <span>{stack.customObjectives.length} objectives</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-grow">
          <p className="text-sm text-gray-500 mb-3">
            {stack.description || 'A collection of related lessons'}
          </p>
          
          {/* Lesson preview */}
          <div className="space-y-1">
            {stack.lessons.slice(0, 3).map((lesson, index) => (
              <div key={index} className="flex items-center text-xs text-gray-500">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                <span className="truncate">{typeof lesson === 'string' ? `Lesson ${lesson}` : `Lesson ${index + 1}`}</span>
              </div>
            ))}
            {stack.lessons.length > 3 && (
              <div className="flex items-center text-xs text-gray-400">
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-2"></div>
                <span>+{stack.lessons.length - 3} more lessons</span>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}