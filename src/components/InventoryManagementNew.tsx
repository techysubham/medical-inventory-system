import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  ChevronDown,
  ChevronRight,
  Box,
  AlertCircle,
  Save,
  X,
} from 'lucide-react';

const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedBase = rawApi.replace(/\/+$/g, '');
const API_URL = normalizedBase.endsWith('/api') ? normalizedBase : normalizedBase + '/api';

interface InventoryItem {
  _id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  supplier?: string;
  location?: string;
  currentQuantity: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  sellingPrice: number;
  unitOfMeasure: string;
  batchNumber?: string;
  lotNumber?: string;
  expirationDate?: string;
  isControlledSubstance?: boolean;
  deaSchedule?: string;
  requiresPrescription?: boolean;
  minStorageTemp?: number;
  maxStorageTemp?: number;
  notes?: string;
}

interface StockCarton {
  _id: string;
  itemId: string;
  cartonNumber: string;
  quantityOfBoxes: number;
  purchasePrice: number;
  supplierId?: string;
  receivedDate: string;
  expirationDate?: string;
  notes?: string;
  status: string;
  boxes?: StockBox[];
}

interface StockBox {
  _id: string;
  cartonId: string;
  boxNumber: number;
  stripsPerBox: number;
  totalStrips: number;
  availableStrips: number;
}

export function InventoryManagement() {
  const { token, hasPermission } = useAuth();
  const { currencySymbol } = useSettings();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'items' | 'stock'>('items');
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [expandedCartons, setExpandedCartons] = useState<Set<string>>(new Set());
  const [cartons, setCartons] = useState<StockCarton[]>([]);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    supplier: '',
    currentQuantity: 0,
    reorderPoint: 10,
    reorderQuantity: 50,
    unitCost: 0,
    sellingPrice: 0,
    unitOfMeasure: 'strip',
    batchNumber: '',
    lotNumber: '',
    expirationDate: '',
    isControlledSubstance: false,
    deaSchedule: '',
    requiresPrescription: false,
    minStorageTemp: '',
    maxStorageTemp: '',
    notes: '',
  });

  const [stockForm, setStockForm] = useState({
    numberOfCartoons: 1,
    numberOfBoxesPerCarton: 1,
    stripsPerBox: 100,
    purchasePrice: 0,
    supplierId: '',
    receivedDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    notes: '',
  });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    if (token) {
      fetchItems();
      fetchSuppliers();
    }
  }, [token]);

  useEffect(() => {
    if (selectedItem) {
      fetchCartons();
    }
  }, [selectedItem]);

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_URL}/inventory`, { headers });
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCartons = async () => {
    if (!selectedItem) return;
    try {
      const response = await fetch(`${API_URL}/inventory/${selectedItem._id}/cartons`, {
        headers,
      });
      if (!response.ok) throw new Error('Failed to fetch cartons');
      const data = await response.json();
      setCartons(data);
    } catch (error) {
      console.error('Error fetching cartons:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      // Fetch from a suppliers endpoint if available, or use mock data
      setSuppliers([
        { _id: '1', name: 'Supplier 1' },
        { _id: '2', name: 'Supplier 2' },
      ]);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const itemData = {
        ...formData,
        minStorageTemp: formData.minStorageTemp ? parseFloat(formData.minStorageTemp) : undefined,
        maxStorageTemp: formData.maxStorageTemp ? parseFloat(formData.maxStorageTemp) : undefined,
      };

      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem ? `${API_URL}/inventory/${editingItem._id}` : `${API_URL}/inventory`;

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(itemData),
      });

      if (!response.ok) throw new Error('Failed to save item');
      setShowModal(false);
      resetForm();
      fetchItems();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item: ' + (error as Error).message);
    }
  };

  const handleSubmitStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const batchData = {
        numberOfCartoons: parseInt(stockForm.numberOfCartoons.toString()),
        numberOfBoxesPerCarton: parseInt(stockForm.numberOfBoxesPerCarton.toString()),
        stripsPerBox: parseInt(stockForm.stripsPerBox.toString()),
        purchasePrice: parseFloat(stockForm.purchasePrice.toString()),
        supplierId: stockForm.supplierId || undefined,
        receivedDate: stockForm.receivedDate,
        expirationDate: stockForm.expirationDate || undefined,
        notes: stockForm.notes || undefined,
      };

      // Use the new batch endpoint to create multiple cartoons with boxes
      const response = await fetch(`${API_URL}/inventory/${selectedItem._id}/cartons/batch`, {
        method: 'POST',
        headers,
        body: JSON.stringify(batchData),
      });

      if (!response.ok) throw new Error('Failed to create cartoons');
      await response.json();

      setShowStockModal(false);
      resetStockForm();
      fetchCartons();
    } catch (error) {
      console.error('Error saving stock:', error);
      alert('Error saving stock: ' + (error as Error).message);
    }
  };

  const handleDeleteCarton = async (id: string) => {
    if (!confirm('Are you sure you want to delete this carton and all its boxes?')) return;
    try {
      const response = await fetch(`${API_URL}/inventory/cartons/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to delete carton');
      fetchCartons();
    } catch (error) {
      console.error('Error deleting carton:', error);
      alert('Error deleting carton: ' + (error as Error).message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await fetch(`${API_URL}/inventory/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to delete item');
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item: ' + (error as Error).message);
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      category: '',
      supplier: '',
      currentQuantity: 0,
      reorderPoint: 10,
      reorderQuantity: 50,
      unitCost: 0,
      sellingPrice: 0,
      unitOfMeasure: 'strip',
      batchNumber: '',
      lotNumber: '',
      expirationDate: '',
      isControlledSubstance: false,
      deaSchedule: '',
      requiresPrescription: false,
      minStorageTemp: '',
      maxStorageTemp: '',
      notes: '',
    });
    setEditingItem(null);
  };

  const resetStockForm = () => {
    setStockForm({
      numberOfCartoons: 1,
      numberOfBoxesPerCarton: 1,
      stripsPerBox: 100,
      purchasePrice: 0,
      supplierId: '',
      receivedDate: new Date().toISOString().split('T')[0],
      expirationDate: '',
      notes: '',
    });
  };

  const toggleCarton = (cartonId: string) => {
    const updated = new Set(expandedCartons);
    if (updated.has(cartonId)) {
      updated.delete(cartonId);
    } else {
      updated.add(cartonId);
    }
    setExpandedCartons(updated);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      sku: item.sku,
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      supplier: item.supplier || '',
      currentQuantity: item.currentQuantity || 0,
      reorderPoint: item.reorderPoint || 10,
      reorderQuantity: item.reorderQuantity || 50,
      unitCost: item.unitCost || 0,
      sellingPrice: item.sellingPrice || 0,
      unitOfMeasure: item.unitOfMeasure || 'strip',
      batchNumber: item.batchNumber || '',
      lotNumber: item.lotNumber || '',
      expirationDate: item.expirationDate ? item.expirationDate.split('T')[0] : '',
      isControlledSubstance: item.isControlledSubstance || false,
      deaSchedule: item.deaSchedule || '',
      requiresPrescription: item.requiresPrescription || false,
      minStorageTemp: item.minStorageTemp ? item.minStorageTemp.toString() : '',
      maxStorageTemp: item.maxStorageTemp ? item.maxStorageTemp.toString() : '',
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const calculateCartonTotals = (carton: StockCarton) => {
    if (!carton.boxes) return { total: 0, available: 0 };
    const total = carton.boxes.reduce((sum, box) => sum + (box.totalStrips || 0), 0);
    const available = carton.boxes.reduce((sum, box) => sum + (box.availableStrips || 0), 0);
    return { total, available };
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

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
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Medicine
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'items'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Medicine List
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'stock'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Stock Hierarchy
        </button>
      </div>

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div>
          <div className="mb-6 flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {filteredItems.map((item) => (
              <div key={item._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-semibold">Purchase Price:</span> {currencySymbol}{Number(item.unitCost).toFixed(2)}
                      </div>
                      <div>
                        <span className="font-semibold">Selling Price:</span> {currencySymbol}{Number(item.sellingPrice).toFixed(2)}
                      </div>
                      <div>
                        <span className="font-semibold">Category:</span> {item.category || 'N/A'}
                      </div>
                      <div>
                        <span className="font-semibold">Supplier:</span> {item.supplier || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setActiveTab('stock');
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="View Stock"
                    >
                      <Box size={20} />
                    </button>
                    {hasPermission('manage_inventory') && (
                      <>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Tab */}
      {activeTab === 'stock' && (
        <div>
          {!selectedItem ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
              <AlertCircle className="mx-auto mb-4 text-blue-600" size={32} />
              <p className="text-gray-700">Select a medicine from the list to view its stock hierarchy</p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedItem.name}</h2>
                    <p className="text-sm text-gray-600">SKU: {selectedItem.sku}</p>
                  </div>
                  {hasPermission('manage_inventory') && (
                    <button
                      onClick={() => {
                        resetStockForm();
                        setShowStockModal(true);
                      }}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      <Plus size={20} />
                      Add Carton
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {cartons.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No cartons added yet. Click "Add Carton" to get started.</p>
                  </div>
                ) : (
                  cartons.map((carton) => {
                    const totals = calculateCartonTotals(carton);
                    const isExpanded = expandedCartons.has(carton._id);

                    return (
                      <div key={carton._id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() => toggleCarton(carton._id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {isExpanded ? (
                              <ChevronDown className="text-blue-600" size={20} />
                            ) : (
                              <ChevronRight className="text-gray-400" size={20} />
                            )}
                            <div className="text-left">
                              <h3 className="font-semibold text-gray-900">Carton #{carton.cartonNumber}</h3>
                              <p className="text-sm text-gray-600">
                                Boxes: {carton.quantityOfBoxes} | Total Strips: {totals.total} | Available: {totals.available}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{currencySymbol}{Number(carton.purchasePrice).toFixed(2)}/carton</p>
                              <p className="text-xs text-gray-600">
                                {new Date(carton.receivedDate).toLocaleDateString()}
                              </p>
                            </div>
                            {hasPermission('manage_inventory') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCarton(carton._id);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={20} />
                              </button>
                            )}
                          </div>
                        </button>

                        {isExpanded && carton.boxes && (
                          <div className="border-t border-gray-200 bg-gray-50 p-4">
                            <div className="space-y-2">
                              {carton.boxes.map((box) => (
                                <div key={box._id} className="bg-white p-3 rounded border border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold text-gray-900">Box #{box.boxNumber}</p>
                                      <p className="text-sm text-gray-600">
                                        {box.stripsPerBox} strips/box | Available: {box.availableStrips}/{box.totalStrips} strips
                                      </p>
                                    </div>
                                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                      {Math.round((box.availableStrips / box.totalStrips) * 100)}%
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Edit Medicine' : 'Add New Medicine'}
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

            <form onSubmit={handleSubmitItem} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="SKU *"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Medicine Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Purchase Price *"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Selling Price *"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold"
                >
                  <Save size={20} />
                  {editingItem ? 'Update' : 'Add'} Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Modal */}
      {showStockModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Add Carton - {selectedItem.name}</h2>
              <button
                onClick={() => {
                  setShowStockModal(false);
                  resetStockForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitStock} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  {stockForm.numberOfCartoons} Carton(s) × {stockForm.numberOfBoxesPerCarton} Boxes per Carton × {stockForm.stripsPerBox} Strips per Box =
                  <span className="font-bold text-blue-600 ml-1">
                    {parseInt(stockForm.numberOfCartoons.toString()) * parseInt(stockForm.numberOfBoxesPerCarton.toString()) * parseInt(stockForm.stripsPerBox.toString())} Total Strips
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  min="1"
                  placeholder="Number of Cartoons *"
                  value={stockForm.numberOfCartoons}
                  onChange={(e) => setStockForm({ ...stockForm, numberOfCartoons: parseInt(e.target.value) || 1 })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Number of Boxes per Carton *"
                  value={stockForm.numberOfBoxesPerCarton}
                  onChange={(e) => setStockForm({ ...stockForm, numberOfBoxesPerCarton: parseInt(e.target.value) || 1 })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Strips per Box *"
                  value={stockForm.stripsPerBox}
                  onChange={(e) => setStockForm({ ...stockForm, stripsPerBox: parseInt(e.target.value) || 100 })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Purchase Price per Carton *"
                  value={stockForm.purchasePrice}
                  onChange={(e) => setStockForm({ ...stockForm, purchasePrice: parseFloat(e.target.value) || 0 })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="date"
                  value={stockForm.receivedDate}
                  onChange={(e) => setStockForm({ ...stockForm, receivedDate: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="date"
                  value={stockForm.expirationDate}
                  onChange={(e) => setStockForm({ ...stockForm, expirationDate: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowStockModal(false);
                    resetStockForm();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold"
                >
                  <Save size={20} />
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
