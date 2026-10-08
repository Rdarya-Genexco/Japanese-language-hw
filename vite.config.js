import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { handleGemini, withDefaults } from './netlify/edge-functions/gemini.js'

/**
 * Serves /api/gemini during `npm run dev` with the same handler as the Netlify Edge Function,
 * so AI works locally without `netlify dev`. GEMINI_API_KEY is read from .env on the dev machine only.
 */
function geminiDevApi() {
  return {
    name: 'gemini-dev-api',
    apply: 'serve',
    configureServer(server) {
      const vars = loadEnv(server.config.mode, process.cwd(), '')
      const env = withDefaults({ get: (name) => vars[name] })
      server.middlewares.use('/api/gemini', async (req, res) => {
        try {
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const request = new Request(new URL(req.originalUrl || req.url, 'http://localhost'), {
            method: req.method,
            headers: req.headers,
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
          })
          const response = await handleGemini(request, env)
          res.statusCode = response.status
          response.headers.forEach((value, name) => res.setHeader(name, value))
          if (response.body) for await (const chunk of response.body) res.write(chunk)
          res.end()
        } catch (err) {
          server.config.logger.error(`[gemini-dev-api] ${err.message}`)
          if (!res.headersSent) res.statusCode = 502
          res.end()
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    geminiDevApi(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: false, // use our own public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // Static pages must not be swallowed by the SPA fallback
        navigateFallbackDenylist: [/^\/privacy\.html$/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/mammoth'))  return 'mammoth'
          if (id.includes('node_modules/lucide'))   return 'lucide'
        },
      },
    },
  },
})
