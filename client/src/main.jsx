import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { CartProvider } from './context/CartContext'
import { SocketProvider } from './context/SocketContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SocketProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </SocketProvider>
  </React.StrictMode>,
)
