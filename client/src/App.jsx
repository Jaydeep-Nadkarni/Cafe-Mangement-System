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
          <Route path="/" element={<Navigate to="/menu" replace />} />
          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}


