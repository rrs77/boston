import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Link as LinkIcon, Eye, Music, BookOpen, Target, Link2 } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';

interface StandaloneLessonCreatorProps {
  onClose: () => void;
  onSave: (lessonData: any) => void;
}

export function StandaloneLessonCreator({ onClose, onSave }: StandaloneLessonCreatorProps) {
  const [activeTab, setActiveTab] = useState<'essentials' | 'support' | 'assessment' | 'links'>('essentials');
  const [showPreview, setShowPreview] = useState(false);
  
  const [lesson, setLesson] = useState({
    lessonTitle: '',
    lessonName: '',
    duration: 0,
    learningOutcome: '',
    successCriteria: '',
    introduction: '',
    mainActivity: '',
    vocabulary: '',
    differentiation: '',
    assessment: '',
    plenary: '',
    resources: '',
    keyQuestions: '',
    videoLink: '',
    resourceLink: '',
    imageLink: '',
    additionalLinks: [] as { url: string; label: string }[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLesson(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleRichTextChange = (field: string, value: string) => {
    setLesson(prev => ({ ...prev, [field]: value }));
  };

  const handleAddLink = () => {
    setLesson(prev => ({
      ...prev,
      additionalLinks: [...prev.additionalLinks, { url: '', label: '' }]
    }));
  };

  const handleRemoveLink = (index: number) => {
    setLesson(prev => ({
      ...prev,
      additionalLinks: prev.additionalLinks.filter((_, i) => i !== index)
    }));
  };

  const handleLinkChange = (index: number, field: 'url' | 'label', value: string) => {
    setLesson(prev => ({
      ...prev,
      additionalLinks: prev.additionalLinks.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!lesson.lessonTitle.trim()) {
      newErrors.lessonTitle = 'Lesson title is required';
    }
    if (!lesson.lessonName.trim()) {
      newErrors.lessonName = 'Lesson name is required';
    }
    if (lesson.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }
    if (!lesson.learningOutcome.trim()) {
      newErrors.learningOutcome = 'Learning outcome is required';
    }
    if (!lesson.mainActivity.trim()) {
      newErrors.mainActivity = 'Main activity is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    const lessonData = {
      title: lesson.lessonTitle, // Use lessonTitle for the card display
      lessonName: lesson.lessonName,
      totalTime: lesson.duration,
      type: 'standalone', // Mark as standalone lesson (not activity-based)
      createdAt: new Date().toISOString(),
      // Include all the lesson content
      learningOutcome: lesson.learningOutcome,
      successCriteria: lesson.successCriteria,
      introduction: lesson.introduction,
      mainActivity: lesson.mainActivity,
      plenary: lesson.plenary,
      vocabulary: lesson.vocabulary,
      keyQuestions: lesson.keyQuestions,
      resources: lesson.resources,
      differentiation: lesson.differentiation,
      assessment: lesson.assessment,
      videoLink: lesson.videoLink,
      resourceLink: lesson.resourceLink,
      imageLink: lesson.imageLink,
      additionalLinks: lesson.additionalLinks,
      // Add empty arrays/objects for compatibility with lesson library card
      grouped: {}, // Standalone lessons don't have grouped activities
      categoryOrder: [],
      orderedActivities: []
    };

    onSave(lessonData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100] overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600">
          <h2 className="text-xl font-bold text-white">Create Lesson Plan</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Sticky Basic Information */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 pt-6 pb-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Lesson Title (for card) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lessonTitle"
                  value={lesson.lessonTitle}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.lessonTitle ? 'border-red-500' : 'border-gray-300'} rounded-lg text-sm`}
                  placeholder="e.g., Exploring Fractions"
                />
                {errors.lessonTitle && (
                  <p className="mt-1 text-xs text-red-500">{errors.lessonTitle}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Lesson Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lessonName"
                  value={lesson.lessonName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.lessonName ? 'border-red-500' : 'border-gray-300'} rounded-lg text-sm`}
                  placeholder="e.g., Introduction to Halves and Quarters"
                />
                {errors.lessonName && (
                  <p className="mt-1 text-xs text-red-500">{errors.lessonName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Duration (mins) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="duration"
                  value={lesson.duration || ''}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.duration ? 'border-red-500' : 'border-gray-300'} rounded-lg text-sm`}
                  placeholder="60"
                  min="0"
                />
                {errors.duration && (
                  <p className="mt-1 text-xs text-red-500">{errors.duration}</p>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Form Sections */}
          <div className="px-6 pb-6 space-y-5 mt-4">
            {/* Learning Objectives - Expanded with Rich Text */}
            <div className="border border-teal-200 rounded-lg p-5 bg-teal-50">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Learning Objectives</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Learning Outcome <span className="text-red-500">*</span>
                  </label>
                  <RichTextEditor
                    value={lesson.learningOutcome}
                    onChange={(value) => handleRichTextChange('learningOutcome', value)}
                    placeholder="What will students learn by the end of this lesson? Be specific about knowledge, skills, or understanding."
                  />
                  {errors.learningOutcome && (
                    <p className="mt-1 text-xs text-red-500">{errors.learningOutcome}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Success Criteria
                  </label>
                  <RichTextEditor
                    value={lesson.successCriteria}
                    onChange={(value) => handleRichTextChange('successCriteria', value)}
                    placeholder="How will you know students have achieved the learning outcome? List measurable criteria."
                  />
                </div>
              </div>
            </div>

            {/* Lesson Content */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Lesson Content</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Introduction/Starter
                  </label>
                  <textarea
                    value={lesson.introduction}
                    onChange={(e) => handleRichTextChange('introduction', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                    placeholder="How will you engage students?"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Main Activity <span className="text-red-500">*</span>
                  </label>
                  <RichTextEditor
                    value={lesson.mainActivity}
                    onChange={(value) => handleRichTextChange('mainActivity', value)}
                    placeholder="Detailed instructions for the main teaching activity"
                  />
                  {errors.mainActivity && (
                    <p className="mt-1 text-xs text-red-500">{errors.mainActivity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Plenary/Conclusion
                  </label>
                  <textarea
                    value={lesson.plenary}
                    onChange={(e) => handleRichTextChange('plenary', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                    placeholder="How will you review learning?"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Teaching Support */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Teaching Support</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Key Vocabulary
                  </label>
                  <textarea
                    value={lesson.vocabulary}
                    onChange={(e) => handleRichTextChange('vocabulary', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                    placeholder="e.g., fraction, half, quarter"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Key Questions
                  </label>
                  <textarea
                    value={lesson.keyQuestions}
                    onChange={(e) => handleRichTextChange('keyQuestions', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                    placeholder="Questions to check understanding"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Resources Needed
                  </label>
                  <textarea
                    value={lesson.resources}
                    onChange={(e) => handleRichTextChange('resources', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                    placeholder="Materials and equipment"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Differentiation & Assessment */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Differentiation & Assessment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Differentiation
                  </label>
                  <textarea
                    value={lesson.differentiation}
                    onChange={(e) => handleRichTextChange('differentiation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                    placeholder="Adaptations for different abilities"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Assessment Strategies
                  </label>
                  <textarea
                    value={lesson.assessment}
                    onChange={(e) => handleRichTextChange('assessment', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                    placeholder="How will you assess learning?"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Web Links & Resources */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Web Links & Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Video Link
                  </label>
                  <input
                    type="url"
                    name="videoLink"
                    value={lesson.videoLink}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Resource Link
                  </label>
                  <input
                    type="url"
                    name="resourceLink"
                    value={lesson.resourceLink}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Image Link
                  </label>
                  <input
                    type="url"
                    name="imageLink"
                    value={lesson.imageLink}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Additional Links */}
              {lesson.additionalLinks.length > 0 && (
                <div className="mt-3 space-y-2">
                  {lesson.additionalLinks.map((link, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs"
                        placeholder="https://..."
                      />
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => handleLinkChange(index, 'label', e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs"
                        placeholder="Link label"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(index)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                type="button"
                onClick={handleAddLink}
                className="mt-2 flex items-center space-x-1 px-2 py-1 text-teal-600 hover:bg-teal-50 rounded text-xs font-medium transition-colors duration-200"
              >
                <Plus className="h-3 w-3" />
                <span>Add Link</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 px-6 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            Create Lesson
          </button>
        </div>
      </div>
    </div>
  );
}

