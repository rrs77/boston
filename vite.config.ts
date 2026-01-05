import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    // Vite automatically copies files from public/ to dist/ during build
    // This includes the _redirects file needed for Cloudflare Pages SPA routing
  },
});
