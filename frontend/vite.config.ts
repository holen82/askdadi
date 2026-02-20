import { defineConfig, loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: '/',
    build: {
      outDir: 'dist',
      sourcemap: true,
      target: 'es2022',
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            'markdown': ['marked', 'highlight.js']
          }
        }
      }
    },
    server: {
      port: 5173,
      strictPort: false,
      host: true
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    define: {
      // Expose env variables to the client
      // Prioritize actual environment variable over .env file
      'import.meta.env.VITE_FUNCTION_APP_URL': JSON.stringify(process.env.VITE_FUNCTION_APP_URL || env.VITE_FUNCTION_APP_URL || 'http://localhost:7071')
    }
  };
});
