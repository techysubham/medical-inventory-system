import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';

const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedBase = rawApi.replace(/\/+$/g, '');
const API_URL = normalizedBase.endsWith('/api') ? normalizedBase : normalizedBase + '/api';

interface Alert {
  _id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  type: 'stock' | 'expiry' | 'order' | 'system' | 'other';
  status: 'unread' | 'read';
  createdAt?: string;
}

export function AlertsManagement() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    if (token) {
      fetchAlerts();
      // Refresh alerts every 30 seconds
      const interval = setInterval(fetchAlerts, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/alerts`, { headers });
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const data = await response.json();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/alerts/${id}`, { 
        method: 'DELETE', 
        headers 
      });
      if (!response.ok) throw new Error('Failed to delete alert');
      setAlerts(alerts.filter(a => a._id !== id));
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle size={20} />;
      case 'medium':
        return <Clock size={20} />;
      default:
        return <CheckCircle size={20} />;
    }
  };

  if (loading) return <div className="p-8 text-center">Loading alerts...</div>;

  const filteredAlerts = filterType === 'all' 
    ? alerts 
    : alerts.filter(a => a.type === filterType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
        <span className="text-sm text-gray-600">{filteredAlerts.length} alerts</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterType === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('stock')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterType === 'stock'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Low Stock
        </button>
        <button
          onClick={() => setFilterType('expiry')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterType === 'expiry'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Expiry
        </button>
        <button
          onClick={() => setFilterType('order')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterType === 'order'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Orders
        </button>
      </div>

      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <div key={alert._id} className={`border-l-4 p-4 rounded-lg flex items-start justify-between ${getSeverityColor(alert.severity)}`}>
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
              <div className="flex-1">
                <h3 className="font-semibold">{alert.title}</h3>
                <p className="text-sm mt-1">{alert.message}</p>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-xs opacity-75">{alert.createdAt?.split('T')[0]}</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    alert.status === 'read' ? 'opacity-50' : 'font-bold'
                  }`}>
                    {alert.status === 'read' ? 'Read' : 'New'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => deleteAlert(alert._id)}
              className="ml-3 p-2 hover:bg-white hover:bg-opacity-30 rounded transition"
              title="Dismiss alert"
            >
              <X size={20} />
            </button>
          </div>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg">
          {filterType === 'all' ? 'No alerts at this time' : `No ${filterType} alerts`}
        </div>
      )}
    </div>
  );
}
