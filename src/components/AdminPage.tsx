import React, { useState } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { CustomObjectivesAdmin } from './CustomObjectivesAdmin';

interface AdminPageProps {
  onBack: () => void;
}

export function AdminPage({ onBack }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<'objectives'>('objectives');
  const [showObjectivesAdmin, setShowObjectivesAdmin] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <Settings className="h-6 w-6 text-gray-600" />
                <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('objectives')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'objectives'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Custom Objectives
            </button>
            {/* Add more tabs here in the future */}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'objectives' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Custom Objectives Management</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Create and manage custom objectives for Year 1+ curriculum groups like Drama, Music, etc.
                  </p>
                </div>
                <button
                  onClick={() => setShowObjectivesAdmin(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  Manage Objectives
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-medium text-purple-900 mb-2">Create Year Groups</h3>
                  <p className="text-sm text-purple-700">
                    Add new curriculum year groups like Y1 Drama, Y2 Music, etc.
                  </p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Define Areas</h3>
                  <p className="text-sm text-blue-700">
                    Create areas of learning within each year group (Performance, Technical Skills, etc.)
                  </p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">Set Objectives</h3>
                  <p className="text-sm text-green-700">
                    Define specific objectives with codes and descriptions for each area
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Example Structure:</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div><strong>Y1 Drama</strong></div>
                  <div className="ml-4">• <strong>Performance Skills</strong></div>
                  <div className="ml-8">- Y1D-P-01: Use voice expressively</div>
                  <div className="ml-8">- Y1D-P-02: Use movement effectively</div>
                  <div className="ml-4">• <strong>Creative Expression</strong></div>
                  <div className="ml-8">- Y1D-C-01: Develop simple narratives</div>
                  <div className="ml-8">- Y1D-C-02: Work collaboratively in groups</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Objectives Admin Modal */}
      <CustomObjectivesAdmin
        isOpen={showObjectivesAdmin}
        onClose={() => setShowObjectivesAdmin(false)}
      />
    </div>
  );
}
