import { useNavigate } from 'react-router-dom';
import { Gamepad2, Check, Mail, Rocket, ArrowRight } from 'lucide-react';

export default function GamesPage() {
  const navigate = useNavigate();

  return (
    <div className="px-4 md:px-6 py-12 flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md text-center animate-fade-in-up">
        {/* Animated Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            {/* Spinning background */}
            <div className="absolute inset-0 w-24 h-24 bg-linear-to-r from-primary/20 to-primary-light/20 rounded-full animate-spin opacity-30" style={{ animationDuration: '3s' }} />
            
            {/* Static game icon */}
            <div className="relative w-24 h-24 flex items-center justify-center text-primary-dark">
              <Gamepad2 className="w-12 h-12" />
            </div>
          </div>
        </div>

        {/* Coming Soon Message */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Coming Soon!
        </h1>
        
        <p className="text-lg text-gray-600 mb-2">
          Exciting games and rewards are on their way
        </p>
        
        <p className="text-sm text-gray-500 mb-8">
          We're working hard to bring you an amazing gaming experience. Stay tuned!
        </p>

        {/* Feature Preview */}
        <div className="bg-linear-to-br from-primary/10 to-primary-light/10 rounded-3xl p-8 mb-8 border border-primary/20">
          <h3 className="text-lg font-bold text-primary-dark mb-6">What's Coming?</h3>
          
          <ul className="space-y-4 text-left">
            <li className="flex gap-4 items-start">
              <span className="shrink-0 w-8 h-8 rounded-full bg-primary text-gray-900 font-bold flex items-center justify-center">
                <Check className="w-4 h-4" />
              </span>
              <div>
                <p className="font-semibold text-gray-900">Daily Spin & Win</p>
                <p className="text-xs text-gray-600">Spin daily and earn rewards</p>
              </div>
            </li>

            <li className="flex gap-4 items-start">
              <span className="shrink-0 w-8 h-8 rounded-full bg-primary text-gray-900 font-bold flex items-center justify-center">
                <Check className="w-4 h-4" />
              </span>
              <div>
                <p className="font-semibold text-gray-900">Scratch Cards</p>
                <p className="text-xs text-gray-600">Instant rewards and discounts</p>
              </div>
            </li>

            <li className="flex gap-4 items-start">
              <span className="shrink-0 w-8 h-8 rounded-full bg-primary text-gray-900 font-bold flex items-center justify-center">
                <Check className="w-4 h-4" />
              </span>
              <div>
                <p className="font-semibold text-gray-900">Leaderboards</p>
                <p className="text-xs text-gray-600">Compete and win prizes</p>
              </div>
            </li>

            <li className="flex gap-4 items-start">
              <span className="shrink-0 w-8 h-8 rounded-full bg-primary text-gray-900 font-bold flex items-center justify-center">
                <Check className="w-4 h-4" />
              </span>
              <div>
                <p className="font-semibold text-gray-900">Loyalty Points</p>
                <p className="text-xs text-gray-600">Earn points on every order</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Notification Signup */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-8 border border-gray-100">
          <p className="text-sm text-gray-600 mb-4 flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" /> Be the first to know when games launch
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-gray-100 border-2 border-transparent rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:bg-white transition-all duration-200"
            />
            <button className="px-4 py-3 bg-primary hover:bg-primary-dark text-gray-900 font-semibold rounded-2xl transition-colors whitespace-nowrap">
              Notify
            </button>
          </div>
        </div>

        {/* Back to Menu Button */}
        <button
          onClick={() => navigate('/menu')}
          className="w-full bg-linear-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-gray-900 font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-yellow hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 group"
        >
          <span>Browse Menu Instead</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
        </button>

        {/* Fun Footer Message */}
        <p className="text-xs text-gray-400 mt-8 flex items-center justify-center gap-1">
          <Rocket className="w-3 h-3" /> Launching in Q4 2025
        </p>
      </div>
    </div>
  );
}
