import React from 'react';
import { Calendar, BookOpen, ChevronRight, CheckCircle, Plus } from 'lucide-react';
import type { LessonData } from '../contexts/DataContext';

interface HalfTermCardProps {
  id: string;
  name: string;
  months: string;
  color: string;
  lessonCount: number;
  stackCount?: number;
  onClick: () => void;
  isComplete: boolean;
  theme?: {
    primary: string;
    secondary: string;
    accent: string;
    gradient: string;
  };
  onLessonClick?: (lessonNumber: string) => void;
  onLessonEdit?: (lessonNumber: string) => void;
  halfTerms?: Array<{ id: string; name: string; lessons: string[] }>;
}

export function HalfTermCard({
  id,
  name,
  months,
  color,
  lessonCount,
  stackCount = 0,
  onClick,
  isComplete,
  theme,
  onLessonClick,
  onLessonEdit,
  halfTerms = []
}: HalfTermCardProps) {
  // Determine progress state and colors
  const getProgressState = () => {
    if (lessonCount === 0) {
      return {
        bgColor: '#D6F2EE', // Light teal background for card footers
        textColor: '#004C45', // Darker teal text for better contrast
        status: 'Empty'
      };
    } else if (isComplete) {
      return {
        bgColor: '#008272', // Primary brand teal for complete
        textColor: '#FFFFFF',
        status: 'Complete'
      };
    } else {
      return {
        bgColor: '#007366', // Teal hover for in progress
        textColor: '#FFFFFF',
        status: 'In Progress'
      };
    }
  };

  const progressState = getProgressState();

  return (
    <div 
      className="bg-white rounded-card shadow-soft transition-all duration-300 cursor-pointer group hover:-translate-y-0.5 hover:shadow-hover overflow-hidden"
      onClick={onClick}
    >
      {/* TOP SECTION - White Background */}
      <div 
        className="relative"
        style={{ 
          padding: '20px 16px',
          background: 'white'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#6B7280',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              margin: 0
            }}
          >
            {name}
          </h3>
          <ChevronRight 
            className="h-5 w-5 transition-all duration-300 text-gray-400 group-hover:translate-x-1" 
            style={{ color: '#6B7280' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#008272'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
          />
        </div>
        
        <p 
          style={{
            fontSize: '14px',
            color: '#4B5563',
            fontWeight: 400,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            margin: 0
          }}
        >
          {months}
        </p>
      </div>

      {/* BOTTOM SECTION - Teal Progress Band */}
      <div 
        className="relative flex items-center justify-between"
        style={{ 
          padding: '16px',
          backgroundColor: progressState.bgColor,
          transition: 'all 250ms ease'
        }}
      >
        <div className="flex items-center gap-2">
          <BookOpen 
            className="h-5 w-5" 
            style={{ color: progressState.textColor }}
          />
          <span 
            style={{
              fontSize: '15px',
              fontWeight: 500,
              color: progressState.textColor,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
            }}
          >
            {lessonCount > 0 ? `${lessonCount} lesson${lessonCount !== 1 ? 's' : ''}` : 'No lessons assigned'}
            {stackCount > 0 && (
              <span style={{ marginLeft: '0.5rem' }}>
                {stackCount} stack{stackCount !== 1 ? 's' : ''}
              </span>
            )}
          </span>
        </div>

      </div>

    </div>
  );
}