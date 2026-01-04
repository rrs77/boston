import React, { useEffect, useRef } from 'react';
import { X, ExternalLink, ArrowLeft } from 'lucide-react';

interface ResourceViewerProps {
  url: string;
  title: string;
  type: string;
  onClose: () => void;
}

export function ResourceViewer({ url, title, type, onClose }: ResourceViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Determine if URL should be embedded in iframe or opened directly
  const canEmbed = (url: string, type: string): boolean => {
    // Canva links can be embedded
    if (type === 'canva' || url.includes('canva.com')) {
      return true;
    }
    
    // PDFs can be embedded
    if (url.toLowerCase().endsWith('.pdf') || url.includes('.pdf')) {
      return true;
    }
    
    // YouTube videos can be embedded
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
      return true;
    }
    
    // Google Drive files can sometimes be embedded
    if (url.includes('drive.google.com')) {
      return true;
    }
    
    // Cloud storage links (like rhythmstix.co.uk) - try to embed
    if (url.includes('cloud.rhythmstix.co.uk') || url.includes('rhythmstix.co.uk')) {
      return true;
    }
    
    return false;
  };

  // Convert YouTube URL to embed format
  const getYouTubeEmbedUrl = (url: string): string => {
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(youtubeRegex);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
  };

  // Convert Canva URL to embed format
  const getCanvaEmbedUrl = (canvaUrl: string): string => {
    if (canvaUrl.includes('/embed/')) {
      return canvaUrl;
    }
    if (canvaUrl.includes('canva.com/design/')) {
      if (!canvaUrl.includes('?')) {
        return `${canvaUrl}?embed`;
      } else if (!canvaUrl.includes('embed')) {
        return `${canvaUrl}&embed`;
      }
    }
    return canvaUrl;
  };

  // Get the appropriate embed URL
  const getEmbedUrl = (): string => {
    if (type === 'canva' || url.includes('canva.com')) {
      return getCanvaEmbedUrl(url);
    }
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return getYouTubeEmbedUrl(url);
    }
    return url;
  };

  const shouldEmbed = canEmbed(url, type);
  const embedUrl = shouldEmbed ? getEmbedUrl() : url;

  // Get resource type label
  const getResourceTypeLabel = (): string => {
    switch (type) {
      case 'video': return 'Video';
      case 'music': return 'Music';
      case 'backing': return 'Backing Track';
      case 'vocals': return 'Vocals';
      case 'resource': return 'Resource';
      case 'link': return 'Link';
      case 'image': return 'Image';
      case 'canva': return 'Canva Design';
      default: return 'Resource';
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[70]"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white z-10">
          <div className="flex items-center space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to CC Designer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{getResourceTypeLabel()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Open in new tab"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-5 w-5" />
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close (ESC)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative" style={{ height: 'calc(100vh - 120px)' }}>
          {shouldEmbed ? (
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              allow="fullscreen"
              allowFullScreen
              title={title}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="text-center max-w-2xl">
                <p className="text-gray-600 mb-4">This resource cannot be embedded. Click the button below to open it in a new tab.</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
                >
                  <ExternalLink className="h-5 w-5" />
                  <span>Open {getResourceTypeLabel()}</span>
                </a>
              </div>
            </div>
          )}
          
          {/* CC Designer Logo Overlay - Top Right Corner */}
          <div 
            className="absolute top-4 right-4 z-20 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Return to CC Designer"
          >
            <div className="p-1.5 flex items-center space-x-1.5">
              <img 
                src="/cd-logo.svg" 
                alt="CC Designer Logo" 
                className="h-5 w-5"
              />
              <span className="text-xs font-semibold text-gray-700 group-hover:text-teal-600 transition-colors hidden sm:inline">
                CC Designer
              </span>
            </div>
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {shouldEmbed ? (
              <>
                Resource embedded from{' '}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  source
                </a>
                {' '}• Press ESC or click X to exit
              </>
            ) : (
              <>
                Press ESC or click X to close • Click the button above to open in a new tab
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

