import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ["**/*.{png}"],
      manifest: {
        "name": "Sumnews",
        "short_name": "Sumnews",
        "description": "A modern app that provides summarized news articles.",
        "start_url": "/",
        "display": "standalone",
        "icons": [
          {
            "src": "favicon/favicon-16x16.png",
            "sizes": "16x16",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "favicon/favicon-32x32.png",
            "sizes": "32x32",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "favicon/favicon.ico",
            "sizes": "48x48",
            "type": "image/x-icon",
            "purpose": "any"
          },
          {
            "src": "favicon/apple-touch-icon.png",
            "sizes": "180x180",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "favicon/icon512_maskable.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any"
          },
          {
            "src": "favicon/icon512_maskable.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
          },
          {
            "src": "favicon/icon512_rounded.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any"
          }
        ],
        "orientation": "portrait",
        "dir": "auto",
        "lang": "en-US",
        "scope": "/",
        "theme_color": "#62febd",
        "background_color": "#ffffff",
        "screenshots": [
          {
            "src": "favicon/screenshot-1280x720.png",
            "sizes": "1280x720",
            "type": "image/png",
            "purpose": "any",
            "form_factor": "wide"
          },
          {
            "src": "favicon/screenshot-750x1334.png",
            "sizes": "750x1334",
            "type": "image/png",
            "purpose": "any"
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg,ico}']
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
});