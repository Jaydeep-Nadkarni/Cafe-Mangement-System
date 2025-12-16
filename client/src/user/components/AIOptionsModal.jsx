import { X, Search, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AIOptionsModal({ item, isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSearchOnline = () => {
    const searchQuery = encodeURIComponent(`${item.name} recipe ingredients`);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
    onClose();
  };

  const handleAskAI = () => {
    navigate(`/ai?item=${encodeURIComponent(item.name)}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
          <h3 className="font-bold text-gray-900 text-lg font-heading">{item.name}</h3>
          <p className="text-sm text-gray-500 mt-1">What would you like to do?</p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <button
            onClick={handleSearchOnline}
            className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all group"
          >
            <div className="bg-white p-3 rounded-xl shadow-sm group-hover:shadow transition-shadow">
              <Search className="w-5 h-5 text-gray-700" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900 text-sm">Search this online</p>
              <p className="text-xs text-gray-500">Open Google search in new tab</p>
            </div>
          </button>

          <button
            onClick={handleAskAI}
            className="w-full flex items-center gap-4 p-4 bg-primary/10 hover:bg-primary/20 rounded-2xl transition-all group"
          >
            <div className="bg-primary p-3 rounded-xl shadow-sm group-hover:shadow transition-shadow">
              <MessageCircle className="w-5 h-5 text-gray-900" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900 text-sm">Ask AI about this item</p>
              <p className="text-xs text-gray-500">Get details, ingredients & more</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
