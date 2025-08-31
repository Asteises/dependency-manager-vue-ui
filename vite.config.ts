import {defineConfig, loadEnv} from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // подхватит .env.[mode]
  return {
    plugins: [vue()],
    resolve: {
      alias: { '@': '/src' }
    },
    server: {
      proxy: {
        // любые вызовы на /api пробрасываем на бэкенд
        '/api': {
          target: env.VITE_API_BASE_URL, // например http://localhost:8080
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  };
});