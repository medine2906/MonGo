import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // ethers.js için gerekli
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Buffer polyfill (ethers v6 için)
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  server: {
    port: 3000,
    open: true,
  },
});
