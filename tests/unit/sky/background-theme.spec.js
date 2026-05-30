import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Background from '../../../src/components/sky/Background.vue'
import { createSkyScene } from '../../../src/lib/sky/scene.js'

const scene = vi.hoisted(() => ({
  handle: {
    dispose:    vi.fn(),
    setContext: vi.fn(),
  },
}))

vi.mock('../../../src/lib/sky/scene.js', () => ({
  createSkyScene: vi.fn(() => scene.handle),
}))

const messages = {
  en: {
    planets: {
      Sun:     'Sun',
      Moon:    'Moon',
      Mercury: 'Mercury',
      Venus:   'Venus',
      Mars:    'Mars',
      Jupiter: 'Jupiter',
      Saturn:  'Saturn',
      Uranus:  'Uranus',
      Neptune: 'Neptune',
      Pluto:   'Pluto',
    },
  },
}

const flushFrame = async () => {
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('Background theme', () => {
  beforeEach(() => {
    scene.handle.dispose.mockClear()
    scene.handle.setContext.mockClear()
    createSkyScene.mockClear()
    vi.stubGlobal('requestAnimationFrame', (callback) => {
      callback()
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    window.matchMedia = vi.fn(() => ({ matches: false }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('passes theme changes into the sky scene reactively', async () => {
    const wrapper = mount(Background, {
      props:  { theme: 'dark' },
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages })],
      },
    })

    await flushFrame()
    expect(createSkyScene).toHaveBeenCalledTimes(1)
    expect(scene.handle.setContext).toHaveBeenLastCalledWith(expect.objectContaining({ theme: 'dark' }))

    await wrapper.setProps({ theme: 'light' })
    expect(scene.handle.setContext).toHaveBeenLastCalledWith(expect.objectContaining({ theme: 'light' }))
    expect(wrapper.get('[data-testid="sky-bg"]').attributes('data-theme')).toBe('light')
  })
})
