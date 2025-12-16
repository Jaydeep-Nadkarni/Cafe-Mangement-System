import { X, Target, Zap, HelpCircle, Coffee, Lightbulb } from 'lucide-react';

export default function HowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9998 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-amber-900/10 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-amber-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-amber-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <HelpCircle className="w-5 h-5 text-amber-600" strokeWidth={2} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">How to Play</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-amber-50 rounded-lg transition-colors text-gray-500 hover:text-gray-900"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Intro */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-50 rounded-full mb-2">
              <Coffee className="w-6 h-6 text-amber-600" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Wordle</h3>
            <p className="text-sm text-gray-600">
              Find the hidden 5-letter word in 6 tries to win rewards
            </p>
          </div>

          {/* Game Flow */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-amber-700">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Enter 5-letter words</p>
                <p className="text-sm text-gray-500 mt-1">Type valid 5-letter café-related words</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-amber-700">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Submit with Enter</p>
                <p className="text-sm text-gray-500 mt-1">Press Enter to check your guess</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-amber-700">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Use color hints</p>
                <p className="text-sm text-gray-500 mt-1">Colors show how close your guess is</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-amber-50">
          <button
            onClick={onClose}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 rounded-lg transition-all duration-200 active:scale-[0.98]"
          >
            Start Playing
          </button>
        </div>
      </div>
    </div>
  );
}