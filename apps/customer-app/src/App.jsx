import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';

// Customer
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerQRCode from './pages/customer/QRCode';
import CustomerRewards from './pages/customer/Rewards';
import CustomerVisits from './pages/customer/Visits';
import CustomerNotifications from './pages/customer/Notifications';
import CustomerProfile from './pages/customer/Profile';
import CustomerShops from './pages/customer/Shops';
import CustomerShopDetails from './pages/customer/ShopDetails';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } }
});

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">Loading Streakify...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role !== 'customer') {
      localStorage.removeItem('streakify_token');
      window.location.href = '/login';
      return '/login';
    }
    return '/customer/dashboard';
  };

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={getDashboardPath()} replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={getDashboardPath()} replace /> : <LoginPage />} />

      {/* Customer Routes */}
      <Route path="/customer" element={<ProtectedRoute roles={['customer']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="shops" element={<CustomerShops />} />
        <Route path="shops/:id" element={<CustomerShopDetails />} />
        <Route path="qr-code" element={<CustomerQRCode />} />
        <Route path="rewards" element={<CustomerRewards />} />
        <Route path="visits" element={<CustomerVisits />} />
        <Route path="notifications" element={<CustomerNotifications />} />
        <Route path="profile" element={<CustomerProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors closeButton theme="system" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
