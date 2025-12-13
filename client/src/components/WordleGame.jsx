import { useState, useEffect } from 'react';
import { X, Trophy, AlertCircle, Volume2, VolumeX, Copy, Check, Keyboard } from 'lucide-react';

const WORDS = [
  'LATTE', 'MOCHA', 'BAGEL', 'DONUT', 'CREAM', 
  'SUGAR', 'FRESH', 'ROAST', 'TOAST', 'WATER', 
  'JUICE', 'CAKES', 'SWEET', 'LUNCH', 'SNACK',
  'BREAD', 'PIZZA', 'SALAD', 'FRUIT', 'BERRY',
  'COCOA', 'MILKY', 'TASTY', 'SPICE', 'HONEY',
  'BLEND', 'GRIND', 'STEAM', 'FROTH', 'BEANS',
  'AROMA', 'TASTE', 'DRINK', 'ORDER', 'TABLE'
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

  // Sound System (Web Audio API)
  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      
      const createOsc = (freq, type, duration, delay = 0, vol = 0.1) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(vol, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + duration);
      };

      if (type === 'tap') {
        createOsc(600, 'sine', 0.1);
      } else if (type === 'flip') {
        createOsc(300, 'triangle', 0.05, 0, 0.05);
      } else if (type === 'error') {
        createOsc(150, 'sawtooth', 0.2, 0, 0.1);
        createOsc(100, 'sawtooth', 0.2, 0.1, 0.1);
      } else if (type === 'win') {
        createOsc(523.25, 'sine', 0.2, 0); // C5
        createOsc(659.25, 'sine', 0.2, 0.1); // E5
        createOsc(783.99, 'sine', 0.4, 0.2); // G5
        createOsc(1046.50, 'sine', 0.8, 0.3); // C6
      } else if (type === 'lose') {
        createOsc(300, 'triangle', 0.3, 0);
        createOsc(200, 'triangle', 0.3, 0.2);
        createOsc(100, 'triangle', 0.5, 0.4);
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  // Keyboard Input (Physical + Mobile)
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
  }, [currentGuess, gameState, solution]);

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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (gameState === 'loading') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-2 md:p-4 animate-fade-in">
      <div className="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh] relative border border-white/20">
        
        {/* Header */}
        <div className="p-3 md:p-5 border-b border-gray-100 flex items-center justify-between bg-white/50 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
              <Trophy className="w-4 md:w-5 h-4 md:h-5 text-primary-dark" />
            </div>
            <h2 className="text-lg md:text-xl font-bold font-display text-gray-900 truncate">Cafe Wordle</h2>
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              title={soundEnabled ? "Mute Sounds" : "Enable Sounds"}
            >
              {soundEnabled ? <Volume2 className="w-4 md:w-5 h-4 md:h-5" /> : <VolumeX className="w-4 md:w-5 h-4 md:h-5" />}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
              <X className="w-4 md:w-5 h-4 md:h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Game Board */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white">{message && (
            <div className="absolute top-16 md:top-24 z-20 bg-gray-900/90 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold animate-fade-in-up shadow-xl backdrop-blur-sm border border-white/10">
              {message}
            </div>
          )}

          <div className="grid grid-rows-6 gap-2 md:gap-3 mb-4 md:mb-8">
            {[...Array(6)].map((_, rowIndex) => {
              const isCurrentRow = rowIndex === guesses.length;
              const guess = guesses[rowIndex];
              const rowColors = guess ? getRowColors(guess) : null;
              
              return (
                <div 
                  key={rowIndex} 
                  className={`grid grid-cols-5 gap-3 ${isCurrentRow && shakeRow ? 'animate-shake' : ''}`}
                >
                  {[...Array(5)].map((_, colIndex) => {
                    const letter = guess 
                      ? guess[colIndex] 
                      : (isCurrentRow ? currentGuess[colIndex] : '');
                    
                    let bgColor = 'bg-white';
                    let borderColor = 'border-gray-200';
                    let textColor = 'text-gray-900';
                    let animation = '';
                    let shadow = 'shadow-sm';

                    if (guess) {
                      const status = rowColors[colIndex];
                      animation = 'animate-flip';
                      
                      if (status === 'correct') {
                        bgColor = 'bg-gradient-to-br from-green-500 to-green-600';
                        borderColor = 'border-green-600';
                        textColor = 'text-white';
                        shadow = 'shadow-green-200';
                      } else if (status === 'present') {
                        bgColor = 'bg-gradient-to-br from-yellow-400 to-yellow-500';
                        borderColor = 'border-yellow-500';
                        textColor = 'text-white';
                        shadow = 'shadow-yellow-200';
                      } else {
                        bgColor = 'bg-gradient-to-br from-gray-400 to-gray-500';
                        borderColor = 'border-gray-500';
                        textColor = 'text-white';
                        shadow = 'shadow-gray-200';
                      }
                    } else if (letter) {
                      borderColor = 'border-gray-400';
                      textColor = 'text-gray-900';
                      animation = 'animate-pop';
                      shadow = 'shadow-md';
                    }

                    return (
                      <div
                        key={colIndex}
                        className={`
                          w-12 h-12 md:w-14 md:h-14 border-2 rounded-xl flex items-center justify-center text-2xl font-bold uppercase transition-all duration-300
                          ${bgColor} ${borderColor} ${textColor} ${animation} ${shadow}
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

          {/* Instruction Footer */}
          <div className="flex items-center gap-2 text-gray-400 text-sm font-medium bg-gray-100 px-4 py-2 rounded-full">
            <Keyboard className="w-4 h-4" />
            <span>Type using your keyboard</span>
          </div>
        </div>

        {/* Result Modal */}
        {(gameState === 'won' || gameState === 'lost') && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in z-30">
            <div className="text-center max-w-xs w-full bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 transform animate-pop">
              <div className="mb-6 flex justify-center">
                {gameState === 'won' ? (
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 animate-bounce-short shadow-inner">
                    <Trophy className="w-12 h-12" />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-inner">
                    <AlertCircle className="w-12 h-12" />
                  </div>
                )}
              </div>
              
              <h3 className="text-3xl font-bold text-gray-900 mb-2 font-display">
                {gameState === 'won' ? 'Splendid!' : 'Game Over'}
              </h3>
              
              <p className="text-gray-600 mb-8 leading-relaxed">
                {gameState === 'won' 
                  ? 'You solved the daily word!' 
                  : <span>The word was <strong className="text-gray-900">{solution}</strong>.<br/>Come back tomorrow!</span>}
              </p>

              {gameState === 'won' && (
                <div className="bg-linear-to-br from-primary/10 to-primary/5 p-5 rounded-2xl mb-8 border border-primary/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                  
                  <p className="text-xs font-bold text-primary-dark uppercase tracking-wider mb-3">Your Reward Code</p>
                  <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-primary/30 shadow-sm">
                    <code className="font-mono font-bold text-lg text-gray-900 tracking-widest">{couponCode}</code>
                    <button 
                      onClick={copyToClipboard}
                      className="shrink-0 p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary-dark active:scale-95"
                      title="Copy coupon code"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-3 font-medium">Valid for today only. Show at checkout.</p>
                </div>
              )}

              <button 
                onClick={onClose}
                className="w-full bg-primary hover:bg-primary-dark text-gray-900 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-primary/20 active:scale-95"
              >
                Close Game
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
          40% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pop {
          animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
}