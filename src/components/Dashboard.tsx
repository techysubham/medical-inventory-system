import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { io as ioClient } from 'socket.io-client';
import { Package, Users, FileText, AlertTriangle, BarChart3, Settings } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();

  const quickStats = [
    { title: 'Total Medicines', value: '—', icon: Package, color: 'bg-blue-100 text-blue-700' },
    { title: 'Active Suppliers', value: '—', icon: Users, color: 'bg-green-100 text-green-700' },
    { title: 'Pending Orders', value: '—', icon: FileText, color: 'bg-purple-100 text-purple-700' },
    { title: 'Alerts', value: '—', icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
  ];

  const [alertsCount, setAlertsCount] = useState(0);
  const [totalMedicines, setTotalMedicines] = useState<number | string>('—');
  const [activeSuppliers, setActiveSuppliers] = useState<number | string>('—');
  const [pendingOrders, setPendingOrders] = useState<number | string>('—');
  const [lowStockCount, setLowStockCount] = useState<number | string>('—');
  const [expiringSoonCount, setExpiringSoonCount] = useState<number | string>('—');
  

  useEffect(() => {
    let mounted = true;
    const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const backendBase = rawApi.replace(/\/+$/g, '').replace(/\/api$/, '');

    // Fetch initial stats and alerts
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('authToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const apiBase = rawApi.replace(/\/+$/g, '').endsWith('/api') ? rawApi.replace(/\/+$/g, '') : rawApi.replace(/\/+$/g, '') + '/api';

    fetch(`${apiBase}/stats`, { headers })
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (!mounted) return;
        setTotalMedicines(data.totalMedicines ?? '—');
        setActiveSuppliers(data.activeSuppliers ?? '—');
        setPendingOrders(data.pendingOrders ?? '—');
        setLowStockCount(data.lowStockCount ?? '—');
        setExpiringSoonCount(data.expiringSoonCount ?? '—');
      })
      .catch(() => {});

    // Fetch initial alerts
    fetch(`${apiBase}/alerts`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!mounted) return;
        setAlertsCount(Array.isArray(data) ? data.length : (data.count || 0));
      })
      .catch(() => {});

    // Connect Socket.IO to backend base (fallback to same origin)
    const socketUrl = backendBase || undefined;
    const socket = ioClient(socketUrl, { autoConnect: true });
    socket.on('connect', () => {});
    socket.on('alert:created', () => {
      setAlertsCount((c) => c + 1);
    });
    socket.on('stats:update', (stats) => {
      if (!stats) return;
      if (typeof stats.totalMedicines !== 'undefined') setTotalMedicines(stats.totalMedicines);
      if (typeof stats.activeSuppliers !== 'undefined') setActiveSuppliers(stats.activeSuppliers);
      if (typeof stats.pendingOrders !== 'undefined') setPendingOrders(stats.pendingOrders);
      if (typeof stats.lowStockCount !== 'undefined') setLowStockCount(stats.lowStockCount);
      if (typeof stats.expiringSoonCount !== 'undefined') setExpiringSoonCount(stats.expiringSoonCount);
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, []);

  const menuItems = [
    { title: 'Inventory', description: 'Manage medicines and stock', icon: Package },
    { title: 'Suppliers', description: 'Manage supplier information', icon: Users },
    { title: 'Invoices', description: 'Create and track invoices', icon: FileText },
    { title: 'Reports', description: 'View analytics and reports', icon: BarChart3 },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Welcome, {user?.firstName}!</h1>
        <p className="text-blue-100">Medical Inventory Management System</p>
        <div className="mt-4 text-sm text-blue-100">
          <p>Role: <span className="font-semibold capitalize">{user?.role}</span></p>
          <p>Email: {user?.email}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{
                      stat.title === 'Alerts' ? alertsCount
                      : stat.title === 'Total Medicines' ? totalMedicines
                      : stat.title === 'Active Suppliers' ? activeSuppliers
                      : stat.title === 'Pending Orders' ? pendingOrders
                      : stat.value
                    }</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      

      {/* Real-time Warnings */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Real-time Warnings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm">Low Stock Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{lowStockCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-700">
                <AlertTriangle size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm">Expiring Soon</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{expiringSoonCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-100 text-orange-700">
                <BarChart3 size={24} />
              </div>
            </div>
          </div>

          
        </div>
      </div>

      {/* Information Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-2">ℹ️ Getting Started</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Navigate using the sidebar menu to access different features</li>
          <li>• Use Inventory Management to add, edit, or delete medicines</li>
          <li>• Manage suppliers and purchase orders as needed</li>
          <li>• Generate and track invoices for customers</li>
          {user?.role === 'superadmin' && <li>• Access User Management to create and manage user accounts</li>}
        </ul>
      </div>
    </div>
  );
}
