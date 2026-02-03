import React, { useState } from 'react';
import { Download, X, Check, Tag, Copy, Link2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { LessonPrintModal } from './LessonPrintModal';
import { useShareLesson } from '../hooks/useShareLesson';

interface LessonExporterProps {
  lessonNumber: string;
  onClose: () => void;
}

export function LessonExporter({ lessonNumber, onClose }: LessonExporterProps) {
  const { allLessonsData, currentSheetInfo, lessonStandards } = useData();
  const { shareLesson, isSharing } = useShareLesson();
  const [showStandards, setShowStandards] = useState(true);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const lessonData = allLessonsData[lessonNumber];
  const lessonStandardsList = lessonStandards[lessonNumber] || [];

  if (!lessonData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
        <div className="bg-white rounded-card shadow-soft p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">Lesson data not found for lesson {lessonNumber}.</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total duration
  const totalDuration = lessonData.totalTime;

  // Group EYFS statements by area
  const groupedEyfs: Record<string, string[]> = {};
  lessonStandardsList.forEach(statement => {
    const parts = statement.split(':');
    const area = parts[0].trim();
    const detail = parts.length > 1 ? parts[1].trim() : statement;
    
    if (!groupedEyfs[area]) {
      groupedEyfs[area] = [];
    }
    
    groupedEyfs[area].push(detail);
  });

  // Download PDF via external service (PDFBolt) – no in-app preview
  const handleDownloadPdf = () => {
    setShowPrintModal(true);
  };

  // Copy Link uses external PDF service via useShareLesson (Netlify generate-pdf + upload)
  const handleShare = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const url = await shareLesson(lessonNumber);
    if (url) {
      setShareUrl(url);
      setShareSuccess(true);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Shareable URL copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        alert('Shareable URL copied to clipboard!');
      } catch (err) {
        alert(`Shareable URL: ${text}`);
      }
      document.body.removeChild(textarea);
    }
  };

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-card shadow-soft w-full max-w-md flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Export Lesson Plan</h2>
            <p className="text-sm text-gray-600">
              {lessonData.title || `Lesson ${lessonNumber}`} - {currentSheetInfo.display}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Options - external PDF service only, no preview */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showStandards}
                onChange={() => setShowEyfs(!showStandards)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Include EYFS Standards</span>
            </label>
          </div>
          <div className="flex space-x-3">
              <button
                onClick={handleDownloadPdf}
                disabled={isSharing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 disabled:bg-blue-400"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (!isSharing) {
                    handleShare(e);
                  }
                }}
                disabled={isSharing}
                aria-label="Copy share link to clipboard"
                className={`px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 ${
                  isSharing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSharing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Copying...</span>
                  </>
                ) : shareSuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
            {shareUrl && shareSuccess && (
              <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-teal-900 mb-1">Shareable URL:</p>
                    <p className="text-xs text-teal-700 break-all">{shareUrl}</p>
                  </div>
                  <button
                      onClick={() => copyToClipboard(shareUrl)}
                      className="ml-3 p-2 text-teal-600 hover:text-teal-800 hover:bg-teal-100 rounded-lg transition-colors"
                      title="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    {showPrintModal && (
      <LessonPrintModal
        lessonNumber={lessonNumber}
        onClose={() => { setShowPrintModal(false); onClose(); }}
        autoDownload={true}
      />
    )}
  </>
  );
}
