import { useLocation } from 'react-router-dom';
import Header from './Header';
import BottomOrderBar from './BottomOrderBar';
import BottomNav from './BottomNav';

export default function Layout({ children }) {
  const location = useLocation();
  
  // Only hide nav on payment success page
  const hideNav = ['/payment-success'].includes(location.pathname);
  
  // Show order bar only on menu page
  const showOrderBar = location.pathname === '/menu';

  return (
    <div className="min-h-screen bg-bg-cream flex flex-col font-sans">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className={`flex-1 ${!hideNav ? 'pb-24' : 'pb-6'} max-w-7xl w-full mx-auto`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideNav && <BottomNav />}

      {/* Bottom Order Bar */}
      {!hideNav && <BottomOrderBar isVisible={showOrderBar} />}
    </div>
  );
}
