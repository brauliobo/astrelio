import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.spec.js'],
    globals: true
  },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } }
})
