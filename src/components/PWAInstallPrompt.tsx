import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallPrompt() {
  const { canInstall, isInstalled, install } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    if (isInstalled || !canInstall) {
      setShowPrompt(false);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = () => {
      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed) {
        const dismissedTime = parseInt(dismissed, 10);
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
        // Show again after 7 days
        if (daysSinceDismissed < 7) {
          setShowPrompt(false);
          return;
        }
      }
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Also show for iOS after a delay
    if (isIOS) {
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [canInstall, isInstalled, isIOS]);

  const handleInstallClick = async () => {
    const installed = await install();
    if (installed) {
      setShowPrompt(false);
    } else {
      // For iOS or browsers without prompt, show instructions
      setShowPrompt(false);
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !showPrompt || (!canInstall && !isIOS)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Download className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Install App</h3>
              <p className="text-sm text-gray-600 mt-1">
                Install Creative Curriculum Designer for quick access and offline use
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {isIOS ? (
          <div className="space-y-3">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Smartphone className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-teal-900">
                  <p className="font-medium mb-1">Install on iOS:</p>
                  <ol className="list-decimal list-inside space-y-1 text-teal-800">
                    <li>Tap the Share button <span className="font-mono">□↑</span> at the bottom</li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" in the top right</li>
                  </ol>
                </div>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Got it
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Monitor className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-teal-900">
                  <p className="font-medium mb-1">Install on Desktop:</p>
                  <p className="text-teal-800">Click Install below, or look for the <span className="font-mono bg-white px-1 rounded">⊕</span> icon in your browser's address bar</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:from-teal-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Install Now</span>
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
