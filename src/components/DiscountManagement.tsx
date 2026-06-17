import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react';

const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedBase = rawApi.replace(/\/+$/g, '');
const API_URL = normalizedBase.endsWith('/api') ? normalizedBase : normalizedBase + '/api';

interface DiscountTier {
  _id: string;
  name: string;
  discountPercentage: number;
  colorCode: string;
  isActive: boolean;
  createdAt?: string;
}

export function DiscountManagement() {
  const { token, hasPermission } = useAuth();
  const [discountTiers, setDiscountTiers] = useState<DiscountTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTier, setEditingTier] = useState<DiscountTier | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    discountPercentage: 0,
    colorCode: '#FF6B6B',
    isActive: true,
  });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const predefinedColors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
  ];

  useEffect(() => {
    if (token) fetchDiscountTiers();
  }, [token]);

  const fetchDiscountTiers = async () => {
    try {
      const response = await fetch(`${API_URL}/discounts/tiers`, { headers });
      if (!response.ok) throw new Error('Failed to fetch discount tiers');
      const data = await response.json();
      setDiscountTiers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching discount tiers:', error);
      alert('Failed to load discount tiers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.discountPercentage < 0 || formData.discountPercentage > 100) {
      alert('Please fill in all required fields with valid values');
      return;
    }

    try {
      const url = editingTier ? `${API_URL}/discounts/tiers/${editingTier._id}` : `${API_URL}/discounts/tiers`;
      const method = editingTier ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save discount tier');
      }

      setShowModal(false);
      resetForm();
      fetchDiscountTiers();
      alert(editingTier ? 'Discount tier updated successfully' : 'Discount tier added successfully');
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving discount tier: ' + (error as Error).message);
    }
  };

  const handleDelete = async (tierId: string) => {
    if (!confirm('Are you sure you want to delete this discount tier?')) return;

    try {
      const response = await fetch(`${API_URL}/discounts/tiers/${tierId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) throw new Error('Failed to delete discount tier');
      fetchDiscountTiers();
      alert('Discount tier deleted successfully');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete discount tier');
    }
  };

  const handleEdit = (tier: DiscountTier) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      discountPercentage: tier.discountPercentage,
      colorCode: tier.colorCode,
      isActive: tier.isActive,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      discountPercentage: 0,
      colorCode: '#FF6B6B',
      isActive: true,
    });
    setEditingTier(null);
  };

  if (loading) return <div className="p-8 text-center">Loading discount tiers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Tag size={36} className="text-blue-600" />
            <span className="text-gradient bg-gradient-to-r from-blue-600 to-teal-600">Discount Management</span>
          </h1>
          <p className="text-gray-600">Create and manage discount tiers</p>
        </div>
        {hasPermission('manage_discounts') && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-glossy flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 shadow-glossy-lg"
          >
            <Plus size={20} />
            <span className="font-bold">Add Discount Tier</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {discountTiers.map((tier) => (
          <div key={tier._id} className="glass-card border-2 rounded-2xl p-6 hover:shadow-glossy-lg transition-all duration-300 hover:scale-105 group" style={{
            borderColor: tier.colorCode,
            background: `linear-gradient(135deg, ${tier.colorCode}15 0%, ${tier.colorCode}08 100%)`
          }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-opacity-80 transition" style={{ color: tier.colorCode }}>
                  {tier.name}
                </h3>
                <p className="text-5xl font-bold mt-3 transition-all duration-300" style={{ color: tier.colorCode }}>
                  {tier.discountPercentage}%
                </p>
              </div>
              <div
                className="w-16 h-16 rounded-2xl shadow-glossy-sm border-2 flex items-center justify-center font-bold text-white text-2xl"
                style={{ backgroundColor: tier.colorCode, borderColor: tier.colorCode }}
              >
                {tier.discountPercentage}%
              </div>
            </div>

            <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${tier.colorCode}40` }}>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  tier.isActive ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-glossy-sm' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {tier.isActive ? '✓ Active' : 'Inactive'}
              </span>
              {hasPermission('manage_discounts') && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleEdit(tier)}
                    className="p-2.5 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-all duration-300 hover:scale-110 shadow-glossy-sm"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(tier._id)}
                    className="p-2.5 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-all duration-300 hover:scale-110 shadow-glossy-sm"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {discountTiers.length === 0 && (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg">No discount tiers found</div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTier ? 'Edit Discount Tier' : 'Add New Discount Tier'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Wholesale, Retail"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Percentage (%) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color Code</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, colorCode: color })}
                      className={`w-full h-10 rounded-lg border-2 transition ${
                        formData.colorCode === color ? 'border-gray-900' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={formData.colorCode}
                  onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  {editingTier ? 'Update' : 'Add'} Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
