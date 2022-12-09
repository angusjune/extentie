import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Icons from 'unplugin-icons/vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  build: {
    rollupOptions: {
      input: {
        customize: 'customize.html',
      },
    },
  },
  plugins: [
    vue(),
    crx({ manifest }),
    Icons({
      compiler: 'vue3',
      autoInstall: true,
      scale: 1,
    }),
  ]
});
