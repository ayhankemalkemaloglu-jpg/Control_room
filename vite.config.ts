import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server runs on 3000 to match the backend's default CORS_ORIGINS entry
// (http://localhost:3000). Override the API target with VITE_API_BASE.
export default defineConfig({
  plugins: [react()],
  server: { port: 3000, host: true },
  preview: { port: 3000 },
});
