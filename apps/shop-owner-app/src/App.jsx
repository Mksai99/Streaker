import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';

// Shop Owner
import ShopDashboard from './pages/shop/Dashboard';
import ShopScanner from './pages/shop/Scanner';
import ShopCustomers from './pages/shop/Customers';
import ShopRewards from './pages/shop/Rewards';
import ShopSettings from './pages/shop/Settings';
import ShopProducts from './pages/shop/Products';
import ShopOffers from './pages/shop/Offers'; // Added

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import ShopRegistration from './pages/shop/Registration'; // Added
import ShopGallery from './pages/shop/Gallery';
import ShopReviews from './pages/shop/Reviews';

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
    if (user.role !== 'shopOwner') {
      localStorage.removeItem('streakify_token');
      window.location.href = '/login';
      return '/login';
    }
    // Simple logic: dashboard handles checking if shop is registered, or we just direct them to dashboard. 
    return '/shop/dashboard';
  };

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={getDashboardPath()} replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={getDashboardPath()} replace /> : <LoginPage />} />
      
      <Route path="/shop/register" element={<ProtectedRoute roles={['shopOwner']}><ShopRegistration /></ProtectedRoute>} />

      {/* Shop Owner Routes */}
      <Route path="/shop" element={<ProtectedRoute roles={['shopOwner']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<ShopDashboard />} />
        <Route path="products" element={<ShopProducts />} />
        <Route path="offers" element={<ShopOffers />} />
        <Route path="scanner" element={<ShopScanner />} />
        <Route path="customers" element={<ShopCustomers />} />
        <Route path="rewards" element={<ShopRewards />} />
        <Route path="settings" element={<ShopSettings />} />
        <Route path="gallery" element={<ShopGallery />} />
        <Route path="reviews" element={<ShopReviews />} />
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
