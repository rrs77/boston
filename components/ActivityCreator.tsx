import React, { useState, useRef } from 'react';
import { 
  Tag, 
  Plus, 
  Save, 
  X, 
  Edit3, 
  Type,
  Palette,
  Link,
  Image,
  Upload,
  Clock,
  Video,
  Music,
  FileText,
  Link as LinkIcon,
  Volume2
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { RichTextEditor } from './RichTextEditor';

interface ActivityCreatorProps {
  onClose: () => void;
  onSave: (activity: any) => void;
  categories: string[];
  levels: string[];
}

export function ActivityCreator({ onClose, onSave, categories, levels }: ActivityCreatorProps) {
  const { categories: allCategories } = useSettings();
  console.log('🔍 Categories format check:', allCategories);
  console.log('🔍 Is first item an object?', typeof allCategories[0]);
  console.log('🔍 First category structure:', allCategories[0]);
  const [activity, setActivity] = useState({
    activity: '',
    description: '',
    activityText: '', // New field for activity text
    descriptionHeading: 'Introduction/Context', // Editable heading for description
    activityHeading: 'Activity', // Editable heading for activity text
    linkHeading: 'Additional Link', // Editable heading for link field
    time: 0,
    videoLink: '',
    musicLink: '',
    backingLink: '',
    resourceLink: '',
    link: '',
    vocalsLink: '',
    imageLink: '',
    category: '',
    level: '',
    unitName: '',
    lessonNumber: '',
    teachingUnit: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Simplified level options - just the core options without duplicates
  const simplifiedLevels = ['All', 'LKG', 'UKG', 'Reception'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setActivity(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setActivity(prev => ({ ...prev, time: isNaN(value) ? 0 : value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for demo purposes
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setActivity(prev => ({
        ...prev,
        imageLink: imageUrl
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!activity.activity.trim()) {
      newErrors.activity = 'Activity name is required';
    }
    
    if (!activity.category) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Replace the handleSubmit function in ActivityCreator.tsx with this improved version:

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  console.log('🚀 Starting activity creation...');
  console.log('📝 Activity data:', activity);
  
  if (!validateForm()) {
    console.log('❌ Form validation failed');
    return;
  }

  try {
    // Set teachingUnit to match category if not specified
    const newActivity = {
      ...activity,
      teachingUnit: activity.teachingUnit || activity.category,
      // Ensure we have default values for required fields
      description: activity.description || '',
      activityText: activity.activityText || '',
      time: activity.time || 0,
      videoLink: activity.videoLink || '',
      musicLink: activity.musicLink || '',
      backingLink: activity.backingLink || '',
      resourceLink: activity.resourceLink || '',
      link: activity.link || '',
      vocalsLink: activity.vocalsLink || '',
      imageLink: activity.imageLink || '',
      level: activity.level || 'All',
      unitName: activity.unitName || '',
      lessonNumber: activity.lessonNumber || '',
      eyfsStandards: []
    };
    
    console.log('📤 Calling onSave with activity:', newActivity);
    
    // Call the onSave function passed from parent
    await onSave(newActivity);
    
    console.log('✅ Activity creation completed successfully');
    
    // Close the modal
    onClose();
    
  } catch (error) {
    console.error('❌ Activity creation failed:', error);
    
    // Show user-friendly error message
    alert(`Failed to create activity: ${error.message || 'Unknown error'}. Please try again.`);
  }
};
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center space-x-3">
            <Tag className="h-6 w-6" />
            <h2 className="text-xl font-bold">Create New Activity</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Activity Name */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="activity"
                  value={activity.activity}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${errors.activity ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                  placeholder="Enter activity name"
                  dir="ltr"
                />
                {errors.activity && (
                  <p className="mt-1 text-sm text-red-500">{errors.activity}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={activity.category}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border ${errors.category ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                  dir="ltr"
                >
                  <option value="">Select a category</option>
                  {allCategories.map(category => (
                    <option key={category.name} value={category.name}>{category.name}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                )}
              </div>

              {/* Level - Simplified */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
                <select
                  name="level"
                  value={activity.level}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  dir="ltr"
                >
                  <option value="">Select a level</option>
                  <option value="All">All</option>
                  <option value="LKG">LKG</option>
                  <option value="UKG">UKG</option>
                  <option value="Reception">Reception</option>
                  {simplifiedLevels.filter(level => !['All', 'LKG', 'UKG', 'Reception'].includes(level)).map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  name="time"
                  value={activity.time}
                  onChange={handleTimeChange}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter duration in minutes"
                  dir="ltr"
                />
              </div>

              {/* Unit Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Name
                </label>
                <input
                  type="text"
                  name="unitName"
                  value={activity.unitName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter unit name (optional)"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Introduction/Context */}
            <div>
              <div className="mb-3 flex items-center space-x-2">
                <input
                  type="text"
                  value={activity.descriptionHeading}
                  onChange={(e) => setActivity(prev => ({ ...prev, descriptionHeading: e.target.value }))}
                  className="text-base font-semibold text-gray-900 bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 flex-1"
                  placeholder="Enter heading (e.g., Introduction/Context)"
                  style={{ borderBottom: '2px solid transparent' }}
                  onFocus={(e) => e.target.style.borderBottomColor = '#0BA596'}
                  onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
                />
                <Edit3 className="h-4 w-4 text-gray-400 flex-shrink-0" />
              </div>
              <RichTextEditor
                value={activity.description}
                onChange={(value) => setActivity(prev => ({ ...prev, description: value }))}
                placeholder="Enter introduction/context..."
                minHeight="150px"
              />
            </div>

            {/* Activity */}
            <div>
              <div className="mb-3 flex items-center space-x-2">
                <input
                  type="text"
                  value={activity.activityHeading}
                  onChange={(e) => setActivity(prev => ({ ...prev, activityHeading: e.target.value }))}
                  className="text-base font-semibold text-gray-900 bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 flex-1"
                  placeholder="Enter heading (e.g., Activity)"
                  style={{ borderBottom: '2px solid transparent' }}
                  onFocus={(e) => e.target.style.borderBottomColor = '#0BA596'}
                  onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
                />
                <Edit3 className="h-4 w-4 text-gray-400 flex-shrink-0" />
              </div>
              <RichTextEditor
                value={activity.activityText}
                onChange={(value) => setActivity(prev => ({ ...prev, activityText: value }))}
                placeholder="Enter activity instructions..."
                minHeight="150px"
              />
            </div>

            {/* Activity Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Image
              </label>
              <div className="flex items-center space-x-4">
                {activity.imageLink ? (
                  <div className="relative">
                    <img 
                      src={activity.imageLink} 
                      alt="Activity" 
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setActivity(prev => ({ ...prev, imageLink: '' }))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    <Image className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">
                    Upload an image for this activity or provide an image URL
                  </p>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center space-x-1"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload</span>
                    </button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <input
                      type="url"
                      name="imageLink"
                      value={activity.imageLink}
                      onChange={handleChange}
                      placeholder="Or paste image URL"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resources</h3>
              <div className="space-y-4">
                {[
                  { key: 'videoLink', label: 'Video URL', icon: Video, editable: false },
                  { key: 'musicLink', label: 'Music URL', icon: Music, editable: false },
                  { key: 'backingLink', label: 'Backing Track URL', icon: Volume2, editable: false },
                  { key: 'resourceLink', label: 'Resource URL', icon: FileText, editable: false },
                  { key: 'vocalsLink', label: 'Vocals URL', icon: Volume2, editable: false },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <input
                      type="text"
                      name={key}
                      value={activity[key as keyof typeof activity] as string}
                      onChange={handleChange}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={label}
                      dir="ltr"
                    />
                  </div>
                ))}
                
                {/* Custom Link - Moved to bottom with editable heading above */}
                <div>
                  <div className="mb-2 flex items-center space-x-2">
                    <LinkIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <input
                      type="text"
                      value={activity.linkHeading || 'Additional Link'}
                      onChange={(e) => setActivity(prev => ({ ...prev, linkHeading: e.target.value }))}
                      className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 flex-1"
                      placeholder="Enter heading (e.g., Additional Link)"
                      style={{ borderBottom: '2px solid transparent' }}
                      onFocus={(e) => e.target.style.borderBottomColor = '#0BA596'}
                      onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
                    />
                    <Edit3 className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 flex-shrink-0"></div> {/* Spacer to align with other inputs */}
                    <input
                      type="text"
                      name="link"
                      value={activity.link}
                      onChange={handleChange}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Link URL"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>Create Activity</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}