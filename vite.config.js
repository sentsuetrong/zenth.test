import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import liveReload from 'vite-plugin-live-reload'
import { resolve } from 'path'

export default defineConfig({
  publicDir: 'assets',
  plugins: [
    tailwindcss(),
    liveReload([
      __dirname + '/app/Views/**/*.php',
      __dirname + '/app/Controllers/**/*.php',
      __dirname + '/app/Helpers/**/*.php',
    ]),
  ],
  build: {
    outDir: 'static',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/main.js'),
        style: resolve(__dirname, 'src/style.scss'),
      },
    },
  },
})
