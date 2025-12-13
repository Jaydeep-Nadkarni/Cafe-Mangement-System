import { useState, useEffect, useRef } from 'react';
import { X, Trophy, AlertCircle, Volume2, VolumeX, Copy, Check, Sparkles, Coffee } from 'lucide-react';

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
  const inputRef = useRef(null);

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

  // Focus input on mount for mobile keyboard
  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  // Handle input from hidden field (mobile)
  const handleInputChange = (e) => {
    if (gameState !== 'playing') return;
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (value.length <= 5) {
      setCurrentGuess(value);
      if (value.length > currentGuess.length) playSound('tap');
    }
  };

  // Handle key events from hidden input
  const handleInputKeyDown = (e) => {
    if (gameState !== 'playing') return;
    if (e.key === 'Enter') {
      e.preventDefault();
      submitGuess();
    }
  };

  // Keyboard Input (Physical keyboard fallback)
  useEffect(() => {
    const handleKeydown = (e) => {
      if (gameState !== 'playing') return;
      // Only handle if not from our input
      if (e.target === inputRef.current) return;

      const key = e.key.toUpperCase();
      if (key === 'ENTER') submitGuess();
      else if (key === 'BACKSPACE') handleDelete();
      else if (/^[A-Z]$/.test(key)) handleKeyPress(key);
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [currentGuess, gameState, solution]);

  // Focus input when tapping game area
  const focusInput = () => {
    if (inputRef.current && gameState === 'playing') {
      inputRef.current.focus();
    }
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
        <div className="p-3 md:p-5 border-b border-gray-100 flex items-center justify-between bg-white/50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-primary/10 p-2 rounded-lg shrink-0">
              <Trophy className="w-4 md:w-5 h-4 md:h-5 text-primary-dark" />
            </div>
            <h2 className="text-lg md:text-xl font-bold font-display text-gray-900 truncate">Cafe Wordle</h2>
          </div>
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
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

        {/* Hidden Input for Mobile Keyboard */}
        <input
          ref={inputRef}
          type="text"
          value={currentGuess}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck="false"
          maxLength={5}
        />

        {/* Game Board */}
        <div 
          className="flex-1 overflow-y-auto p-3 md:p-6 flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white cursor-text"
          onClick={focusInput}
        >
          {message && (
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
                          w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 border-2 rounded-lg md:rounded-xl flex items-center justify-center text-xl sm:text-2xl font-bold uppercase transition-all duration-300
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
          {gameState === 'playing' && (
            <button 
              onClick={focusInput}
              className="flex items-center gap-2 text-gray-500 text-xs md:text-sm font-medium bg-gray-100 hover:bg-gray-200 px-4 md:px-5 py-2.5 rounded-full transition-colors active:scale-95"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>Tap here to type</span>
            </button>
          )}
        </div>

        {/* Result Modal */}
        {(gameState === 'won' || gameState === 'lost') && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 animate-fade-in z-30">
            <div className="text-center w-full max-w-sm mx-auto">
              
              {/* Icon with decoration */}
              <div className="relative mb-6">
                {gameState === 'won' && (
                  <>
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1">
                      <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                      <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse delay-100" />
                      <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse delay-200" />
                    </div>
                  </>
                )}
                <div className={`
                  w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-lg
                  ${gameState === 'won' 
                    ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white' 
                    : 'bg-gradient-to-br from-gray-400 to-gray-500 text-white'}
                `}>
                  {gameState === 'won' 
                    ? <Trophy className="w-10 h-10" /> 
                    : <Coffee className="w-10 h-10" />}
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 font-display">
                {gameState === 'won' ? 'Brilliant!' : 'Nice Try!'}
              </h3>
              
              {/* Subtitle */}
              <p className="text-gray-500 text-sm mb-6">
                {gameState === 'won' 
                  ? 'You cracked today\'s word' 
                  : <span>The word was <span className="font-bold text-gray-700">{solution}</span></span>}
              </p>

              {/* Stats row */}
              <div className="flex justify-center gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{guesses.length}</div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Tries</div>
                </div>
                <div className="w-px bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{gameState === 'won' ? '10%' : '0%'}</div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Discount</div>
                </div>
              </div>

              {/* Coupon Card */}
              {gameState === 'won' && (
                <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reward Code</span>
                    <span className="text-[10px] text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">10% OFF</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl">
                    <code className="font-mono font-bold text-lg text-gray-900 tracking-wider">{couponCode}</code>
                    <button 
                      onClick={copyToClipboard}
                      className={`
                        flex-shrink-0 px-3 py-1.5 rounded-lg font-medium text-xs transition-all active:scale-95
                        ${copied 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-900 text-white hover:bg-gray-800'}
                      `}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">Use at checkout • Valid today only</p>
                </div>
              )}

              {/* Lost state message */}
              {gameState === 'lost' && (
                <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
                  <p className="text-sm text-gray-600">Don't worry! Come back tomorrow for a new word and another chance to win.</p>
                </div>
              )}

              {/* Close Button */}
              <button 
                onClick={onClose}
                className={`
                  w-full py-3.5 rounded-xl font-bold transition-all duration-300 active:scale-[0.98] text-sm
                  ${gameState === 'won'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25'
                    : 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-900/20'}
                `}
              >
                {gameState === 'won' ? 'Claim & Close' : 'Close Game'}
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