import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',  // IMPORTANT for Cloudflare Tunnel
  plugins: [react(), tailwindcss()],
  server: {
    host: true,             // REQUIRED for external URLs
    port: 3000,
    allowedHosts: true,     // Allow Cloudflare Tunnel host
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
