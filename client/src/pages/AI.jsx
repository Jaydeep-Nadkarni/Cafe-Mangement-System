import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Button from '../components/Button';

const AI = () => {
  const location = useLocation();
  const contextItem = location.state?.contextItem;
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: contextItem 
        ? `Hello! I see you're interested in the ${contextItem.name}. How can I help you with that?`
        : 'Hello! I\'m your AI café assistant. I can help you with menu recommendations, dietary preferences, or answer any questions about our offerings. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      let apiMessages = [...messages, userMessage];

      // Inject context if available
      if (contextItem) {
        const contextMsg = {
          role: 'system',
          content: `The user is asking about a specific product from the menu. Here are the details:
          Name: ${contextItem.name}
          Description: ${contextItem.description}
          Price: $${contextItem.price}
          Category: ${contextItem.category}
          Ingredients: ${contextItem.ingredients?.join(', ') || 'N/A'}
          Allergens: ${contextItem.allergens?.join(', ') || 'N/A'}
          Please answer questions specifically about this item if asked.`
        };
        apiMessages = [contextMsg, ...apiMessages];
      }

      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        console.error('API Error:', data.error);
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your request.' }]);
      }
    } catch (error) {
      console.error('Network Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I cannot connect to the server right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    '☕ Recommend a coffee',
    '🥗 Healthy options',
    '🌱 Vegetarian menu',
    '⚡ Quick bites'
  ];

  return (
    <div className="min-h-[calc(100vh-130px)] flex flex-col bg-gray-50">
      <div className="flex items-center gap-4 px-4 py-6 bg-white shadow-sm">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-3xl shadow-yellow">🤖</div>
        <div>
          <h1 className="text-xl font-bold m-0 text-gray-900">AI Assistant</h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <p className="text-sm text-green-500 m-0 font-medium">Online</p>
          </div>
        </div>
      </div>

      {contextItem && (
        <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex items-center justify-between">
          <span className="text-sm text-primary-dark font-medium">
            Chatting about: <strong>{contextItem.name}</strong>
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto pb-[100px]">
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex animate-fade-in-up ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] md:max-w-[70%] px-6 py-4 rounded-2xl leading-relaxed break-words ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-primary to-primary-light text-gray-900 rounded-br-lg shadow-sm' 
                  : 'bg-white text-gray-900 rounded-bl-lg shadow-sm border border-gray-100'
              }`}>
                {message.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start animate-fade-in-up">
              <div className="max-w-[70%] px-6 py-4 rounded-2xl leading-relaxed break-words bg-white text-gray-900 rounded-bl-lg shadow-sm border border-gray-100 flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="flex-shrink-0 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 whitespace-nowrap transition-all duration-150 hover:bg-gray-50 hover:border-primary hover:text-primary-dark"
              onClick={() => setInput(action)}
            >
              {action}
            </button>
          ))}
        </div>

        <div className="p-4 bg-white border-t border-gray-100 flex gap-2 items-end">
          <textarea
            className="flex-1 bg-gray-100 border-none rounded-2xl px-4 py-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={1}
            style={{ minHeight: '50px', maxHeight: '150px' }}
          />
          <Button 
            onClick={handleSend} 
            disabled={loading || !input.trim()}
            className="h-[50px] w-[50px] rounded-full flex items-center justify-center p-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AI;
