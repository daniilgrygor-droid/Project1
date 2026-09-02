import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    outDir: 'build-out',
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: 'index.html',
      output: {
        manualChunks: (id) => {
          const s = String(id)
          if (s.includes('@supabase/supabase-js')) return 'supabase'
          if (s.includes('node_modules/react') || s.includes('node_modules/react-dom') || s.includes('node_modules/react-router')) return 'vendor'
        },
      },
    },
  },
})
