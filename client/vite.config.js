import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  server: {
    '/api': {
      target: 'http://localhost:10000',
      changeOrigin: true,
    },
  },
})
