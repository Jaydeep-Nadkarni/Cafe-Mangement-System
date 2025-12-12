import { useLocation } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import BottomOrderBar from './BottomOrderBar';

export default function Layout({ children }) {
  const location = useLocation();
  
  // Hide nav on certain pages
  const hideNav = ['/order-summary', '/payment-success'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className={`flex-1 ${!hideNav ? 'pb-24 md:pb-6' : 'pb-6'} max-w-7xl w-full mx-auto`}>
        {children}
      </main>

      {/* Bottom Order Bar */}
      {!hideNav && <BottomOrderBar />}

      {/* Bottom Navigation */}
      {!hideNav && <BottomNav />}
    </div>
  );
}
