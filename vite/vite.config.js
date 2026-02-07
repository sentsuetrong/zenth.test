import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue(), tailwindcss()],

    base: command === 'serve' ? '/' : '/assets/.vite/',

    build: {
      outDir: path.resolve(__dirname, '../assets/.vite'),
      emptyOutDir: true,
      manifest: true,
      rollupOptions: {
        input: 'src/main.js',
      },
    },

    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      origin: 'http://zen.test:5173',
      cors: true,
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
