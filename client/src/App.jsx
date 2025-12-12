import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, PageTransition } from './components';
import { MenuPage, OrderSummaryPage, PaymentSuccessPage, GamesPage } from './pages';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/menu" element={<PageTransition><MenuPage /></PageTransition>} />
          <Route path="/games" element={<PageTransition><GamesPage /></PageTransition>} />
          <Route path="/order-summary" element={<PageTransition><OrderSummaryPage /></PageTransition>} />
          <Route path="/payment-success" element={<PageTransition><PaymentSuccessPage /></PageTransition>} />
          <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

function HomePage() {
  return (
    <div className="px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Cafe</h2>
      <p className="text-gray-600 text-lg mb-8">
        Explore our menu, order your favorite items, and enjoy exclusive games!
      </p>
      
      {/* Featured Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-primary/20 to-primary-light/20 rounded-3xl p-8 shadow-sm border border-primary/10 hover:shadow-md transition-shadow">
          <h3 className="text-2xl font-bold text-primary-dark mb-2">🍽️ Browse Menu</h3>
          <p className="text-gray-600 mb-4">
            Discover our delicious selection of coffee, pastries, and more
          </p>
          <a
            href="/menu"
            className="inline-block bg-primary hover:bg-primary-dark text-gray-900 font-semibold px-6 py-2 rounded-full transition-colors"
          >
            View Menu
          </a>
        </div>

        <div className="bg-gradient-to-br from-blue-100/40 to-blue-50/40 rounded-3xl p-8 shadow-sm border border-blue-200/30 hover:shadow-md transition-shadow">
          <h3 className="text-2xl font-bold text-blue-700 mb-2">🎮 Play Games</h3>
          <p className="text-gray-600 mb-4">
            Have fun with interactive games and win rewards
          </p>
          <a
            href="/games"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-full transition-colors"
          >
            Play Now
          </a>
        </div>
      </div>
    </div>
  )
}
