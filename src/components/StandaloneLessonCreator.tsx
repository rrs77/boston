import React, { useState } from 'react';
import { X, Plus, Trash2, Eye, Music, BookOpen, Target, Link2 } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';

interface StandaloneLessonCreatorProps {
  onSave: (lessonData: any) => void;
  onClose: () => void;
}

export const StandaloneLessonCreator: React.FC<StandaloneLessonCreatorProps> = ({ onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<'main' | 'extended'>('main');
  const [showPreview, setShowPreview] = useState(false);
  
  const [lesson, setLesson] = useState({
    lessonTitle: '',
    lessonName: '',
    duration: 60,
    learningOutcome: '',
    successCriteria: '',
    introduction: '',
    mainActivity: '',
    plenary: '',
    vocabulary: '',
    keyQuestions: '',
    resources: '',
    differentiation: '',
    assessment: '',
    videoLink: '',
    resourceLink: '',
    imageLink: '',
    additionalLinks: [] as Array<{ url: string; label: string }>,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-resize textareas on mount and when values change
  React.useEffect(() => {
    const textareas = document.querySelectorAll('textarea[name]');
    textareas.forEach((textarea) => {
      const ta = textarea as HTMLTextAreaElement;
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });
  }, [lesson]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLesson((prev) => ({ ...prev, [name]: name === 'duration' ? parseInt(value) || 0 : value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleRichTextChange = (field: string, value: string) => {
    setLesson((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddLink = () => {
    setLesson((prev) => ({
      ...prev,
      additionalLinks: [...prev.additionalLinks, { url: '', label: '' }],
    }));
  };

  const handleRemoveLink = (index: number) => {
    setLesson((prev) => ({
      ...prev,
      additionalLinks: prev.additionalLinks.filter((_, i) => i !== index),
    }));
  };

  const handleLinkChange = (index: number, field: 'url' | 'label', value: string) => {
    setLesson((prev) => ({
      ...prev,
      additionalLinks: prev.additionalLinks.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!lesson.lessonTitle.trim()) newErrors.lessonTitle = 'Lesson title is required';
    if (!lesson.lessonName.trim()) newErrors.lessonName = 'Lesson name is required';
    if (!lesson.duration || lesson.duration <= 0) newErrors.duration = 'Duration must be greater than 0';
    if (!lesson.learningOutcome.trim()) newErrors.learningOutcome = 'Learning outcome is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    console.log('📝 Submit button clicked');
    console.log('📊 Current lesson data:', lesson);
    
    if (!validate()) {
      console.log('❌ Validation failed');
      return;
    }

    console.log('✅ Validation passed');

    const lessonData = {
      title: lesson.lessonTitle,
      lessonName: lesson.lessonName,
      totalTime: lesson.duration,
      type: 'standalone',
      createdAt: new Date().toISOString(),
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
      grouped: {},
      categoryOrder: [],
      orderedActivities: []
    };

    console.log('💾 Calling onSave with:', lessonData);
    onSave(lessonData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600">
          <div className="flex items-center space-x-3">
            <Music className="h-6 w-6 text-white" />
            <h2 className="text-xl font-bold text-white">Create Lesson Plan</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('main')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'main'
                ? 'text-teal-600 border-b-2 border-teal-600 bg-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Key Information</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('extended')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'extended'
                ? 'text-teal-600 border-b-2 border-teal-600 bg-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Extended Details</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'main' ? (
            <div className="p-6 space-y-6">
              {/* Basic Information Card */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <BookOpen className="h-5 w-5 text-teal-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Lesson Title (for card) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lessonTitle"
                      value={lesson.lessonTitle}
                      onChange={handleChange}
                      className={`w-full h-10 px-3 border ${errors.lessonTitle ? 'border-red-500' : 'border-gray-300'} rounded-lg text-sm bg-white`}
                      placeholder="e.g., Musical Rhythms"
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
                      className={`w-full h-10 px-3 border ${errors.lessonName ? 'border-red-500' : 'border-gray-300'} rounded-lg text-sm bg-white`}
                      placeholder="e.g., Exploring Tempo"
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
                      className={`w-full h-10 px-3 border ${errors.duration ? 'border-red-500' : 'border-gray-300'} rounded-lg text-sm bg-white`}
                      placeholder="60"
                      min="0"
                    />
                    {errors.duration && (
                      <p className="mt-1 text-xs text-red-500">{errors.duration}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Learning Objectives Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <Target className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Learning Objectives</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Learning Outcome <span className="text-red-500">*</span>
                    </label>
                    <div className="bg-white rounded-lg border border-gray-300">
                      <RichTextEditor
                        value={lesson.learningOutcome}
                        onChange={(value) => handleRichTextChange('learningOutcome', value)}
                        placeholder="Students will be able to identify and perform different musical tempos (e.g., adagio, andante, allegro)"
                      />
                    </div>
                    {errors.learningOutcome && (
                      <p className="mt-1 text-xs text-red-500">{errors.learningOutcome}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Success Criteria
                    </label>
                    <div className="bg-white rounded-lg border border-gray-300">
                      <RichTextEditor
                        value={lesson.successCriteria}
                        onChange={(value) => handleRichTextChange('successCriteria', value)}
                        placeholder="• Students can clap rhythms at different tempos • Can identify tempo changes when listening • Can explain the difference between fast and slow tempo"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Introduction Card */}
              <div className={`bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg transition-all duration-300 ${lesson.introduction ? 'p-5' : 'p-4'}`}>
                <div className="flex items-center space-x-2 mb-3">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  <h3 className="text-base font-semibold text-gray-900">Introduction/Context</h3>
                </div>
                {lesson.introduction || true ? (
                  <textarea
                    name="introduction"
                    value={lesson.introduction}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                    style={{ height: lesson.introduction ? 'auto' : '60px', minHeight: '60px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                    placeholder="Warm-up: Sing familiar song at normal tempo, then experiment with different speeds"
                  />
                ) : null}
              </div>

              {/* Main Activity Card */}
              <div className={`bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg transition-all duration-300 ${lesson.mainActivity ? 'p-5' : 'p-4'}`}>
                <div className="flex items-center space-x-2 mb-3">
                  <Music className="h-5 w-5 text-green-600" />
                  <h3 className="text-base font-semibold text-gray-900">Main Activity</h3>
                </div>
                {lesson.mainActivity || true ? (
                  <div className="bg-white rounded-lg border border-gray-300">
                    <RichTextEditor
                      value={lesson.mainActivity}
                      onChange={(value) => handleRichTextChange('mainActivity', value)}
                      placeholder="Describe the main activity in detail. For music: Include instrumental work, singing, movement, listening activities, and performance elements."
                    />
                  </div>
                ) : null}
              </div>

              {/* Plenary Card */}
              <div className={`bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg transition-all duration-300 ${lesson.plenary ? 'p-5' : 'p-4'}`}>
                <div className="flex items-center space-x-2 mb-3">
                  <Target className="h-5 w-5 text-orange-600" />
                  <h3 className="text-base font-semibold text-gray-900">Plenary/Conclusion</h3>
                </div>
                {lesson.plenary || true ? (
                  <textarea
                    name="plenary"
                    value={lesson.plenary}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                    style={{ height: lesson.plenary ? 'auto' : '60px', minHeight: '60px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                    placeholder="Performance: Groups perform their pieces at chosen tempos, class discusses effectiveness"
                  />
                ) : null}
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-5">
              {/* Extended Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lesson.vocabulary || true ? (
                  <div className={`bg-gray-50 border border-gray-200 rounded-lg transition-all duration-300 ${lesson.vocabulary ? 'p-4' : 'p-3'}`}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vocabulary
                    </label>
                    <textarea
                      name="vocabulary"
                      value={lesson.vocabulary}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                      style={{ height: lesson.vocabulary ? 'auto' : '60px', minHeight: '60px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      placeholder="Tempo, Adagio, Andante, Allegro, Beat, Rhythm"
                    />
                  </div>
                ) : null}

                {lesson.keyQuestions || true ? (
                  <div className={`bg-gray-50 border border-gray-200 rounded-lg transition-all duration-300 ${lesson.keyQuestions ? 'p-4' : 'p-3'}`}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key Questions
                    </label>
                    <textarea
                      name="keyQuestions"
                      value={lesson.keyQuestions}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                      style={{ height: lesson.keyQuestions ? 'auto' : '60px', minHeight: '60px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      placeholder="How does tempo affect the mood? What happens when we play faster/slower?"
                    />
                  </div>
                ) : null}

                {lesson.resources || true ? (
                  <div className={`bg-gray-50 border border-gray-200 rounded-lg transition-all duration-300 ${lesson.resources ? 'p-4' : 'p-3'}`}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resources
                    </label>
                    <textarea
                      name="resources"
                      value={lesson.resources}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                      style={{ height: lesson.resources ? 'auto' : '60px', minHeight: '60px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      placeholder="Percussion instruments, metronome, audio player, tempo cards"
                    />
                  </div>
                ) : null}

                {lesson.assessment || true ? (
                  <div className={`bg-gray-50 border border-gray-200 rounded-lg transition-all duration-300 ${lesson.assessment ? 'p-4' : 'p-3'}`}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assessment
                    </label>
                    <textarea
                      name="assessment"
                      value={lesson.assessment}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                      style={{ height: lesson.assessment ? 'auto' : '60px', minHeight: '60px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      placeholder="Observe: Can students match tempo? Do they understand terminology?"
                    />
                  </div>
                ) : null}
              </div>

              {lesson.differentiation || true ? (
                <div className={`bg-gray-50 border border-gray-200 rounded-lg transition-all duration-300 ${lesson.differentiation ? 'p-4' : 'p-3'}`}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Differentiation
                  </label>
                  <textarea
                    name="differentiation"
                    value={lesson.differentiation}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                    style={{ height: lesson.differentiation ? 'auto' : '80px', minHeight: '80px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                    placeholder="Support: Use visual tempo indicators, simplified patterns. Extension: Compose using multiple tempo changes"
                  />
                </div>
              ) : null}

              {/* Web Links Card */}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <Link2 className="h-5 w-5 text-cyan-600" />
                  <h3 className="text-base font-semibold text-gray-900">Web Links & Resources</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Video Link
                    </label>
                    <input
                      type="url"
                      name="videoLink"
                      value={lesson.videoLink}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                      placeholder="https://youtube.com/..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Resource Link
                    </label>
                    <input
                      type="url"
                      name="resourceLink"
                      value={lesson.resourceLink}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Image Link
                    </label>
                    <input
                      type="url"
                      name="imageLink"
                      value={lesson.imageLink}
                      onChange={handleChange}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Additional Links */}
                {lesson.additionalLinks.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {lesson.additionalLinks.map((link, index) => (
                      <div key={index} className="grid grid-cols-[1fr_auto_auto] gap-2">
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                          className="h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white"
                          placeholder="https://..."
                        />
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => handleLinkChange(index, 'label', e.target.value)}
                          className="h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white w-40"
                          placeholder="Label"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(index)}
                          className="h-10 px-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddLink}
                  className="flex items-center space-x-2 px-3 py-2 text-teal-600 hover:bg-teal-50 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Link</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-2 px-4 py-2 text-teal-600 hover:bg-teal-50 rounded-lg text-sm font-medium transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span>Preview Card</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 text-sm font-medium transition-all shadow-sm"
            >
              Create Lesson
            </button>
          </div>
        </div>

        {/* Preview Modal (Simple placeholder) */}
        {showPreview && (
          <div className="absolute inset-4 bg-white rounded-lg shadow-2xl border-2 border-teal-500 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-sm">
                <h4 className="text-lg font-bold text-gray-900 mb-2">{lesson.lessonTitle || 'Lesson Title'}</h4>
                <p className="text-sm text-gray-600 mb-1">{lesson.lessonName || 'Lesson Name'}</p>
                <p className="text-xs text-gray-500">{lesson.duration} minutes</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
