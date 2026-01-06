import React, { useState, useEffect } from 'react';
import { X, Copy, Calendar, ArrowRight } from 'lucide-react';

interface TermCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopy: (sourceYear: string, sourceTerm: string, targetYear: string, targetTerm: string) => Promise<void>;
  availableYears: string[];
  currentYear: string;
}

const HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct' },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec' },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb' },
  { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr' },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May' },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul' },
];

export function TermCopyModal({ 
  isOpen, 
  onClose, 
  onCopy, 
  availableYears, 
  currentYear 
}: TermCopyModalProps) {
  const [sourceYear, setSourceYear] = useState<string>('');
  const [sourceTerm, setSourceTerm] = useState<string>('');
  const [targetYear, setTargetYear] = useState<string>(currentYear);
  const [targetTerm, setTargetTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSourceYear(currentYear); // Default to current year for easier same-year moves
      setSourceTerm('');
      setTargetYear(currentYear);
      setTargetTerm('');
      setError('');
    }
  }, [isOpen, currentYear]);

  const handleCopy = async () => {
    if (!sourceYear || !sourceTerm || !targetYear || !targetTerm) {
      setError('Please select all required fields');
      return;
    }

    if (sourceYear === targetYear && sourceTerm === targetTerm) {
      setError('Source and target cannot be the same');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onCopy(sourceYear, sourceTerm, targetYear, targetTerm);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to copy term');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-card shadow-soft w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600 text-white">
          <div className="flex items-center space-x-3">
            <Copy className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Copy or Move Term</h2>
              <p className="text-sm text-white/90">Copy lesson plans between terms or academic years</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Source Selection */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Source (Copy From)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year
                  </label>
                  <select
                    value={sourceYear}
                    onChange={(e) => setSourceYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select source year...</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Term
                  </label>
                  <select
                    value={sourceTerm}
                    onChange={(e) => setSourceTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={!sourceYear}
                  >
                    <option value="">Select source term...</option>
                    {HALF_TERMS.map(term => (
                      <option key={term.id} value={term.id}>
                        {term.name} ({term.months})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            {/* Target Selection */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Target (Copy To)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year
                  </label>
                  <select
                    value={targetYear}
                    onChange={(e) => setTargetYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Term
                  </label>
                  <select
                    value={targetTerm}
                    onChange={(e) => setTargetTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={!targetYear}
                  >
                    <option value="">Select target term...</option>
                    {HALF_TERMS.map(term => (
                      <option key={term.id} value={term.id}>
                        {term.name} ({term.months})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Important</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Copying a term will replace all existing lessons in the target term. This action cannot be undone. 
                  {sourceYear === targetYear && sourceTerm && targetTerm && sourceTerm !== targetTerm && (
                    <span className="block mt-1 font-medium">Moving within the same year will copy lessons to the new term.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            disabled={isLoading || !sourceYear || !sourceTerm || !targetYear || !targetTerm}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Copying...</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Term</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
