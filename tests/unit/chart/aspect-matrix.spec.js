import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import AspectMatrix from '../../../src/components/chart/AspectMatrix.vue'
import en from '../../../src/i18n/en.json'

const position = (name, longitude, speed = 1) => ({
  name,
  longitude,
  latitude: 0,
  speed,
  retrograde: speed < 0,
})

const chart = {
  ascendant: 13,
  mc:        87,
  positions: [
    position('Sun', 0, 1),
    position('Moon', 150, 0.5),
    position('Mars', 62, 2),
  ],
}

const mountMatrix = () => mount(AspectMatrix, {
  props: {
    base:      chart,
    baseLabel: 'Reference',
  },
  global: {
    plugins: [createI18n({ legacy: false, locale: 'en', messages: { en } })],
    stubs:   {
      CelestialGlyph: {
        props:    ['symbol'],
        template: '<span data-testid="glyph">{{ symbol }}</span>',
      },
    },
  },
})

describe('AspectMatrix', () => {
  it('shows exact orb tooltip metadata and visible legends', () => {
    const wrapper = mountMatrix()
    const sextile = wrapper.get('[data-aspect-grid-cell="Sun-Mars-sextile"]')

    expect(sextile.attributes('title')).toContain('Sun Sextile Mars')
    expect(sextile.attributes('title')).toContain('Orb: 2°00′ / 5°00′')
    expect(sextile.attributes('title')).toContain('Exact: 60°')
    expect(sextile.attributes('title')).toContain('Motion: Separating')
    expect(wrapper.text()).toContain('Aspects')
    expect(wrapper.text()).toContain('R Retrograde')
    expect(wrapper.text()).toContain('E Stationary')
  })

  it('applies major, all, applying, and exact filters to matrix cells', async () => {
    const wrapper = mountMatrix()

    expect(wrapper.find('[data-aspect-grid-cell="Sun-Moon-quincunx"]').exists()).toBe(false)

    await wrapper.get('[data-testid="aspect-filter-all"]').trigger('click')
    expect(wrapper.find('[data-aspect-grid-cell="Sun-Moon-quincunx"]').exists()).toBe(true)
    expect(wrapper.find('[data-aspect-grid-cell="Sun-Mars-sextile"]').exists()).toBe(true)

    await wrapper.get('[data-testid="aspect-filter-applying"]').trigger('click')
    expect(wrapper.find('[data-aspect-grid-cell="Sun-Moon-quincunx"]').exists()).toBe(true)
    expect(wrapper.find('[data-aspect-grid-cell="Sun-Mars-sextile"]').exists()).toBe(false)

    await wrapper.get('[data-testid="aspect-filter-exact"]').trigger('click')
    expect(wrapper.find('[data-aspect-grid-cell="Sun-Moon-quincunx"]').exists()).toBe(true)
    expect(wrapper.find('[data-aspect-grid-cell="Sun-Mars-sextile"]').exists()).toBe(false)
  })
})
