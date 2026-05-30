import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwind from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { copyFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

const require = createRequire(import.meta.url)
const swissEphDir = dirname(require.resolve('swisseph-wasm/package.json'))

const manualChunks = (id) => {
  if (!id.includes('/node_modules/')) return undefined
  if (id.includes('/node_modules/swisseph-wasm/')) return 'vendor-swisseph'
  if (id.includes('/node_modules/three/')) return 'vendor-sky'
  if (id.includes('/node_modules/astronomy-engine/')) return 'vendor-astro'
  if (id.includes('/node_modules/luxon/')) return 'vendor-time'
  if (
    id.includes('/node_modules/@vue/') ||
    id.includes('/node_modules/vue/') ||
    id.includes('/node_modules/vue-router/') ||
    id.includes('/node_modules/vue-i18n/') ||
    id.includes('/node_modules/pinia')
  ) {
    return 'vendor-vue'
  }
  return undefined
}

const copySwissEphAssets = () => {
  let root = ''
  let outDir = ''
  return {
    name: 'copy-swisseph-assets',
    apply: 'build',
    configResolved(config) {
      root = config.root
      outDir = config.build.outDir
    },
    closeBundle() {
      // swisseph-wasm resolves these names dynamically at runtime, so Vite
      // cannot discover the .data package from static imports alone.
      const targetDir = join(root, outDir, 'wasm')
      mkdirSync(targetDir, { recursive: true })
      for (const file of ['swisseph.wasm', 'swisseph.data']) {
        copyFileSync(join(swissEphDir, 'wasm', file), join(targetDir, file))
      }
    },
  }
}

export default defineConfig(({ mode }) => ({
  base: process.env.GITHUB_PAGES === '1' ? '/astrelio/' : '/',
  plugins: [
    vue(),
    tailwind(),
    copySwissEphAssets(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Astrelio',
        short_name: 'Astrelio',
        description: 'Frontend-only astrology app',
        theme_color: '#0b0a1a',
        background_color: '#0b0a1a',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        globIgnores: ['**/data/cities.generated.json']
      }
    })
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server:  { port: 5173, host: '127.0.0.1' },
  preview: { port: 4173, host: '127.0.0.1' },
  assetsInclude: ['**/*.wasm', '**/*.data'],
  optimizeDeps: { exclude: ['swisseph-wasm'] },
  build:   {
    outDir: 'docs',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: mode !== 'production',
    rollupOptions: {
      output: { manualChunks }
    }
  }
}))
