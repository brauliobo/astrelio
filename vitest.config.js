import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.spec.js'],
    globals: true
  },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } }
})
