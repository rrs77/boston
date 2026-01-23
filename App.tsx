import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { SettingsProvider } from './contexts/SettingsContextNew';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LoginForm } from './components/LoginForm';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Footer } from './components/Footer';
import { useAuth } from './hooks/useAuth';
import { HelpGuide } from './components/HelpGuide';

function AppContent() {
  const { user, loading } = useAuth();
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [helpGuideSection, setHelpGuideSection] = useState<'activity' | 'lesson' | 'unit' | 'assign' | undefined>(undefined);
  
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
  
  const handleOpenGuide = (section?: 'activity' | 'lesson' | 'unit' | 'assign') => {
    setHelpGuideSection(section);
    setShowHelpGuide(true);
  };
  
  return (
    <>
      <style>{`
        /* Global styles for rendered HTML content (from RichTextEditor) */
        ul:not(.ql-checklist):not([data-list="check"]) {
          list-style-type: disc !important;
          padding-left: 1.5em !important;
          margin: 0.5em 0 !important;
        }
        ul:not(.ql-checklist):not([data-list="check"]) li {
          list-style-type: disc !important;
          display: list-item !important;
          margin-bottom: 0.25em !important;
        }
        ol {
          list-style-type: decimal !important;
          padding-left: 1.5em !important;
          margin: 0.5em 0 !important;
        }
        ol li {
          list-style-type: decimal !important;
          display: list-item !important;
          margin-bottom: 0.25em !important;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 pt-16">
          <Dashboard />
        </main>
        <Footer />
        <HelpGuide 
          isOpen={showHelpGuide} 
          onClose={() => setShowHelpGuide(false)} 
          initialSection={helpGuideSection}
        />
      </div>
    </>
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