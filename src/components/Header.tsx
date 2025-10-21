import React, { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, BookOpen, RefreshCw, Settings, HelpCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContextNew';
import { UserSettings } from './UserSettings';
import { WalkthroughGuide } from './WalkthroughGuide';
import { HelpGuide } from './HelpGuide';
import { LogoSVG } from './Logo';

export function Header() {
  const { user, logout } = useAuth();
  const { currentSheetInfo, setCurrentSheetInfo, refreshData, loading } = useData();
  const { settings, getThemeForClass, customYearGroups } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [helpGuideSection, setHelpGuideSection] = useState<'activity' | 'lesson' | 'unit' | 'assign' | undefined>(undefined);

  // Get theme colors for current class
  const theme = getThemeForClass(currentSheetInfo.sheet);

  return (
    <>
      <header className="bg-white fixed top-0 left-0 right-0 z-50" style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm sm:text-base">CD</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 truncate" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                  <span className="hidden sm:inline">Creative Curriculum Designer</span>
                  <span className="sm:hidden">CCD</span>
                </h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
              {/* Year Group Selector */}
              <div className="relative min-w-0">
                <select
                  value={currentSheetInfo.sheet}
                  onChange={(e) => {
                    const selected = customYearGroups.find(group => group.id === e.target.value);
                    if (selected) {
                      const newSheetInfo = {
                        sheet: selected.id,
                        display: selected.name,
                        eyfs: `${selected.id} Statements`
                      };
                      setCurrentSheetInfo(newSheetInfo);
                      
                      // Save to localStorage so it persists across sessions
                      localStorage.setItem('currentSheetInfo', JSON.stringify(newSheetInfo));
                    }
                  }}
                  className="bg-gray-50 border-2 border-gray-300 text-gray-900 text-xs lg:text-sm rounded-lg focus:border-teal-500 focus:outline-none outline-none block w-full p-1.5 lg:p-2 pr-6 lg:pr-8 appearance-none cursor-pointer transition-colors duration-200 hover:bg-gray-100 min-w-[120px] lg:min-w-[180px]"
                  style={{ outline: 'none', boxShadow: 'none' }}
                  onFocus={(e) => e.target.style.outline = 'none'}
                >
                  {customYearGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Help Button */}
              <button
                onClick={() => setShowHelpGuide(true)}
                className="p-1.5 lg:p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
                title="Help Guide"
                data-help-button
              >
                <HelpCircle className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>

              {/* Settings Button */}
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-1.5 lg:p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
                title="User Settings"
              >
                <Settings className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-1.5 lg:p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50 flex-shrink-0"
                title="Refresh Data"
              >
                <RefreshCw className={`h-4 w-4 lg:h-5 lg:w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-1 lg:space-x-3 flex-shrink-0 min-w-0">
                <div className="flex items-center space-x-1 lg:space-x-2 min-w-0 p-1 lg:p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-6 w-6 lg:h-8 lg:w-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-6 w-6 lg:h-8 lg:w-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-3 w-3 lg:h-5 lg:w-5 text-gray-600" />
                    </div>
                  )}
                  <span className="text-xs lg:text-sm font-medium text-gray-700 truncate max-w-[80px] lg:max-w-[120px] hidden lg:inline">
                    {user?.name}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 lg:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4 lg:h-5 lg:w-5" />
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="space-y-4">
                {/* Year Group Selector Mobile */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Year Group
                  </label>
                  <select
                    value={currentSheetInfo.sheet}
                    onChange={(e) => {
                      const selected = customYearGroups.find(group => group.id === e.target.value);
                      if (selected) {
                        setCurrentSheetInfo({
                          sheet: selected.id,
                          display: selected.name,
                          eyfs: `${selected.id} Statements`
                        });
                      }
                    }}
                    className="w-full bg-gray-50 border-2 border-gray-300 text-gray-900 text-sm rounded-lg focus:border-teal-500 focus:outline-none outline-none block p-2.5"
                    style={{ outline: 'none', boxShadow: 'none' }}
                    onFocus={(e) => e.target.style.outline = 'none'}
                  >
                    {customYearGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Info Mobile */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {user?.name}
                    </span>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <button
                      onClick={() => setShowHelpGuide(true)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <HelpCircle className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setSettingsOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleRefresh}
                      disabled={loading}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={logout}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* User Settings Modal */}
      <UserSettings 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />

      {/* Walkthrough Guide */}
      <WalkthroughGuide
        isOpen={showWalkthrough}
        onClose={() => setShowWalkthrough(false)}
      />

      {/* Help Guide */}
      <HelpGuide
        isOpen={showHelpGuide}
        onClose={() => setShowHelpGuide(false)}
        initialSection={helpGuideSection}
      />
    </>
  );

  // Navigation between lessons
  function handleRefresh() {
    refreshData();
  }
}