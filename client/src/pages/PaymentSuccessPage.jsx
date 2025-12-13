import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { AlertTriangle, Check, ClipboardList, Bell, Clock, Phone, Home } from 'lucide-react';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();
  const [paymentData, setPaymentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [billStatus, setBillStatus] = useState('pending'); // pending, sending, sent, failed

  useEffect(() => {
    // Get payment data from location state
    const state = location.state;
    if (state?.paymentData) {
      setPaymentData(state.paymentData);
      setIsLoading(false);

      // Send WhatsApp Bill
      const sendBill = async () => {
        if (billStatus !== 'pending') return;
        setBillStatus('sending');
        
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/send-whatsapp-bill`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              orderId: state.paymentData.orderId,
              amount: state.paymentData.amount,
              method: state.paymentData.method || 'online',
              customerName: state.paymentData.customerName,
              customerPhone: state.paymentData.customerPhone,
              items: state.orderItems
            })
          });
          
          const result = await response.json();
          console.log('Bill sending result:', result);
          setBillStatus('sent');
        } catch (error) {
          console.error('Error sending bill:', error);
          setBillStatus('failed');
        }
      };

      sendBill();
    } else {
      // Redirect to home if no payment data
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, navigate]); // Removed billStatus from deps to avoid loop

  const handleBackToHome = () => {
    // Clear cart on successful payment
    navigate('/', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full mx-auto" />
          </div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="px-4 py-12 text-center animate-fade-in-up">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-16 h-16 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Data Not Found</h2>
        <p className="text-gray-600 mb-6">Redirecting you back to home...</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-12 flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md">
        {/* Success Animation */}
        <div className="text-center mb-8 animate-fade-in-up">
          {/* Animated Checkmark */}
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative w-24 h-24">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-primary-light opacity-20 animate-pulse" />
              
              {/* Inner circle */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary-light/20 flex items-center justify-center">
                <Check className="w-12 h-12 text-primary-dark animate-bounce" />
              </div>
            </div>
          </div>

          {/* Thank You Message */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Thank You!
          </h1>
          <p className="text-gray-600 text-lg mb-2">Your order has been confirmed</p>
          <p className="text-sm text-gray-500">
            A confirmation has been sent to your registered mobile number
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-3xl shadow-sm p-8 mb-8 animate-fade-in-up">
          {/* Order ID */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
              Order ID
            </p>
            <p className="text-2xl font-bold text-primary break-all">
              {paymentData.orderId}
            </p>
          </div>

          {/* Payment Details Grid */}
          <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
            {/* Amount */}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-bold text-gray-900 text-lg">
                ₹{paymentData.amount.toFixed(2)}
              </span>
            </div>

            {/* Payment Method */}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-semibold text-gray-900">Razorpay</span>
            </div>

            {/* Status */}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status</span>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-semibold">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Successful
              </span>
            </div>

            {/* Timestamp */}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Date & Time</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(paymentData.timestamp).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Transaction ID */}
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
              Payment ID
            </p>
            <p className="text-xs font-mono text-gray-600 break-all bg-gray-50 rounded-lg p-3">
              {paymentData.razorpayPaymentId}
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-primary/10 border border-primary/20 rounded-3xl p-6 mb-8 animate-fade-in-up">
          <h3 className="font-bold text-primary-dark mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5" /> What's Next?
          </h3>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3 items-center">
              <Bell className="w-4 h-4 text-primary-dark" />
              <span>
                {billStatus === 'sending' && 'Sending bill via WhatsApp...'}
                {billStatus === 'sent' && 'Bill sent to your WhatsApp!'}
                {billStatus === 'failed' && 'Could not send WhatsApp bill.'}
                {billStatus === 'pending' && 'Preparing your bill...'}
              </span>
            </li>
            <li className="flex gap-3 items-center">
              <Clock className="w-4 h-4 text-primary-dark" />
              <span>Your order will be prepared and delivered soon</span>
            </li>
            <li className="flex gap-3 items-center">
              <Phone className="w-4 h-4 text-primary-dark" />
              <span>You can track your order in the app</span>
            </li>
          </ul>
        </div>

        {/* Back to Home Button */}
        <button
          onClick={handleBackToHome}
          className="w-full bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-gray-900 font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-yellow hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 group animate-fade-in-up"
        >
          <span>Back to Home</span>
          <Home className="w-5 h-5 group-hover:-rotate-45 transition-transform duration-300" />
        </button>

        {/* Support Link */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Having issues?{' '}
          <a
            href="mailto:support@cafe.com"
            className="text-primary hover:text-primary-dark transition-colors font-semibold"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
