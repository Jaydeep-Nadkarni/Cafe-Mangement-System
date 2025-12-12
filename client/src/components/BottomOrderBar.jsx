import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import { MENU_ITEMS } from '../data/menuItems';

export default function BottomOrderBar() {
  const navigate = useNavigate();
  const { cart } = useCart();
  
  const calculateTotal = () => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = MENU_ITEMS.find(i => i.id === parseInt(itemId));
      return total + (item ? item.price * quantity : 0);
    }, 0);
  };

  const totalPrice = calculateTotal();
  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const hasItems = totalItems > 0;

  return (
    <>
      {/* Bottom Order Bar */}
      <div
        className={`fixed bottom-6 left-4 right-4 z-50 transition-all duration-500 transform ${
          hasItems
            ? 'translate-y-0 opacity-100'
            : 'translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={() => navigate('/order-summary')}
          className="w-full bg-gray-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl shadow-gray-900/20 flex items-center justify-between group hover:bg-gray-800 transition-all duration-300 border border-white/10"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-2.5 rounded-xl group-hover:bg-primary group-hover:text-gray-900 transition-colors duration-300">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total</span>
              <span className="text-xl font-bold font-mono">₹{totalPrice.toFixed(0)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              View Cart ({totalItems})
            </span>
            <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </button>
      </div>
    </>
  );
}
