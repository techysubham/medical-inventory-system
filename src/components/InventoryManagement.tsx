import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Plus, Search, Edit2, Trash2, X, ChevronDown } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    cartonNumber: '',
    quantityOfBoxes: 0,
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

    if (!selectedItemId || !cartonData.cartonNumber) {
      alert('Please fill in required fields');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/inventory/${selectedItemId}/cartons`, {
        method: 'POST',
        headers,
        body: JSON.stringify(cartonData),
      });

      if (!response.ok) throw new Error('Failed to create carton');

      const carton = await response.json();

      // Calculate total strips and add boxes
      const totalStrips = cartonData.quantityOfBoxes * cartonData.stripsPerBox;
      const stripsPerBox = cartonData.stripsPerBox;

      for (let i = 1; i <= cartonData.quantityOfBoxes; i++) {
        await fetch(`${API_URL}/inventory/cartons/${carton._id}/boxes`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            boxNumber: i,
            stripsPerBox,
            totalStrips: stripsPerBox,
            availableStrips: stripsPerBox,
          }),
        });
      }

      alert(`Carton created with ${cartonData.quantityOfBoxes} boxes (${totalStrips} total strips)`);
      setShowCartonModal(false);
      setCartonData({
        cartonNumber: '',
        quantityOfBoxes: 0,
        stripsPerBox: 0,
        purchasePrice: 0,
        expirationDate: '',
      });
      setSelectedItemId(null);
      fetchItems();
      if (selectedItemId) fetchCartons(selectedItemId);
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating carton: ' + (error as Error).message);
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
    setFormData({
      sku: item.sku,
      name: item.name,
      description: item.description || '',
      category: item.category,
      currentQuantity: item.currentQuantity,
      unitCost: item.unitCost,
      sellingPrice: item.sellingPrice,
      requiresPrescription: item.requiresPrescription,
      expirationDate: item.expirationDate || '',
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
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        {hasPermission('manage_inventory') && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Medicine
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">SKU</th>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-left font-semibold">Cost/Sell</th>
                <th className="px-4 py-3 text-left font-semibold">Profit %</th>
                <th className="px-4 py-3 text-left font-semibold">Stock</th>
                <th className="px-4 py-3 text-left font-semibold">Discounts</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredItems.map((item) => {
                const { profit, profitPercent } = calculateProfit(item);
                const applicableDiscounts = getApplicableDiscounts(item);
                return (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{item.sku}</td>
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3 text-gray-600">{item.category}</td>
                    <td className="px-4 py-3">{currencySymbol}{item.unitCost.toFixed(2)} / {currencySymbol}{item.sellingPrice.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={profit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600'}>
                        {profitPercent}%
                      </span>
                    </td>
                    <td className="px-4 py-3">{item.currentQuantity} strips</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {applicableDiscounts.slice(0, 2).map((d) => (
                          <span
                            key={d._id}
                            className="text-xs px-2 py-1 rounded text-white"
                            style={{ backgroundColor: d.colorCode }}
                          >
                            {d.discountPercentage}%
                          </span>
                        ))}
                        {applicableDiscounts.length > 2 && (
                          <span className="text-xs px-2 py-1 bg-gray-200 rounded">+{applicableDiscounts.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      {hasPermission('manage_inventory') && (
                        <>
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleExpandCartons(item._id)}
                        className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                      >
                        <ChevronDown size={16} style={{ transform: expandedCartons[item._id] ? 'rotate(180deg)' : '' }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.map((item) => {
                return expandedCartons[item._id] ? (
                  <tr key={`${item._id}-cartons`}>
                    <td colSpan={8} className="px-4 py-4 bg-gray-50">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold">Stock Cartons</h3>
                          {hasPermission('manage_inventory') && (
                            <button
                              onClick={() => {
                                setSelectedItemId(item._id);
                                setShowCartonModal(true);
                              }}
                              className="flex items-center gap-1 text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                            >
                              <Plus size={14} />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">{editingItem ? 'Edit' : 'Add'} Medicine</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="SKU *"
                  className="px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Medicine Name *"
                  className="px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description"
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Category"
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) })}
                  placeholder="Purchase Price (Cost) *"
                  className="px-3 py-2 border rounded-lg"
                  required
                />
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
                <input
                  type="number"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })}
                  placeholder="Selling Price *"
                  className="px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  placeholder="Expiration Date"
                  className="px-3 py-2 border rounded-lg"
                />
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

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingItem ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Carton Modal */}
      {showCartonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Add Carton</h2>
              <button onClick={() => setShowCartonModal(false)} className="text-gray-400">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddCarton} className="p-6 space-y-4">
              <input
                type="text"
                value={cartonData.cartonNumber}
                onChange={(e) => setCartonData({ ...cartonData, cartonNumber: e.target.value })}
                placeholder="Carton Number *"
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="number"
                value={cartonData.quantityOfBoxes}
                onChange={(e) => setCartonData({ ...cartonData, quantityOfBoxes: parseInt(e.target.value) })}
                placeholder="Number of Boxes *"
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="number"
                value={cartonData.stripsPerBox}
                onChange={(e) => setCartonData({ ...cartonData, stripsPerBox: parseInt(e.target.value) })}
                placeholder="Strips per Box *"
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="number"
                step="0.01"
                value={cartonData.purchasePrice}
                onChange={(e) => setCartonData({ ...cartonData, purchasePrice: parseFloat(e.target.value) })}
                placeholder="Purchase Price"
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="date"
                value={cartonData.expirationDate}
                onChange={(e) => setCartonData({ ...cartonData, expirationDate: e.target.value })}
                placeholder="Expiration Date"
                className="w-full px-3 py-2 border rounded-lg"
              />

              {cartonData.quantityOfBoxes > 0 && cartonData.stripsPerBox > 0 && (
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm text-blue-900">
                    Total Strips: <strong>{cartonData.quantityOfBoxes * cartonData.stripsPerBox}</strong>
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowCartonModal(false)} className="px-4 py-2 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Add Carton
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
