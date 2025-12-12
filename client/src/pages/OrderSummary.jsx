import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import QuantitySelector from '../components/QuantitySelector';

const OrderSummary = ({ cartItems = {}, onUpdateQuantity, onClearCart }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/menu');
      const data = await response.json();
      if (data.success) {
        setMenuItems(data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching menu:', err);
      setLoading(false);
    }
  };

  // Calculate cart details
  const cartDetails = Object.entries(cartItems).map(([itemId, quantity]) => {
    const item = menuItems.find(i => (i._id || i.id) === itemId);
    return item ? { ...item, quantity } : null;
  }).filter(Boolean);

  const subtotal = cartDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax - discount;

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'CAFE10') {
      setDiscount(subtotal * 0.1);
      alert('Coupon applied successfully!');
    } else {
      alert('Invalid coupon code');
      setDiscount(0);
    }
  };

  const handleCheckout = () => {
    setShowMobileModal(true);
  };

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobileNumber)) {
      setMobileError('Please enter a valid 10-digit mobile number');
      return;
    }
    setMobileError('');
    setIsProcessing(true);

    try {
      // 1. Create Order on Backend
      const response = await fetch('http://localhost:5000/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create order');
      }

      const { id: order_id, amount, currency } = data.data;

      // 2. Initialize Razorpay Checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_placeholder', // Replace with your actual key
        amount: amount,
        currency: currency,
        name: "Cafe Management System",
        description: "Order Payment",
        image: "https://example.com/your_logo", // Optional
        order_id: order_id,
        handler: function (response) {
          // 3. Handle Success
          // You should verify the signature on the backend here (call /api/payment/verify)
          // For now, we'll assume success and navigate
          
          if (onClearCart) onClearCart();
          setShowMobileModal(false);
          navigate('/payment-success', { 
            state: { 
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id
            } 
          });
        },
        prefill: {
          contact: mobileNumber,
        },
        theme: {
          color: "#FDD835",
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response){
        alert(`Payment Failed: ${response.error.description}`);
        setIsProcessing(false);
      });
      
      rzp1.open();

    } catch (error) {
      console.error('Payment Error:', error);
      alert('Something went wrong while initializing payment. Please try again.');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="text-center p-12 text-gray-500">Loading cart...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-130px)] px-4 py-6 pb-[100px] max-w-3xl mx-auto relative">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-1 text-gray-900">Order Summary</h1>
        <p className="text-base text-gray-500 m-0">{cartDetails.length} item(s) in cart</p>
      </div>

      {cartDetails.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-3xl shadow-md">
          <div className="text-[80px] mb-6 opacity-50">🛒</div>
          <h2 className="text-xl font-bold mb-2 text-gray-900">Your cart is empty</h2>
          <p className="text-base text-gray-500 m-0 mb-6">Add some delicious items from our menu</p>
          <Button variant="primary" onClick={() => navigate('/menu')}>Browse Menu</Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 mb-8">
            {cartDetails.map((item) => (
              <div key={item._id || item.id} className="flex gap-4 p-6 bg-white rounded-3xl shadow-md transition-all duration-300 hover:shadow-lg">
                <div className="flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-gray-100">
                  <img 
                    src={item.image || 'https://via.placeholder.com/100?text=No+Image'} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                    }}
                  />
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-primary-dark font-bold">${item.price.toFixed(2)}</p>
                </div>

                <div className="flex flex-col items-end justify-between gap-2">
                  <QuantitySelector
                    quantity={item.quantity}
                    min={1}
                    max={99}
                    size="small"
                    onChange={(qty) => onUpdateQuantity(item, qty)}
                  />
                  <button
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-150"
                    onClick={() => onUpdateQuantity(item, 0)}
                    aria-label="Remove item"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-md mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Order Total</h2>
            
            {/* Coupon Input */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Coupon Code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary bg-gray-50"
              />
              <button 
                onClick={handleApplyCoupon}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
              >
                Apply
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-100">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button 
            className="w-full bg-primary text-gray-900 py-4 rounded-2xl font-bold text-lg shadow-yellow hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
            onClick={handleCheckout}
          >
            Proceed to Pay
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </>
      )}

      {/* Mobile Number Modal */}
      {showMobileModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl animate-slide-up">
            <button 
              onClick={() => setShowMobileModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">Enter Mobile Number</h3>
            <p className="text-gray-500 mb-6">We'll send you order updates via SMS</p>

            <form onSubmit={handleMobileSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setMobileNumber(val);
                    setMobileError('');
                  }}
                  placeholder="Enter 10-digit number"
                  className={`w-full px-4 py-3 rounded-xl border-2 ${mobileError ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-primary bg-gray-50'} outline-none transition-colors text-lg tracking-wide`}
                />
                {mobileError && <p className="text-red-500 text-sm mt-1">{mobileError}</p>}
              </div>

              <button 
                type="submit"
                disabled={isProcessing}
                className="w-full bg-primary text-gray-900 py-3 rounded-xl font-bold text-lg shadow-yellow hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Confirm & Pay'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSummary;
            
            <div className="flex justify-between mb-3 text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between mb-3 text-gray-600">
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>

            <div className="my-4 border-t border-gray-100"></div>

            <div className="flex justify-between mb-6 text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <Button
              variant="primary"
              size="large"
              fullWidth
              onClick={handleCheckout}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              }
            >
              Proceed to Checkout
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderSummary;
