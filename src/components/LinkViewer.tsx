import React, { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2, ExternalLink, Volume2, Play } from 'lucide-react';

interface LinkViewerProps {
  url: string;
  title: string;
  type?: 'video' | 'music' | 'backing' | 'resource' | 'link' | 'vocals' | 'image';
  onClose: () => void;
}

export function LinkViewer({ url, title, type = 'link', onClose }: LinkViewerProps) {
  // Auto-open ALL links in browser, not PWA context
  useEffect(() => {
    console.log('LinkViewer opened with URL:', url);
    
    // Force open in browser - bypass PWA context
    const openInBrowser = () => {
      // Try window.open first
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      
      // Check if window opened successfully
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Popup blocked - use fallback method
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        // Add to body temporarily
        document.body.appendChild(link);
        link.click();
        // Remove after click
        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);
      }
    };

    openInBrowser();
    onClose();
  }, [url, onClose]);

  // Show a brief loading message while opening
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Opening Link</h3>
          <p className="text-gray-600">{title}</p>
          <p className="text-sm text-gray-500 mt-2">Opening in fullscreen...</p>
        </div>
      </div>
    </div>
  );
}