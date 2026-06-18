import { useState } from 'react';
import { X, Package, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedBase = rawApi.replace(/\/+$/g, '');
const API_URL = normalizedBase.endsWith('/api') ? normalizedBase : normalizedBase + '/api';

interface AddStockModalProps {
  isOpen: boolean;
  itemId: string;
  itemName: string;
  itemLocation: string;
  defaultExpiryDate: string;
  onClose: () => void;
  onSuccess: () => void;
}

type TabType = 'quick' | 'detailed';

export function AddStockModal({
  isOpen,
  itemId,
  itemName,
  itemLocation,
  defaultExpiryDate,
  onClose,
  onSuccess,
}: AddStockModalProps) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('quick');
  const [loading, setLoading] = useState(false);

  // Quick Entry Tab State
  const [quickData, setQuickData] = useState({
    numberOfCartoons: 1,
    numberOfBoxesPerCarton: 1,
    stripsPerBox: 0,
    purchasePrice: 0,
    expirationDate: defaultExpiryDate,
  });

  // Detailed Entry Tab State
  const [detailedData, setDetailedData] = useState({
    cartonNumber: '',
    boxes: [{ boxNumber: 1, stripsPerBox: 0, purchasePrice: 0 }],
    expirationDate: defaultExpiryDate,
  });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Calculate total strips for Quick Entry
  const quickTotalStrips = quickData.numberOfCartoons * quickData.numberOfBoxesPerCarton * quickData.stripsPerBox;

  // Calculate total strips for Detailed Entry
  const detailedTotalStrips = detailedData.boxes.reduce((sum, box) => sum + box.stripsPerBox, 0);

  // Handle Quick Entry Submit - Creates cartons + auto-creates batch
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quickData.stripsPerBox === 0 || quickData.numberOfBoxesPerCarton === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const totalStrips = quickData.numberOfCartoons * quickData.numberOfBoxesPerCarton * quickData.stripsPerBox;

      // Create carton for each carton in the batch
      for (let i = 1; i <= quickData.numberOfCartoons; i++) {
        const cartonRes = await fetch(`${API_URL}/inventory/${itemId}/cartons`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            cartonNumber: `C${Date.now()}-${i}`,
            quantityOfBoxes: quickData.numberOfBoxesPerCarton,
            purchasePrice: quickData.purchasePrice,
            expirationDate: quickData.expirationDate,
          }),
        });

        if (!cartonRes.ok) throw new Error('Failed to create carton');
        const cartonData = await cartonRes.json();

        // Create boxes for this carton
        for (let j = 1; j <= quickData.numberOfBoxesPerCarton; j++) {
          await fetch(`${API_URL}/inventory/${itemId}/cartons/${cartonData._id}/boxes`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              boxNumber: j,
              stripsPerBox: quickData.stripsPerBox,
              totalStrips: quickData.stripsPerBox,
              availableStrips: quickData.stripsPerBox,
            }),
          });
        }
      }

      // Auto-create batch with auto-generated batch number
      const autoBatchNumber = `B-${itemId}-${Date.now()}`;
      const costPerUnit = quickData.purchasePrice > 0 ? quickData.purchasePrice / totalStrips : 0;

      await fetch(`${API_URL}/stock-batches`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          itemId,
          batchNumber: autoBatchNumber,
          receivedDate: new Date().toISOString().split('T')[0],
          expiryDate: quickData.expirationDate,
          quantityReceived: totalStrips,
          costPerUnit,
          location: itemLocation,
        }),
      });

      onSuccess();
      alert(`✅ Created ${quickData.numberOfCartoons} carton(s) with ${totalStrips} strips + Auto-batch created`);
      handleClose();
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Detailed Entry Submit - Creates carton + auto-creates batch
  const handleDetailedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailedData.cartonNumber || detailedData.boxes.some(b => b.stripsPerBox === 0)) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const totalStrips = detailedData.boxes.reduce((sum, box) => sum + box.stripsPerBox, 0);

      const cartonRes = await fetch(`${API_URL}/inventory/${itemId}/cartons`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          cartonNumber: detailedData.cartonNumber,
          quantityOfBoxes: detailedData.boxes.length,
          purchasePrice: detailedData.boxes[0].purchasePrice,
          expirationDate: detailedData.expirationDate,
        }),
      });

      if (!cartonRes.ok) throw new Error('Failed to create carton');
      const cartonObj = await cartonRes.json();

      // Create boxes
      for (const box of detailedData.boxes) {
        await fetch(`${API_URL}/inventory/${itemId}/cartons/${cartonObj._id}/boxes`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            boxNumber: box.boxNumber,
            stripsPerBox: box.stripsPerBox,
            totalStrips: box.stripsPerBox,
            availableStrips: box.stripsPerBox,
          }),
        });
      }

      // Auto-create batch with auto-generated batch number
      const autoBatchNumber = `B-${itemId}-${Date.now()}`;
      const avgPrice = detailedData.boxes.reduce((sum, b) => sum + b.purchasePrice, 0) / detailedData.boxes.length;
      const costPerUnit = avgPrice > 0 ? avgPrice / totalStrips : 0;

      await fetch(`${API_URL}/stock-batches`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          itemId,
          batchNumber: autoBatchNumber,
          receivedDate: new Date().toISOString().split('T')[0],
          expiryDate: detailedData.expirationDate,
          quantityReceived: totalStrips,
          costPerUnit,
          location: itemLocation,
        }),
      });

      onSuccess();
      alert(`✅ Carton "${detailedData.cartonNumber}" created with ${totalStrips} strips + Auto-batch created`);
      handleClose();
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuickData({
      numberOfCartoons: 1,
      numberOfBoxesPerCarton: 1,
      stripsPerBox: 0,
      purchasePrice: 0,
      expirationDate: defaultExpiryDate,
    });
    setDetailedData({
      cartonNumber: '',
      boxes: [{ boxNumber: 1, stripsPerBox: 0, purchasePrice: 0 }],
      expirationDate: defaultExpiryDate,
    });
    setActiveTab('quick');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-glossy-lg border border-white/20">
        {/* Header */}
        <div className="border-b border-white/20 px-8 py-6 flex justify-between items-center sticky top-0 bg-gradient-to-r from-blue-50/90 to-cyan-50/90 backdrop-blur">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gradient bg-gradient-to-r from-blue-600 to-teal-600">Add Stock</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-lg transition-all duration-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-8 pt-6 flex gap-2">
          <button
            onClick={() => setActiveTab('quick')}
            className={`px-6 py-3 font-semibold rounded-t-lg transition-all ${
              activeTab === 'quick'
                ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent'
            }`}
          >
            📦 Quick Entry
          </button>
          <button
            onClick={() => setActiveTab('detailed')}
            className={`px-6 py-3 font-semibold rounded-t-lg transition-all ${
              activeTab === 'detailed'
                ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent'
            }`}
          >
            📋 Detailed Entry
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Quick Entry Tab */}
          {activeTab === 'quick' && (
            <form onSubmit={handleQuickSubmit} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold">Quick Entry for uniform cartons</p>
                  <p className="text-xs mt-1">Use this when all cartons have the same box and strip count</p>
                </div>
              </div>

              {/* Total Strips Display */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Total Strips</span>
                  <span className="text-3xl font-bold text-green-600">{quickTotalStrips}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Number of Cartons *</label>
                  <input
                    type="number"
                    min="1"
                    value={quickData.numberOfCartoons}
                    onChange={(e) =>
                      setQuickData({ ...quickData, numberOfCartoons: parseInt(e.target.value || '1') })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Boxes per Carton *</label>
                  <input
                    type="number"
                    min="1"
                    value={quickData.numberOfBoxesPerCarton}
                    onChange={(e) =>
                      setQuickData({ ...quickData, numberOfBoxesPerCarton: parseInt(e.target.value || '1') })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Strips per Box *</label>
                  <input
                    type="number"
                    min="1"
                    value={quickData.stripsPerBox}
                    onChange={(e) =>
                      setQuickData({ ...quickData, stripsPerBox: parseInt(e.target.value || '0') })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Purchase Price per Carton</label>
                  <input
                    type="number"
                    step="0.01"
                    value={quickData.purchasePrice}
                    onChange={(e) =>
                      setQuickData({ ...quickData, purchasePrice: parseFloat(e.target.value || '0') })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Expiration Date *</label>
                  <input
                    type="date"
                    value={quickData.expirationDate}
                    onChange={(e) => setQuickData({ ...quickData, expirationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all"
                >
                  {loading ? 'Creating...' : '✅ Add Stock'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 bg-gray-400 text-white font-bold rounded-lg hover:bg-gray-500 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Detailed Entry Tab */}
          {activeTab === 'detailed' && (
            <form onSubmit={handleDetailedSubmit} className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-purple-800">
                  <p className="font-semibold">Detailed Entry for custom configurations</p>
                  <p className="text-xs mt-1">Use this when boxes have different strip counts</p>
                </div>
              </div>

              {/* Total Strips Display */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Total Strips</span>
                  <span className="text-3xl font-bold text-green-600">{detailedTotalStrips}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Carton Number *</label>
                <input
                  type="text"
                  value={detailedData.cartonNumber}
                  onChange={(e) => setDetailedData({ ...detailedData, cartonNumber: e.target.value })}
                  placeholder="e.g., CAR-20250618-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Boxes */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold text-gray-700">Boxes</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newBoxes = [...detailedData.boxes];
                      newBoxes.push({
                        boxNumber: newBoxes.length + 1,
                        stripsPerBox: 0,
                        purchasePrice: newBoxes[0]?.purchasePrice || 0,
                      });
                      setDetailedData({ ...detailedData, boxes: newBoxes });
                    }}
                    className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                  >
                    + Add Box
                  </button>
                </div>

                {detailedData.boxes.map((box, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-3 border border-gray-200 p-3 rounded-lg">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Box #{box.boxNumber}</label>
                      <input
                        type="number"
                        value={box.boxNumber}
                        disabled
                        className="w-full px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Strips per Box</label>
                      <input
                        type="number"
                        min="1"
                        value={box.stripsPerBox}
                        onChange={(e) => {
                          const newBoxes = [...detailedData.boxes];
                          newBoxes[idx].stripsPerBox = parseInt(e.target.value || '0');
                          setDetailedData({ ...detailedData, boxes: newBoxes });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={box.purchasePrice}
                        onChange={(e) => {
                          const newBoxes = [...detailedData.boxes];
                          newBoxes[idx].purchasePrice = parseFloat(e.target.value || '0');
                          setDetailedData({ ...detailedData, boxes: newBoxes });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Expiration Date *</label>
                <input
                  type="date"
                  value={detailedData.expirationDate}
                  onChange={(e) => setDetailedData({ ...detailedData, expirationDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-all"
                >
                  {loading ? 'Creating...' : '✅ Add Carton'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 bg-gray-400 text-white font-bold rounded-lg hover:bg-gray-500 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
