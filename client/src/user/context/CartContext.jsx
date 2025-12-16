import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

// Helper to create unique cart key for items with/without sizes
const getCartKey = (itemId, size = null) => size ? `${itemId}-${size}` : `${itemId}`;

export function CartProvider({ children }) {
  const [cart, setCart] = useState({});
  const [coupon, setCoupon] = useState(null);

  const applyCoupon = (couponData) => {
    setCoupon(couponData);
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  const addItem = (item, size = null) => {
    if (!item) return;
    const itemId = item._id || item.id;
    const key = getCartKey(itemId, size);
    setCart(prev => ({
      ...prev,
      [key]: {
        quantity: (prev[key]?.quantity || 0) + 1,
        item,
        size
      }
    }));
  };

  const removeItem = (itemId, size = null) => {
    const key = getCartKey(itemId, size);
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[key]?.quantity > 1) {
        newCart[key] = { ...newCart[key], quantity: newCart[key].quantity - 1 };
      } else {
        delete newCart[key];
      }
      return newCart;
    });
  };

  const deleteItem = (itemId, size = null) => {
    const key = getCartKey(itemId, size);
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[key];
      return newCart;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  const getQuantity = (itemId, size = null) => {
    const key = getCartKey(itemId, size);
    return cart[key]?.quantity || 0;
  };

  // Get total quantity for an item across all sizes
  const getTotalQuantityForItem = (itemId) => {
    return Object.entries(cart)
      .filter(([key]) => key.startsWith(`${itemId}-`) || key === `${itemId}`)
      .reduce((sum, [, data]) => sum + data.quantity, 0);
  };

  const getTotalItems = () => Object.values(cart).reduce((sum, data) => sum + data.quantity, 0);

  // Get price for item considering size
  const getItemPrice = (item, size = null) => {
    if (!item || !item.price) return 0;
    if (size && item.sizes && Array.isArray(item.sizes)) {
      const sizeData = item.sizes.find(s => s && s.name === size);
      return sizeData ? sizeData.price : item.price;
    }
    return item.price;
  };

  // Get cart items as array for display
  const getCartItems = () => {
    return Object.entries(cart).map(([key, data]) => ({
      key,
      ...data,
      price: getItemPrice(data.item, data.size)
    }));
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addItem, 
      removeItem, 
      deleteItem, 
      clearCart, 
      getQuantity, 
      getTotalQuantityForItem,
      getTotalItems,
      getItemPrice,
      getCartItems,
      coupon,
      applyCoupon,
      removeCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
