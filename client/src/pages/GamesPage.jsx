import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Users, Play, Trophy, Lock } from 'lucide-react';
import { GameContext } from '../context/GameContext';
import WordleGame from '../components/WordleGame';
import HowToPlayModal from '../components/HowToPlayModal';

export default function GamesPage() {
  const navigate = useNavigate();
  const { setIsWordleOpen: setGlobalIsWordleOpen } = useContext(GameContext);
  const [activeTab, setActiveTab] = useState('single');
  const [isWordleOpen, setIsWordleOpen] = useState(false);
  const [isSearchGameOpen, setIsSearchGameOpen] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const handlePlayClick = (gameId) => {
    if (gameId === 'wordle') {
      setIsWordleOpen(true);
      setGlobalIsWordleOpen(true);
    } else if (gameId === 'search') {
      setIsSearchGameOpen(true);
      setGlobalIsWordleOpen(true);
    }
  };

  const handleWordleClose = () => {
    console.log('Closing Wordle game');
    setIsWordleOpen(false);
    setGlobalIsWordleOpen(false);
  };

  const handleSearchGameClose = () => {
    setIsSearchGameOpen(false);
    setGlobalIsWordleOpen(false);
  };

  useEffect(() => {
    // Prevent body scroll when game is open
    if (isWordleOpen || isSearchGameOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isWordleOpen, isSearchGameOpen]);

  const games = [
    {
      id: 'wordle',
      name: 'Cafe Wordle',
      description: 'Guess the daily cafe-themed word in 6 tries to win exclusive discounts.',
      image: 'https://images.unsplash.com/photo-1632516643720-e7f5d7d6ecc9?w=800&h=600&fit=crop',
      reward: 'Win 10% Off Coupon',
      tag: 'Daily Challenge',
      color: 'bg-green-100 text-green-800'
    },
    {
      id: 'search',
      name: 'Cafe Feud',
      description: 'Guess the top search completions for cafe-related questions.',
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop',
      reward: 'Earn Loyalty Points',
      tag: 'New Game',
      color: 'bg-blue-100 text-blue-800'
    }
  ];

  return (
    <div className="px-4 md:px-6 py-8 max-w-4xl mx-auto min-h-[80vh]">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 font-display">
          Games & Rewards
        </h1>
        <p className="text-gray-500 font-body">Play games, win rewards, and enjoy!</p>
      </div>

      {/* Toggle Switch */}
      <div className="max-w-xs mx-auto mb-10 bg-gray-100 p-1.5 rounded-full flex relative animate-fade-in-up delay-100">
        <button
          onClick={() => setActiveTab('single')}
          className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'single'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          Single Player
        </button>
        <button
          onClick={() => setActiveTab('multi')}
          className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'multi'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Multiplayer
        </button>
      </div>

      {/* Content Area */}
      <div className="animate-fade-in-up delay-200">
        {activeTab === 'single' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {games.map((game) => (
              <div 
                key={game.id}
                className="bg-white rounded-3xl shadow-card hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-100 flex flex-col h-full"
              >
                {/* Image Container */}
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 bg-gray-900/10 group-hover:bg-gray-900/0 transition-colors z-10" />
                  <img 
                    src={game.image} 
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  
                  {/* Tag */}
                  <div className="absolute top-4 left-4 z-20">
                    <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-900 uppercase tracking-wider shadow-sm">
                      {game.tag}
                    </span>
                  </div>

                  {/* How to Play Button - Top Right Corner */}
                  <button 
                    onClick={() => setShowHowToPlay(true)}
                    className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 font-bold shadow-sm hover:shadow-md transition-all duration-300 active:scale-90"
                    title="How to Play"
                  >
                    ?
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 font-display mb-2">{game.name}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{game.description}</p>
                  </div>

                  <div className="mt-auto space-y-4">
                    {/* Reward Badge */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${game.color} w-fit`}>
                      <Trophy className="w-4 h-4" />
                      <span className="text-xs font-bold">{game.reward}</span>
                    </div>

                    {/* Play Button */}
                    <button 
                      onClick={() => handlePlayClick(game.id)}
                      className="w-full bg-primary hover:bg-primary-dark text-gray-900 py-3.5 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-primary/20 active:scale-95 flex items-center justify-center gap-2 group/btn"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>Play Now</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Multiplayer Coming Soon State */
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20" />
                <div className="relative bg-gray-50 p-6 rounded-full">
                  <Lock className="w-12 h-12 text-gray-400" />
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 font-display">Coming Soon</h3>
            <p className="text-gray-500 max-w-xs mx-auto mb-8">
              Challenge your friends in real-time! We're building something awesome.
            </p>
            <button 
              onClick={() => setActiveTab('single')}
              className="text-primary-dark font-bold hover:underline"
            >
              Play Single Player Games &rarr;
            </button>
          </div>
        )}
      </div>

      {isWordleOpen && <WordleGame onClose={handleWordleClose} />}
      {isSearchGameOpen && <SearchGame onClose={handleSearchGameClose} />}
      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </div>
  );
}
