import { ReactNode, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertsContext';
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
  const { unreadCount } = useAlerts();

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
        <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50">
          {/* Sidebar Header - Enhanced with Glossy Effect */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl opacity-75 blur-lg"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl flex items-center justify-center shadow-glossy">
                  <Heart className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold text-gradient bg-gradient-to-r from-blue-600 to-teal-600">MedInventory</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-all duration-300 text-gray-600 hover:text-gray-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info - Enhanced */}
          <div className="px-4 py-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
            <div className="text-sm">
              <p className="font-bold text-gray-900 text-base">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-gray-600 text-xs mt-1 truncate">{user?.email}</p>
              <div className="mt-3">
                <span className="inline-block px-3 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-glossy-sm capitalize">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  currentPage === item.id
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold shadow-glossy'
                    : 'text-gray-700 hover:bg-gray-100/80 hover:scale-105'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${currentPage === item.id ? 'text-white' : ''}`} />
                  <span className="truncate">{item.name}</span>
                  {item.id === 'alerts' && unreadCount > 0 && (
                    <span className={`ml-auto inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full ${currentPage === item.id ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}`}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
              </button>
            ))}

            {/* Admin Section - Enhanced */}
            {adminLink && (
              <>
                <div className="px-4 py-3 mt-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Admin</div>
                <button
                  onClick={() => {
                    onNavigate(adminLink.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    currentPage === adminLink.id
                      ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold shadow-glossy'
                      : 'text-gray-700 hover:bg-red-50/80 hover:scale-105'
                  }`}
                >
                  <adminLink.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${currentPage === adminLink.id ? 'text-white' : ''}`} />
                  <span>{adminLink.name}</span>
                </button>
              </>
            )}
          </nav>

          <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50/80 hover:text-red-700 transition-all duration-300 group font-semibold"
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar - Enhanced with Glossy Effect */}
        <header className="sticky top-0 z-30 h-16 glass-card border-b border-white/20 px-4 lg:px-8 shadow-glossy">
          <div className="flex items-center justify-between h-full">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-blue-100 text-gray-600 hover:text-blue-700 transition-all duration-300"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-gradient bg-gradient-to-r from-blue-600 to-teal-600 hidden lg:block">
              {allNavigation.find((n) => n.id === currentPage)?.name || 
               (currentPage === 'users' ? 'User Management' : 'Dashboard')}
            </h1>
            <div className="flex items-center gap-6">
              <button className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300 group" title="Alerts" onClick={() => onNavigate('alerts')}>
                <Bell className="w-6 h-6 transition-transform group-hover:scale-110" />
                {unreadCount > 0 ? (
                  <span className="absolute top-0 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white shadow-glossy-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : (
                  <span className="absolute top-1 right-1 w-3 h-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-full shadow-glossy-sm opacity-60"></span>
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen">{children}</main>
      </div>
    </div>
  );
}
