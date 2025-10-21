import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProviderNew } from './contexts/SettingsContextNew';
import { DataProvider } from './contexts/DataContext';
import AppContent from './AppContent';

console.log('🔥 NEW AppNew.tsx loaded at:', new Date().toISOString());

function AppNew() {
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

export default AppNew;