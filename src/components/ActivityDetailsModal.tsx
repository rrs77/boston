import React, { useState } from 'react';
import { X, Clock, Video, Music, FileText, Link as LinkIcon, Image, Volume2, Tag, Users, ExternalLink, Edit3, Palette } from 'lucide-react';
import type { Activity } from '../contexts/DataContext';
import { ResourceViewer } from './ResourceViewer';

interface ActivityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
  onEdit?: (activity: Activity) => void;
}

export function ActivityDetailsModal({ isOpen, onClose, activity, onEdit }: ActivityDetailsModalProps) {
  const [selectedResource, setSelectedResource] = useState<{ url: string; title: string; type: string } | null>(null);
  
  if (!isOpen || !activity) {
    console.log('ActivityDetailsModal: Not rendering', { isOpen, hasActivity: !!activity });
    return null;
  }
  
  console.log('ActivityDetailsModal: Rendering', { 
    activityName: activity.activity, 
    category: activity.category,
    hasDescription: !!activity.description,
    hasActivityText: !!activity.activityText,
    hasResources: !!(activity.videoLink || activity.musicLink || activity.backingLink || activity.resourceLink || activity.link || activity.imageLink || activity.canvaLink)
  });

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
    { label: 'Canva', url: activity.canvaLink, icon: Palette, color: 'text-indigo-600 bg-indigo-50 border-indigo-200', type: 'canva' },
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
          </div>

          {/* Year Groups - Moved to top */}
          {activity.yearGroups && activity.yearGroups.length > 0 && (
            (() => {
              // Filter out "All" and empty values from year groups
              const validYearGroups = activity.yearGroups.filter(
                group => group && group.trim() !== '' && group.toLowerCase() !== 'all'
              );
              
              // Only show section if there are valid year groups
              if (validYearGroups.length === 0) return null;
              
              return (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Year Groups</h3>
                  <div className="flex flex-wrap gap-2">
                    {validYearGroups.map((group, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-teal-100 text-teal-800 text-sm rounded-full"
                      >
                        {group}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()
          )}
          
          {/* Fallback message if no content */}
          {(() => {
            // Check if there are valid year groups (excluding "All")
            const validYearGroups = activity.yearGroups?.filter(
              group => group && group.trim() !== '' && group.toLowerCase() !== 'all'
            ) || [];
            
            if (!activity.description && !activity.activityText && resources.length === 0 && validYearGroups.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  <Tag className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Activity Details</p>
                  <p className="text-sm">No additional information available for this activity.</p>
                </div>
              );
            }
            return null;
          })()}

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

          {/* Resources */}
          {resources.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Resources</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resources.map((resource, index) => {
                  const IconComponent = resource.icon;
                  
                  // Handle resource click - open in ResourceViewer modal
                  const handleResourceClick = (e: React.MouseEvent, url: string, type: string) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Open all resources in modal
                    setSelectedResource({
                      url: url,
                      title: `${activity.activity} - ${resource.label}`,
                      type: type
                    });
                  };
                  
                  return (
                    <button
                      key={index}
                      onClick={(e) => handleResourceClick(e, resource.url!, resource.type)}
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
      
      {/* ResourceViewer Modal */}
      {selectedResource && (
        <ResourceViewer
          url={selectedResource.url}
          title={selectedResource.title}
          type={selectedResource.type}
          onClose={() => setSelectedResource(null)}
        />
      )}
    </div>
  );
}
