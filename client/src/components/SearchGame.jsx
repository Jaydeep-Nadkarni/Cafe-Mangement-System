import { useState, useEffect, useRef } from 'react';
import { X, Search, Trophy, AlertCircle, Check, ArrowRight, HelpCircle, Flame } from 'lucide-react';
import { SEARCH_GAME_DATA } from '../data/searchGameData';

export default function SearchGame({ onClose }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [input, setInput] = useState('');
  const [revealedAnswers, setRevealedAnswers] = useState(new Set());
  const [gameStatus, setGameStatus] = useState('playing'); // playing, roundOver, gameComplete
  const [message, setMessage] = useState('');
  const [shakeInput, setShakeInput] = useState(false);
  const inputRef = useRef(null);

  const MAX_STRIKES = 3;
  const currentQuestion = SEARCH_GAME_DATA[currentRound];

  useEffect(() => {
    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    const savedState = JSON.parse(localStorage.getItem('cafe_search_game_state') || 'null');

    if (savedState && savedState.date === today && savedState.gameStatus === 'gameComplete') {
      setGameStatus('gameComplete');
      setScore(savedState.score);
    }
  }, []);

  useEffect(() => {
    if (gameStatus === 'playing') {
      inputRef.current?.focus();
    }
  }, [gameStatus, currentRound]);

  const playSound = (type) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    const now = ctx.currentTime;
    
    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'reveal') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.2);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
  };

  const handleGuess = (e) => {
    e?.preventDefault();
    if (!input.trim() || gameStatus !== 'playing') return;

    const guess = input.trim().toLowerCase();
    let found = false;
    let alreadyGuessed = false;

    // Check if already revealed
    currentQuestion.answers.forEach((ans, idx) => {
      if (revealedAnswers.has(idx) && ans.text.toLowerCase() === guess) {
        alreadyGuessed = true;
      }
    });

    if (alreadyGuessed) {
      setMessage('Already guessed!');
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);
      setInput('');
      return;
    }

    // Check for match
    currentQuestion.answers.forEach((ans, idx) => {
      if (!revealedAnswers.has(idx) && ans.text.toLowerCase() === guess) {
        const newRevealed = new Set(revealedAnswers);
        newRevealed.add(idx);
        setRevealedAnswers(newRevealed);
        setScore(prev => prev + ans.points);
        playSound('correct');
        found = true;
      }
    });

    if (!found) {
      const newStrikes = strikes + 1;
      setStrikes(newStrikes);
      playSound('wrong');
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);
      
      if (newStrikes >= MAX_STRIKES) {
        handleRoundOver();
      }
    } else {
      // Check if all found
      if (revealedAnswers.size + 1 === currentQuestion.answers.length) {
        handleRoundOver();
      }
    }

    setInput('');
  };

  const handleRoundOver = () => {
    setGameStatus('roundOver');
    playSound('reveal');
    // Reveal all answers
    const allIndices = new Set(currentQuestion.answers.map((_, i) => i));
    setRevealedAnswers(allIndices);
  };

  const nextRound = () => {
    if (currentRound < SEARCH_GAME_DATA.length - 1) {
      setCurrentRound(prev => prev + 1);
      setStrikes(0);
      setRevealedAnswers(new Set());
      setGameStatus('playing');
      setInput('');
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    setGameStatus('gameComplete');
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('cafe_search_game_state', JSON.stringify({
      date: today,
      score: score,
      gameStatus: 'gameComplete'
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-500" />
              Cafe Feud
            </h2>
            <span className="text-xs text-gray-500">Round {currentRound + 1} of {SEARCH_GAME_DATA.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Score</span>
            <span className="text-xl font-bold text-blue-600">{score.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="max-w-2xl mx-auto w-full space-y-8">
          
          {gameStatus === 'gameComplete' ? (
            <div className="text-center py-12 space-y-6 animate-fade-in-up">
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                <Trophy className="w-12 h-12 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Session Complete!</h2>
                <p className="text-gray-500">You scored {score.toLocaleString()} points today.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-4">Come back tomorrow for new questions!</p>
                <button 
                  onClick={onClose}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                >
                  Back to Games
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Search Bar Display */}
              <div className="bg-white rounded-full shadow-lg border border-gray-200 p-4 flex items-center gap-3 transform transition-all hover:shadow-xl">
                <Search className="w-6 h-6 text-gray-400" />
                <div className="flex-1 text-lg md:text-xl font-medium text-gray-800">
                  {currentQuestion.query} <span className="text-blue-500 font-bold">...</span>
                </div>
              </div>

              {/* Strikes */}
              <div className="flex justify-center gap-4">
                {[...Array(MAX_STRIKES)].map((_, i) => (
                  <div 
                    key={i}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
                      i < strikes 
                        ? 'bg-red-100 text-red-600 scale-110 border-2 border-red-200' 
                        : 'bg-gray-100 text-gray-300 border-2 border-transparent'
                    }`}
                  >
                    X
                  </div>
                ))}
              </div>

              {/* Answers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentQuestion.answers.map((answer, idx) => {
                  const isRevealed = revealedAnswers.has(idx);
                  return (
                    <div 
                      key={idx}
                      className="relative h-12 perspective-1000"
                    >
                      <div 
                        className={`absolute inset-0 w-full h-full transition-all duration-500 transform-style-3d ${
                          isRevealed ? 'rotate-x-0' : 'rotate-x-180'
                        }`}
                      >
                        {/* Front (Revealed) */}
                        <div 
                          className={`absolute inset-0 bg-white border border-blue-100 rounded-lg flex items-center justify-between px-4 shadow-sm ${
                            isRevealed ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          <span className="font-medium text-gray-800 capitalize">{answer.text}</span>
                          <span className="font-bold text-blue-600">{answer.points}</span>
                        </div>
                      </div>

                      {/* Back (Hidden) */}
                      <div 
                        className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm transition-all duration-500 ${
                          isRevealed ? 'opacity-0 rotate-x-180' : 'opacity-100 rotate-x-0'
                        }`}
                      >
                        <span className="text-blue-200 font-bold text-xl">{idx + 1}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Input Area */}
      {gameStatus !== 'gameComplete' && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-8 md:pb-4">
          <div className="max-w-2xl mx-auto space-y-3">
            {message && (
              <div className="text-center text-red-500 text-sm font-medium animate-bounce">
                {message}
              </div>
            )}
            
            {gameStatus === 'playing' ? (
              <form onSubmit={handleGuess} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setMessage('');
                  }}
                  placeholder="Type your guess..."
                  className={`flex-1 bg-gray-100 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-xl px-4 py-3 outline-none transition-all font-medium ${
                    shakeInput ? 'animate-shake border-red-300 bg-red-50' : ''
                  }`}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  Guess
                </button>
                <button
                  type="button"
                  onClick={handleRoundOver}
                  className="bg-gray-100 text-gray-600 px-4 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Give Up
                </button>
              </form>
            ) : (
              <button
                onClick={nextRound}
                className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-colors shadow-lg shadow-green-200 flex items-center justify-center gap-2 animate-pulse"
              >
                {currentRound < SEARCH_GAME_DATA.length - 1 ? 'Next Round' : 'Finish Game'}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
