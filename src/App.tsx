import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { SettingsProviderNew } from './contexts/SettingsContextNew';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LoginForm } from './components/LoginForm';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Footer } from './components/Footer';
import { useAuth } from './hooks/useAuth';
import { HelpGuide } from './components/HelpGuide';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

function AppContent() {
  const { user, loading } = useAuth();
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [helpGuideSection, setHelpGuideSection] = useState<
    'activity' | 'lesson' | 'unit' | 'assign' | undefined
  >(undefined);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const handleOpenGuide = (
    section?: 'activity' | 'lesson' | 'unit' | 'assign'
  ) => {
    setHelpGuideSection(section);
    setShowHelpGuide(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
          success: {
            iconTheme: {
              primary: '#0D9488',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#DC2626',
              secondary: '#fff',
            },
          },
        }}
      />
      <Header />
      <main className="flex-1 pt-14 sm:pt-16 pb-20">
        <Dashboard />
      </main>
      <Footer />
      <HelpGuide
        isOpen={showHelpGuide}
        onClose={() => setShowHelpGuide(false)}
        initialSection={helpGuideSection}
      />
      <PWAInstallPrompt />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProviderNew>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </SettingsProviderNew>
    </AuthProvider>
  );
}

export default App;
