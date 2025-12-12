import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Games from './pages/Games';
import AI from './pages/AI';
import OrderSummary from './pages/OrderSummary';
import PaymentSuccess from './pages/PaymentSuccess';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState({});

  const handleAddToCart = (item) => {
    const itemId = item._id || item.id;
    setCartItems(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const handleUpdateQuantity = (item, newQuantity) => {
    const itemId = item._id || item.id;
    if (newQuantity === 0) {
      const newCart = { ...cartItems };
      delete newCart[itemId];
      setCartItems(newCart);
    } else {
      setCartItems(prev => ({
        ...prev,
        [itemId]: newQuantity
      }));
    }
  };

  const handleClearCart = () => {
    setCartItems({});
  };

  const getTotalItems = () => {
    return Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header 
          title="Cafe Management" 
          showCart={true} 
          cartCount={getTotalItems()} 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        
        <main className="flex-1 mt-[60px] w-full pb-[70px] md:pb-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/menu" 
              element={
                <Menu 
                  searchQuery={searchQuery} 
                  cartItems={cartItems}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                />
              } 
            />
            <Route path="/games" element={<Games />} />
            <Route path="/ai" element={<AI />} />
            <Route 
              path="/order-summary" 
              element={
                <OrderSummary 
                  cartItems={cartItems}
                  onUpdateQuantity={handleUpdateQuantity}
                  onClearCart={handleClearCart}
                />
              } 
            />
            <Route path="/payment-success" element={<PaymentSuccess />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
