import React from 'react';

const Games = () => {
  return (
    <div className="min-h-[calc(100vh-130px)] px-4 py-6 pb-[100px]">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Fun & Games</h1>
        <p className="text-lg text-gray-500 m-0">Play while you wait for your order!</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        <div className="bg-white p-8 rounded-3xl shadow-md text-center transition-all duration-300 cursor-pointer hover:translate-y-[-8px] hover:scale-105 hover:shadow-lg hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary-light/10 group">
          <div className="text-[80px] mb-4 animate-wiggle group-hover:animate-spin">🎯</div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">Coming Soon</h3>
          <p className="text-base text-gray-500 m-0">Interactive games will be available here</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-md text-center transition-all duration-300 cursor-pointer hover:translate-y-[-8px] hover:scale-105 hover:shadow-lg hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary-light/10 group">
          <div className="text-[80px] mb-4 animate-wiggle group-hover:animate-spin">🎲</div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">Trivia</h3>
          <p className="text-base text-gray-500 m-0">Test your coffee knowledge</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-md text-center transition-all duration-300 cursor-pointer hover:translate-y-[-8px] hover:scale-105 hover:shadow-lg hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary-light/10 group">
          <div className="text-[80px] mb-4 animate-wiggle group-hover:animate-spin">🧩</div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">Puzzle</h3>
          <p className="text-base text-gray-500 m-0">Solve fun puzzles</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-md text-center transition-all duration-300 cursor-pointer hover:translate-y-[-8px] hover:scale-105 hover:shadow-lg hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary-light/10 group">
          <div className="text-[80px] mb-4 animate-wiggle group-hover:animate-spin">🎮</div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">Arcade</h3>
          <p className="text-base text-gray-500 m-0">Classic arcade games</p>
        </div>
      </div>
    </div>
  );
};

export default Games;
