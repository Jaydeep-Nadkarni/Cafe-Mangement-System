import { useLocation, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import { GameContext } from '../context/GameContext';
import Header from './Header';
import BottomOrderBar from './BottomOrderBar';
import BottomNav from './BottomNav';

export default function Layout() {
  const location = useLocation();
  const gameContext = useContext(GameContext);
  const isWordleOpen = gameContext?.isWordleOpen || false;
  
  // Hide nav on payment success or during Wordle gameplay
  const hideNav = ['/payment-success'].includes(location.pathname) || isWordleOpen;
  
  // Show order bar only on menu page
  const showOrderBar = location.pathname === '/menu';

  return (
    <div className="min-h-screen bg-bg-cream flex flex-col font-sans">
      {/* Header - Hide during Wordle */}
      {!isWordleOpen && <Header />}

      {/* Main Content */}
      <main className={`flex-1 ${!hideNav ? 'pb-24' : 'pb-6'} max-w-7xl w-full mx-auto`}>
        <Outlet />
      </main>

      {/* Bottom Navigation - Hide during Wordle */}
      {!hideNav && <BottomNav />}

      {/* Bottom Order Bar - Hide during Wordle */}
      {!hideNav && <BottomOrderBar isVisible={showOrderBar} />}
    </div>
  );
}
