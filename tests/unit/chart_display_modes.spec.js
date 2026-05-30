import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it, vi } from 'vitest'
import ChartWheel from '../../src/components/chart/ChartWheel.vue'

const messages = {
  en: {
    chart: {
      display_mode: 'Display',
      display_modes: {
        clean: 'Clean',
        aspects: 'Aspects',
        detailed: 'Detailed',
        print: 'Print',
      },
    },
    zodiac: {
      signs: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
    },
    aspects: {
      sextile: 'Sextile',
    },
  },
}

const position = (name, longitude, speed = 1) => ({
  name,
  longitude,
  latitude: 0,
  speed,
  retrograde: false,
})

const chart = {
  ascendant: 120,
  mc: 210,
  cusps: [120, 150, 180, 210, 240, 270, 300, 330, 0, 30, 60, 90],
  positions: [
    position('Sun', 300 + 23 + (49 / 60)),
    position('Mars', 23 + (49 / 60)),
    position('Moon', 140),
  ],
}

const mountChartWheel = (props = {}) => mount(ChartWheel, {
  props: { natal: chart, ...props },
  global: {
    plugins: [createI18n({ legacy: false, locale: 'en', messages })],
  },
})

describe('chart display modes', () => {
  it('switches degrees, aspects, and point detail visibility by mode', async () => {
    const wrapper = mountChartWheel()

    expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-chart-mode')).toBe('detailed')
    expect(wrapper.find('[data-testid="aspect-lines"]').exists()).toBe(true)

    await wrapper.get('[data-testid="chart-mode-clean"]').trigger('click')
    await nextTick()

    expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-chart-mode')).toBe('clean')
    expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-show-degrees')).toBe('false')
    expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-show-point-details')).toBe('false')
    expect(wrapper.find('[data-testid="aspect-lines"]').exists()).toBe(false)

    await wrapper.get('[data-testid="chart-mode-aspects"]').trigger('click')
    await nextTick()

    expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-chart-mode')).toBe('aspects')
    expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-show-degrees')).toBe('false')
    expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-show-point-details')).toBe('true')
    expect(wrapper.find('[data-testid="aspect-lines"]').exists()).toBe(true)

    await wrapper.get('[data-testid="chart-mode-print"]').trigger('click')
    await nextTick()

    expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-chart-mode')).toBe('print')
    expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-show-degrees')).toBe('true')
    expect(wrapper.find('[data-testid="aspect-lines"]').exists()).toBe(false)
  })

  it('defaults simple charts to clean mode on small screens', async () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }))

    try {
      const wrapper = mountChartWheel()
      await nextTick()

      expect(wrapper.get('[data-testid="chart-wheel"]').attributes('data-chart-mode')).toBe('clean')
      wrapper.unmount()
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })
})
