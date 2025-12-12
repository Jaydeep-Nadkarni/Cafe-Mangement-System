import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Bot, User, Sparkles } from 'lucide-react';

export default function AIChatPage() {
  const [searchParams] = useSearchParams();
  const prefillItem = searchParams.get('item') || '';
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hi! I\'m your Café AI assistant. Ask me anything about our menu items, ingredients, recommendations, or nutritional information!'
    }
  ]);
  const [input, setInput] = useState(prefillItem ? `Tell me about ${prefillItem}` : '');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-send if prefilled
  useEffect(() => {
    if (prefillItem && input) {
      handleSend();
    }
  }, []);

  const generateResponse = (userMessage) => {
    const lowerMsg = userMessage.toLowerCase();
    
    // Simple mock AI responses
    if (lowerMsg.includes('burger') || lowerMsg.includes('cheeseburger')) {
      return 'Our Classic Cheeseburger is made with a juicy 100% beef patty, aged cheddar cheese, fresh lettuce, ripe tomatoes, and our signature house sauce. It\'s our best seller! The patty is grilled to perfection and served on a toasted brioche bun. Approximately 650 calories.';
    }
    if (lowerMsg.includes('pizza') || lowerMsg.includes('margherita')) {
      return 'The Margherita Pizza features a thin, crispy crust topped with San Marzano tomato sauce, fresh mozzarella di bufala, and aromatic basil leaves. It\'s a classic Italian favorite, baked in our wood-fired oven at 450°C. Perfect for sharing!';
    }
    if (lowerMsg.includes('coffee') || lowerMsg.includes('macchiato') || lowerMsg.includes('cappuccino')) {
      return 'We use single-origin Arabica beans roasted in-house! Our Caramel Macchiato is a customer favorite with vanilla syrup, velvety steamed milk, espresso, and a caramel drizzle. Our Cappuccino offers a perfect balance of espresso, steamed milk, and creamy foam.';
    }
    if (lowerMsg.includes('dessert') || lowerMsg.includes('cake') || lowerMsg.includes('chocolate')) {
      return 'Our Chocolate Lava Cake is an indulgent treat! It\'s a warm chocolate cake with a gooey molten center, served with a scoop of Madagascar vanilla ice cream. Best enjoyed immediately while the center is still flowing!';
    }
    if (lowerMsg.includes('vegan') || lowerMsg.includes('vegetarian')) {
      return 'We have several vegetarian options including our Margherita Pizza and Truffle Fries. For vegan options, our Iced Matcha Latte can be made with oat milk. Ask our staff about daily vegan specials!';
    }
    if (lowerMsg.includes('recommend') || lowerMsg.includes('suggestion') || lowerMsg.includes('best')) {
      return 'Based on customer favorites, I recommend trying our Classic Cheeseburger (best seller!), paired with Truffle Fries, and finish with our Chocolate Lava Cake. For drinks, the Caramel Macchiato is perfect!';
    }
    if (lowerMsg.includes('allerg') || lowerMsg.includes('gluten') || lowerMsg.includes('dairy')) {
      return 'We take allergies seriously! Please inform our staff about any allergies. Our Truffle Fries are gluten-free. We offer dairy-free milk alternatives for all our coffee drinks. Detailed allergen information is available upon request.';
    }
    
    return 'That\'s a great question! I can help you with information about our menu items, ingredients, nutritional content, and recommendations. What would you like to know more about?';
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI typing delay
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        role: 'assistant',
        content: generateResponse(input)
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-2xl mx-auto px-4">
      {/* Chat Header */}
      <div className="py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2.5 rounded-xl">
            <Sparkles className="w-5 h-5 text-gray-900" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 font-heading">Café AI Assistant</h1>
            <p className="text-xs text-gray-500">Ask me anything about our menu!</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 animate-fade-in-up ${
              message.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user'
                  ? 'bg-gray-900 text-white'
                  : 'bg-primary text-gray-900'
              }`}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-gray-900 text-white rounded-tr-sm'
                  : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 animate-fade-in-up">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary text-gray-900">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="py-4 border-t border-gray-100">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about menu items..."
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-primary hover:bg-primary-dark text-gray-900 p-3 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
