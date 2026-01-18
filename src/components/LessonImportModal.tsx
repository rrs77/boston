import React, { useState } from 'react';
import { X, Upload, FileText, Wand2, Check, AlertTriangle } from 'lucide-react';

interface LessonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (lessonData: ParsedLessonData) => void;
}

export interface ParsedLessonData {
  lessonTitle?: string;
  lessonName?: string;
  duration?: number;
  learningOutcome?: string;
  successCriteria?: string;
  introduction?: string;
  mainActivity?: string;
  plenary?: string;
  vocabulary?: string;
  keyQuestions?: string;
  resources?: string;
  differentiation?: string;
  assessment?: string;
}

// Section markers that can be detected in imported text
const SECTION_MARKERS = {
  lessonTitle: ['lesson title:', 'title:', 'lesson name:'],
  learningOutcome: ['learning outcome:', 'learning outcomes:', 'objectives:', 'objective:', 'lo:', 'learning objective:', 'children will be able to:', 'walt:'],
  successCriteria: ['success criteria:', 'sc:', 'i can:', 'success criterion:', 'wilf:'],
  introduction: ['introduction:', 'intro:', 'starter:', 'hook:', 'engage:'],
  mainActivity: ['main activity:', 'main:', 'activity:', 'activities:', 'explore:', 'development:'],
  plenary: ['plenary:', 'plenary / conclusion:', 'conclusion:', 'review:', 'reflect:'],
  vocabulary: ['vocabulary:', 'vocab:', 'key vocabulary:', 'key words:', 'keywords:', 'key terms:'],
  keyQuestions: ['key questions:', 'questions:', 'key question:', 'discussion questions:'],
  resources: ['resources:', 'materials:', 'equipment:', 'you will need:'],
  differentiation: ['differentiation:', 'support:', 'challenge:', 'scaffolding:', 'sen:', 'extension:'],
  assessment: ['assessment:', 'afl:', 'assessment for learning:', 'how will you assess:', 'evaluation:']
};

export function LessonImportModal({ isOpen, onClose, onImport }: LessonImportModalProps) {
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedLessonData | null>(null);
  const [parseMode, setParseMode] = useState<'auto' | 'manual'>('auto');
  const [formatOptions, setFormatOptions] = useState({
    convertBullets: true,
    wrapParagraphs: true,
    preserveLineBreaks: false,
    detectHeadings: true
  });
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  const formatText = (text: string): string => {
    if (!text) return '';
    
    let formatted = text.trim();
    
    // Convert bullet points
    if (formatOptions.convertBullets) {
      // Convert various bullet formats to HTML list items
      const lines = formatted.split('\n');
      let inList = false;
      const processedLines: string[] = [];
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        const isBullet = /^[-•*]\s+/.test(trimmedLine) || /^\d+[.)]\s+/.test(trimmedLine);
        
        if (isBullet) {
          if (!inList) {
            processedLines.push('<ul>');
            inList = true;
          }
          const content = trimmedLine.replace(/^[-•*]\s+/, '').replace(/^\d+[.)]\s+/, '');
          processedLines.push(`<li>${content}</li>`);
        } else {
          if (inList) {
            processedLines.push('</ul>');
            inList = false;
          }
          if (trimmedLine) {
            if (formatOptions.wrapParagraphs) {
              processedLines.push(`<p>${trimmedLine}</p>`);
            } else {
              processedLines.push(trimmedLine);
            }
          }
        }
      });
      
      if (inList) {
        processedLines.push('</ul>');
      }
      
      formatted = processedLines.join(formatOptions.preserveLineBreaks ? '<br/>' : '');
    } else if (formatOptions.wrapParagraphs) {
      // Just wrap paragraphs
      const paragraphs = formatted.split(/\n\n+/);
      formatted = paragraphs.map(p => `<p>${p.replace(/\n/g, formatOptions.preserveLineBreaks ? '<br/>' : ' ')}</p>`).join('');
    }
    
    return formatted;
  };

  const parseText = () => {
    if (!rawText.trim()) {
      setParsedData(null);
      return;
    }

    const text = rawText.toLowerCase();
    const result: ParsedLessonData = {};

    // Find each section in the text
    const sections: { key: keyof ParsedLessonData; start: number; marker: string }[] = [];

    Object.entries(SECTION_MARKERS).forEach(([key, markers]) => {
      markers.forEach(marker => {
        const index = text.indexOf(marker);
        if (index !== -1) {
          // Only add if we haven't found this section yet, or this marker is earlier
          const existing = sections.find(s => s.key === key);
          if (!existing || index < existing.start) {
            if (existing) {
              sections.splice(sections.indexOf(existing), 1);
            }
            sections.push({ key: key as keyof ParsedLessonData, start: index, marker });
          }
        }
      });
    });

    // Sort sections by position
    sections.sort((a, b) => a.start - b.start);

    // Extract content for each section
    sections.forEach((section, index) => {
      const startPos = section.start + section.marker.length;
      const endPos = index < sections.length - 1 ? sections[index + 1].start : rawText.length;
      const content = rawText.substring(startPos, endPos).trim();
      
      if (content) {
        result[section.key] = formatText(content);
      }
    });

    // If no sections found, put everything in main activity
    if (sections.length === 0 && rawText.trim()) {
      result.mainActivity = formatText(rawText);
    }

    setParsedData(result);
    setShowPreview(true);
  };

  const handleImport = () => {
    if (parsedData) {
      onImport(parsedData);
      onClose();
      setRawText('');
      setParsedData(null);
      setShowPreview(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setRawText(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[130]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700">
          <div className="flex items-center space-x-3">
            <Upload className="h-6 w-6 text-white" />
            <h2 className="text-lg font-bold text-white">Import Lesson Content</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste or type lesson content
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-mono"
                  placeholder={`Paste your lesson plan here...

The importer will detect sections like:
- Learning Outcome: / Objectives:
- Success Criteria: / I can:
- Introduction: / Starter:
- Main Activity: / Activities:
- Plenary: / Conclusion:
- Vocabulary: / Key Words:
- Key Questions:
- Resources: / Materials:
- Differentiation: / Support: / Challenge:
- Assessment:`}
                />
              </div>

              {/* File Upload */}
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Upload .txt file</span>
                  <input
                    type="file"
                    accept=".txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Format Options */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Formatting Options</h4>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formatOptions.convertBullets}
                    onChange={(e) => setFormatOptions(prev => ({ ...prev, convertBullets: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Convert bullet points to lists</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formatOptions.wrapParagraphs}
                    onChange={(e) => setFormatOptions(prev => ({ ...prev, wrapParagraphs: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Wrap text in paragraphs</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formatOptions.preserveLineBreaks}
                    onChange={(e) => setFormatOptions(prev => ({ ...prev, preserveLineBreaks: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Preserve line breaks</span>
                </label>
              </div>

              {/* Parse Button */}
              <button
                onClick={parseText}
                disabled={!rawText.trim()}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Wand2 className="h-5 w-5" />
                <span>Parse & Preview</span>
              </button>
            </div>

            {/* Preview Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Preview Parsed Content</h4>
              
              {!parsedData ? (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-500 text-sm">Paste content and click "Parse & Preview"</p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
                  {Object.entries(parsedData).map(([key, value]) => {
                    if (!value) return null;
                    const labels: Record<string, string> = {
                      lessonTitle: 'Lesson Title',
                      lessonName: 'Lesson Name',
                      learningOutcome: 'Learning Outcome',
                      successCriteria: 'Success Criteria',
                      introduction: 'Introduction',
                      mainActivity: 'Main Activity',
                      plenary: 'Plenary',
                      vocabulary: 'Vocabulary',
                      keyQuestions: 'Key Questions',
                      resources: 'Resources',
                      differentiation: 'Differentiation',
                      assessment: 'Assessment'
                    };
                    return (
                      <div key={key} className="border-b border-gray-200 pb-3 last:border-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-900">{labels[key] || key}</span>
                        </div>
                        <div 
                          className="text-sm text-gray-600 pl-6 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: value as string }}
                        />
                      </div>
                    );
                  })}
                  
                  {Object.keys(parsedData).length === 0 && (
                    <div className="flex items-center space-x-2 text-amber-600">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="text-sm">No sections detected. Content will be added to Main Activity.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Section Guide */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-blue-900 mb-2">Detected Section Markers</h5>
                <div className="text-xs text-blue-700 space-y-1">
                  <p><strong>Learning Outcome:</strong> "Learning Outcome:", "Objectives:", "WALT:"</p>
                  <p><strong>Success Criteria:</strong> "Success Criteria:", "I can:", "WILF:"</p>
                  <p><strong>Main Activity:</strong> "Main Activity:", "Activities:"</p>
                  <p><strong>Resources:</strong> "Resources:", "Materials:", "You will need:"</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!parsedData || Object.keys(parsedData).length === 0}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Import to Lesson</span>
          </button>
        </div>
      </div>
    </div>
  );
}
