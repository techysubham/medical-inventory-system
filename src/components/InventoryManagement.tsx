import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Plus, Search, Edit2, Trash2, X, ChevronDown, Package } from 'lucide-react';

const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedBase = rawApi.replace(/\/+$/g, '');
const API_URL = normalizedBase.endsWith('/api') ? normalizedBase : normalizedBase + '/api';

interface InventoryItem {
  _id: string;
  sku: string;
  name: string;
  category: string;
  currentQuantity: number;
  unitCost: number;
  sellingPrice: number;
  requiresPrescription: boolean;
  expirationDate?: string;
  description?: string;
  status: 'active' | 'inactive';
}

interface Discount {
  _id: string;
  name: string;
  discountPercentage: number;
  colorCode: string;
}

interface StockCarton {
  _id: string;
  cartonNumber: string;
  quantityOfBoxes: number;
  purchasePrice: number;
  receivedDate: string;
  expirationDate?: string;
}

interface StockBox {
  _id: string;
  boxNumber: number;
  stripsPerBox: number;
  totalStrips: number;
  availableStrips: number;
}

export function InventoryManagement() {
  const { token, hasPermission } = useAuth();
  const { currencySymbol } = useSettings();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [medicineDiscounts, setMedicineDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [expandedCartons, setExpandedCartons] = useState<Record<string, boolean>>({});
  const [showCartonModal, setShowCartonModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [cartons, setCartons] = useState<StockCarton[]>([]);
  const [boxes, setBoxes] = useState<Record<string, StockBox[]>>({});

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    currentQuantity: 0,
    unitCost: 0,
    sellingPrice: 0,
    requiresPrescription: false,
    expirationDate: '',
    status: 'active' as const,
    discountTierId: '',
  });

  const [cartonData, setCartonData] = useState({
    numberOfCartoons: 1,
    numberOfBoxesPerCarton: 1,
    stripsPerBox: 0,
    purchasePrice: 0,
    expirationDate: '',
  });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    if (token) {
      fetchItems();
      fetchDiscounts();
      fetchMedicineDiscounts();
    }
  }, [token]);

  const fetchMedicineDiscounts = async () => {
    try {
      const response = await fetch(`${API_URL}/discounts/medicines`, { headers });
      if (response.ok) {
        const data = await response.json();
        setMedicineDiscounts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching medicine discounts:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_URL}/inventory`, { headers });
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching items:', error);
      alert('Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscounts = async () => {
    try {
      const response = await fetch(`${API_URL}/discounts/tiers`, { headers });
      if (response.ok) {
        const data = await response.json();
        setDiscounts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching discounts:', error);
    }
  };

  const fetchCartons = async (itemId: string) => {
    try {
      const response = await fetch(`${API_URL}/inventory/${itemId}/cartons`, { headers });
      if (!response.ok) throw new Error('Failed to fetch cartons');
      const data = await response.json();
      setCartons(Array.isArray(data) ? data : []);

      // Fetch boxes for each carton
      for (const carton of data) {
        fetchBoxes(carton._id);
      }
    } catch (error) {
      console.error('Error fetching cartons:', error);
    }
  };

  const fetchBoxes = async (cartonId: string) => {
    try {
      const response = await fetch(`${API_URL}/inventory/cartons/${cartonId}/boxes`, { headers });
      if (response.ok) {
        const data = await response.json();
        setBoxes((prev) => ({ ...prev, [cartonId]: Array.isArray(data) ? data : [] }));
      }
    } catch (error) {
      console.error('Error fetching boxes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.sku) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const url = editingItem ? `${API_URL}/inventory/${editingItem._id}` : `${API_URL}/inventory`;
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save item');
      }

      const saved = await response.json();

      // Handle medicine discount: update/delete/create as needed
      try {
        const existingMd = medicineDiscounts.find((m) => m.itemId && (m.itemId._id ? m.itemId._id === saved._id : m.itemId === saved._id));

        if (existingMd) {
          const existingTierId = existingMd.discountTierId && (existingMd.discountTierId._id ? existingMd.discountTierId._id : existingMd.discountTierId);
          if (!formData.discountTierId) {
            // user removed discount -> delete existing
            await fetch(`${API_URL}/discounts/medicines/${existingMd._id}`, { method: 'DELETE', headers });
          } else if (existingTierId !== formData.discountTierId) {
            // changed -> delete old and create new
            await fetch(`${API_URL}/discounts/medicines/${existingMd._id}`, { method: 'DELETE', headers });
            await fetch(`${API_URL}/discounts/medicines`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ itemId: saved._id, discountTierId: formData.discountTierId }),
            });
          }
        } else if (formData.discountTierId) {
          // no existing, create new
          await fetch(`${API_URL}/discounts/medicines`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ itemId: saved._id, discountTierId: formData.discountTierId }),
          });
        }
      } catch (err) {
        console.error('Failed to update medicine discount', err);
      }

      setShowModal(false);
      resetForm();
      fetchItems();
      fetchMedicineDiscounts();
      alert(editingItem ? 'Item updated successfully' : 'Item added successfully');
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving item: ' + (error as Error).message);
    }
  };

  const handleAddCarton = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItemId || !cartonData.numberOfCartoons || !cartonData.numberOfBoxesPerCarton || !cartonData.stripsPerBox) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const batchData = {
        numberOfCartoons: parseInt(cartonData.numberOfCartoons.toString()),
        numberOfBoxesPerCarton: parseInt(cartonData.numberOfBoxesPerCarton.toString()),
        stripsPerBox: parseInt(cartonData.stripsPerBox.toString()),
        purchasePrice: parseFloat(cartonData.purchasePrice.toString()),
        receivedDate: new Date().toISOString().split('T')[0],
        expirationDate: cartonData.expirationDate || undefined,
      };

      const response = await fetch(`${API_URL}/inventory/${selectedItemId}/cartons/batch`, {
        method: 'POST',
        headers,
        body: JSON.stringify(batchData),
      });

      if (!response.ok) throw new Error('Failed to create cartoons');
      const result = await response.json();

      alert(`${result.totalBoxes} boxes created across ${result.message.split('Created ')[1].split(' carton')[0]} cartons (${result.totalStrips} total strips)`);
      setShowCartonModal(false);
      setCartonData({
        numberOfCartoons: 1,
        numberOfBoxesPerCarton: 1,
        stripsPerBox: 0,
        purchasePrice: 0,
        expirationDate: '',
      });
      setSelectedItemId(null);
      fetchItems();
      if (selectedItemId) fetchCartons(selectedItemId);
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating cartons: ' + (error as Error).message);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`${API_URL}/inventory/${itemId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) throw new Error('Failed to delete item');
      fetchItems();
      alert('Item deleted successfully');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete item');
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    // determine existing medicine discount if any
    const existingMd = medicineDiscounts.find((m) => m.itemId && (m.itemId._id ? m.itemId._id === item._id : m.itemId === item._id));
    
    // Format expiration date: convert ISO format to YYYY-MM-DD for input type="date"
    let formattedExpiry = '';
    if (item.expirationDate) {
      const date = new Date(item.expirationDate);
      formattedExpiry = date.toISOString().split('T')[0]; // Extract YYYY-MM-DD
    }
    
    setFormData({
      sku: item.sku,
      name: item.name,
      description: item.description || '',
      category: item.category,
      currentQuantity: item.currentQuantity,
      unitCost: item.unitCost,
      sellingPrice: item.sellingPrice,
      requiresPrescription: item.requiresPrescription,
      expirationDate: formattedExpiry,
      status: item.status,
      discountTierId: existingMd && existingMd.discountTierId ? (existingMd.discountTierId._id || existingMd.discountTierId) : '',
    });
    setShowModal(true);
  };

  const handleExpandCartons = (itemId: string) => {
    if (expandedCartons[itemId]) {
      setExpandedCartons((prev) => ({ ...prev, [itemId]: false }));
    } else {
      fetchCartons(itemId);
      setExpandedCartons((prev) => ({ ...prev, [itemId]: true }));
      setSelectedItemId(itemId);
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      category: '',
      currentQuantity: 0,
      unitCost: 0,
      sellingPrice: 0,
      requiresPrescription: false,
      expirationDate: '',
      status: 'active',
      discountTierId: '',
    });
    setEditingItem(null);
  };

  const calculateProfit = (item: InventoryItem) => {
    const profit = item.sellingPrice - item.unitCost;
    const profitPercent = item.unitCost > 0 ? ((profit / item.unitCost) * 100).toFixed(1) : 0;
    return { profit, profitPercent };
  };

  const getApplicableDiscounts = (item: InventoryItem) => {
    const md = medicineDiscounts.find((m) => {
      return m.itemId && (m.itemId._id ? m.itemId._id === item._id : m.itemId === item._id);
    });
    if (md && md.discountTierId) return [md.discountTierId];
    if ((item as any).discountTier) return [(item as any).discountTier];
    return [];
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Loading inventory...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Package size={36} className="text-blue-600" />
            <span className="text-gradient bg-gradient-to-r from-blue-600 to-teal-600">Inventory Management</span>
          </h1>
          <p className="text-gray-600">Manage your medicines and stock efficiently</p>
        </div>
        {hasPermission('manage_inventory') && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-glossy flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 shadow-glossy-lg"
          >
            <Plus size={20} />
            <span className="font-bold">Add Medicine</span>
          </button>
        )}
      </div>

      <div className="glass-card p-6 shadow-glossy-lg">
        <div className="flex items-center gap-3 mb-6 bg-white/50 px-4 py-3 rounded-xl border border-gray-200/50">
          <Search size={22} className="text-blue-600" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500 font-medium"
          />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200/50">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200/50">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-800">SKU</th>
                <th className="px-6 py-4 text-left font-bold text-gray-800">Name</th>
                <th className="px-6 py-4 text-left font-bold text-gray-800">Category</th>
                <th className="px-6 py-4 text-left font-bold text-gray-800">Cost/Sell</th>
                <th className="px-6 py-4 text-left font-bold text-gray-800">Profit %</th>
                <th className="px-6 py-4 text-left font-bold text-gray-800">Stock</th>
                <th className="px-6 py-4 text-left font-bold text-gray-800">Discounts</th>
                <th className="px-6 py-4 text-left font-bold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {filteredItems.map((item) => {
                const { profit, profitPercent } = calculateProfit(item);
                const applicableDiscounts = getApplicableDiscounts(item);
                return (
                  <tr key={item._id} className="hover:bg-blue-50/50 transition-all duration-300 group">
                    <td className="px-6 py-4 font-bold text-gray-900 group-hover:text-blue-600">{item.sku}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{item.name}</td>
                    <td className="px-6 py-4 text-gray-600 badge-modern bg-gray-100 text-gray-700 border-gray-300">{item.category}</td>
                    <td className="px-6 py-4 font-medium">{currencySymbol}{item.unitCost.toFixed(2)} / {currencySymbol}{item.sellingPrice.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold text-lg ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitPercent}%
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{item.currentQuantity} strips</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {applicableDiscounts.slice(0, 2).map((d) => (
                          <span
                            key={d._id}
                            className="text-xs px-3 py-1.5 rounded-full text-white font-bold shadow-glossy-sm"
                            style={{ backgroundColor: d.colorCode }}
                          >
                            {d.discountPercentage}%
                          </span>
                        ))}
                        {applicableDiscounts.length > 2 && (
                          <span className="text-xs px-3 py-1.5 bg-gray-200 text-gray-700 rounded-full font-bold">+{applicableDiscounts.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      {hasPermission('manage_inventory') && (
                        <>
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2.5 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-all duration-300 hover:scale-110 shadow-glossy-sm"
                            title="Edit item"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-2.5 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-all duration-300 hover:scale-110 shadow-glossy-sm"
                            title="Delete item"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleExpandCartons(item._id)}
                        className="p-2.5 text-purple-600 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-all duration-300 hover:scale-110 shadow-glossy-sm"
                        title="View cartons"
                      >
                        <ChevronDown size={18} style={{ transform: expandedCartons[item._id] ? 'rotate(180deg)' : '', transition: 'transform 0.3s' }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.map((item) => {
                return expandedCartons[item._id] ? (
                  <tr key={`${item._id}-cartons`}>
                    <td colSpan={8} className="px-6 py-6 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 border-t-2 border-blue-200/50">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-lg text-gray-900">📦 Stock Cartons</h3>
                          {hasPermission('manage_inventory') && (
                            <button
                              onClick={() => {
                                setSelectedItemId(item._id);
                                setShowCartonModal(true);
                              }}
                              className="btn-glossy flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-2 text-xs font-bold shadow-glossy-sm"
                            >
                              <Plus size={16} />
                              Add Carton
                            </button>
                          )}
                        </div>

                        {cartons.length === 0 ? (
                          <p className="text-sm text-gray-500">No cartons recorded for this item</p>
                        ) : (
                          <div className="bg-white rounded border space-y-2 p-3">
                            {cartons.map((carton) => (
                              <div key={carton._id} className="border-l-4 border-purple-500 pl-3 py-2">
                                <p className="font-medium">Carton #{carton.cartonNumber}</p>
                                <p className="text-sm text-gray-600">
                                  Boxes: {carton.quantityOfBoxes} | Purchase: {currencySymbol}{carton.purchasePrice.toFixed(2)}
                                </p>

                                {boxes[carton._id] && boxes[carton._id].length > 0 && (
                                  <div className="mt-2 ml-2 space-y-1 border-l-2 border-gray-300 pl-2">
                                    {boxes[carton._id].map((box) => (
                                      <p key={box._id} className="text-xs text-gray-700">
                                        Box {box.boxNumber}: {box.totalStrips} strips ({box.availableStrips} available)
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : null;
              })}
            </tbody>
          </table>
          {filteredItems.length === 0 && <div className="p-8 text-center text-gray-500">No medicines found</div>}
        </div>
      </div>

      {/* Add/Edit Medicine Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-glossy-lg border border-white/20">
            <div className="border-b border-white/20 px-8 py-6 flex justify-between items-center sticky top-0 bg-gradient-to-r from-blue-50/90 to-cyan-50/90 backdrop-blur">
              <h2 className="text-2xl font-bold text-gradient bg-gradient-to-r from-blue-600 to-teal-600">{editingItem ? '✏️ Edit' : '➕ Add'} Medicine</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-lg transition-all duration-300">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">SKU *</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="input-modern"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Medicine Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-modern"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-modern"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Purchase Price (Cost) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) })}
                    className="input-modern"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <label className="text-sm">Select Discount (optional)</label>
                <select
                  value={formData.discountTierId}
                  onChange={(e) => setFormData({ ...formData, discountTierId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">No discount</option>
                  {discounts.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} — {d.discountPercentage}%
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                  <input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requiresPrescription}
                  onChange={(e) => setFormData({ ...formData, requiresPrescription: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Requires Prescription</span>
              </label>

              <div className="flex justify-end gap-4 pt-6 border-t border-white/20">
                <button type="button" onClick={() => setShowModal(false)} className="btn-modern px-6 py-3 border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 font-semibold rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="btn-glossy px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl shadow-glossy-lg">
                  {editingItem ? 'Update Medicine' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Carton Modal */}
      {showCartonModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card max-w-md w-full mx-4 shadow-glossy-lg border border-white/20">
            <div className="border-b border-white/20 px-8 py-6 flex justify-between items-center bg-gradient-to-r from-purple-50/90 to-pink-50/90 backdrop-blur">
              <h2 className="text-2xl font-bold text-gradient bg-gradient-to-r from-purple-600 to-pink-600">📦 Add Carton</h2>
              <button onClick={() => setShowCartonModal(false)} className="p-2 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-lg transition-all">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddCarton} className="p-8 space-y-5">
              <div className="glass-card bg-purple-50/50 p-4 border border-purple-200/50">
                <p className="text-sm text-purple-900 font-semibold">
                  {cartonData.numberOfCartoons} Carton(s) × {cartonData.numberOfBoxesPerCarton} Boxes per Carton × {cartonData.stripsPerBox} Strips per Box =
                  <strong className="ml-1 text-lg text-purple-600">
                    {parseInt(cartonData.numberOfCartoons.toString()) * parseInt(cartonData.numberOfBoxesPerCarton.toString()) * parseInt(cartonData.stripsPerBox.toString())} Total Strips
                  </strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Cartons *</label>
                <input
                  type="number"
                  min="1"
                  value={cartonData.numberOfCartoons}
                  onChange={(e) => setCartonData({ ...cartonData, numberOfCartoons: parseInt(e.target.value) || 1 })}
                  className="input-modern"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Boxes per Carton *</label>
                <input
                  type="number"
                  min="1"
                  value={cartonData.numberOfBoxesPerCarton}
                  onChange={(e) => setCartonData({ ...cartonData, numberOfBoxesPerCarton: parseInt(e.target.value) || 1 })}
                  className="input-modern"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Strips per Box *</label>
                <input
                  type="number"
                  min="1"
                  value={cartonData.stripsPerBox}
                  onChange={(e) => setCartonData({ ...cartonData, stripsPerBox: parseInt(e.target.value) || 1 })}
                  className="input-modern"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Purchase Price per Carton</label>
                <input
                  type="number"
                  step="0.01"
                  value={cartonData.purchasePrice}
                  onChange={(e) => setCartonData({ ...cartonData, purchasePrice: parseFloat(e.target.value) })}
                  className="input-modern"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Expiration Date</label>
                <input
                  type="date"
                  value={cartonData.expirationDate}
                  onChange={(e) => setCartonData({ ...cartonData, expirationDate: e.target.value })}
                  className="input-modern"
                />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-white/20">
                <button type="button" onClick={() => setShowCartonModal(false)} className="btn-modern px-6 py-3 border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 font-semibold rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="btn-glossy px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl shadow-glossy-lg">
                  Add Cartoons
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
