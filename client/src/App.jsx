import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { Layout, PageTransition } from './components';
import { MenuPage, OrderSummaryPage, PaymentSuccessPage, GamesPage, AIChatPage } from './pages';

export default function App() {
  return (
    <GameProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Layout>
          <Routes>
            <Route path="/menu" element={<PageTransition><MenuPage /></PageTransition>} />
            <Route path="/games" element={<PageTransition><GamesPage /></PageTransition>} />
            <Route path="/ai" element={<PageTransition><AIChatPage /></PageTransition>} />
            <Route path="/order-summary" element={<PageTransition><OrderSummaryPage /></PageTransition>} />
            <Route path="/payment-success" element={<PageTransition><PaymentSuccessPage /></PageTransition>} />
            <Route path="/" element={<Navigate to="/menu" replace />} />
            <Route path="*" element={<Navigate to="/menu" replace />} />
          </Routes>
        </Layout>
      </Router>
    </GameProvider>
  )
}


