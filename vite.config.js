import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  server: {
    port: 5174,
    strictPort: true
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          gsap: ['gsap']
        }
      }
    }
  }
})
