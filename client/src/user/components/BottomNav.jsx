import { useNavigate, useLocation } from 'react-router-dom';
import { UtensilsCrossed, Gamepad2, Sparkles } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed, path: '/menu' },
    { id: 'games', label: 'Games', icon: Gamepad2, path: '/games' },
    { id: 'ai', label: 'AI', icon: Sparkles, path: '/ai' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-1 py-3 px-6 transition-all duration-300 relative group ${
                  isActive(tab.path)
                    ? 'text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {/* Active indicator bar */}
                {isActive(tab.path) && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-lg animate-fade-in-up" />
                )}

                {/* Icon with background for active state */}
                <div className={`p-2 rounded-xl transition-colors ${isActive(tab.path) ? 'bg-primary' : ''}`}>
                  <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive(tab.path) ? 'stroke-2' : 'stroke-1.5'}`} />
                </div>

                {/* Label */}
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
