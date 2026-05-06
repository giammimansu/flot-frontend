import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // firebase-messaging-sw.js is manually managed in public/
      // vite-plugin-pwa generates its own sw.js alongside it
      filename: 'sw.js',
      manifest: false, // manifest.json is manually managed in public/
      injectRegister: 'auto',
      workbox: {
        // Precache all static assets produced by Vite
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],

        // Exclude auth-related paths from SW scope
        navigateFallbackDenylist: [/^\/auth\//, /^\/oauth2\//],

        runtimeCaching: [
          // API calls — Network First, 10s timeout, fallback to cache
          {
            urlPattern: ({ url }) =>
              url.hostname.includes('api.flot.app') ||
              url.hostname.includes('ws.flot.app'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'flot-api',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts — Stale While Revalidate
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Static CDN assets — Cache First
          {
            urlPattern: /^https:\/\/cdn\.flot\.app\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'flot-cdn',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        // Never intercept Cognito or auth traffic
        navigateFallback: '/offline.html',
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],

  server: {
    port: 3000,
    host: true,
  },

  build: {
    target: 'es2023',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/messaging'],
          'vendor-aws': ['aws-amplify', '@aws-amplify/auth'],
          'vendor-stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
        },
      },
    },
  },
});
