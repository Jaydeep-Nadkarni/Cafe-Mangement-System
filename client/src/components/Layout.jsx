import { useLocation } from 'react-router-dom';
import Header from './Header';
import BottomOrderBar from './BottomOrderBar';
import BottomNav from './BottomNav';

export default function Layout({ children }) {
  const location = useLocation();
  
  // Hide nav on certain pages
  const hideNav = ['/order-summary', '/payment-success'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-bg-cream flex flex-col font-sans">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className={`flex-1 ${!hideNav ? 'pb-24 md:pb-6' : 'pb-6'} max-w-7xl w-full mx-auto`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideNav && <BottomNav />}

      {/* Bottom Order Bar */}
      {!hideNav && <BottomOrderBar />}
    </div>
  );
}
