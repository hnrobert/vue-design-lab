import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { lab } from 'vue-design-lab/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue(), lab()],
  resolve: {
    // fileURLToPath keeps the alias correct on Windows too
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
