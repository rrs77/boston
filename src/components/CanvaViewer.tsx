import React, { useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface CanvaViewerProps {
  url: string;
  title: string;
  onClose: () => void;
}

export function CanvaViewer({ url, title, onClose }: CanvaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Request fullscreen when component mounts
  useEffect(() => {
    const requestFullscreen = async () => {
      if (containerRef.current) {
        try {
          if (containerRef.current.requestFullscreen) {
            await containerRef.current.requestFullscreen();
          } else if ((containerRef.current as any).webkitRequestFullscreen) {
            // Safari
            await (containerRef.current as any).webkitRequestFullscreen();
          } else if ((containerRef.current as any).mozRequestFullScreen) {
            // Firefox
            await (containerRef.current as any).mozRequestFullScreen();
          } else if ((containerRef.current as any).msRequestFullscreen) {
            // IE/Edge
            await (containerRef.current as any).msRequestFullscreen();
          }
        } catch (error) {
          console.warn('Failed to request fullscreen:', error);
          // Continue even if fullscreen fails
        }
      }
    };

    requestFullscreen();

    // Handle fullscreen change events
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && 
          !(document as any).webkitFullscreenElement && 
          !(document as any).mozFullScreenElement && 
          !(document as any).msFullscreenElement) {
        // User exited fullscreen, close the modal
        onClose();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [onClose]);

  // Ensure Canva URL is properly formatted for embedding
  const getEmbedUrl = (canvaUrl: string): string => {
    // If it's already an embed URL, return as is
    if (canvaUrl.includes('/embed/')) {
      return canvaUrl;
    }
    
    // If it's a regular Canva share URL, convert to embed format
    // Canva URLs typically look like: https://www.canva.com/design/DAXXXXX/view
    // Embed format: https://www.canva.com/design/DAXXXXX/view?embed
    if (canvaUrl.includes('canva.com/design/')) {
      // Add ?embed if not already present
      if (!canvaUrl.includes('?')) {
        return `${canvaUrl}?embed`;
      } else if (!canvaUrl.includes('embed')) {
        return `${canvaUrl}&embed`;
      }
    }
    
    return canvaUrl;
  };

  const embedUrl = getEmbedUrl(url);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black bg-opacity-100 flex items-center justify-center z-[70]"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">Canva Design</p>
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

        {/* Canva Embed - Takes remaining space */}
        <div className="flex-1 overflow-hidden relative" style={{ height: 'calc(100vh - 120px)' }}>
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allow="fullscreen"
            title={title}
          />
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Canva design embedded from{' '}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
              onClick={(e) => e.stopPropagation()}
            >
              Canva
            </a>
            {' '}• Press ESC or click X to exit
          </p>
        </div>
      </div>
    </div>
  );
}

