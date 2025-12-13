import { useState, useEffect } from 'react';
import { X, Trophy, AlertCircle, Volume2, VolumeX, Copy, Check } from 'lucide-react';

const WORDS = [
  'LATTE', 'MOCHA', 'BAGEL', 'DONUT', 'CREAM', 
  'SUGAR', 'FRESH', 'ROAST', 'TOAST', 'WATER', 
  'JUICE', 'CAKES', 'SWEET', 'LUNCH', 'SNACK',
  'BREAD', 'PIZZA', 'SALAD', 'FRUIT', 'BERRY',
  'COCOA', 'MILKY', 'TASTY', 'SPICE', 'HONEY',
  'BLEND', 'GRIND', 'STEAM', 'FROTH', 'BEANS',
  'AROMA', 'TASTE', 'DRINK', 'ORDER', 'TABLE'
];

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
];

export default function WordleGame({ onClose }) {
  const [solution, setSolution] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameState, setGameState] = useState('loading'); // loading, playing, won, lost
  const [shakeRow, setShakeRow] = useState(false);
  const [message, setMessage] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Initialize Game
  useEffect(() => {
    const initializeGame = () => {
      const today = new Date().toISOString().split('T')[0];
      let sessionId = localStorage.getItem('cafe_session_id');
      
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('cafe_session_id', sessionId);
      }

      // Deterministic word selection
      let hash = 0;
      const str = today + sessionId;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      const dailyWord = WORDS[Math.abs(hash) % WORDS.length];

      // Check saved state
      const savedState = JSON.parse(localStorage.getItem('cafe_wordle_state'));
      
      if (savedState && savedState.date === today) {
        setSolution(savedState.solution);
        setGuesses(savedState.guesses);
        setGameState(savedState.gameState);
        if (savedState.couponCode) setCouponCode(savedState.couponCode);
      } else {
        // New Game
        setSolution(dailyWord);
        setGuesses([]);
        setGameState('playing');
        setCouponCode('');
      }
    };

    initializeGame();
  }, []);

  // Save State
  useEffect(() => {
    if (gameState === 'loading') return;
    
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('cafe_wordle_state', JSON.stringify({
      date: today,
      guesses,
      gameState,
      solution,
      couponCode
    }));
  }, [guesses, gameState, solution, couponCode]);

  // Keyboard Input
  useEffect(() => {
    const handleKeydown = (e) => {
      if (gameState !== 'playing') return;

      const key = e.key.toUpperCase();
      if (key === 'ENTER') submitGuess();
      else if (key === 'BACKSPACE') handleDelete();
      else if (/^[A-Z]$/.test(key)) handleKeyPress(key);
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [currentGuess, gameState]);

  const playSound = (type) => {
    if (!soundEnabled) return;
    // Placeholder for sound logic
    // const audio = new Audio(`/sounds/${type}.mp3`);
    // audio.play().catch(() => {});
  };

  const handleKeyPress = (letter) => {
    if (currentGuess.length < 5 && gameState === 'playing') {
      setCurrentGuess(prev => prev + letter);
      playSound('tap');
    }
  };

  const handleDelete = () => {
    setCurrentGuess(prev => prev.slice(0, -1));
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2000);
  };

  const generateCoupon = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'WT'; // Wordle Token
    const array = new Uint32Array(8);
    crypto.getRandomValues(array);
    for (let i = 0; i < 8; i++) {
      code += chars[array[i] % chars.length];
    }
    return code;
  };

  const submitGuess = () => {
    if (currentGuess.length !== 5) {
      setShakeRow(true);
      showMessage('Not enough letters');
      playSound('error');
      setTimeout(() => setShakeRow(false), 500);
      return;
    }

    // In a real app, validate word existence here
    
    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess('');
    playSound('flip');

    if (currentGuess === solution) {
      setGameState('won');
      const code = generateCoupon();
      setCouponCode(code);
      playSound('win');
    } else if (newGuesses.length >= 6) {
      setGameState('lost');
      playSound('lose');
    }
  };

  const getRowColors = (guess) => {
    const status = Array(5).fill('absent');
    const solutionChars = solution.split('');
    const guessChars = guess.split('');
    const solutionCounts = {};

    solutionChars.forEach(c => solutionCounts[c] = (solutionCounts[c] || 0) + 1);

    // Green pass
    guessChars.forEach((c, i) => {
      if (c === solutionChars[i]) {
        status[i] = 'correct';
        solutionCounts[c]--;
      }
    });

    // Yellow pass
    guessChars.forEach((c, i) => {
      if (status[i] !== 'correct' && solutionCounts[c] > 0) {
        status[i] = 'present';
        solutionCounts[c]--;
      }
    });

    return status;
  };

  const getKeyStatus = (key) => {
    let status = 'initial';
    guesses.forEach(guess => {
      const rowColors = getRowColors(guess);
      guess.split('').forEach((l, i) => {
        if (l === key) {
          const s = rowColors[i];
          if (s === 'correct') status = 'correct';
          else if (s === 'present' && status !== 'correct') status = 'present';
          else if (s === 'absent' && status === 'initial') status = 'absent';
        }
      });
    });
    return status;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (gameState === 'loading') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <h2 className="text-xl font-bold font-display text-gray-900">Cafe Wordle</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Game Board */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center bg-gray-50">
          {message && (
            <div className="absolute top-20 z-20 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold animate-fade-in-up shadow-lg">
              {message}
            </div>
          )}

          <div className="grid grid-rows-6 gap-2 mb-4">
            {[...Array(6)].map((_, rowIndex) => {
              const isCurrentRow = rowIndex === guesses.length;
              const guess = guesses[rowIndex];
              const rowColors = guess ? getRowColors(guess) : null;
              
              return (
                <div 
                  key={rowIndex} 
                  className={`grid grid-cols-5 gap-2 ${isCurrentRow && shakeRow ? 'animate-shake' : ''}`}
                >
                  {[...Array(5)].map((_, colIndex) => {
                    const letter = guess 
                      ? guess[colIndex] 
                      : (isCurrentRow ? currentGuess[colIndex] : '');
                    
                    let bgColor = 'bg-white';
                    let borderColor = 'border-gray-300';
                    let textColor = 'text-gray-900';
                    let animation = '';

                    if (guess) {
                      const status = rowColors[colIndex];
                      animation = 'animate-flip';
                      
                      if (status === 'correct') {
                        bgColor = 'bg-[#6aaa64]'; // Wordle Green
                        borderColor = 'border-[#6aaa64]';
                        textColor = 'text-white';
                      } else if (status === 'present') {
                        bgColor = 'bg-[#c9b458]'; // Wordle Yellow
                        borderColor = 'border-[#c9b458]';
                        textColor = 'text-white';
                      } else {
                        bgColor = 'bg-[#787c7e]'; // Wordle Gray
                        borderColor = 'border-[#787c7e]';
                        textColor = 'text-white';
                      }
                    } else if (letter) {
                      borderColor = 'border-gray-500';
                      textColor = 'text-gray-900';
                      animation = 'animate-pop';
                    }

                    return (
                      <div
                        key={colIndex}
                        className={`
                          w-12 h-12 md:w-14 md:h-14 border-2 rounded-lg flex items-center justify-center text-2xl font-bold uppercase transition-all duration-300
                          ${bgColor} ${borderColor} ${textColor} ${animation}
                        `}
                        style={{ animationDelay: guess ? `${colIndex * 100}ms` : '0ms' }}
                      >
                        {letter}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Keyboard */}
        <div className="p-2 md:p-4 bg-white border-t border-gray-100">
          {KEYBOARD_ROWS.map((row, i) => (
            <div key={i} className="flex justify-center gap-1 mb-2">
              {row.map((key) => {
                const status = getKeyStatus(key);
                let bgClass = 'bg-gray-200 hover:bg-gray-300 text-gray-900';
                
                if (status === 'correct') bgClass = 'bg-[#6aaa64] text-white';
                else if (status === 'present') bgClass = 'bg-[#c9b458] text-white';
                else if (status === 'absent') bgClass = 'bg-[#787c7e] text-white';

                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === 'ENTER') submitGuess();
                      else if (key === 'BACK') handleDelete();
                      else handleKeyPress(key);
                    }}
                    className={`
                      ${key.length > 1 ? 'px-3 md:px-4 text-xs' : 'w-8 md:w-10'} 
                      h-12 rounded-lg font-bold transition-colors duration-150 flex items-center justify-center
                      ${bgClass}
                    `}
                  >
                    {key === 'BACK' ? '⌫' : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Result Modal */}
        {(gameState === 'won' || gameState === 'lost') && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in z-30">
            <div className="text-center max-w-xs w-full">
              <div className="mb-4 flex justify-center">
                {gameState === 'won' ? (
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 animate-bounce-short">
                    <Trophy className="w-10 h-10" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                )}
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2 font-display">
                {gameState === 'won' ? 'Splendid!' : 'Game Over'}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {gameState === 'won' 
                  ? 'You solved the daily word!' 
                  : `The word was ${solution}. Come back tomorrow!`}
              </p>

              {gameState === 'won' && (
                <div className="bg-primary/10 p-4 rounded-xl mb-6 border border-primary/20">
                  <p className="text-xs font-bold text-primary-dark uppercase tracking-wider mb-2">Your Reward Code</p>
                  <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-primary/30">
                    <code className="flex-1 font-mono font-bold text-lg text-gray-900 tracking-wider">{couponCode}</code>
                    <button 
                      onClick={copyToClipboard}
                      className="p-2 hover:bg-gray-100 rounded-md transition-colors text-primary-dark"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">Valid for today only. Use at checkout.</p>
                </div>
              )}

              <button 
                onClick={onClose}
                className="w-full bg-primary hover:bg-primary-dark text-gray-900 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-primary/20 active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes pop {
          0% { transform: scale(0.8); opacity: 0; }
          40% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pop {
          animation: pop 0.1s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}