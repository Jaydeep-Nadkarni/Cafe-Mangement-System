import { useState, useEffect, useCallback } from 'react';
import { X, RotateCcw, Trophy, AlertCircle } from 'lucide-react';

const WORDS = [
  'LATTE', 'MOCHA', 'BAGEL', 'DONUT', 'CREAM', 
  'SUGAR', 'FRESH', 'ROAST', 'TOAST', 'WATER', 
  'JUICE', 'CAKES', 'SWEET', 'LUNCH', 'SNACK',
  'BREAD', 'PIZZA', 'SALAD', 'FRUIT', 'BERRY',
  'COCOA', 'MILKY', 'TASTY', 'SPICE', 'HONEY'
];

const getDailyWord = () => {
  const date = new Date();
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  return WORDS[seed % WORDS.length];
};

export default function WordleGame({ onClose }) {
  const [solution, setSolution] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameState, setGameState] = useState('playing'); // playing, won, lost
  const [shakeRow, setShakeRow] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setSolution(getDailyWord());
  }, []);

  // Handle physical keyboard input
  useEffect(() => {
    const handleKeydown = (e) => {
      if (gameState !== 'playing') return;

      const key = e.key.toUpperCase();
      
      if (key === 'ENTER') {
        submitGuess();
      } else if (key === 'BACKSPACE') {
        handleDelete();
      } else if (/^[A-Z]$/.test(key)) {
        handleKeyPress(key);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [currentGuess, gameState]);

  const handleKeyPress = (letter) => {
    if (currentGuess.length < 5 && gameState === 'playing') {
      setCurrentGuess(prev => prev + letter);
    }
  };

  const handleDelete = () => {
    setCurrentGuess(prev => prev.slice(0, -1));
  };

  const showMessage = (msg, duration = 2000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  };

  const submitGuess = () => {
    if (currentGuess.length !== 5) {
      setShakeRow(true);
      showMessage('Not enough letters');
      setTimeout(() => setShakeRow(false), 500);
      return;
    }

    // In a real app, we'd check if it's a valid dictionary word here.
    // For this cafe version, we'll be lenient or check against a larger list.
    // For now, we just accept any 5 letters to keep it simple/playable.

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess('');

    if (currentGuess === solution) {
      setGameState('won');
    } else if (newGuesses.length >= 6) {
      setGameState('lost');
    }
  };

  const getLetterStatus = (letter, index, guess) => {
    if (!guess) return 'initial';
    
    const letterCount = {};
    for (const char of solution) {
      letterCount[char] = (letterCount[char] || 0) + 1;
    }

    // First pass: find greens to decrement counts
    guess.split('').forEach((l, i) => {
      if (l === solution[i]) {
        letterCount[l]--;
      }
    });

    if (guess[index] === solution[index]) return 'correct';
    
    // If not green, check if yellow is possible
    if (solution.includes(letter) && letterCount[letter] > 0) {
      // We need to verify if this specific instance should be yellow
      // This is a simplified check. A perfect check requires two passes logic 
      // which is complex to do inside a simple map function without context.
      // For UI coloring of the grid, we usually pre-calculate statuses.
      // But let's do a simpler approximation for the grid render:
      
      // Actually, let's do it properly in the render loop.
      return 'present';
    }
    
    return 'absent';
  };

  // Helper to calculate colors for a completed guess row
  const getRowColors = (guess) => {
    const status = Array(5).fill('absent');
    const solutionChars = solution.split('');
    const guessChars = guess.split('');
    const solutionCounts = {};

    // Count frequencies
    solutionChars.forEach(char => solutionCounts[char] = (solutionCounts[char] || 0) + 1);

    // First pass: Correct (Green)
    guessChars.forEach((char, i) => {
      if (char === solutionChars[i]) {
        status[i] = 'correct';
        solutionCounts[char]--;
      }
    });

    // Second pass: Present (Yellow)
    guessChars.forEach((char, i) => {
      if (status[i] !== 'correct' && solutionCounts[char] > 0) {
        status[i] = 'present';
        solutionCounts[char]--;
      }
    });

    return status;
  };

  const generateSecureCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPart = '';
    const array = new Uint32Array(2);
    crypto.getRandomValues(array);
    for (let i = 0; i < 8; i++) {
      const index = array[i % 2] % chars.length;
      randomPart += chars[index];
      array[i % 2] = Math.floor(array[i % 2] / chars.length);
    }
    return `WORDLE-${randomPart.slice(0, 4)}-${randomPart.slice(4)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <h2 className="text-xl font-bold font-display text-gray-900">Cafe Wordle</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Game Board */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center bg-gray-50">
          
          {/* Message Toast */}
          {message && (
            <div className="absolute top-20 z-10 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold animate-fade-in-up shadow-lg">
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
                    let borderColor = 'border-gray-200';
                    let textColor = 'text-gray-900';

                    if (guess) {
                      const status = rowColors[colIndex];
                      if (status === 'correct') {
                        bgColor = 'bg-green-500';
                        borderColor = 'border-green-500';
                        textColor = 'text-white';
                      } else if (status === 'present') {
                        bgColor = 'bg-primary'; // Yellow theme
                        borderColor = 'border-primary';
                        textColor = 'text-gray-900';
                      } else {
                        bgColor = 'bg-gray-400';
                        borderColor = 'border-gray-400';
                        textColor = 'text-white';
                      }
                    } else if (letter) {
                      borderColor = 'border-gray-400';
                      textColor = 'text-gray-900';
                    }

                    return (
                      <div
                        key={colIndex}
                        className={`
                          w-12 h-12 md:w-14 md:h-14 border-2 rounded-lg flex items-center justify-center text-2xl font-bold uppercase transition-all duration-300
                          ${bgColor} ${borderColor} ${textColor}
                          ${letter && !guess ? 'animate-pop' : ''}
                        `}
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

        {/* Footer Instruction */}
        <div className="p-4 bg-white border-t border-gray-100 text-center text-gray-500 text-sm">
          Type using your keyboard to play
        </div>

        {/* Game Over Modal Overlay */}
        {gameState !== 'playing' && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
            <div className="text-center max-w-xs w-full">
              <div className="mb-4 flex justify-center">
                {gameState === 'won' ? (
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 animate-bounce">
                    <Trophy className="w-10 h-10" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                )}
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2 font-display">
                {gameState === 'won' ? 'You Won!' : 'Game Over'}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {gameState === 'won' 
                  ? 'Great job! You guessed the daily word.' 
                  : `The word was ${solution}. Better luck tomorrow!`}
              </p>

              {gameState === 'won' && (
                <div className="bg-primary/10 p-4 rounded-xl mb-6 border border-primary/20">
                  <p className="text-sm font-bold text-primary-dark uppercase tracking-wider mb-1">Reward Unlocked</p>
                  <p className="text-lg font-bold text-gray-900 select-all">{generateSecureCode()}</p>
                  <p className="text-xs text-gray-500 mt-1">Use this code at checkout</p>
                </div>
              )}

              <button 
                onClick={onClose}
                className="w-full bg-primary hover:bg-primary-dark text-gray-900 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-primary/20 active:scale-95"
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