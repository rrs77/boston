import React, { useState, useEffect } from 'react';
import { X, Edit3, Save, AlertCircle } from 'lucide-react';
import type { ActivityStack } from '../contexts/DataContext';

interface EditStackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stackId: string, updates: Partial<ActivityStack>) => void;
  stack: ActivityStack | null;
}

export function EditStackModal({
  isOpen,
  onClose,
  onSave,
  stack
}: EditStackModalProps) {
  const [stackName, setStackName] = useState('');
  const [stackDescription, setStackDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Update form when stack changes
  useEffect(() => {
    if (stack) {
      setStackName(stack.name);
      setStackDescription(stack.description || '');
    }
  }, [stack]);

  if (!isOpen || !stack) return null;

  const handleSave = async () => {
    if (!stackName.trim()) return;

    setIsSaving(true);
    try {
      await onSave(stack.id, {
        name: stackName.trim(),
        description: stackDescription.trim()
      });
      onClose();
    } catch (error) {
      console.error('Failed to save stack:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setStackName(stack.name);
    setStackDescription(stack.description || '');
    onClose();
  };

  const totalTime = stack.activities.reduce((sum, activity) => sum + (activity.time || 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Edit3 className="h-6 w-6" />
            <h3 className="text-lg font-semibold">Edit Stack</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
            disabled={isSaving}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Stack Name */}
          <div>
            <label htmlFor="editStackName" className="block text-sm font-medium text-gray-700 mb-2">
              Stack Name *
            </label>
            <input
              id="editStackName"
              type="text"
              value={stackName}
              onChange={(e) => setStackName(e.target.value)}
              placeholder="Enter stack name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSaving}
            />
          </div>

          {/* Stack Description */}
          <div>
            <label htmlFor="editStackDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="editStackDescription"
              value={stackDescription}
              onChange={(e) => setStackDescription(e.target.value)}
              placeholder="Enter stack description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSaving}
            />
          </div>

          {/* Stack Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">Stack Information</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Activities:</span>
                <span>{stack.activities.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Time:</span>
                <span>{totalTime} minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Created:</span>
                <span>{new Date(stack.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span>{new Date(stack.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Validation */}
          {!stackName.trim() && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Stack name is required</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors duration-200"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!stackName.trim() || isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
