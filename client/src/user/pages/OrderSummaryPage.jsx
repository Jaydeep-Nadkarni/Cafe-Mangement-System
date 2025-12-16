import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getTableSession } from '../utils/sessionStorage';
import MobileNumberModal from '../components/MobileNumberModal';
import { ShoppingCart, Lightbulb, ArrowRight, Tag, Check, X, CreditCard, Banknote, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { formatCurrency } from '../../utils/formatCurrency';

export default function OrderSummaryPage() {
  const navigate = useNavigate();
  const { cart, clearCart, getCartItems, getItemPrice } = useCart();
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponInput, setCouponInput] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [session, setSession] = useState(null);
  const [chefNotes, setChefNotes] = useState('');

  // Retrieve branch code and table number from persistent session
  useEffect(() => {
    const retrievedSession = getTableSession();
    console.log('Session retrieved:', retrievedSession);
    if (retrievedSession) {
      setSession(retrievedSession);
      setBranchCode(retrievedSession.branchCode);
      setTableNumber(retrievedSession.tableNumber);
      console.log('Set branchCode:', retrievedSession.branchCode, 'tableNumber:', retrievedSession.tableNumber);
    } else {
      console.warn('No session found - user may not have scanned QR code');
    }
  }, []);

  // Get cart items as array
  const cartItems = getCartItems();

  // Redirect if no items in cart
  if (cartItems.length === 0) {
    return (
      <div className="px-4 py-12 text-center animate-fade-in-up">
        <div className="flex justify-center mb-4">
          <div className="bg-gray-100 p-6 rounded-full">
            <ShoppingCart className="w-12 h-12 text-gray-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 font-display">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 font-body">Add some delicious items to proceed</p>
        <button
          onClick={() => navigate('/menu')}
          className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-xl transition-all duration-300 shadow-lg"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  // Show warning if no session (user didn't scan QR)
  if (!session) {
    return (
      <div className="px-4 py-12 text-center animate-fade-in-up">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 p-6 rounded-full">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 font-display">No Table Session Found</h2>
        <p className="text-gray-500 mb-8 font-body">Please scan the QR code at your table to proceed</p>
        <button
          onClick={() => navigate('/menu')}
          className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-xl transition-all duration-300 shadow-lg"
        >
          Go Back to Menu
        </button>
      </div>
    );
  }

  // Calculate pricing
  const subtotal = cartItems.reduce((sum, cartItem) => {
    return sum + (cartItem.price * cartItem.quantity);
  }, 0);

  const taxRate = 0.05; // 5% GST
  const tax = subtotal * taxRate;

  // Coupon discount - simple mock coupons
  const couponDiscounts = {
    'SAVE10': 0.10,
    'SAVE20': 0.20,
    'WELCOME5': 0.05
  };

  let discountRate = 0;
  if (appliedCoupon) {
    if (appliedCoupon.startsWith('WT')) {
      discountRate = 0.10; // 10% for Wordle coupons
    } else {
      discountRate = couponDiscounts[appliedCoupon] || 0;
    }
  }

  const discountAmount = subtotal * discountRate;
  const total = subtotal + tax - discountAmount;

  const handleApplyCoupon = () => {
    const code = couponInput.toUpperCase();
    // Accept predefined coupons OR Wordle coupons (starting with WT)
    if (code in couponDiscounts || (code.startsWith('WT') && code.length > 2)) {
      setAppliedCoupon(code);
      setCouponInput('');
    } else {
      alert('Invalid coupon code');
      setCouponInput('');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  const handlePaymentSelect = (method) => {
    // Always show modal to collect customer details before proceeding
    setPaymentMethod(method);
    setShowMobileModal(true);
  };

  return (
    <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto pb-32">
      {/* Page Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-display">Order Summary</h1>
        <p className="text-gray-500 font-body">Review your order before payment</p>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-3xl shadow-card p-6 md:p-8 mb-6 animate-fade-in-up border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-6 font-display">Your Items</h2>
        <div className="space-y-6">
          {cartItems.map((cartItem) => {
            const { item, quantity, size, price, key } = cartItem;
            const itemTotal = price * quantity;
            
            return (
              <div key={key} className="flex items-start justify-between group">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 font-display">
                      {item.name}
                      {size && (
                        <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                          {item.sizes?.find(s => s.name === size)?.label || size}
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 font-mono mt-1">
                      {quantity} x {formatCurrency(price)}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-gray-900 font-mono">{formatCurrency(itemTotal)}</span>
              </div>
            );
          })}
        </div>
        
        <div className="my-6 border-t border-gray-100" />

        {/* Chef Notes Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <label className="text-sm font-bold text-gray-700">Note for Chef (Optional)</label>
          </div>
          <textarea
            value={chefNotes}
            onChange={(e) => setChefNotes(e.target.value)}
            placeholder="E.g., Less spicy, no onions, extra cheese..."
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm resize-none h-24"
          />
        </div>

        <div className="my-6 border-t border-gray-100" />

        {/* Coupon Section */}
        <div className="mb-6">
          {!appliedCoupon ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono text-sm uppercase"
                />
              </div>
              <button
                onClick={handleApplyCoupon}
                disabled={!couponInput}
                className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Apply
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-green-50 border border-green-100 p-4 rounded-xl">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-bold text-green-800 text-sm">Coupon Applied</p>
                  <p className="text-xs text-green-600 font-mono">{appliedCoupon}</p>
                </div>
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="p-2 hover:bg-green-100 rounded-lg text-green-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Bill Details */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-mono">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax (5%)</span>
            <span className="font-mono">{formatCurrency(tax)}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-green-600 font-medium">
              <span>Discount</span>
              <span className="font-mono">-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className="border-t border-dashed border-gray-200 my-3 pt-3 flex justify-between items-end">
            <span className="font-bold text-gray-900 text-lg font-display">Total</span>
            <span className="font-bold text-gray-900 text-2xl font-mono">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Gamification Tip */}
      <div className="bg-linear-to-r from-primary/10 to-primary-light/10 border border-primary/20 rounded-2xl p-4 mb-8 flex items-start gap-3 animate-fade-in-up delay-100">
        <div className="bg-white p-2 rounded-full shadow-sm">
          <Lightbulb className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-sm mb-1">Did you know?</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            You can play mini-games while waiting for your order to win exclusive discounts on your next visit!
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => handlePaymentSelect('online')}
          className="w-full bg-primary hover:bg-primary-dark text-gray-900 font-bold py-4 rounded-2xl shadow-lg shadow-yellow/20 transition-all active:scale-95 flex items-center justify-between px-6 group"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5" />
            <span>Pay Now</span>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => handlePaymentSelect('cash')}
          className="w-full bg-white border-2 border-gray-100 hover:border-gray-200 text-gray-700 font-bold py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-between px-6 group"
        >
          <div className="flex items-center gap-3">
            <Banknote className="w-5 h-5" />
            <span>Pay at Counter Later</span>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-gray-400" />
        </button>
      </div>

      {/* Mobile Number Modal */}
      {showMobileModal && (
        <MobileNumberModal
          isOpen={showMobileModal}
          onClose={() => setShowMobileModal(false)}
          orderData={{
            totalAmount: total,
            orderId: `ORD_${Date.now()}`,
            branchCode: session?.branchCode || branchCode,
            tableNumber: session?.tableNumber || tableNumber,
            items: cartItems,
            chefNotes: chefNotes
          }}
          paymentMethod={paymentMethod}
        />
      )}
    </div>
  );
}
