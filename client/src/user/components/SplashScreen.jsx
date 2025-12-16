import { useEffect, useState } from 'react';
import { Coffee, Croissant, Pizza, IceCream } from 'lucide-react';

export default function SplashScreen({ onComplete }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Track mouse/touch movement for parallax
    const handleMove = (e) => {
      const x = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const y = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
      
      setMousePos({
        x: (x / window.innerWidth - 0.5) * 20,
        y: (y / window.innerHeight - 0.5) * 20
      });
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);

    // INCREASED: Auto-exit splash screen after 12 seconds (was 7)
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 3500); // Changed from 7000 to 12000 (12 seconds)

    // INCREASED: Complete transition after fade-out animation
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4500); // Changed from 8200 to 13500 (13.5 seconds total)

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen fixed inset-0 z-9999 ${isExiting ? 'splash-exit' : ''}`}>
      {/* Background Layer - Slowest parallax */}
      <div 
        className="absolute inset-0 bg-linear-to-br from-amber-50 via-orange-50 to-amber-100 transition-transform duration-500 ease-out"
        style={{
          transform: `translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px)`
        }}
      />

      {/* Decorative Circles - Medium parallax */}
      <div 
        className="absolute top-10 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float-slower"
        style={{
          transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`
        }}
      />
      <div 
        className="absolute bottom-20 left-10 w-48 h-48 bg-orange-300/20 rounded-full blur-3xl animate-float-slower-delayed"
        style={{
          transform: `translate(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px)`
        }}
      />

      {/* Floating Food Icons - Faster parallax */}
      <div 
        className="absolute top-1/4 left-1/4 opacity-20 animate-float-slowest"
        style={{
          transform: `translate(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px)`
        }}
      >
        <Coffee className="w-12 h-12 text-amber-600" strokeWidth={1.5} />
      </div>
      <div 
        className="absolute top-1/3 right-1/4 opacity-15 animate-float-slower-delayed"
        style={{
          transform: `translate(${mousePos.x * 0.9}px, ${mousePos.y * 0.9}px)`
        }}
      >
        <Croissant className="w-10 h-10 text-orange-500" strokeWidth={1.5} />
      </div>
      <div 
        className="absolute bottom-1/3 left-1/3 opacity-20 animate-float-slower"
        style={{
          transform: `translate(${mousePos.x * 0.7}px, ${mousePos.y * 0.7}px)`
        }}
      >
        <Pizza className="w-14 h-14 text-amber-500" strokeWidth={1.5} />
      </div>
      <div 
        className="absolute bottom-1/4 right-1/3 opacity-15 animate-float-slowest-delayed"
        style={{
          transform: `translate(${mousePos.x * 0.85}px, ${mousePos.y * 0.85}px)`
        }}
      >
        <IceCream className="w-11 h-11 text-orange-400" strokeWidth={1.5} />
      </div>

      {/* Main Content - Fastest parallax */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${mousePos.x * 1.2}px, ${mousePos.y * 1.2}px)`
        }}
      >
        {/* Logo */}
        <div className="mb-6 animate-logo-appear">
          <div className="bg-primary p-6 rounded-3xl shadow-2xl relative overflow-hidden">
            {/* Slower shine effect */}
            <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/30 to-transparent animate-shine-slower" />
            <Coffee className="w-16 h-16 text-gray-900 relative z-10" strokeWidth={2} />
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-5xl font-bold text-gray-900 mb-3 animate-slide-up font-heading tracking-tight">
          Cafe
        </h1>

        {/* Tagline */}
        <p className="text-lg text-gray-600 font-medium mb-8 animate-slide-up-delayed tracking-wide">
          Order · Play · Enjoy
        </p>

        {/* Loading Dots - Slower animation */}
        <div className="flex gap-2 animate-fade-in-delayed">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce-dot-slower" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce-dot-slower" style={{ animationDelay: '300ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce-dot-slower" style={{ animationDelay: '600ms' }} />
        </div>
      </div>

      <style>{`
        /* Exit animation */
        .splash-exit {
          animation: fadeOut 1500ms ease-out forwards;
        }

        @keyframes fadeOut {
          to {
            opacity: 0;
            transform: scale(1.05);
          }
        }

        /* Logo appear */
        @keyframes logoAppear {
          0% {
            opacity: 0;
            transform: scale(0.8) rotate(-10deg);
          }
          60% {
            transform: scale(1.1) rotate(5deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        .animate-logo-appear {
          animation: logoAppear 1800ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* Slide up animations */
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          opacity: 0;
          animation: slideUp 1200ms ease-out 900ms forwards;
        }
        .animate-slide-up-delayed {
          opacity: 0;
          animation: slideUp 1200ms ease-out 1400ms forwards;
        }

        /* Fade in delayed */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-delayed {
          opacity: 0;
          animation: fadeIn 1000ms ease-out 1800ms forwards;
        }

        /* Slower float animations */
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes floatSlower {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        .animate-float-slower {
          animation: floatSlower 10s ease-in-out infinite;
        }
        .animate-float-slower-delayed {
          animation: floatSlower 10s ease-in-out infinite 2s;
        }
        .animate-float-slowest {
          animation: floatSlower 14s ease-in-out infinite;
        }
        .animate-float-slowest-delayed {
          animation: floatSlower 14s ease-in-out infinite 3s;
        }

        /* Slower bounce dots */
        @keyframes bounceDotSlower {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        .animate-bounce-dot-slower {
          animation: bounceDotSlower 2.1s ease-in-out infinite;
        }

        /* Slower shine effect */
        @keyframes shineSlower {
          0% { transform: translateX(-100%) translateY(-100%) rotate(30deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(30deg); }
        }
        .animate-shine-slower {
          animation: shineSlower 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}