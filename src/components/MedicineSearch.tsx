import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Search, Tag } from 'lucide-react';

const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedBase = rawApi.replace(/\/+$/g, '');
const API_URL = normalizedBase.endsWith('/api') ? normalizedBase : normalizedBase + '/api';

interface Medicine {
  _id: string;
  sku: string;
  name: string;
  category: string;
  currentQuantity: number;
  sellingPrice: number;
  unitCost: number;
  requiresPrescription: boolean;
}

interface Discount {
  _id: string;
  name: string;
  discountPercentage: number;
  colorCode: string;
}

export function MedicineSearch() {
  const { token } = useAuth();
  const { currencySymbol } = useSettings();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    if (token) {
      fetchMedicines();
      fetchDiscounts();
    }
  }, [token]);

  const fetchMedicines = async () => {
    try {
      const response = await fetch(`${API_URL}/inventory`, { headers });
      if (!response.ok) throw new Error('Failed to fetch medicines');
      const data = await response.json();
      setMedicines(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
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
      console.error('Error:', error);
    }
  };

  const calculateDiscountedPrice = (originalPrice: number, discountPercent: number) => {
    return (originalPrice - (originalPrice * discountPercent) / 100).toFixed(2);
  };

  const filteredMedicines = medicines.filter(
    (medicine) =>
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Loading medicines...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Search size={36} className="text-blue-600" />
            <span className="text-gradient bg-gradient-to-r from-blue-600 to-teal-600">Medicine Search & Discounts</span>
          </h1>
          <p className="text-gray-600">Find medicines and view available discounts</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {discounts.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3">Available Discounts</h3>
            <div className="flex flex-wrap gap-2">
              {discounts.map((discount) => (
                <span
                  key={discount._id}
                  className="text-white px-3 py-1 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: discount.colorCode }}
                >
                  {discount.name}: {discount.discountPercentage}% OFF
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {filteredMedicines.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? 'No medicines found matching your search' : 'No medicines available'}
            </div>
          ) : (
            filteredMedicines.map((medicine) => (
              <div key={medicine._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{medicine.name}</h3>
                    <p className="text-sm text-gray-600">SKU: {medicine.sku}</p>
                  </div>
                  {medicine.requiresPrescription && (
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded font-medium">
                      ℞ Prescription Required
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <p className="font-medium">{medicine.category}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">In Stock:</span>
                    <p className="font-medium">{medicine.currentQuantity} strips</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Cost Price:</span>
                    <p className="font-medium text-blue-600">{currencySymbol}{medicine.unitCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Selling Price:</span>
                    <p className="font-medium text-green-600">{currencySymbol}{medicine.sellingPrice.toFixed(2)}</p>
                  </div>
                </div>

                {/* Stock Status */}
                <div className="mb-3">
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      medicine.currentQuantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {medicine.currentQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </div>
                </div>

                {/* Discount Options */}
                {discounts.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">💰 Available Discount Prices:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {discounts.map((discount) => {
                        const discountedPrice = calculateDiscountedPrice(medicine.sellingPrice, discount.discountPercentage);
                        const savings = (medicine.sellingPrice - parseFloat(discountedPrice)).toFixed(2);
                        return (
                          <div
                            key={discount._id}
                            className="p-2 rounded border"
                            style={{ borderColor: discount.colorCode, backgroundColor: `${discount.colorCode}15` }}
                          >
                            <p className="text-xs text-gray-600">{discount.name}</p>
                            <p className="text-sm font-bold" style={{ color: discount.colorCode }}>
                              {currencySymbol}{discountedPrice}
                            </p>
                            <p className="text-xs text-gray-500">Save {currencySymbol}{savings}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
