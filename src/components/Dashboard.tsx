import { useAuth } from '../contexts/AuthContext';
import { Package, Users, FileText, AlertTriangle, BarChart3, Settings } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();

  const quickStats = [
    { title: 'Total Medicines', value: '—', icon: Package, color: 'bg-blue-100 text-blue-700' },
    { title: 'Active Suppliers', value: '—', icon: Users, color: 'bg-green-100 text-green-700' },
    { title: 'Pending Orders', value: '—', icon: FileText, color: 'bg-purple-100 text-purple-700' },
    { title: 'Alerts', value: '—', icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
  ];

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
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
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

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer border border-gray-200"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg text-blue-700">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
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
