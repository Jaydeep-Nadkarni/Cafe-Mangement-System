// Razorpay Integration Utility
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initiatePayment = async ({
  amount,
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onFailure,
}) => {
  // Load Razorpay script if not already loaded
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    onFailure(new Error('Failed to load Razorpay'));
    return;
  }

  // Check if Razorpay object exists
  if (!window.Razorpay) {
    onFailure(new Error('Razorpay is not available'));
    return;
  }

  try {
    // Create order on backend (mock for now - integrate with your API)
    // const response = await fetch('/api/payments/create-order', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ amount, orderId })
    // });
    // const { razorpayOrderId } = await response.json();

    // Mock razorpay order ID for demo
    // const razorpayOrderId = `order_${Date.now()}`;

    // Get Razorpay key from environment variables (Vite uses import.meta.env)
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1DP5MMOlF23iry';

    // Razorpay configuration
    const options = {
      key: razorpayKey, // Use key from .env.local
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      name: 'Cafe Management System',
      description: `Order #${orderId}`,
      // order_id: razorpayOrderId, // REMOVED: Do not pass invalid order_id. Only pass if created via API.
      
      // Customer details
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
      },

      // Theme
      theme: {
        color: '#FDD835', // Yellow primary color
      },

      // Success callback
      handler: function (response) {
        console.log('Payment successful:', response);
        onSuccess({
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
          orderId: orderId,
          amount: amount,
          timestamp: new Date().toISOString(),
        });
      },

      // Modal closed callback
      modal: {
        ondismiss: function () {
          console.log('Payment modal closed');
          onFailure(new Error('Payment cancelled by user'));
        },
      },

      // Retry enabled
      retry: {
        enabled: true,
        max_count: 3,
      },

      // Additional notes
      notes: {
        orderId: orderId,
        customerPhone: customerPhone,
      },
    };

    // Open Razorpay modal
    const rzp = new window.Razorpay(options);

    // Handle payment errors
    rzp.on('payment.failed', function (response) {
      console.error('Payment failed:', response.error);
      onFailure(new Error(response.error.description || 'Payment failed'));
    });

    rzp.open();
  } catch (error) {
    console.error('Payment initiation error:', error);
    onFailure(error);
  }
};

// Verify payment signature on backend (call this after successful payment)
export const verifyPaymentSignature = async (paymentData) => {
  try {
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    const result = await response.json();
    return result.verified;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};
