import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  // Never inline assets as data: URLs, so the strict Content Security Policy can block them
  build: { assetsInlineLimit: 0 },
  server: { port: 5173, proxy: { '/api': 'http://localhost:4000' } },
});
