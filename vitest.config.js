import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'
import { vuePlugin } from './vite.vue.js'

export default defineConfig({
  plugins: [vuePlugin(false)],
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.spec.js'],
    globals: true,
  },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
