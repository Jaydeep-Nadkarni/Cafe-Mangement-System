import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { GameProvider } from './context/GameContext';
import { useAuth } from './context/AuthContext';
import { Layout, PageTransition } from './components';
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
} from './pages';
import SplashScreen from './components/SplashScreen';

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <Navigate to={role === 'admin' ? '/admin' : '/branch'} replace />;
  }
  
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Wrapper for Customer Routes to include Layout
const CustomerRoute = ({ children }) => {
  return <Layout>{children}</Layout>;
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Check if splash has been shown in this session
    const splashShown = sessionStorage.getItem('cafe_splash_shown');
    if (splashShown) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('cafe_splash_shown', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <GameProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* Customer Routes */}
          <Route path="/menu" element={<CustomerRoute><PageTransition><MenuPage /></PageTransition></CustomerRoute>} />
          <Route path="/games" element={<CustomerRoute><PageTransition><GamesPage /></PageTransition></CustomerRoute>} />
          <Route path="/ai" element={<CustomerRoute><PageTransition><AIChatPage /></PageTransition></CustomerRoute>} />
          <Route path="/order-summary" element={<CustomerRoute><PageTransition><OrderSummaryPage /></PageTransition></CustomerRoute>} />
          <Route path="/payment-success" element={<CustomerRoute><PageTransition><PaymentSuccessPage /></PageTransition></CustomerRoute>} />
          
          {/* Auth Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/branch" element={<BranchLogin />} />
          
          {/* Protected Dashboard Routes */}
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

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/menu" replace />} />
          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
      </Router>
    </GameProvider>
  )
}


