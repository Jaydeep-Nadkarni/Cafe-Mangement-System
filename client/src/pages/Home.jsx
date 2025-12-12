import React from 'react';

const Home = () => {
  return (
    <div className="min-h-[calc(100vh-130px)] pb-[100px]">
      <div className="bg-gradient-to-br from-primary to-primary-light py-12 px-4 text-center shadow-lg">
        <div className="max-w-2xl mx-auto">
          <span className="inline-block text-[80px] mb-4 animate-float">☕</span>
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Welcome to Our Café</h1>
          <p className="text-lg text-gray-900 opacity-90 leading-relaxed m-0">
            Experience the perfect blend of great coffee, delicious food, and warm hospitality
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-12 px-4 max-w-7xl mx-auto">
        <div className="bg-white p-8 rounded-3xl shadow-md text-center transition-all duration-300 hover:translate-y-[-8px] hover:shadow-lg">
          <div className="text-[60px] mb-4 animate-wiggle">🍽️</div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">Fresh Menu</h3>
          <p className="text-base text-gray-500 leading-relaxed m-0">Browse our selection of freshly prepared items</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-md text-center transition-all duration-300 hover:translate-y-[-8px] hover:shadow-lg">
          <div className="text-[60px] mb-4 animate-wiggle">🎮</div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">Fun Games</h3>
          <p className="text-base text-gray-500 leading-relaxed m-0">Play interactive games while you wait</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-md text-center transition-all duration-300 hover:translate-y-[-8px] hover:shadow-lg">
          <div className="text-[60px] mb-4 animate-wiggle">🤖</div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">AI Assistant</h3>
          <p className="text-base text-gray-500 leading-relaxed m-0">Get personalized recommendations</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-md text-center transition-all duration-300 hover:translate-y-[-8px] hover:shadow-lg">
          <div className="text-[60px] mb-4 animate-wiggle">📦</div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">Easy Ordering</h3>
          <p className="text-base text-gray-500 leading-relaxed m-0">Quick and seamless order process</p>
        </div>
      </div>

      <div className="text-center py-12 px-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Ready to Order?</h2>
        <p className="text-base text-gray-500 leading-relaxed m-0">Check out our menu and place your order now!</p>
      </div>
    </div>
  );
};

export default Home;
