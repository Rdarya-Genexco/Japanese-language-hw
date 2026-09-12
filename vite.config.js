import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Give library chunks stable names based on their package, not content hash.
        // This means vendor chunks (React, firebase, mammoth…) keep the same URL
        // across deploys when the library version hasn't changed — fewer stale-chunk
        // errors for users who already have those chunks cached.
        manualChunks(id) {
          // Pin these two library chunks to stable names so their URLs don't
          // change between deploys when the library version hasn't changed.
          // mammoth: loaded via dynamic import() for DOCX — must be stable.
          // lucide: large icon set, never changes between app deploys.
          if (id.includes('node_modules/mammoth'))  return 'mammoth'
          if (id.includes('node_modules/lucide'))   return 'lucide'
        },
      },
    },
  },
})
