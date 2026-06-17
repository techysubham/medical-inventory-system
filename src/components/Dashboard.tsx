import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { io as ioClient } from 'socket.io-client';
import { Package, Users, FileText, AlertTriangle, BarChart3, Settings, Activity, Zap } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();

  const quickStats = [
    { title: 'Total Medicines', value: '—', icon: Package, gradient: 'from-blue-500 to-cyan-500', lightGradient: 'from-blue-100 to-cyan-100' },
    { title: 'Active Suppliers', value: '—', icon: Users, gradient: 'from-emerald-500 to-teal-500', lightGradient: 'from-emerald-100 to-teal-100' },
    { title: 'Pending Orders', value: '—', icon: FileText, gradient: 'from-purple-500 to-pink-500', lightGradient: 'from-purple-100 to-pink-100' },
    { title: 'Alerts', value: '—', icon: AlertTriangle, gradient: 'from-red-500 to-orange-500', lightGradient: 'from-red-100 to-orange-100' },
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
    <div className="space-y-8 pb-6">
      {/* Welcome Section - Enhanced with Glossy Effect */}
      <div className="relative overflow-hidden rounded-3xl p-8 text-white shadow-glossy-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600 opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-glossy"></div>
        <div className="relative">
          <div className="mb-6 inline-block">
            <div className="badge-modern bg-white/20 text-white border-white/30">
              <Activity size={18} />
              <span>Welcome Back</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-2 tracking-tight">Hello, {user?.firstName}! 👋</h1>
          <p className="text-blue-50 text-lg mb-6">Medical Inventory Management System</p>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <p className="text-blue-100 text-sm mb-1">Role</p>
              <p className="text-white font-semibold capitalize text-lg">{user?.role}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <p className="text-blue-100 text-sm mb-1">Email</p>
              <p className="text-white font-semibold truncate text-sm">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <BarChart3 size={32} className="text-blue-600" />
          <span>Quick Stats</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            const bgColors = [
              'bg-gradient-to-br from-blue-50 to-blue-100/50',
              'bg-gradient-to-br from-emerald-50 to-emerald-100/50',
              'bg-gradient-to-br from-purple-50 to-purple-100/50',
              'bg-gradient-to-br from-rose-50 to-rose-100/50'
            ];
            return (
              <div key={index} className={`stat-card group ${bgColors[index]} border-l-4 ${
                index === 0 ? 'border-blue-500' :
                index === 1 ? 'border-emerald-500' :
                index === 2 ? 'border-purple-500' :
                'border-rose-500'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                  </div>
                  <div className={`icon-box bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                    <Icon size={24} />
                  </div>
                </div>
                <p className={`stat-value bg-gradient-to-r ${stat.gradient}`}>
                  {stat.title === 'Alerts' ? alertsCount
                  : stat.title === 'Total Medicines' ? totalMedicines
                  : stat.title === 'Active Suppliers' ? activeSuppliers
                  : stat.title === 'Pending Orders' ? pendingOrders
                  : stat.value
                  }
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Warnings */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <AlertTriangle size={32} className="text-orange-500" />
          <span>Real-time Warnings</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="stat-card group bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-l-4 border-yellow-500">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">Low Stock Items</p>
              </div>
              <div className="icon-box bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg">
                <AlertTriangle size={24} />
              </div>
            </div>
            <p className="stat-value bg-gradient-to-r from-yellow-500 to-orange-500">{lowStockCount}</p>
          </div>

          <div className="stat-card group bg-gradient-to-br from-red-50 to-red-100/50 border-l-4 border-red-500">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">Expiring Soon</p>
              </div>
              <div className="icon-box bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg">
                <BarChart3 size={24} />
              </div>
            </div>
            <p className="stat-value bg-gradient-to-r from-orange-500 to-red-500">{expiringSoonCount}</p>
          </div>
        </div>
      </div>

      {/* Information Section - Enhanced */}
      <div className="glass-card p-8 border-l-4 border-blue-500">
        <div className="flex items-start gap-4">
          <div className="text-3xl">ℹ️</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Getting Started</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-gray-700">
                <span className="text-blue-500 font-bold text-lg mt-0.5">→</span>
                <span>Navigate using the sidebar menu to access different features</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700">
                <span className="text-blue-500 font-bold text-lg mt-0.5">→</span>
                <span>Use Inventory Management to add, edit, or delete medicines</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700">
                <span className="text-blue-500 font-bold text-lg mt-0.5">→</span>
                <span>Manage suppliers and purchase orders as needed</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700">
                <span className="text-blue-500 font-bold text-lg mt-0.5">→</span>
                <span>Generate and track invoices for customers</span>
              </li>
              {user?.role === 'superadmin' && (
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-blue-500 font-bold text-lg mt-0.5">→</span>
                  <span>Access User Management to create and manage user accounts</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
