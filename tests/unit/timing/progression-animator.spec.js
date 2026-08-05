import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ProgressionAnimator from '../../../src/components/timing/ProgressionAnimator.vue'
import en from '../../../src/i18n/en.json'

const position = (name, longitude, motion = 'direct') => ({
  name,
  longitude,
  latitude: 0,
  motion,
  speed: motion === 'retrograde' ? -0.1 : 1,
  retrograde: motion === 'retrograde',
})

const natal = {
  positions: [
    position('Sun', 10),
    position('Moon', 42),
    position('Mercury', 80),
    position('Saturn', 150),
  ],
}

const progressed = {
  positions: [
    position('Sun', 35),
    position('Moon', 90),
    position('Mercury', 75, 'retrograde'),
    position('Saturn', 168),
  ],
}

const mountAnimator = () => mount(ProgressionAnimator, {
  props: {
    person: { isoLocal: '1986-02-12T18:10' },
    natal,
    progressed,
    dateMs: Date.UTC(2025, 1, 12),
    dateInput: '2025-02-12',
    birthMs: Date.UTC(1986, 1, 12),
    aspects: [{ a: 'Sun', b: 'Saturn', type: 'square', delta: 0.4, strength: 0.9, applying: true }],
  },
  global: {
    plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
  },
})

describe('ProgressionAnimator', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the animated stage, cycle dial, and ranked change cards', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const wrapper = mountAnimator()

    expect(wrapper.get('[data-testid="progression-visualization"]').exists()).toBe(true)
    expect(wrapper.get('.progression-canvas').exists()).toBe(true)
    expect(wrapper.get('.progression-cycle-dial').text()).toContain('Tau')
    expect(wrapper.findAll('[data-testid="progression-change-card"]')).toHaveLength(4)
    expect(wrapper.get('.progression-aspect-row').text()).toContain('Sun')
  })

  it('emits persisted date changes from the date control and focuses a planet', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const wrapper = mountAnimator()

    await wrapper.get('[data-testid="prog-date"]').setValue('2030-01-01')
    expect(wrapper.emitted('update:date-input').at(-1)).toEqual(['2030-01-01'])

    await wrapper.get('[data-planet="Mercury"]').trigger('click')
    expect(wrapper.get('[data-planet="Mercury"]').classes()).toContain('is-selected')
  })
})
