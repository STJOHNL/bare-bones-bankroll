import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dev server proxies /api to the Express backend, so the client always
// calls a same-origin relative path. Set API_PORT if the server isn't on 5004.
const apiPort = process.env.API_PORT || 5004

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
  test: {
    // Use jsdom so React components can render in a browser-like environment
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
