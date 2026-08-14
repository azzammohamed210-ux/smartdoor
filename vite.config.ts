import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png.png'],
      manifest: {
        name: 'MZ SMART',
        short_name: 'MZ SMART',
        description: 'أنظمة الأبواب الأوتوماتيكية والأقفال الذكية',
        theme_color: '#0b1b2b',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'ar',
        dir: 'rtl',
        icons: [
          {
            src: 'logo.png.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'logo.png.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'logo.png.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
})
