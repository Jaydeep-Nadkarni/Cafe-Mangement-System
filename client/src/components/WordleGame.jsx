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

function WordleGame({ onClose }) {
  const [solution, setSolution] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameState, setGameState] = useState('loading');
  const [shakeRow, setShakeRow] = useState(false);
  const [message, setMessage] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const initializeGame = () => {
      const today = new Date().toISOString().split('T')[0];
      let sessionId = sessionStorage.getItem('cafe_session_id');
      
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessionStorage.setItem('cafe_session_id', sessionId);
      }

      let hash = 0;
      const str = today + sessionId;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      const dailyWord = WORDS[Math.abs(hash) % WORDS.length];

      const savedState = JSON.parse(sessionStorage.getItem('cafe_wordle_state') || 'null');
      
      if (savedState && savedState.date === today) {
        setSolution(savedState.solution);
        setGuesses(savedState.guesses);
        setGameState(savedState.gameState);
        if (savedState.couponCode) setCouponCode(savedState.couponCode);
      } else {
        setSolution(dailyWord);
        setGuesses([]);
        setGameState('playing');
        setCouponCode('');
      }
    };

    initializeGame();
  }, []);

  useEffect(() => {
    if (gameState === 'loading') return;
    
    const today = new Date().toISOString().split('T')[0];
    sessionStorage.setItem('cafe_wordle_state', JSON.stringify({
      date: today,
      guesses,
      gameState,
      solution,
      couponCode
    }));
  }, [guesses, gameState, solution, couponCode]);

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
        createOsc(523.25, 'sine', 0.2, 0);
        createOsc(659.25, 'sine', 0.2, 0.1);
        createOsc(783.99, 'sine', 0.4, 0.2);
        createOsc(1046.50, 'sine', 0.8, 0.3);
      } else if (type === 'lose') {
        createOsc(300, 'triangle', 0.3, 0);
        createOsc(200, 'triangle', 0.3, 0.2);
        createOsc(100, 'triangle', 0.5, 0.4);
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;

      const key = e.key.toUpperCase();

      if (/^[A-Z]$/.test(key)) {
        e.preventDefault();
        if (currentGuess.length < 5) {
          setCurrentGuess(prev => prev + key);
          playSound('tap');
        }
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (currentGuess.length > 0) {
          setCurrentGuess(prev => prev.slice(0, -1));
          playSound('tap');
        }
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        submitGuess();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [gameState, currentGuess, solution, guesses]);

  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) {
      inputRef.current.focus();
    } else if ((gameState === 'won' || gameState === 'lost') && inputRef.current) {
      inputRef.current.blur();
    }
  }, [gameState]);

  const focusInput = () => {
    if (inputRef.current && gameState === 'playing') {
      inputRef.current.focus();
    }
  };

  const handleGameBoardClick = () => {
    focusInput();
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2000);
  };

  const generateCoupon = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'WT';
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

    guessChars.forEach((c, i) => {
      if (c === solutionChars[i]) {
        status[i] = 'correct';
        solutionCounts[c]--;
      }
    });

    guessChars.forEach((c, i) => {
      if (status[i] !== 'correct' && solutionCounts[c] > 0) {
        status[i] = 'present';
        solutionCounts[c]--;
      }
    });

    return status;
  };

  const getKeyStatus = (letter) => {
    let bestStatus = 'unused';
    for (const guess of guesses) {
      const colors = getRowColors(guess);
      for (let i = 0; i < 5; i++) {
        if (guess[i] === letter) {
          if (colors[i] === 'correct') return 'correct';
          if (colors[i] === 'present' && bestStatus !== 'correct') bestStatus = 'present';
          if (colors[i] === 'absent' && bestStatus === 'unused') bestStatus = 'absent';
        }
      }
    }
    return bestStatus;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (gameState === 'loading') return null;

  if (gameState === 'won' || gameState === 'lost') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-50 via-white to-gray-50 animate-fade-in">
        <div className="h-full overflow-y-auto">
          <div className="min-h-full flex flex-col items-center justify-center p-4 py-8 md:p-8">
            <div className="w-full max-w-md relative">
              <button
                onClick={onClose}
                className="absolute -top-4 right-0 p-2 hover:bg-white/80 rounded-full transition-all z-10 bg-white shadow-sm"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-100">
                <div className="mb-6">
                  <div className={`
                    w-24 h-24 mx-auto rounded-3xl flex items-center justify-center shadow-lg
                    ${gameState === 'won' 
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white' 
                      : 'bg-gradient-to-br from-gray-400 to-gray-500 text-white'}
                  `}>
                    {gameState === 'won' 
                      ? <Trophy className="w-12 h-12" /> 
                      : <Coffee className="w-12 h-12" />}
                  </div>
                </div>
                
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 font-display text-center">
                  {gameState === 'won' ? 'Brilliant!' : 'Nice Try!'}
                </h3>
                
                <p className="text-gray-500 text-base mb-8 text-center">
                  {gameState === 'won' 
                    ? 'You cracked today\'s word' 
                    : <span>The word was <span className="font-bold text-gray-700">{solution}</span></span>}
                </p>
                
                {gameState === 'won' && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 mb-6 border border-green-100">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Reward Code</span>
                      <span className="text-xs text-green-600 font-bold bg-white px-3 py-1 rounded-full shadow-sm">10% OFF</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-xl mb-3 shadow-sm">
                      <code className="font-mono font-bold text-lg text-gray-900 tracking-wider">{couponCode}</code>
                      <button 
                        onClick={copyToClipboard}
                        className={`
                          flex-shrink-0 p-2.5 rounded-lg transition-all active:scale-95
                          ${copied 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-900 text-white hover:bg-gray-800'}
                        `}
                        title={copied ? 'Copied!' : 'Copy code'}
                      >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 text-center">Use at checkout • Valid today only</p>
                  </div>
                )}

                {gameState === 'lost' && (
                  <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
                    <p className="text-sm text-gray-600 text-center leading-relaxed">
                      Don't worry! Come back tomorrow for a new word and another chance to win.
                    </p>
                  </div>
                )}

                <button 
                  onClick={onClose}
                  className={`
                    w-full py-3.5 rounded-xl font-bold transition-all duration-300 active:scale-[0.98] text-base
                    ${gameState === 'won'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30'
                      : 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-900/20'}
                  `}
                >
                  {gameState === 'won' ? 'Claim & Close' : 'Close Game'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
  ];

  return (
    <div className="wordle-game fixed inset-0 z-50 bg-white flex flex-col" onClick={handleGameBoardClick}>
      <header className="h-[50px] border-b border-[#d3d6da] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <h1 className="text-[22px] font-bold tracking-wide text-gray-900 uppercase" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
          Wordle
        </h1>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title={soundEnabled ? "Mute" : "Unmute"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-gray-600" /> : <VolumeX className="w-5 h-5 text-gray-600" />}
          </button>
        </div>
      </header>

      <textarea
        ref={inputRef}
        value={currentGuess}
        onChange={(e) => {
          const filtered = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
          setCurrentGuess(filtered);
        }}
        className="fixed -top-[100px] opacity-0 pointer-events-none"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck="false"
        inputMode="none"
        readOnly
      />

      <div className="flex-1 flex flex-col justify-between max-w-[500px] w-full mx-auto">
        {message && (
          <div className="absolute top-[60px] left-1/2 -translate-x-1/2 z-20 bg-gray-900 text-white px-4 py-3 rounded text-sm font-bold animate-fade-in">
            {message}
          </div>
        )}

        <div className="flex-1 flex items-center justify-center p-2.5">
          <div className="grid grid-rows-6 gap-[5px] w-full max-w-[350px] aspect-[5/6]">
            {[...Array(6)].map((_, rowIndex) => {
              const isCurrentRow = rowIndex === guesses.length;
              const guess = guesses[rowIndex];
              const rowColors = guess ? getRowColors(guess) : null;
              
              return (
                <div 
                  key={rowIndex} 
                  className={`grid grid-cols-5 gap-[5px] ${isCurrentRow && shakeRow ? 'animate-shake' : ''}`}
                >
                  {[...Array(5)].map((_, colIndex) => {
                    const letter = guess 
                      ? guess[colIndex] 
                      : (isCurrentRow ? currentGuess[colIndex] : '');
                    
                    const isTyping = isCurrentRow && !guess && letter;
                    const status = rowColors ? rowColors[colIndex] : null;

                    let tileClass = 'bg-white border-2 border-[#d3d6da]';
                    if (letter && !guess) {
                      tileClass = 'bg-white border-2 border-[#878a8c]';
                    }
                    if (status === 'correct') tileClass = 'bg-[#6aaa64] border-2 border-[#6aaa64] text-white';
                    if (status === 'present') tileClass = 'bg-[#c9b458] border-2 border-[#c9b458] text-white';
                    if (status === 'absent') tileClass = 'bg-[#787c7e] border-2 border-[#787c7e] text-white';

                    return (
                      <div
                        key={colIndex}
                        className={`
                          aspect-square flex items-center justify-center text-[2rem] font-bold uppercase
                          ${tileClass}
                          ${isTyping ? 'animate-pop' : ''}
                          ${guess ? 'animate-flip-tile' : ''}
                        `}
                        style={{ 
                          fontFamily: "'Helvetica Neue', Arial, sans-serif",
                          animationDelay: guess ? `${colIndex * 300}ms` : '0ms',
                          borderRadius: '2px'
                        }}
                        data-status={status}
                        data-letter={letter}
                      >
                        <span className="tile-letter" style={{ animationDelay: guess ? `${colIndex * 300}ms` : '0ms' }}>
                          {letter}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cafe-Style Keyboard */}
        <div className="w-full px-2 pb-5 pt-3 shrink-0 bg-gradient-to-b from-amber-50/30 to-amber-50/60" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
          <div className="max-w-[500px] mx-auto">
            {keyboardRows.map((row, rowIndex) => (
              <div 
                key={rowIndex} 
                className="flex justify-center gap-[6px] mb-[6px]"
                style={{ 
                  paddingLeft: rowIndex === 1 ? '24px' : 0, 
                  paddingRight: rowIndex === 1 ? '24px' : 0 
                }}
              >
                {row.map((key) => {
                  const isSpecial = key === 'ENTER' || key === 'BACK';
                  const status = isSpecial ? 'unused' : getKeyStatus(key);
                  
                  let keyClass = 'bg-gradient-to-b from-stone-100 to-stone-200 text-stone-800 shadow-sm border border-stone-300/50 hover:from-stone-200 hover:to-stone-300';
                  
                  if (status === 'correct') {
                    keyClass = 'bg-gradient-to-b from-amber-700 to-amber-800 text-amber-50 shadow-md border border-amber-900/30 hover:from-amber-600 hover:to-amber-700';
                  } else if (status === 'present') {
                    keyClass = 'bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-md border border-amber-700/30 hover:from-amber-400 hover:to-amber-500';
                  } else if (status === 'absent') {
                    keyClass = 'bg-gradient-to-b from-stone-400 to-stone-500 text-stone-100 shadow-sm border border-stone-600/30';
                  }

                  const handleClick = () => {
                    if (key === 'ENTER') {
                      submitGuess();
                    } else if (key === 'BACK') {
                      setCurrentGuess(prev => prev.slice(0, -1));
                      playSound('tap');
                    } else if (currentGuess.length < 5) {
                      setCurrentGuess(prev => prev + key);
                      playSound('tap');
                    }
                  };

                  return (
                    <button
                      key={key}
                      onClick={handleClick}
                      className={`
                        flex items-center justify-center font-bold uppercase 
                        transition-all duration-200 active:scale-95 active:shadow-none
                        ${keyClass}
                      `}
                      style={{
                        borderRadius: '6px',
                        height: '42px',
                        flex: isSpecial ? '1.5' : '1',
                        minWidth: isSpecial ? '60px' : '0',
                        fontSize: isSpecial ? '10px' : '13px',
                        fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
                        fontWeight: '700',
                        letterSpacing: isSpecial ? '0.5px' : '0.3px',
                        userSelect: 'none',
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation'
                      }}
                    >
                      {key === 'BACK' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="currentColor">
                          <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z"></path>
                        </svg>
                      ) : key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-pop {
          animation: pop 100ms ease-in-out;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 600ms ease-in-out;
        }
        
        @keyframes flip-in {
          0% { transform: rotateX(0deg); }
          50% { transform: rotateX(-90deg); }
          100% { transform: rotateX(0deg); }
        }
        .animate-flip-tile {
          animation: flip-in 500ms ease-in-out both;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in {
          animation: fadeIn 200ms ease-out forwards;
        }
        
        .wordle-game button {
          -webkit-user-select: none;
          user-select: none;
        }
        
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .wordle-game {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  const [showGame, setShowGame] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      {showGame ? (
        <WordleGame onClose={() => setShowGame(false)} />
      ) : (
        <div className="text-center">
          <button 
            onClick={() => setShowGame(true)}
            className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            ☕ Play Cafe Wordle
          </button>
        </div>
      )}
    </div>
  );
}