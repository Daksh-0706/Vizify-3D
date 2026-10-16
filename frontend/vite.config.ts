import { defineConfig } from 'vite';
export default defineConfig({
  server: { port: 5173, proxy: { '/scans': 'http://localhost:8000', '/scan': 'http://localhost:8000', '/health': 'http://localhost:8000' } },
  build: { target: 'es2020' }
});
