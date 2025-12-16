import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ShoppingBag } from 'lucide-react';

export default function BottomOrderBar({ isVisible = true }) {
  const navigate = useNavigate();
  const { getCartItems, getTotalItems } = useCart();
  
  const cartItems = getCartItems();
  const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const totalItems = getTotalItems();
  const hasItems = totalItems > 0;
  const shouldShow = hasItems && isVisible;

  return (
    <>
      {/* Bottom Order Bar - positioned above nav bar */}
      <div
        className={`fixed bottom-20 left-4 right-4 z-50 transition-all duration-500 transform mb-6 ${
          shouldShow
            ? 'translate-y-0 opacity-100'
            : 'translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={() => navigate('/order-summary')}
          className="w-full bg-white backdrop-blur-md border border-gray-200 text-gray-900 p-4 rounded-2xl shadow-2xl flex items-center justify-between group hover:bg-gray-200 transition-all duration-300"
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
            <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
              View Cart ({totalItems})
            </span>
            <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </button>
      </div>
    </>
  );
}
