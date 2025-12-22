import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { CartProvider } from './user/context/CartContext'
import { SocketProvider } from './user/context/SocketContext'
import { AuthProvider } from './user/context/AuthContext'
import { registerServiceWorker, setupOnlineStatus } from './utils/pwa'
import { setupDashboardInstallPrompt } from './utils/dashboardPWA'

// Initialize PWA features
registerServiceWorker();
setupDashboardInstallPrompt(); // Dashboard-specific install prompt
setupOnlineStatus();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>,
)
