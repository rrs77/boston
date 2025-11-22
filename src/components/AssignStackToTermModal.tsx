import React, { useState } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface AssignStackToTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  stackId: string;
  stackName: string;
  onAssign: (stackId: string, termId: string) => void;
}

export function AssignStackToTermModal({
  isOpen,
  onClose,
  stackId,
  stackName,
  onAssign
}: AssignStackToTermModalProps) {
  const { halfTerms, getLessonsForHalfTerm } = useData();
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Fallback half-terms with proper names
  const FALLBACK_HALF_TERMS = [
    { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct', lessons: [], isComplete: false },
    { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec', lessons: [], isComplete: false },
    { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb', lessons: [], isComplete: false },
    { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr', lessons: [], isComplete: false },
    { id: 'SM1', name: 'Summer 1', months: 'Apr-May', lessons: [], isComplete: false },
    { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul', lessons: [], isComplete: false },
  ];

  // Filter out invalid half-terms (UUIDs, empty names, etc.) and use fallback if needed
  const validHalfTerms = halfTerms?.filter(term => 
    term && 
    term.id && 
    term.name && 
    !term.id.includes('-') && // Filter out UUIDs
    (term.id.startsWith('A') || term.id.startsWith('SP') || term.id.startsWith('SM')) // Only valid IDs
  ) || [];
  
  const displayHalfTerms = validHalfTerms.length >= 6 ? validHalfTerms : FALLBACK_HALF_TERMS;

  const handleAssign = async () => {
    if (!selectedTerm) return;
    
    setIsAssigning(true);
    try {
      // Check if any lessons from this stack are already assigned to other terms
      // For now, we'll just assign the stack reference to the term
      onAssign(stackId, selectedTerm);
      onClose();
      setSelectedTerm('');
    } catch (error) {
      console.error('Failed to assign stack to term:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClose = () => {
    setSelectedTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Assign Stack to Half-Term</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-teal-500"></div>
              <span className="font-medium text-gray-900">{stackName}</span>
            </div>
            <p className="text-sm text-gray-600">
              Assigning this stack will make it available for planning in the selected term.
            </p>
          </div>

          {/* Term Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Term
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {halfTerms.map((term) => {
                const currentLessons = getLessonsForHalfTerm(term.id);
                const isComplete = term.isComplete;
                
                return (
                  <label
                    key={term.id}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedTerm === term.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    } ${isComplete ? 'opacity-60' : ''}`}
                  >
                    <input
                      type="radio"
                      name="term"
                      value={term.id}
                      checked={selectedTerm === term.id}
                      onChange={(e) => setSelectedTerm(e.target.value)}
                      disabled={isComplete}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{term.name}</h3>
                          <p className="text-sm text-gray-500">{term.months}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-600">
                            {currentLessons.length} lessons
                          </span>
                          {isComplete && (
                            <div className="flex items-center space-x-1 text-xs mt-1" style={{color: '#0BA596'}}>
                              <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: '#0BA596'}}></div>
                              <span>Complete</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Warning for complete terms */}
          {selectedTerm && halfTerms.find(t => t.id === selectedTerm)?.isComplete && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-yellow-800">
                    This term is marked as complete. Are you sure you want to assign the stack to it?
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedTerm || isAssigning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            {isAssigning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Assigning...</span>
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4" />
                <span>Assign to Half-Term</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
