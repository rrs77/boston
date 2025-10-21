import React, { useState, useEffect } from 'react';
import { Calendar, X, Check, ChevronRight } from 'lucide-react';

// Fallback half-terms in case DataContext doesn't provide all 6
const FALLBACK_HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct', lessons: [], isComplete: false },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec', lessons: [], isComplete: false },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb', lessons: [], isComplete: false },
  { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr', lessons: [], isComplete: false },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May', lessons: [], isComplete: false },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul', lessons: [], isComplete: false },
];

interface HalfTerm {
  id: string;
  name: string;
  months: string;
  lessons: string[];
  isComplete: boolean;
}

interface AssignToHalfTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (halfTermId: string) => void;
  lessonNumber: string;
  halfTerms: HalfTerm[];
  displayNumber?: number; // Add optional prop for sequential display number
}

export function AssignToHalfTermModal({
  isOpen,
  onClose,
  onAssign,
  lessonNumber,
  halfTerms,
  displayNumber
}: AssignToHalfTermModalProps) {
  const [selectedHalfTerm, setSelectedHalfTerm] = useState<string>('');

  // Reset selection when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedHalfTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  console.log('🎯 AssignToHalfTermModal rendered', { 
    lessonNumber, 
    halfTerms, 
    halfTermsLength: halfTerms?.length,
    halfTermsStructure: halfTerms?.map(term => ({ id: term.id, name: term.name, months: term.months })),
    selectedHalfTerm,
    fullHalfTerms: halfTerms
  });

  // Filter out invalid half-terms (UUIDs, empty names, etc.) and use fallback if needed
  const validHalfTerms = halfTerms?.filter(term => 
    term && 
    term.id && 
    term.name && 
    !term.id.includes('-') && // Filter out UUIDs
    (term.id.startsWith('A') || term.id.startsWith('SP') || term.id.startsWith('SM')) // Only valid IDs
  ) || [];
  
  const displayHalfTerms = validHalfTerms.length >= 6 ? validHalfTerms : FALLBACK_HALF_TERMS;
  
  console.log('🎯 Using halfTerms:', { 
    original: halfTerms?.length, 
    valid: validHalfTerms.length,
    fallback: FALLBACK_HALF_TERMS.length, 
    using: displayHalfTerms.length,
    displayHalfTerms,
    validHalfTerms
  });

  // Show loading state if no half-terms available
  if (!displayHalfTerms || displayHalfTerms.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading half-terms...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleAssign = () => {
    console.log('🚀 Assignment initiated:', { lessonNumber, selectedHalfTerm });
    
    if (selectedHalfTerm) {
      console.log('✅ Calling onAssign with:', selectedHalfTerm);
      
      // Call the assignment function with the selected half-term
      // This will work regardless of whether we're using fallback or real data
      onAssign(selectedHalfTerm);
      
      // Reset selection and close modal
      setSelectedHalfTerm('');
      onClose();
      
      console.log('🔒 Modal should now close');
    } else {
      console.warn('⚠️ No half-term selected for assignment');
    }
  };

  const handleClose = () => {
    console.log('❌ Modal closing - resetting selection');
    setSelectedHalfTerm('');
    onClose();
  };

  // Use displayNumber if provided, otherwise fall back to lessonNumber
  const lessonDisplayText = displayNumber ? displayNumber.toString() : lessonNumber;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Assign Lesson to Half-Term</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* FIXED: Use sequential display number instead of actual lesson number */}
          <p className="text-gray-700 mb-4">
            Select a half-term to assign Lesson {lessonDisplayText}.
          </p>

          <div className="space-y-2 mb-6">
            {displayHalfTerms && displayHalfTerms.length > 0 ? displayHalfTerms.map(halfTerm => (
              <button
                key={halfTerm.id}
                onClick={() => {
                  console.log('🎯 Half-term selected:', halfTerm.id);
                  setSelectedHalfTerm(halfTerm.id);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors duration-200 ${
                  selectedHalfTerm === halfTerm.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    halfTerm.id.startsWith('A') ? 'bg-amber-500' :
                    halfTerm.id.startsWith('SP') ? 'bg-green-500' :
                    'bg-purple-500'
                  }`}></div>
                  <div className="text-left">
                    <p className="font-medium">{halfTerm.name}</p>
                    <p className="text-xs text-gray-500">{halfTerm.months}</p>
                  </div>
                </div>
                {selectedHalfTerm === halfTerm.id && (
                  <Check className="h-5 w-5 text-blue-600" />
                )}
              </button>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <p>No half-terms available</p>
                <p className="text-sm mt-1">Please check your data configuration</p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedHalfTerm}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Assign to Half-Term</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}