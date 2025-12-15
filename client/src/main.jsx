import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { CartProvider } from './context/CartContext'
import { SocketProvider } from './context/SocketContext'
import { AuthProvider } from './context/AuthContext'

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
