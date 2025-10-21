import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface YearNavigationProps {
  currentYear: string;
  availableYears: string[];
  onYearChange: (year: string) => void;
  onCopyTerm: () => void;
}

export function YearNavigation({ 
  currentYear, 
  availableYears, 
  onYearChange, 
  onCopyTerm 
}: YearNavigationProps) {
  const currentIndex = availableYears.indexOf(currentYear);
  const canGoBack = currentIndex < availableYears.length - 1;
  const canGoForward = currentIndex > 0;

  const handlePreviousYear = () => {
    if (canGoBack) {
      onYearChange(availableYears[currentIndex + 1]);
    }
  };

  const handleNextYear = () => {
    if (canGoForward) {
      onYearChange(availableYears[currentIndex - 1]);
    }
  };

  const isCurrentAcademicYear = () => {
    const currentDate = new Date();
    const currentYearNum = currentDate.getFullYear();
    const nextYearNum = currentYearNum + 1;
    const currentAcademicYear = `${currentYearNum}-${nextYearNum}`;
    return currentYear === currentAcademicYear;
  };

  return (
    <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Year Navigation */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handlePreviousYear}
          disabled={!canGoBack}
          className={`p-2 rounded-lg transition-colors duration-200 ${
            canGoBack
              ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title={canGoBack ? 'View previous academic year' : 'No previous years available'}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Academic Year {currentYear}
            </h3>
            {isCurrentAcademicYear() && (
              <span className="text-xs font-medium" style={{color: '#0BA596'}}>Current Year</span>
            )}
          </div>
        </div>

        <button
          onClick={handleNextYear}
          disabled={!canGoForward}
          className={`p-2 rounded-lg transition-colors duration-200 ${
            canGoForward
              ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title={canGoForward ? 'Return to more recent year' : 'Already at most recent year'}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Term Copy Button */}
      <button
        onClick={onCopyTerm}
        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200"
        title="Copy terms from other academic years"
      >
        <Calendar className="h-4 w-4" />
        <span>Copy Term</span>
      </button>
    </div>
  );
}
