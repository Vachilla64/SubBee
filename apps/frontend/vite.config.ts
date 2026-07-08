import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'SubBee — Subscription Wallet',
        short_name: 'SubBee',
        description: 'Never get surprised by a subscription charge again. Fund once, SubBee pays everything.',
        theme_color: '#E6EFEE',
        background_color: '#E6EFEE',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to the backend during development
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
    },
  },
});
