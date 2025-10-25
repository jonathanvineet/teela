import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: false, // Disable error overlay
    },
    watch: {
      // Ignore changes to agents_registry.json to prevent HMR reload
      ignored: ['**/agents/agents_registry.json', '**/agents/*.py']
    },
    proxy: {
      '/api/teela-chat': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
