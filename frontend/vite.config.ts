import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(() => {
  // If building for Vercel, Netlify, or Standalone SPA, use root base and dist outDir
  const isStandalone = process.env.VERCEL === '1' || process.env.NETLIFY === 'true' || process.env.STANDALONE === 'true';

  return {
    plugins: [react()],
    base: isStandalone ? '/' : '/static/',
    build: {
      outDir: isStandalone ? 'dist' : path.resolve(__dirname, '../static'),
      emptyOutDir: isStandalone,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    },
    server: {
      proxy: {
        '/api': 'http://localhost:8081',
        '/health': 'http://localhost:8081'
      }
    }
  };
});
