import { ReactNode, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Heart,
  Bell,
  Search,
  FileText,
  Percent,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { signOut, user, hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const allNavigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, permission: null },
    { id: 'inventory', name: 'Inventory', icon: Package, permission: 'view_inventory' },
    { id: 'medicine-search', name: 'Medicine Search', icon: Search, permission: 'view_inventory' },
    { id: 'invoices', name: 'Invoices', icon: FileText, permission: 'view_invoices' },
    { id: 'discounts', name: 'Discounts', icon: Percent, permission: 'view_discounts' },
    { id: 'suppliers', name: 'Suppliers', icon: Users, permission: 'view_suppliers' },
    { id: 'orders', name: 'Purchase Orders', icon: ShoppingCart, permission: 'view_inventory' },
    { id: 'alerts', name: 'Alerts', icon: AlertTriangle, permission: 'view_inventory' },
    { id: 'reports', name: 'Reports', icon: BarChart3, permission: 'view_reports' },
    { id: 'settings', name: 'Settings', icon: Settings, permission: 'view_settings' },
  ];

  // Filter navigation based on permissions
  const navigation = allNavigation.filter((item) => {
    if (!item.permission) return true; // Always show dashboard
    if (user?.isSuperAdmin || user?.role === 'superadmin') return true;
    return user?.permissions?.includes(item.permission);
  });

  // Add admin panel link for users with manage_users permission or superadmin
  const adminLink = (user?.isSuperAdmin || user?.role === 'superadmin' || hasPermission('manage_users')) ? 
    { id: 'users', name: 'User Management', icon: Users } : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-600 to-teal-600 p-2 rounded-lg">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">MedInventory</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="text-sm">
              <p className="font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-gray-600 text-xs">{user?.email}</p>
              <div className="mt-2">
                <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                  currentPage === item.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </button>
            ))}

            {/* Admin Section */}
            {adminLink && (
              <>
                <div className="px-3 py-2 mt-6 text-xs font-semibold text-gray-500 uppercase">Admin</div>
                <button
                  onClick={() => {
                    onNavigate(adminLink.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                    currentPage === adminLink.id
                      ? 'bg-red-50 text-red-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <adminLink.icon className="w-5 h-5" />
                  {adminLink.name}
                </button>
              </>
            )}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 px-4 lg:px-8">
          <div className="flex items-center justify-between h-full">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 hidden lg:block">
              {allNavigation.find((n) => n.id === currentPage)?.name || 
               (currentPage === 'users' ? 'User Management' : 'Dashboard')}
            </h1>
            <div className="flex items-center gap-4">
              <button className="relative text-gray-600 hover:text-gray-900">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
