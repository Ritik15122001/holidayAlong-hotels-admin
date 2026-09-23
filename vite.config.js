import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Admin is served under /admin, so assets and the router share this base.
  base: '/admin/',
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:5050' } },
});
