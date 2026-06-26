import { useState } from 'react';
import { useAlerts } from '../contexts/AlertsContext';
import { AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';


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
  const { alerts, deleteAlert: removeAlert } = useAlerts();
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

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

  const filteredAlerts = filterType === 'all' ? alerts : alerts.filter((a) => a.type === filterType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <AlertTriangle size={36} className="text-red-600" />
            <span className="text-gradient bg-gradient-to-r from-red-600 to-orange-600">Alerts</span>
          </h1>
          <p className="text-gray-600">{filteredAlerts.length} active alerts</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setFilterType('all')}
          className={`btn-modern px-6 py-3 rounded-xl text-sm font-bold transition ${
            filterType === 'all'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-glossy-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('stock')}
          className={`btn-modern px-6 py-3 rounded-xl text-sm font-bold transition ${
            filterType === 'stock'
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-glossy-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Low Stock
        </button>
        <button
          onClick={() => setFilterType('expiry')}
          className={`btn-modern px-6 py-3 rounded-xl text-sm font-bold transition ${
            filterType === 'expiry'
              ? 'bg-gradient-to-r from-red-600 to-pink-500 text-white shadow-glossy-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
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

      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div key={alert._id} className={`glass-card border-l-4 p-6 rounded-2xl flex items-start justify-between shadow-glossy ${getSeverityColor(alert.severity)} hover:shadow-glossy-lg transition-all duration-300`}>
            <div className="flex items-start gap-4 flex-1">
              <div className="mt-1 text-2xl">{getSeverityIcon(alert.severity)}</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900">{alert.title}</h3>
                <p className="text-sm text-gray-700 mt-2">{alert.message}</p>
                <p className="text-xs text-gray-500 font-medium mt-3">{alert.createdAt?.split('T')[0]}</p>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  await removeAlert(alert._id);
                } catch (err) {
                  console.error('Error deleting alert:', err);
                }
              }}
              className="ml-4 p-2.5 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-lg transition-all duration-300 hover:scale-110"
              title="Dismiss alert"
            >
              <X size={20} />
            </button>
          </div>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="p-12 text-center glass-card rounded-2xl shadow-glossy">
          <p className="text-lg text-gray-500 font-medium">
            {filterType === 'all' ? '✨ No alerts at this time' : `📭 No ${filterType} alerts`}
          </p>
        </div>
      )}
    </div>
  );
}
