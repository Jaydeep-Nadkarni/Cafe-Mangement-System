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
      {/* Bottom Order Bar - positioned above nav bar */}
      <div
        className={`fixed bottom-20 left-4 right-4 z-50 transition-all duration-500 transform ${
          hasItems
            ? 'translate-y-0 opacity-100'
            : 'translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={() => navigate('/order-summary')}
          className="w-full bg-gray-900 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between group hover:bg-gray-800 transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="bg-primary p-2.5 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-gray-900" />
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
