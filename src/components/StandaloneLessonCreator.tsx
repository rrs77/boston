import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';

interface StandaloneLessonCreatorProps {
  onClose: () => void;
  onSave: (lessonData: any) => void;
}

export function StandaloneLessonCreator({ onClose, onSave }: StandaloneLessonCreatorProps) {
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
      ...lesson,
      type: 'standalone', // Mark as standalone lesson (not activity-based)
      createdAt: new Date().toISOString()
    };

    onSave(lessonData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600">
          <h2 className="text-2xl font-bold text-white">Create Lesson Plan</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lesson Title (for card) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lessonTitle"
                    value={lesson.lessonTitle}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border ${errors.lessonTitle ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                    placeholder="e.g., Exploring Fractions"
                  />
                  {errors.lessonTitle && (
                    <p className="mt-1 text-sm text-red-500">{errors.lessonTitle}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lesson Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lessonName"
                    value={lesson.lessonName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border ${errors.lessonName ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                    placeholder="e.g., Introduction to Halves and Quarters"
                  />
                  {errors.lessonName && (
                    <p className="mt-1 text-sm text-red-500">{errors.lessonName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={lesson.duration || ''}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border ${errors.duration ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                    placeholder="60"
                    min="0"
                  />
                  {errors.duration && (
                    <p className="mt-1 text-sm text-red-500">{errors.duration}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Learning Objectives */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Objectives</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Learning Outcome <span className="text-red-500">*</span>
                  </label>
                  <RichTextEditor
                    value={lesson.learningOutcome}
                    onChange={(value) => handleRichTextChange('learningOutcome', value)}
                    placeholder="What will students learn by the end of this lesson?"
                  />
                  {errors.learningOutcome && (
                    <p className="mt-1 text-sm text-red-500">{errors.learningOutcome}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Success Criteria
                  </label>
                  <RichTextEditor
                    value={lesson.successCriteria}
                    onChange={(value) => handleRichTextChange('successCriteria', value)}
                    placeholder="How will you know students have achieved the learning outcome?"
                  />
                </div>
              </div>
            </div>

            {/* Lesson Content */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lesson Content</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Introduction/Starter
                  </label>
                  <RichTextEditor
                    value={lesson.introduction}
                    onChange={(value) => handleRichTextChange('introduction', value)}
                    placeholder="How will you engage students and introduce the topic?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Activity <span className="text-red-500">*</span>
                  </label>
                  <RichTextEditor
                    value={lesson.mainActivity}
                    onChange={(value) => handleRichTextChange('mainActivity', value)}
                    placeholder="Detailed instructions for the main teaching activity"
                  />
                  {errors.mainActivity && (
                    <p className="mt-1 text-sm text-red-500">{errors.mainActivity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plenary/Conclusion
                  </label>
                  <RichTextEditor
                    value={lesson.plenary}
                    onChange={(value) => handleRichTextChange('plenary', value)}
                    placeholder="How will you review learning and consolidate understanding?"
                  />
                </div>
              </div>
            </div>

            {/* Teaching Support */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Teaching Support</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Vocabulary
                  </label>
                  <RichTextEditor
                    value={lesson.vocabulary}
                    onChange={(value) => handleRichTextChange('vocabulary', value)}
                    placeholder="Important words and terminology for this lesson"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Questions
                  </label>
                  <RichTextEditor
                    value={lesson.keyQuestions}
                    onChange={(value) => handleRichTextChange('keyQuestions', value)}
                    placeholder="Questions to assess understanding and promote thinking"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resources Needed
                  </label>
                  <RichTextEditor
                    value={lesson.resources}
                    onChange={(value) => handleRichTextChange('resources', value)}
                    placeholder="Materials, equipment, or resources required"
                  />
                </div>
              </div>
            </div>

            {/* Differentiation & Assessment */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Differentiation & Assessment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Differentiation
                  </label>
                  <RichTextEditor
                    value={lesson.differentiation}
                    onChange={(value) => handleRichTextChange('differentiation', value)}
                    placeholder="How will you adapt this lesson for different ability levels?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assessment Strategies
                  </label>
                  <RichTextEditor
                    value={lesson.assessment}
                    onChange={(value) => handleRichTextChange('assessment', value)}
                    placeholder="How will you assess student learning during and after the lesson?"
                  />
                </div>
              </div>
            </div>

            {/* Web Links & Resources */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Web Links & Resources</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video Link
                  </label>
                  <input
                    type="url"
                    name="videoLink"
                    value={lesson.videoLink}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resource Link
                  </label>
                  <input
                    type="url"
                    name="resourceLink"
                    value={lesson.resourceLink}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Link
                  </label>
                  <input
                    type="url"
                    name="imageLink"
                    value={lesson.imageLink}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    placeholder="https://..."
                  />
                </div>

                {/* Additional Links */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Additional Links
                    </label>
                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="flex items-center space-x-1 px-3 py-1 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-lg text-sm transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Link</span>
                    </button>
                  </div>
                  
                  {lesson.additionalLinks.map((link, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="https://..."
                      />
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => handleLinkChange(index, 'label', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Link label"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            Create Lesson
          </button>
        </div>
      </div>
    </div>
  );
}

