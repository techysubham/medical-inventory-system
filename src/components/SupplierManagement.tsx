import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2, X, Building2 } from 'lucide-react';

const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedBase = rawApi.replace(/\/+$/g, '');
const API_URL = normalizedBase.endsWith('/api') ? normalizedBase : normalizedBase + '/api';

interface Supplier {
  _id: string;
  name: string;
  supplierCode?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
}

export function SupplierManagement() {
  const { token, hasPermission } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    supplierCode: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    status: 'active' as const,
  });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    if (token) fetchSuppliers();
  }, [token]);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${API_URL}/suppliers`, { headers });
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      const data = await response.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Supplier name is required');
      return;
    }

    try {
      const url = editingSupplier ? `${API_URL}/suppliers/${editingSupplier._id}` : `${API_URL}/suppliers`;
      const method = editingSupplier ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save supplier');
      setShowModal(false);
      resetForm();
      fetchSuppliers();
      alert(editingSupplier ? 'Supplier updated' : 'Supplier added');
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this supplier?')) return;
    try {
      const response = await fetch(`${API_URL}/suppliers/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to delete');
      fetchSuppliers();
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      supplierCode: supplier.supplierCode || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      status: supplier.status,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', supplierCode: '', email: '', phone: '', address: '', city: '', status: 'active' });
    setEditingSupplier(null);
  };

  if (loading) return <div className="p-8 text-center">Loading suppliers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Building2 size={36} className="text-blue-600" />
            <span className="text-gradient bg-gradient-to-r from-blue-600 to-teal-600">Supplier Management</span>
          </h1>
          <p className="text-gray-600">Manage your suppliers and their information</p>
        </div>
        {hasPermission('manage_suppliers') && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-glossy flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 shadow-glossy-lg"
          >
            <Plus size={20} />
            <span className="font-bold">Add Supplier</span>
          </button>
        )}
      </div>

      <div className="glass-card shadow-glossy-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200/50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Name</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Code</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Email</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Phone</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">City</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Status</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50">
            {suppliers.map((supplier) => (
              <tr key={supplier._id} className="hover:bg-blue-50/50 transition-all duration-300 group">
                <td className="px-6 py-4 text-sm font-bold text-gray-900 group-hover:text-blue-600">{supplier.name}</td>
                <td className="px-6 py-4 text-sm font-mono text-blue-600 font-bold">{supplier.supplierCode || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{supplier.email || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{supplier.phone || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{supplier.city || '-'}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-glossy-sm ${supplier.status === 'active' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {supplier.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm flex gap-3">
                  {hasPermission('manage_suppliers') ? (
                    <>
                      <button onClick={() => handleEdit(supplier)} className="p-2.5 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-all duration-300 hover:scale-110 shadow-glossy-sm">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(supplier._id)} className="p-2.5 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-all duration-300 hover:scale-110 shadow-glossy-sm">
                        <Trash2 size={18} />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic">View only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {suppliers.length === 0 && <div className="p-8 text-center text-gray-500">No suppliers found</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Supplier Name *" className="w-full px-4 py-2 border rounded-lg" required />
              <input type="text" value={formData.supplierCode} onChange={(e) => setFormData({...formData, supplierCode: e.target.value})} placeholder="Supplier Code (e.g., AZO, BAY, CIPLA) *" className="w-full px-4 py-2 border rounded-lg font-mono" required />
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Email" className="w-full px-4 py-2 border rounded-lg" />
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Phone" className="w-full px-4 py-2 border rounded-lg" />
              <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Address" className="w-full px-4 py-2 border rounded-lg" />
              <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="City" className="w-full px-4 py-2 border rounded-lg" />
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 border rounded-lg text-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
