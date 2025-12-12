import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import MobileNumberModal from '../components/MobileNumberModal';

// Mock menu data with prices
const MENU_DATA = {
  1: { name: 'Espresso', price: 3.99 },
  2: { name: 'Cappuccino', price: 4.49 },
  3: { name: 'Croissant', price: 3.50 },
  4: { name: 'Chocolate Muffin', price: 3.99 },
  5: { name: 'Latte', price: 4.99 },
  6: { name: 'Avocado Toast', price: 6.99 },
  7: { name: 'Cheesecake', price: 5.99 },
  8: { name: 'Club Sandwich', price: 7.99 },
  9: { name: 'Macchiato', price: 4.49 },
  10: { name: 'Blueberry Muffin', price: 3.99 },
  11: { name: 'Tiramisu', price: 5.99 },
  12: { name: 'Panini', price: 6.99 }
};

export default function OrderSummaryPage() {
  const navigate = useNavigate();
  const { cart } = useCart();
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponInput, setCouponInput] = useState('');

  // Redirect if no items in cart
  if (Object.keys(cart).length === 0) {
    return (
      <div className="px-4 py-12 text-center animate-fade-in-up">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Add items to proceed with checkout</p>
        <button
          onClick={() => navigate('/menu')}
          className="bg-primary hover:bg-primary-dark text-gray-900 font-semibold px-8 py-3 rounded-2xl transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  // Calculate pricing
  const subtotal = Object.entries(cart).reduce((sum, [itemId, qty]) => {
    return sum + (MENU_DATA[itemId]?.price || 0) * qty;
  }, 0);

  const taxRate = 0.08; // 8% tax
  const tax = subtotal * taxRate;

  // Coupon discount - simple mock coupons
  const couponDiscounts = {
    'SAVE10': 0.10,
    'SAVE20': 0.20,
    'WELCOME5': 0.05
  };

  const discountRate = appliedCoupon ? couponDiscounts[appliedCoupon] || 0 : 0;
  const discountAmount = subtotal * discountRate;
  const total = subtotal + tax - discountAmount;

  const handleApplyCoupon = () => {
    if (couponInput.toUpperCase() in couponDiscounts) {
      setAppliedCoupon(couponInput.toUpperCase());
      setCouponInput('');
    } else {
      alert('Invalid coupon code');
      setCouponInput('');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  const handlePayNow = () => {
    setShowMobileModal(true);
  };

  return (
    <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto pb-32">
      {/* Page Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Summary</h1>
        <p className="text-gray-600">Review your order before payment</p>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 mb-6 animate-fade-in-up">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Your Items</h2>
        <div className="space-y-4">
          {Object.entries(cart).map(([itemId, quantity]) => {
            const item = MENU_DATA[itemId];
            const itemTotal = item.price * quantity;
            return (
              <div
                key={itemId}
                className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">Qty: {quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${itemTotal.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">
                    ${item.price.toFixed(2)} each
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coupon Section */}
      <div className="bg-gradient-to-br from-primary/10 to-primary-light/10 rounded-3xl p-6 border border-primary/20 mb-6 animate-fade-in-up">
        <h3 className="text-sm font-bold text-primary-dark mb-4 uppercase tracking-wider">
          Apply Coupon or Reward
        </h3>
        {!appliedCoupon ? (
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              className="flex-1 bg-white border border-primary/30 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handleApplyCoupon}
              className="px-6 py-3 bg-primary hover:bg-primary-dark text-gray-900 font-semibold rounded-2xl transition-colors text-sm whitespace-nowrap"
            >
              Apply
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span className="font-semibold text-primary-dark">{appliedCoupon}</span>
              <span className="text-sm text-gray-600">Applied</span>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ✕
            </button>
          </div>
        )}
        <p className="text-xs text-gray-600 mt-3">
          💡 Try: SAVE10 (10%), SAVE20 (20%), or WELCOME5 (5%)
        </p>
      </div>

      {/* Price Breakdown */}
      <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 animate-fade-in-up">
        {/* Subtotal */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
        </div>

        {/* Tax */}
        <div className="flex justify-between items-center py-4 border-b border-gray-100">
          <span className="text-gray-600">Tax (8%)</span>
          <span className="font-semibold text-gray-900">${tax.toFixed(2)}</span>
        </div>

        {/* Discount */}
        {discountAmount > 0 && (
          <div className="flex justify-between items-center py-4 border-b border-gray-100">
            <span className="text-green-600 font-medium">
              Discount ({(discountRate * 100).toFixed(0)}%)
            </span>
            <span className="font-semibold text-green-600">
              -${discountAmount.toFixed(2)}
            </span>
          </div>
        )}

        {/* Total Payable */}
        <div className="flex justify-between items-center pt-6">
          <span className="text-lg font-bold text-gray-900">Total Payable</span>
          <div className="text-right">
            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              ${total.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {Object.values(cart).reduce((sum, qty) => sum + qty, 0)} items
            </p>
          </div>
        </div>
      </div>

      {/* Pay Now Button */}
      <button
        onClick={handlePayNow}
        className="w-full mt-8 bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-gray-900 font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-yellow hover:shadow-lg active:scale-95 animate-fade-in-up flex items-center justify-center gap-2 group"
      >
        <span>Pay Now</span>
        <svg
          className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </button>

      {/* Mobile Number Modal */}
      {showMobileModal && (
        <MobileNumberModal
          isOpen={showMobileModal}
          onClose={() => setShowMobileModal(false)}
          orderData={{
            totalAmount: total,
            orderId: `ORD_${Date.now()}`,
          }}
        />
      )}
    </div>
  );
}
