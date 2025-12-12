import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import QuantitySelector from './QuantitySelector';

const MenuCard = ({ 
  item, 
  quantity = 0,
  onAddToCart,
  onUpdateQuantity,
  showFullDetails = false
}) => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  
  const {
    name,
    category,
    price,
    image,
    description,
    ingredients = [],
    allergens = [],
    nutritionalInfo = {},
    available = true,
    preparationTime
  } = item;

  const handleAddToCart = () => {
    if (onAddToCart && available) {
      onAddToCart(item);
    }
  };

  const handleChatWithAI = () => {
    navigate('/ai', { state: { contextItem: item } });
  };

  const handleSearchOnline = () => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(name + ' cafe item ingredients')}`, '_blank');
  };

  return (
    <>
      <div className={`bg-white rounded-3xl shadow-md overflow-hidden transition-all duration-300 flex flex-col h-full group animate-fade-in ${!available ? 'opacity-70' : 'hover:translate-y-[-4px] hover:shadow-lg'}`}>
        <div className="relative w-full pt-[75%] overflow-hidden bg-gray-100">
          <img 
            src={image || 'https://via.placeholder.com/400x300?text=No+Image'} 
            alt={name}
            className={`absolute top-0 left-0 w-full h-full object-cover transition-transform duration-500 ${available ? 'group-hover:scale-105' : ''}`}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
            }}
          />
          {!available && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-2xl text-xs font-bold shadow-md">Unavailable</div>
          )}
          {preparationTime && (
            <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded-2xl text-xs font-medium backdrop-blur-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {preparationTime} min
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col flex-1">
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="text-lg font-bold text-gray-900 m-0">{name}</h3>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg uppercase tracking-wider">{category}</span>
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>

          {showFullDetails && (
            <>
              {ingredients.length > 0 && (
                <div className="text-xs text-gray-500 mb-2">
                  <strong>Ingredients:</strong> {ingredients.join(', ')}
                </div>
              )}

              {allergens.length > 0 && (
                <div className="text-xs text-red-500 mb-2">
                  <strong>Allergens:</strong> {allergens.join(', ')}
                </div>
              )}

              {nutritionalInfo.calories && (
                <div className="flex gap-3 text-xs text-gray-500 mb-4 pt-2 border-t border-gray-100">
                  <span>{nutritionalInfo.calories} cal</span>
                  {nutritionalInfo.protein && <span>Protein: {nutritionalInfo.protein}</span>}
                  {nutritionalInfo.carbs && <span>Carbs: {nutritionalInfo.carbs}</span>}
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="flex items-baseline text-primary-dark">
                <span className="text-sm font-medium mr-0.5">$</span>
                <span className="text-2xl font-bold">{price.toFixed(2)}</span>
              </div>
              <button 
                onClick={() => setShowModal(true)}
                className="w-8 h-8 rounded-full bg-gray-100 text-primary-dark flex items-center justify-center hover:bg-primary hover:text-gray-900 transition-colors"
                title="Ask AI / Details"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            {quantity > 0 ? (
              <QuantitySelector
                quantity={quantity}
                onChange={(newQty) => onUpdateQuantity(item, newQty)}
                size="medium"
              />
            ) : (
              <Button
                variant="primary"
                size="medium"
                onClick={handleAddToCart}
                disabled={!available}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Add
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Product Details Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="relative h-48 bg-gray-100">
              <img 
                src={image || 'https://via.placeholder.com/400x300?text=No+Image'} 
                alt={name}
                className="w-full h-full object-cover"
              />
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-gray-600 hover:bg-white hover:text-red-500 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
                  <p className="text-gray-500">{category}</p>
                </div>
                <span className="text-2xl font-bold text-primary-dark">${price.toFixed(2)}</span>
              </div>

              <p className="text-gray-600 mb-6">{description}</p>

              <div className="space-y-4 mb-8">
                {ingredients.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Ingredients</h4>
                    <p className="text-sm text-gray-600">{ingredients.join(', ')}</p>
                  </div>
                )}
                
                {allergens.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Allergens</h4>
                    <p className="text-sm text-red-500">{allergens.join(', ')}</p>
                  </div>
                )}

                {nutritionalInfo.calories && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Nutritional Info</h4>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="block text-gray-500 text-xs">Calories</span>
                        <span className="font-medium">{nutritionalInfo.calories}</span>
                      </div>
                      {nutritionalInfo.protein && (
                        <div>
                          <span className="block text-gray-500 text-xs">Protein</span>
                          <span className="font-medium">{nutritionalInfo.protein}g</span>
                        </div>
                      )}
                      {nutritionalInfo.carbs && (
                        <div>
                          <span className="block text-gray-500 text-xs">Carbs</span>
                          <span className="font-medium">{nutritionalInfo.carbs}g</span>
                        </div>
                      )}
                      {nutritionalInfo.fat && (
                        <div>
                          <span className="block text-gray-500 text-xs">Fat</span>
                          <span className="font-medium">{nutritionalInfo.fat}g</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleSearchOnline}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Online
                </button>
                <button 
                  onClick={handleChatWithAI}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-light text-gray-900 font-bold shadow-yellow hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-xl">🤖</span>
                  Chat with AI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuCard;
