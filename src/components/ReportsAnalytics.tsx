import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { BarChart3, TrendingUp, Package, DollarSign, Euro, PoundSterling, IndianRupee, Wallet } from 'lucide-react';

const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedBase = rawApi.replace(/\/+$/g, '');
const API_URL = normalizedBase.endsWith('/api') ? normalizedBase : normalizedBase + '/api';

interface Stats {
  totalItems: number;
  totalSuppliers: number;
  totalInvoices: number;
  totalRevenue: number;
}

interface PaymentMethodStat {
  method: string;
  count: number;
  total: number;
}

export function ReportsAnalytics() {
  const { token } = useAuth();
  const { currencySymbol, settings } = useSettings();
  const [stats, setStats] = useState<Stats | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentMethodStat[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    if (token) {
      fetchStats();
      fetchPaymentStats();
    }
  }, [token]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/reports/stats`, { headers });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error:', error);
      setStats({
        totalItems: 0,
        totalSuppliers: 0,
        totalInvoices: 0,
        totalRevenue: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const response = await fetch(`${API_URL}/reports/payment-methods`, { headers });
      if (!response.ok) throw new Error('Failed to fetch payment stats');
      const data = await response.json();
      setPaymentStats(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
      setPaymentStats([]);
    }
  };

  const getCurrencyIcon = () => {
    switch (settings?.currency) {
      case 'EUR': return Euro;
      case 'GBP': return PoundSterling;
      case 'INR': return IndianRupee;
      case 'USD':
      default: return DollarSign;
    }
  };

  if (loading) return <div className="p-8 text-center">Loading reports...</div>;

  const cards = [
    { title: 'Total Medicines', value: stats?.totalItems || 0, icon: Package, color: 'bg-blue-100 text-blue-700' },
    { title: 'Total Suppliers', value: stats?.totalSuppliers || 0, icon: TrendingUp, color: 'bg-green-100 text-green-700' },
    { title: 'Total Invoices', value: stats?.totalInvoices || 0, icon: BarChart3, color: 'bg-purple-100 text-purple-700' },
    { title: 'Total Revenue', value: `${currencySymbol}${(stats?.totalRevenue || 0).toFixed(2)}`, icon: getCurrencyIcon(), color: 'bg-yellow-100 text-yellow-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <BarChart3 size={36} className="text-purple-600" />
            <span className="text-gradient bg-gradient-to-r from-purple-600 to-pink-600">Reports & Analytics</span>
          </h1>
          <p className="text-gray-600">View comprehensive inventory and sales analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6 border-t-4 border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Wallet size={24} className="text-indigo-600" />
          Payment Method Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paymentStats && paymentStats.length > 0 ? (
            paymentStats.map((stat, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-700">{stat.method}</h3>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{stat.count} invoices</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{currencySymbol}{stat.total.toFixed(2)}</div>
                <div className="text-xs text-gray-500">
                  {stat.count > 0 ? `Avg: ${currencySymbol}${(stat.total / stat.count).toFixed(2)}` : 'No transactions'}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-gray-500">
              <p>No payment data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
