import { useCart } from '../context/CartContext';

export default function MenuCard({ item }) {
  const { addItem, removeItem, getQuantity } = useCart();
  const quantity = getQuantity(item.id);

  return (
    <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group animate-fade-in-up h-full flex flex-col">
      {/* Image Container */}
      <div className="relative overflow-hidden bg-gray-100 h-48 md:h-56">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* AI Button */}
        <button
          className="absolute top-3 right-3 bg-white rounded-full p-2.5 shadow-md hover:shadow-lg hover:bg-primary/10 transition-all duration-300 group-hover:scale-110 hover:scale-125 active:scale-95"
          title="Ask AI about this item"
        >
          <svg
            className="w-5 h-5 text-primary-dark"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 md:p-5 flex flex-col">
        {/* Name and Price */}
        <div className="mb-3">
          <h3 className="font-bold text-gray-900 text-lg leading-snug mb-1 line-clamp-2">
            {item.name}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
        </div>

        {/* Price */}
        <div className="mb-4">
          <span className="text-2xl font-bold text-primary">${item.price}</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Order Button / Quantity Selector */}
        {quantity === 0 ? (
          <button
            onClick={() => addItem(item)}
            className="w-full bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-gray-900 font-bold py-3 rounded-2xl transition-all duration-300 active:scale-95 hover:shadow-yellow relative group/btn overflow-hidden"
          >
            <span className="relative z-10">Order Now</span>
            <span className="absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-10 transition-opacity duration-300" />
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-gradient-to-r from-primary/20 to-primary-light/20 rounded-2xl p-1">
            <button
              onClick={() => removeItem(item.id)}
              className="flex-1 py-2.5 bg-white hover:bg-primary/10 rounded-xl transition-colors duration-300 font-bold text-lg text-primary-dark hover:text-primary active:bg-primary/20"
            >
              −
            </button>
            <span className="flex-1 text-center font-bold text-lg text-primary-dark">
              {quantity}
            </span>
            <button
              onClick={() => addItem(item)}
              className="flex-1 py-2.5 bg-white hover:bg-primary/10 rounded-xl transition-colors duration-300 font-bold text-lg text-primary-dark hover:text-primary active:bg-primary/20"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
