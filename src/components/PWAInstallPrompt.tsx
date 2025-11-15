import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallPromptProps {
  /** Show prompt automatically on first visit */
  autoShow?: boolean;
  /** Show prompt after user makes a purchase */
  showAfterPurchase?: boolean;
  /** Custom trigger - controlled externally */
  isOpen?: boolean;
  onClose?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  autoShow = false,
  showAfterPurchase = false,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);
    setIsInstalled(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Capture the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Show prompt if conditions are met
      if (autoShow && !dismissed) {
        // Show after 3 seconds on first visit
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      } else if (autoShow && daysSinceDismissed > 7) {
        // Show again after 7 days if dismissed
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect when app is installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App installed successfully!');
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.removeItem('pwa-install-dismissed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [autoShow]);

  // Handle controlled visibility
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setShowPrompt(controlledIsOpen);
    }
  }, [controlledIsOpen]);

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) {
      return;
    }

    if (isIOS) {
      // Show iOS-specific instructions
      return;
    }

    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA: User ${outcome} the install prompt`);

      if (outcome === 'accepted') {
        setIsInstalled(true);
      }

      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    if (controlledOnClose) {
      controlledOnClose();
    }
  };

  // Don't show if already installed
  if (isInstalled || isStandalone) {
    return null;
  }

  // Don't show if no prompt available and not iOS
  if (!deferredPrompt && !isIOS && !showPrompt) {
    return null;
  }

  // Use controlled visibility or internal state
  const isVisible = controlledIsOpen !== undefined ? controlledIsOpen : showPrompt;

  if (!isVisible) {
    return null;
  }

  // iOS-specific instructions
  if (isIOS) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-card shadow-raised max-w-md w-full p-6 sm:p-8 animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-soft">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-section-title text-slate-900">Install App</h3>
                <p className="text-sm text-slate-600">Add to Home Screen</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-slate-700 text-sm leading-relaxed">
              To install the Creative Curriculum Designer app on your iPhone or iPad:
            </p>

            <ol className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-semibold">
                  1
                </span>
                <span>Tap the <strong>Share</strong> button in Safari (square with arrow pointing up)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-semibold">
                  2
                </span>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-semibold">
                  3
                </span>
                <span>Tap <strong>"Add"</strong> in the top right corner</span>
              </li>
            </ol>

            <div className="mt-6 p-4 bg-teal-50 rounded-xl border border-teal-100">
              <p className="text-sm text-teal-900 font-medium">
                ✨ The app icon will appear on your home screen and work offline!
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="mt-6 w-full px-6 py-3 bg-gradient-primary text-white rounded-button shadow-soft hover:shadow-hover transition-all duration-200 font-medium"
          >
            Got it!
          </button>
        </div>
      </div>
    );
  }

  // Android/Desktop install prompt
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-card shadow-raised max-w-md w-full p-6 sm:p-8 animate-slide-up">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-soft">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-section-title text-slate-900">Install App</h3>
              <p className="text-sm text-slate-600">Works offline & faster!</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-slate-700 leading-relaxed">
            Install Creative Curriculum Designer for a better experience:
          </p>

          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
              <span>Works offline - access your lessons anywhere</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
              <span>Faster loading with cached content</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
              <span>App icon on your home screen</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
              <span>No app store required!</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-button hover:bg-slate-200 transition-all duration-200 font-medium"
          >
            Maybe Later
          </button>
          <button
            onClick={handleInstallClick}
            className="flex-1 px-6 py-3 bg-gradient-primary text-white rounded-button shadow-soft hover:shadow-hover transition-all duration-200 font-medium flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Install</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Export helper hook for manual triggering
export const usePWAInstall = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(standalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setCanInstall(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return { canInstall, isInstalled };
};

