import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Package, DollarSign, Tag } from 'lucide-react';
import { activityPacksApi, ActivityPack } from '../config/api';
import { useSettings } from '../contexts/SettingsContextNew';

interface ActivityPacksAdminProps {
  userEmail: string;
}

export const ActivityPacksAdmin: React.FC<ActivityPacksAdminProps> = ({ userEmail }) => {
  const { categories } = useSettings();
  const [packs, setPacks] = useState<ActivityPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPack, setEditingPack] = useState<Partial<ActivityPack> | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadPacks();
  }, []);

  const loadPacks = async () => {
    try {
      setLoading(true);
      const data = await activityPacksApi.getAllPacksAdmin();
      setPacks(data);
    } catch (error) {
      console.error('Failed to load packs:', error);
      alert('Failed to load packs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePack = () => {
    setEditingPack({
      pack_id: '',
      name: '',
      description: '',
      price: 24.99,
      icon: '🎭',
      category_ids: [],
      is_active: true
    });
    setShowCreateForm(true);
  };

  const handleSavePack = async () => {
    if (!editingPack) return;

    try {
      // Validation
      if (!editingPack.pack_id || !editingPack.name) {
        alert('Pack ID and Name are required');
        return;
      }

      await activityPacksApi.upsertPack(editingPack);
      alert('Pack saved successfully!');
      setShowCreateForm(false);
      setEditingPack(null);
      loadPacks();
    } catch (error) {
      console.error('Failed to save pack:', error);
      alert('Failed to save pack: ' + (error as Error).message);
    }
  };

  const handleDeletePack = async (packId: string) => {
    if (!confirm('Are you sure you want to delete this pack? This cannot be undone.')) {
      return;
    }

    try {
      await activityPacksApi.deletePack(packId);
      alert('Pack deleted successfully!');
      loadPacks();
    } catch (error) {
      console.error('Failed to delete pack:', error);
      alert('Failed to delete pack');
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (!editingPack) return;

    const currentCategories = editingPack.category_ids || [];
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId];

    setEditingPack({
      ...editingPack,
      category_ids: newCategories
    });
  };

  // Group categories by group
  const groupedCategories = categories.reduce((acc, category) => {
    const group = category.group || 'Ungrouped';
    if (!acc[group]) acc[group] = [];
    acc[group].push(category);
    return acc;
  }, {} as Record<string, typeof categories>);

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading activity packs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Package className="h-6 w-6 text-teal-600" />
            <span>Manage Activity Packs</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage purchasable activity packs. Link categories to packs to control access.
          </p>
        </div>
        <button
          onClick={handleCreatePack}
          className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create Pack</span>
        </button>
      </div>

      {/* Existing Packs */}
      <div className="space-y-4">
        {packs.map((pack) => (
          <div
            key={pack.id}
            className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:border-teal-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-3xl">{pack.icon}</span>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{pack.name}</h4>
                    <p className="text-sm text-gray-500">ID: {pack.pack_id}</p>
                  </div>
                  {!pack.is_active && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mb-3">{pack.description}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center space-x-1 text-green-600 font-semibold">
                    <DollarSign className="h-4 w-4" />
                    <span>£{pack.price.toFixed(2)}</span>
                  </span>
                  <span className="flex items-center space-x-1 text-gray-600">
                    <Tag className="h-4 w-4" />
                    <span>{pack.category_ids?.length || 0} categories linked</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setEditingPack(pack);
                    setShowCreateForm(true);
                  }}
                  className="px-3 py-1.5 text-teal-600 border border-teal-600 rounded hover:bg-teal-50 transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePack(pack.pack_id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {pack.category_ids && pack.category_ids.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-2">Linked Categories:</p>
                <div className="flex flex-wrap gap-2">
                  {pack.category_ids.map((catId) => {
                    const category = categories.find(c => c.id === catId);
                    return category ? (
                      <span
                        key={catId}
                        className="px-2 py-1 rounded text-xs text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        ))}

        {packs.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No activity packs created yet</p>
            <p className="text-sm text-gray-500 mt-1">Click "Create Pack" to get started</p>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && editingPack && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingPack.id ? 'Edit Activity Pack' : 'Create New Activity Pack'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingPack(null);
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Basic Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pack ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingPack.pack_id || ''}
                      onChange={(e) => setEditingPack({ ...editingPack, pack_id: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                      placeholder="DRAMA_PACK"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      disabled={!!editingPack.id}
                    />
                    <p className="text-xs text-gray-500 mt-1">Unique identifier (cannot be changed after creation)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon
                    </label>
                    <input
                      type="text"
                      value={editingPack.icon || ''}
                      onChange={(e) => setEditingPack({ ...editingPack, icon: e.target.value })}
                      placeholder="🎭"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-2xl text-center"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pack Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingPack.name || ''}
                    onChange={(e) => setEditingPack({ ...editingPack, name: e.target.value })}
                    placeholder="Drama Games Activity Pack"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingPack.description || ''}
                    onChange={(e) => setEditingPack({ ...editingPack, description: e.target.value })}
                    placeholder="Describe what's included in this pack..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPack.price || 0}
                    onChange={(e) => setEditingPack({ ...editingPack, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingPack.is_active !== false}
                      onChange={(e) => setEditingPack({ ...editingPack, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Active (available for purchase)</span>
                  </label>
                </div>
              </div>

              {/* Category Linking */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Link Categories</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Select which categories belong to this pack. Activities in these categories will only be visible to users who purchase this pack.
                </p>

                <div className="space-y-4">
                  {Object.entries(groupedCategories).map(([groupName, groupCategories]) => (
                    <div key={groupName} className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">{groupName}</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {groupCategories.map((category) => {
                          const isSelected = (editingPack.category_ids || []).includes(category.id);
                          return (
                            <button
                              key={category.id}
                              onClick={() => toggleCategory(category.id)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                isSelected
                                  ? 'bg-teal-100 border-2 border-teal-600 text-teal-900'
                                  : 'bg-white border border-gray-300 text-gray-700 hover:border-teal-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{category.name}</span>
                                {isSelected && <span className="text-teal-600">✓</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingPack(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePack}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Pack</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

