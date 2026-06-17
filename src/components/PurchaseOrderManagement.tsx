import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Plus, Edit2, Trash2, X, ShoppingCart } from 'lucide-react';

const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedBase = rawApi.replace(/\/+$/g, '');
const API_URL = normalizedBase.endsWith('/api') ? normalizedBase : normalizedBase + '/api';

interface PurchaseOrder {
  _id: string;
  orderNumber: string;
  supplierId: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  orderDate?: string;
  dueDate?: string;
}

export function PurchaseOrderManagement() {
  const { token, hasPermission } = useAuth();
  const { currencySymbol } = useSettings();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);

  const [formData, setFormData] = useState({
    orderNumber: '',
    supplierId: '',
    totalAmount: 0,
    status: 'pending' as const,
    orderDate: new Date().toISOString().split('T')[0],
    dueDate: '',
  });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${API_URL}/suppliers`, { headers });
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      const data = await response.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  useEffect(() => {
    if (token) fetchOrders();
    if (token) fetchSuppliers();
  }, [token]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/purchase-orders`, { headers });
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orderNumber || !formData.supplierId) {
      alert('Please fill in required fields');
      return;
    }

    try {
      const url = editingOrder ? `${API_URL}/purchase-orders/${editingOrder._id}` : `${API_URL}/purchase-orders`;
      const method = editingOrder ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let msg = 'Failed to save';
        try {
          const data = await response.json();
          msg = data.error || msg;
        } catch (_) {}
        throw new Error(msg);
      }
      setShowModal(false);
      resetForm();
      fetchOrders();
      alert('Saved successfully');
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this order?')) return;
    try {
      const response = await fetch(`${API_URL}/purchase-orders/${id}`, { method: 'DELETE', headers });
      if (!response.ok) throw new Error('Failed to delete');
      fetchOrders();
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    }
  };

  const resetForm = () => {
    setFormData({ orderNumber: '', supplierId: '', totalAmount: 0, status: 'pending', orderDate: new Date().toISOString().split('T')[0], dueDate: '' });
    setEditingOrder(null);
  };

  if (loading) return <div className="p-8 text-center">Loading purchase orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <ShoppingCart size={36} className="text-blue-600" />
            <span className="text-gradient bg-gradient-to-r from-blue-600 to-teal-600">Purchase Orders</span>
          </h1>
          <p className="text-gray-600">Manage purchase orders and track shipments</p>
        </div>
        {hasPermission('manage_suppliers') && (
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Create Order
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Order #</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Supplier</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{order.orderNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{(order as any).supplierId && typeof (order as any).supplierId === 'object' ? (order as any).supplierId.name : (order as any).supplierId}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{currencySymbol}{order.totalAmount.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{order.orderDate}</td>
                <td className="px-6 py-4 text-sm flex gap-2">
                  {hasPermission('manage_suppliers') ? (
                    <>
                      <button onClick={() => {
                          setEditingOrder(order);
                          const supplierVal = (order as any).supplierId && typeof (order as any).supplierId === 'object' ? (order as any).supplierId._id : (order as any).supplierId;
                          setFormData({...formData, ...order, supplierId: supplierVal});
                          setShowModal(true);
                        }} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(order._id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
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
        {orders.length === 0 && <div className="p-8 text-center text-gray-500">No purchase orders found</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">{editingOrder ? 'Edit Order' : 'Create Order'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input type="text" value={formData.orderNumber} onChange={(e) => setFormData({...formData, orderNumber: e.target.value})} placeholder="Order Number *" className="w-full px-4 py-2 border rounded-lg" required />
              <label className="block text-sm font-medium text-gray-700">Supplier *</label>
              <select value={formData.supplierId} onChange={(e) => setFormData({...formData, supplierId: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required>
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}{s.email ? ` — ${s.email}` : ''}</option>
                ))}
              </select>
              <input type="number" step="0.01" value={formData.totalAmount} onChange={(e) => setFormData({...formData, totalAmount: parseFloat(e.target.value)})} placeholder="Total Amount" className="w-full px-4 py-2 border rounded-lg" />
              <input type="date" value={formData.orderDate} onChange={(e) => setFormData({...formData, orderDate: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className="w-full px-4 py-2 border rounded-lg">
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
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
