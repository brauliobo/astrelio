import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

const dist = (pkg, file) => fileURLToPath(new URL(`./node_modules/${pkg}/dist/${file}`, import.meta.url))

// Vue's Node/CJS entry does not re-export Vapor. Pin the runtime graph to the
// ESM-bundler builds so createVaporApp, template(), and related helpers exist.
export const vueRuntimeAliases = [
  { find: /^vue$/, replacement: dist('vue', 'vue.runtime.esm-bundler.js') },
  { find: /^@vue\/runtime-dom$/, replacement: dist('@vue/runtime-dom', 'runtime-dom.esm-bundler.js') },
  { find: /^@vue\/runtime-core$/, replacement: dist('@vue/runtime-core', 'runtime-core.esm-bundler.js') },
  { find: /^@vue\/runtime-vapor$/, replacement: dist('@vue/runtime-vapor', 'runtime-vapor.esm-bundler.js') },
  { find: /^@vue\/reactivity$/, replacement: dist('@vue/reactivity', 'reactivity.esm-bundler.js') },
  { find: /^@vue\/shared$/, replacement: dist('@vue/shared', 'shared.esm-bundler.js') },
]

export const vuePlugin = (vapor = true) => vue({
  features: { vapor },
})
