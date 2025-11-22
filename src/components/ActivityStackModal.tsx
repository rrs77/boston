import React, { useState } from 'react';
import { X, Printer, Clock, Users } from 'lucide-react';
import type { ActivityStack } from '../contexts/DataContext';
import { ActivityCard } from './ActivityCard';
import { useSettings } from '../contexts/SettingsContextNew';

interface ActivityStackModalProps {
  isOpen: boolean;
  onClose: () => void;
  stack: ActivityStack | null;
  onActivityClick?: (activity: any) => void;
}

export function ActivityStackModal({ 
  isOpen, 
  onClose, 
  stack, 
  onActivityClick 
}: ActivityStackModalProps) {
  const { getCategoryColor } = useSettings();

  if (!isOpen || !stack) return null;

  const totalTime = stack.activities.reduce((sum, activity) => sum + (activity.time || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-5xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600 text-white">
          <div>
            <h3 className="text-white text-lg font-semibold">{stack.name}</h3>
            <p className="text-white/80 text-sm">
              {stack.activities.length} activities • {totalTime} minutes
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePrint} 
              className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center space-x-2"
              title="Print Stack"
            >
              <Printer className="h-5 w-5" />
              <span className="text-sm font-medium">Print</span>
            </button>
            <button 
              onClick={onClose} 
              className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          {stack.description && (
            <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
              <p className="text-gray-700 text-sm">{stack.description}</p>
            </div>
          )}
          
          {/* Activities Grid with consistent heights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stack.activities.map((activity, idx) => (
              <div key={activity._id || activity.id || idx} className="flex h-full">
                <ActivityCard
                  activity={activity}
                  onClick={onActivityClick ? () => onActivityClick(activity) : undefined}
                  viewMode="detailed"
                  className="h-full"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

