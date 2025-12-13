import { useState, useRef, useEffect } from 'react';
import { X, Trophy, AlertCircle, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';

const SEGMENTS = [
  { id: 1, label: '10% OFF', value: 10, type: 'discount', color: '#FDD835', text: '#1A1A1A' },
  { id: 2, label: 'Free Cookie', value: 'cookie', type: 'item', color: '#FFFFFF', text: '#1A1A1A' },
  { id: 3, label: '20% OFF', value: 20, type: 'discount', color: '#FDD835', text: '#1A1A1A' },
  { id: 4, label: 'Try Again', value: null, type: 'none', color: '#E5E7EB', text: '#6B7280' },
  { id: 5, label: '5% OFF', value: 5, type: 'discount', color: '#FFFFFF', text: '#1A1A1A' },
  { id: 6, label: 'Free Coffee', value: 'coffee', type: 'item', color: '#FDD835', text: '#1A1A1A' },
];

export default function SpinnerGame({ onClose }) {
  const { applyCoupon } = useCart();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [hasSpun, setHasSpun] = useState(false);
  
  // Sound effects refs (placeholders for now)
  // const spinSound = useRef(new Audio('/sounds/spin.mp3'));
  // const winSound = useRef(new Audio('/sounds/win.mp3'));

  const generateSecureCode = (prefix = 'SPIN') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes confusing chars (I, 1, O, 0)
    let randomPart = '';
    const array = new Uint32Array(2);
    crypto.getRandomValues(array);
    
    // Generate 8 character random string from crypto values
    for (let i = 0; i < 8; i++) {
      const index = array[i % 2] % chars.length;
      randomPart += chars[index];
      // Re-roll to avoid bias (simple version)
      array[i % 2] = Math.floor(array[i % 2] / chars.length);
    }
    
    // Format: PREFIX-XXXX-XXXX
    return `${prefix}-${randomPart.slice(0, 4)}-${randomPart.slice(4)}`;
  };

  const spinWheel = () => {
    if (isSpinning || hasSpun) return;

    setIsSpinning(true);
    setResult(null);

    // Calculate random rotation
    // Min 5 full spins (1800 deg) + random segment
    const minSpins = 5;
    const randomDegrees = Math.floor(Math.random() * 360);
    const totalRotation = rotation + (minSpins * 360) + randomDegrees;
    
    setRotation(totalRotation);

    // Calculate result based on final rotation
    // The pointer is at the top (0 degrees in CSS transform terms usually means 12 o'clock if we set it up right)
    // But standard CSS rotation starts 0 at 12 o'clock? No, usually 0 is whatever we define.
    // Let's assume the wheel starts with Segment 1 at the top.
    // If we rotate X degrees, the segment at the top is determined by the remaining angle.
    
    setTimeout(() => {
      setIsSpinning(false);
      setHasSpun(true);
      
      // Normalize rotation to 0-360
      const actualRotation = totalRotation % 360;
      // If we rotate clockwise, the wheel moves "right". The pointer stays at top.
      // So we need to see which segment is at 0 degrees.
      // 360 - actualRotation gives us the angle relative to the start.
      const angleAtPointer = (360 - actualRotation) % 360;
      
      // Each segment is 60 degrees (360 / 6)
      const segmentIndex = Math.floor(angleAtPointer / 60);
      const winningSegment = SEGMENTS[segmentIndex];
      
      setResult(winningSegment);
    }, 4000); // Match CSS transition duration
  };

  const handleApplyCoupon = () => {
    if (result && result.type !== 'none') {
      const secureCode = generateSecureCode(result.type === 'discount' ? 'SAVE' : 'GIFT');
      applyCoupon({
        code: secureCode,
        type: result.type,
        value: result.value,
        description: result.label
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <h2 className="text-xl font-bold font-display text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-dark" />
            Daily Spin
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Game Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-gray-50 relative">
          
          {/* Pointer */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
            <div className="w-8 h-10 bg-red-500 clip-path-triangle shadow-lg" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
          </div>

          {/* Wheel Container */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8">
            <div 
              className="w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.15, 0, 0.15, 1)"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              {/* Segments */}
              {SEGMENTS.map((segment, index) => {
                const rotation = index * 60;
                return (
                  <div
                    key={segment.id}
                    className="absolute top-0 left-0 w-full h-full origin-center"
                    style={{ 
                      transform: `rotate(${rotation}deg)`,
                      clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 33.33%)' // This clip path is tricky for 60 degrees.
                      // Better approach: Use Conic Gradient or SVG. Let's use SVG for the wheel content.
                    }}
                  >
                    {/* We'll use SVG below instead of this div mess */}
                  </div>
                );
              })}

              {/* SVG Wheel */}
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {SEGMENTS.map((segment, index) => {
                  // Calculate path for 60 degree slice
                  // x = r * cos(a), y = r * sin(a)
                  // 60 deg = PI/3
                  const startAngle = (index * 60) * (Math.PI / 180);
                  const endAngle = ((index + 1) * 60) * (Math.PI / 180);
                  
                  const x1 = 50 + 50 * Math.cos(startAngle);
                  const y1 = 50 + 50 * Math.sin(startAngle);
                  const x2 = 50 + 50 * Math.cos(endAngle);
                  const y2 = 50 + 50 * Math.sin(endAngle);

                  return (
                    <g key={segment.id}>
                      <path
                        d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                        fill={segment.color}
                        stroke="white"
                        strokeWidth="0.5"
                      />
                      {/* Text Label */}
                      <text
                        x="50"
                        y="50"
                        fill={segment.text}
                        fontSize="4"
                        fontWeight="bold"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        transform={`rotate(${(index * 60) + 30 + 90}, 50, 50) translate(0, -35)`}
                      >
                        {segment.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            
            {/* Center Cap */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center z-10 border-2 border-gray-100">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* Controls / Result */}
          <div className="text-center w-full max-w-xs min-h-[120px]">
            {!result && !isSpinning && !hasSpun && (
              <button
                onClick={spinWheel}
                className="w-full bg-primary hover:bg-primary-dark text-gray-900 py-4 rounded-2xl font-bold text-xl shadow-lg shadow-primary/20 active:scale-95 transition-all animate-pulse"
              >
                SPIN NOW
              </button>
            )}

            {isSpinning && (
              <p className="text-lg font-bold text-gray-500 animate-bounce">
                Spinning...
              </p>
            )}

            {result && (
              <div className="animate-fade-in-up">
                {result.type !== 'none' ? (
                  <>
                    <div className="flex justify-center mb-2">
                      <Trophy className="w-12 h-12 text-yellow-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">You Won!</h3>
                    <p className="text-lg text-primary-dark font-bold mb-4">{result.label}</p>
                    <button
                      onClick={handleApplyCoupon}
                      className="w-full bg-primary hover:bg-primary-dark text-gray-900 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-primary/20 active:scale-95"
                    >
                      Apply to Cart
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center mb-2">
                      <AlertCircle className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">So Close!</h3>
                    <p className="text-gray-500 mb-4">Better luck next time.</p>
                    <button
                      onClick={onClose}
                      className="w-full bg-gray-200 text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}