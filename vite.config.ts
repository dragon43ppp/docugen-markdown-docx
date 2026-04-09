import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    server: {
      port: 9000,
      host: '0.0.0.0',
      proxy: {
          '/api': {
              target: 'http://127.0.0.1:8001',
              changeOrigin: true,
          },
          '/python-api': {
              target: 'http://127.0.0.1:8001',
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/python-api/, ''),
          }
      }
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
});
