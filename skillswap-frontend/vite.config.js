import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  preview: {
    host: true,
    allowedHosts: ['skillswapafrica.onrender.com']
  },
  define: {
    // Provide a browser global for libraries that expect `global`
    global: 'globalThis'
  },
  optimizeDeps: {
    include: ['simple-peer']
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    ssr: false
  }
})
