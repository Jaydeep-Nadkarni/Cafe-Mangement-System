import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { GameProvider } from './user/context/GameContext';
import { useAuth } from './user/context/AuthContext';
import { Layout, PageTransition } from './user/components';
import { 
  MenuPage, 
  OrderSummaryPage, 
  PaymentSuccessPage, 
  GamesPage, 
  AIChatPage,
  AdminLogin,
  BranchLogin,
  AdminDashboard,
  BranchDashboard
} from './user/pages';
import SplashScreen from './user/components/SplashScreen';

// --- PROTECTED ROUTE COMPONENT ---
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner message="Verifying credentials..." />;

  if (!user) {
    // Redirect to the appropriate login page based on the intended destination
    const loginPath = location.pathname.includes('/admin') ? '/admin' : '/branch';
    return <Navigate to={loginPath} replace />;
  }

  // Admin access: Must be admin or super_admin
  if (role === 'admin' && !['admin', 'super_admin'].includes(user.role)) {
    return <Navigate to="/menu" replace />;
  }

  // Branch access: Can be manager, admin, or super_admin
  if (role === 'branch' && !['manager', 'admin', 'super_admin'].includes(user.role)) {
    return <Navigate to="/menu" replace />;
  }

  return children;
};

// --- ROUTE PERSISTENCE ---
const RouteRestorer = ({ children }) => {
  const { user, loading, saveLastRoute } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Only save routes that are "destinations" (Dashboards or App features)
    const isLoginPath = ['/admin', '/branch'].includes(location.pathname);
    const isRoot = location.pathname === '/';

    if (!loading && user && !isLoginPath && !isRoot) {
      saveLastRoute(location.pathname);
    }
  }, [location, user, loading, saveLastRoute]);

  return children;
};

const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  </div>
);

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const { user, loading } = useAuth();

  useEffect(() => {
    const splashShown = sessionStorage.getItem('cafe_splash_shown');
    if (splashShown) setShowSplash(false);
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('cafe_splash_shown', 'true');
    setShowSplash(false);
  };

  if (showSplash) return <SplashScreen onComplete={handleSplashComplete} />;

  return (
    <GameProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RouteRestorer>
          <AppRoutes />
        </RouteRestorer>
      </Router>
    </GameProvider>
  );
}

function AppRoutes() {
  const { user, loading, getLastRoute } = useAuth();
  const location = useLocation();

  // 1. Handle Global Loading State
  if (loading) return <LoadingSpinner message="Restoring session..." />;

  // 2. Handle Initial Redirect (PWA behavior)
  // If user lands on "/" and is logged in, send them to their last saved dashboard or menu
  if (user && location.pathname === '/') {
    const lastRoute = getLastRoute();
    if (lastRoute) return <Navigate to={lastRoute} replace />;
    
    // Fallback based on role if no last route saved
    if (['admin', 'super_admin'].includes(user.role)) return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'manager') return <Navigate to="/branch/dashboard" replace />;
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/admin" element={
        user && ['admin', 'super_admin'].includes(user.role) 
          ? <Navigate to="/admin/dashboard" replace /> 
          : <AdminLogin />
      } />
      
      <Route path="/branch" element={
        user && ['manager', 'admin', 'super_admin'].includes(user.role)
          ? <Navigate to="/branch/dashboard" replace /> 
          : <BranchLogin />
      } />

      {/* Customer Experience (Inside Layout) */}
      <Route element={<Layout />}>
        <Route path="/menu" element={<PageTransition><MenuPage /></PageTransition>} />
        <Route path="/games" element={<PageTransition><GamesPage /></PageTransition>} />
        <Route path="/ai" element={<PageTransition><AIChatPage /></PageTransition>} />
        <Route path="/order-summary" element={<PageTransition><OrderSummaryPage /></PageTransition>} />
        <Route path="/payment-success" element={<PageTransition><PaymentSuccessPage /></PageTransition>} />
      </Route>

      {/* Protected Dashboards */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute role="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/branch/dashboard" element={
        <ProtectedRoute role="branch">
          <BranchDashboard />
        </ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="/" element={<Navigate to="/menu" replace />} />
      <Route path="*" element={<Navigate to="/menu" replace />} />
    </Routes>
  );
}