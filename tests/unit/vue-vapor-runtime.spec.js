import { createVaporApp, template, vaporInteropPlugin } from 'vue/dist/vue.runtime-with-vapor.esm-browser.js'
import { describe, expect, it } from 'vitest'

describe('vue vapor runtime', () => {
  it('exports vapor helpers from the Vue 3.6 runtime', () => {
    expect(typeof template).toBe('function')
    expect(typeof createVaporApp).toBe('function')
    expect(['function', 'object']).toContain(typeof vaporInteropPlugin)
  })
})
