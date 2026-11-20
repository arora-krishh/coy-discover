import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The browser talks to Vite on :5173; Vite forwards /api/* to Express on :4000.
// One origin for the browser means no CORS setup is needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': 'http://localhost:4000' },
  },
});
