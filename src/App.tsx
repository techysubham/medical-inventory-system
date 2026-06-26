import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AlertsProvider } from './contexts/AlertsContext';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { InventoryManagement } from './components/InventoryManagement';
import { SupplierManagement } from './components/SupplierManagement';
import { PurchaseOrderManagement } from './components/PurchaseOrderManagement';
import { AlertsManagement } from './components/AlertsManagement';
import { ReportsAnalytics } from './components/ReportsAnalytics';
import { SettingsManagement } from './components/SettingsManagement';
import { MedicineSearch } from './components/MedicineSearch';
import { InvoiceGeneration } from './components/InvoiceGeneration';
import { DiscountManagement } from './components/DiscountManagement';
import { UserManagement } from './components/UserManagement';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <InventoryManagement />;
      case 'medicine-search':
        return <MedicineSearch />;
      case 'invoices':
        return <InvoiceGeneration />;
      case 'discounts':
        return <DiscountManagement />;
      case 'suppliers':
        return <SupplierManagement />;
      case 'orders':
        return <PurchaseOrderManagement />;
      case 'alerts':
        return <AlertsManagement />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'settings':
        return <SettingsManagement />;
      case 'users':
        return <UserManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AlertsProvider>
          <AppContent />
        </AlertsProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
