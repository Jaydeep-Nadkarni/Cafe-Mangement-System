import { useNavigate, useLocation } from 'react-router-dom';
import { UtensilsCrossed, Gamepad2 } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed, path: '/menu' },
    { id: 'games', label: 'Games', icon: Gamepad2, path: '/games' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-around md:justify-start md:gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-1 py-4 px-6 transition-all duration-300 relative group ${
                  isActive(tab.path)
                    ? 'text-primary'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {/* Active indicator bar */}
                {isActive(tab.path) && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-b-lg animate-fade-in-up" />
                )}

                {/* Icon */}
                <Icon className={`w-6 h-6 transition-transform duration-300 group-hover:scale-110 ${isActive(tab.path) ? 'stroke-2' : 'stroke-1.5'}`} />

                {/* Label */}
                <span className="text-xs md:text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
