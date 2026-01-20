import { defineConfig } from 'vite'
import liveReload from 'vite-plugin-live-reload'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    tailwindcss(),
    liveReload([
      __dirname + '/codeigniter/app/Views/**/*.php',
      __dirname + '/codeigniter/app/Config/**/*.php',
      __dirname + '/codeigniter/app/Controllers/**/*.php',
      __dirname + '/codeigniter/app/Helpers/**/*.php',
    ]),
  ],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/main.js'),
        style: resolve(__dirname, 'src/main.scss'),
      },
    },
  },
})
