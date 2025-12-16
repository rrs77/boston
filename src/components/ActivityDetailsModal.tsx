import React from 'react';
import { X, Clock, Video, Music, FileText, Link as LinkIcon, Image, Volume2, Tag, Users, ExternalLink, Edit3 } from 'lucide-react';
import type { Activity } from '../contexts/DataContext';

interface ActivityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
  onEdit?: (activity: Activity) => void;
}

export function ActivityDetailsModal({ isOpen, onClose, activity, onEdit }: ActivityDetailsModalProps) {
  if (!isOpen || !activity) return null;

  // Format description with line breaks
  const formatDescription = (text: string) => {
    if (!text) return '';
    
    // If already HTML, return as is
    if (text.includes('<')) {
      return text;
    }
    
    // Replace newlines with <br> tags
    return text.replace(/\n/g, '<br>');
  };

  // Get resources - match the actual activity data structure
  const resources = [
    { label: 'Video', url: activity.videoLink, icon: Video, color: 'text-red-600 bg-red-50 border-red-200', type: 'video' },
    { label: 'Music', url: activity.musicLink, icon: Music, color: 'text-teal-600 bg-teal-50 border-teal-200', type: 'music' },
    { label: 'Backing', url: activity.backingLink, icon: Volume2, color: 'text-teal-600 bg-teal-50 border-teal-200', type: 'backing' },
    { label: 'Vocals', url: activity.vocalsLink, icon: Volume2, color: 'text-orange-600 bg-orange-50 border-orange-200', type: 'vocals' },
    { label: 'Resource', url: activity.resourceLink, icon: FileText, color: 'text-teal-600 bg-teal-50 border-teal-200', type: 'resource' },
    { label: 'Link', url: activity.link, icon: LinkIcon, color: 'text-gray-600 bg-gray-50 border-gray-200', type: 'link' },
    { label: 'Image', url: activity.imageLink, icon: Image, color: 'text-teal-600 bg-teal-50 border-teal-200', type: 'image' },
  ].filter(resource => resource.url && resource.url.trim());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-card shadow-soft w-full max-w-2xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{activity.activity}</h2>
                <p className="text-teal-100 text-sm">{activity.category}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Activity Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Duration: {activity.time || 0} minutes</span>
            </div>
            
            {activity.yearGroups && activity.yearGroups.length > 0 && (
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Level: {activity.yearGroups.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {activity.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
              <div 
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: formatDescription(activity.description) }}
              />
            </div>
          )}

          {/* Activity Text */}
          {activity.activityText && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Activity Instructions</h3>
              <div 
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: formatDescription(activity.activityText) }}
              />
            </div>
          )}

          {/* Year Groups */}
          {activity.yearGroups && activity.yearGroups.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Year Groups</h3>
              <div className="flex flex-wrap gap-2">
                {activity.yearGroups.map((group, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-teal-100 text-teal-800 text-sm rounded-full"
                  >
                    {group}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          {resources.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Resources</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resources.map((resource, index) => {
                  const IconComponent = resource.icon;
                  
                  // Handle resource click - ensure it opens in browser, not PWA
                  const handleResourceClick = (e: React.MouseEvent, url: string) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Force open in browser window, not PWA context
                    // Use window.open with explicit flags to ensure browser opens it
                    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
                    
                    // Fallback if popup blocked
                    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                      // If popup blocked, try creating a temporary link and clicking it
                      const link = document.createElement('a');
                      link.href = url;
                      link.target = '_blank';
                      link.rel = 'noopener noreferrer';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  };
                  
                  return (
                    <button
                      key={index}
                      onClick={(e) => handleResourceClick(e, resource.url!)}
                      className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md text-left w-full ${resource.color}`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-5 w-5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{resource.label}</p>
                          <p className="text-xs opacity-75 truncate">{resource.url}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 flex-shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          {onEdit && (
            <button
              onClick={() => {
                onEdit(activity);
                onClose();
              }}
              className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors duration-200 flex items-center space-x-2"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
