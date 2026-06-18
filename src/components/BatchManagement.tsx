import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedBase = rawApi.replace(/\/+$/g, '');
const API_URL = normalizedBase.endsWith('/api') ? normalizedBase : normalizedBase + '/api';

interface Batch {
  _id: string;
  batchNumber: string;
  receivedDate: string;
  expiryDate: string;
  quantityReceived: number;
  quantityAvailable: number;
  quantitySold: number;
  costPerUnit: number;
  totalCost: number;
  status: string;
  isExpired?: boolean;
  daysUntilExpiry?: number;
}

interface BatchManagementProps {
  itemId: string;
  itemName: string;
}

export function BatchManagement({ itemId, itemName }: BatchManagementProps) {
  const { token } = useAuth();
  const { currencySymbol } = useSettings();
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    batchNumber: '',
    receivedDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    quantityReceived: '',
    costPerUnit: '',
  });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetchBatches();
  }, [itemId]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/stock-batches/item/${itemId}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch batches');
      const data = await res.json();
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.batchNumber || !formData.expiryDate || !formData.quantityReceived || formData.costPerUnit === '') {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/stock-batches`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          itemId,
          batchNumber: formData.batchNumber,
          receivedDate: formData.receivedDate,
          expiryDate: formData.expiryDate,
          quantityReceived: parseInt(formData.quantityReceived),
          costPerUnit: parseFloat(formData.costPerUnit),
        }),
      });

      if (!response.ok) throw new Error('Failed to add batch');

      setShowForm(false);
      setFormData({
        batchNumber: '',
        receivedDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        quantityReceived: '',
        costPerUnit: '',
      });
      
      await fetchBatches();
      // Notify other components (inventory list) to refresh
      try {
        window.dispatchEvent(new CustomEvent('inventory:changed', { detail: { itemId } }));
      } catch (e) {}
      alert('Batch added successfully');
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;

    try {
      const res = await fetch(`${API_URL}/stock-batches/${batchId}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) throw new Error('Failed to delete batch');
      await fetchBatches();
      try {
        window.dispatchEvent(new CustomEvent('inventory:changed', { detail: { itemId } }));
      } catch (e) {}
      alert('Batch deleted successfully');
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    }
  };

  const getStatusColor = (batch: Batch) => {
    if (batch.isExpired) return 'bg-red-50 border-red-200';
    if (batch.daysUntilExpiry !== undefined && batch.daysUntilExpiry < 30) return 'bg-yellow-50 border-yellow-200';
    if (batch.quantityAvailable === 0) return 'bg-gray-50 border-gray-200';
    return 'bg-green-50 border-green-200';
  };

  const getStatusIcon = (batch: Batch) => {
    if (batch.isExpired) return <AlertCircle className="w-4 h-4 text-red-600" />;
    if (batch.daysUntilExpiry !== undefined && batch.daysUntilExpiry < 30) return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    if (batch.quantityAvailable === 0) return <AlertCircle className="w-4 h-4 text-gray-600" />;
    return <Check className="w-4 h-4 text-green-600" />;
  };

  return (
    <div className="mt-6 p-6 bg-white rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Batch Management - {itemName}</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add New Batch
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddBatch} className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number *</label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                placeholder="e.g., B20250618001"
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
              <input
                type="date"
                value={formData.receivedDate}
                onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Received *</label>
              <input
                type="number"
                value={formData.quantityReceived}
                onChange={(e) => setFormData({ ...formData, quantityReceived: e.target.value })}
                placeholder="Number of strips"
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Per Unit *</label>
              <input
                type="number"
                step="0.01"
                value={formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Add Batch
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-4 text-gray-500">Loading batches...</div>
      ) : batches.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No batches found. Add your first batch to get started.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Batch #</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Received</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Expiry</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Received</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Available</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Sold</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Cost/Unit</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch._id} className={`border-b border-gray-100 ${getStatusColor(batch)}`}>
                  <td className="py-3 px-4 font-medium text-gray-800">{batch.batchNumber}</td>
                  <td className="py-3 px-4 text-gray-700">
                    {new Date(batch.receivedDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {new Date(batch.expiryDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">{batch.quantityReceived}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-800">{batch.quantityAvailable}</td>
                  <td className="py-3 px-4 text-right text-gray-700">{batch.quantitySold}</td>
                  <td className="py-3 px-4 text-right text-gray-700">
                    {currencySymbol} {batch.costPerUnit.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(batch)}
                      <span className="text-xs font-medium">
                        {batch.isExpired && 'Expired'}
                        {!batch.isExpired && batch.daysUntilExpiry !== undefined && batch.daysUntilExpiry < 30 && `${batch.daysUntilExpiry}d left`}
                        {!batch.isExpired && batch.daysUntilExpiry !== undefined && batch.daysUntilExpiry >= 30 && 'Active'}
                        {batch.quantityAvailable === 0 && 'Exhausted'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDeleteBatch(batch._id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete batch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
