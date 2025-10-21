import React, { useState, useRef, useEffect } from 'react';
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
import { useSettings } from '../contexts/SettingsContextNew';
import { RichTextEditor } from './RichTextEditor';
import { SimpleNestedCategoryDropdown } from './SimpleNestedCategoryDropdown';
import { customObjectivesApi } from '../config/customObjectivesApi';
import { CustomObjectivesSelector } from './CustomObjectivesSelector';
import type { CustomObjectiveYearGroup } from '../types/customObjectives';

interface ActivityCreatorProps {
  onClose: () => void;
  onSave: (activity: any) => void;
  categories: string[];
  levels: string[];
}

export function ActivityCreator({ onClose, onSave, categories, levels }: ActivityCreatorProps) {
  const { categories: allCategories, customYearGroups } = useSettings();
  const [activity, setActivity] = useState({
    activity: '',
    description: '',
    activityText: '', // New field for activity text
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
    yearGroups: [] as string[], // New field for multiple year groups
    curriculum_type: 'EYFS' as 'EYFS' | 'CUSTOM', // New field for curriculum type
    custom_objective_year_group_id: '', // New field for custom objectives year group
    custom_objective_ids: [] as string[], // New field for selected custom objectives
    unitName: '',
    lessonNumber: '',
    teachingUnit: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Custom objectives state
  const [customObjectiveYearGroups, setCustomObjectiveYearGroups] = useState<CustomObjectiveYearGroup[]>([]);
  const [loadingCustomYearGroups, setLoadingCustomYearGroups] = useState(false);

  // Load custom objective year groups
  useEffect(() => {
    loadCustomObjectiveYearGroups();
  }, []);

  const loadCustomObjectiveYearGroups = async () => {
    setLoadingCustomYearGroups(true);
    try {
      const data = await customObjectivesApi.yearGroups.getAll();
      setCustomObjectiveYearGroups(data);
    } catch (error) {
      console.error('Failed to load custom objective year groups:', error);
    } finally {
      setLoadingCustomYearGroups(false);
    }
  };

  // Dynamic level options based on year groups
  const simplifiedLevels = ['All', ...customYearGroups.map(group => group.name)];

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

  const handleYearGroupChange = (yearGroup: string, checked: boolean) => {
    setActivity(prev => ({
      ...prev,
      yearGroups: checked 
        ? [...prev.yearGroups, yearGroup]
        : prev.yearGroups.filter(g => g !== yearGroup)
    }));
  };

  const handleCurriculumTypeChange = (curriculumType: 'EYFS' | 'CUSTOM') => {
    setActivity(prev => ({
      ...prev,
      curriculum_type: curriculumType,
      custom_objective_year_group_id: curriculumType === 'CUSTOM' ? prev.custom_objective_year_group_id : '',
      custom_objective_ids: curriculumType === 'CUSTOM' ? prev.custom_objective_ids : []
    }));
  };

  const handleCustomObjectiveYearGroupChange = (yearGroupId: string) => {
    setActivity(prev => ({
      ...prev,
      custom_objective_year_group_id: yearGroupId,
      custom_objective_ids: [] // Reset selected objectives when year group changes
    }));
  };

  const handleCustomObjectivesChange = (objectiveIds: string[]) => {
    setActivity(prev => ({
      ...prev,
      custom_objective_ids: objectiveIds
    }));
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
    
    if (activity.yearGroups.length === 0) {
      newErrors.yearGroups = 'At least one year group is required';
    }

    // Custom objectives validation
    // Custom objectives validation removed - now optional with unified selector
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Set teachingUnit to match category if not specified
      // Set level to first year group for backward compatibility
      const newActivity = {
        ...activity,
        teachingUnit: activity.teachingUnit || activity.category,
        level: activity.yearGroups[0] || 'All' // Use first year group for backward compatibility
      };
      
      onSave(newActivity);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 text-white" style={{ background: 'linear-gradient(135deg, #0BA596 0%, #0BA596 100%)' }}>
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
                  className={`w-full px-4 py-3 border ${errors.activity ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:border-transparent`}
                  style={{ '--tw-ring-color': '#0BA596' } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = '#0BA596'}
                  onBlur={(e) => e.target.style.borderColor = errors.activity ? '#EF4444' : '#D1D5DB'}
                  placeholder="Enter activity name"
                  dir="ltr"
                />
                {errors.activity && (
                  <p className="mt-1 text-sm text-red-500">{errors.activity}</p>
                )}
              </div>

              {/* Curriculum Type - REMOVED: Now all objectives are shown together */}

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className={`border-2 rounded-lg ${errors.category ? 'border-red-500' : 'border-gray-300'} focus-within:border-gray-400 transition-colors duration-200`}
                     style={{ 
                       borderColor: errors.category ? '#EF4444' : '#D1D5DB',
                       '--tw-ring-color': '#0BA596'
                     } as React.CSSProperties}>
                  <SimpleNestedCategoryDropdown
                    selectedCategory={activity.category}
                    onCategoryChange={(category) => setActivity(prev => ({ ...prev, category }))}
                    placeholder="Select a category"
                    className="px-4 py-3 text-sm font-medium w-full bg-white"
                    dropdownBackgroundColor="#F0FDFA"
                  />
                </div>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                )}
              </div>

              {/* Year Groups - Multi-select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Year Groups <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {customYearGroups.map(group => (
                    <label key={group.name} className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 ${
                      activity.yearGroups.includes(group.name)
                        ? 'shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-25'
                    }`}
                    style={{
                      borderColor: activity.yearGroups.includes(group.name) ? '#0BA596' : '#E5E7EB',
                      backgroundColor: activity.yearGroups.includes(group.name) ? '#E6F7F5' : undefined
                    }}>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={activity.yearGroups.includes(group.name)}
                          onChange={(e) => handleYearGroupChange(group.name, e.target.checked)}
                          className="h-5 w-5 border-gray-300 rounded"
                          style={{ accentColor: '#0BA596' }}
                        />
                      </div>
                      <div 
                        className="w-6 h-6 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
                        style={{ backgroundColor: group.color || '#14B8A6' }}
                      ></div>
                      <span className={`text-sm font-medium ${
                        activity.yearGroups.includes(group.name) 
                          ? 'font-medium' 
                          : 'text-gray-700'
                      }`}>
                        {group.name}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.yearGroups && (
                  <p className="mt-2 text-sm text-red-500 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.yearGroups}
                  </p>
                )}
              </div>

              {/* Objectives Selector - Now shows all objectives (EYFS + Custom) together */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Objectives
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Choose from EYFS objectives or custom year group objectives below
                </p>
                {/* TODO: Create a unified objectives selector that shows EYFS + all custom objectives */}
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                  Unified objectives selector coming soon
                </div>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#0BA596' } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = '#0BA596'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#0BA596' } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = '#0BA596'}
                  onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
                  placeholder="Enter unit name (optional)"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <RichTextEditor
                value={activity.description}
                onChange={(value) => setActivity(prev => ({ ...prev, description: value }))}
                placeholder="Enter activity description..."
                minHeight="150px"
              />
            </div>

            {/* Activity Text - NEW FIELD */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity
              </label>
              <RichTextEditor
                value={activity.activityText}
                onChange={(value) => setActivity(prev => ({ ...prev, activityText: value }))}
                placeholder="Enter activity instructions..."
                minHeight="100px"
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
                      className="px-3 py-2 text-white text-sm font-medium rounded-lg flex items-center space-x-1"
                      style={{ backgroundColor: '#0BA596' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#0A9688'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#0BA596'}
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm"
                      style={{ '--tw-ring-color': '#0BA596' } as React.CSSProperties}
                      onFocus={(e) => e.target.style.borderColor = '#0BA596'}
                      onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
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
                  { key: 'videoLink', label: 'Video URL', icon: Video },
                  { key: 'musicLink', label: 'Music URL', icon: Music },
                  { key: 'backingLink', label: 'Backing Track URL', icon: Volume2 },
                  { key: 'resourceLink', label: 'Resource URL', icon: FileText },
                  { key: 'link', label: 'Additional Link', icon: LinkIcon },
                  { key: 'vocalsLink', label: 'Vocals URL', icon: Volume2 },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <input
                      type="url"
                      name={key}
                      value={activity[key as keyof typeof activity] as string}
                      onChange={handleChange}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={label}
                      dir="ltr"
                    />
                  </div>
                ))}
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
              className="px-6 py-3 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              style={{ backgroundColor: '#0BA596' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0A9688'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#0BA596'}
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