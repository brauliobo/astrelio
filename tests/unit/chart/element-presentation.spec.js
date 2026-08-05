import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import Insight from '../../../src/components/chart/Insight.vue'
import Wheel from '../../../src/components/chart/Wheel.vue'
import en from '../../../src/i18n/en.json'
import ptBR from '../../../src/i18n/pt-BR.json'

const messages = { en, 'pt-BR': ptBR }
const i18n = locale => createI18n({ legacy: false, locale, messages })
const position = (name, longitude) => ({ name, longitude, latitude: 0, speed: 1, retrograde: false })

const chart = {
  zodiac:    'tropical',
  ascendant: 0,
  mc:        90,
  cusps:     Array.from({ length: 12 }, (_, index) => index * 30),
  positions: [
    position('Sun', 5),
    position('Moon', 185),
    position('Mercury', 35),
    position('Mars', 95),
  ],
}

const mountInsight = (locale, currentChart = chart) => mount(Insight, {
  props:  { chart: currentChart, panel: 'left' },
  global: { plugins: [i18n(locale)] },
})

const mountWheel = (currentChart, showSelectionSummary = false) => mount(Wheel, {
  props:  { natal: currentChart, showModeControls: false, showSelectionSummary },
  global: { plugins: [i18n('en')] },
})

describe('element-aware insight presentation', () => {
  it('localizes tropical element groups, related elements, colors, and placements in English', () => {
    const wrapper = mountInsight('en')
    const balance = wrapper.get('[data-testid="insight-element-balance"]')
    const fire = balance.get('[data-element="fire"]')

    expect(fire.text()).toContain('Signs: Aries, Leo, Sagittarius')
    expect(fire.text()).toContain('Related element: Air')
    expect(fire.get('.chart-insight__element-bar').attributes('style')).toContain('var(--chart-element-fire)')
    expect(fire.get('.chart-insight__element-marker').attributes('style')).toContain('var(--chart-element-fire-fill)')
    expect(fire.get('.chart-insight__element-marker').attributes('aria-hidden')).toBe('true')
    expect(fire.get('[role="img"][aria-label*="weighted placements"]').attributes('aria-label')).toContain('Fire')
    expect(wrapper.get('[data-testid="insight-sun"]').text()).toContain('Fire element')
    expect(wrapper.get('[data-testid="insight-sun"] .chart-insight__element-marker').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('[data-testid="insight-moon"]').text()).toContain('Air element')
    expect(wrapper.get('[data-testid="insight-ascendant"]').text()).toContain('Fire element')
    expect(wrapper.get('[data-testid="insight-mc"]').text()).toContain('Water element')
  })

  it('localizes element groups and placement metadata in Brazilian Portuguese', () => {
    const wrapper = mountInsight('pt-BR')
    const balance = wrapper.get('[data-testid="insight-element-balance"]')

    expect(balance.get('[data-element="fire"]').text()).toContain('Signos: Áries, Leão, Sagitário')
    expect(balance.get('[data-element="fire"]').text()).toContain('Elemento relacionado: Ar')
    expect(wrapper.get('[data-testid="insight-sun"]').text()).toContain('Elemento Fogo')
  })

  it('keeps tropical element metadata out of sidereal presentation', () => {
    const wrapper = mountInsight('en', { ...chart, zodiac: 'sidereal' })

    expect(wrapper.find('[data-testid="insight-element-balance"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="insight-sun"]').attributes('data-element')).toBeUndefined()
    expect(wrapper.text()).toContain('Modality rhythm')
  })

  it('renders the tropical legend outside the clipped wheel stage', () => {
    const tropical = mountWheel(chart)
    const stage    = tropical.get('[data-testid="chart-wheel-stage"]')
    const legend   = tropical.get('[data-testid="element-legend"]')

    expect(legend.element.parentElement).not.toBe(stage.element)
    expect(legend.findAll('[data-element]')).toHaveLength(4)

    const sidereal = mountWheel({ ...chart, zodiac: 'sidereal' })
    expect(sidereal.find('[data-testid="element-legend"]').exists()).toBe(false)
  })

  it('clears tropical sign highlights and summaries when the chart switches to sidereal in place', async () => {
    const wrapper = mountWheel(chart, true)
    const sign    = wrapper.get('[data-wheel-id="sign-0"]')

    await sign.trigger('click')
    await sign.trigger('mouseleave')
    await nextTick()

    const tropicalSummary = wrapper.get('[data-testid="chart-selection-summary"]')
    expect(tropicalSummary.attributes('data-element')).toBe('fire')
    expect(tropicalSummary.attributes('data-related-elements')).toBe('air')
    expect(tropicalSummary.get('[data-selection-fact="axis"]').exists()).toBe(true)

    await wrapper.setProps({ natal: { ...chart, zodiac: 'sidereal' } })
    await nextTick()

    expect(wrapper.get('[data-wheel-id="sign-0"]').attributes('data-highlight')).toBe('idle')
    expect(wrapper.find('[data-testid="sign-axis-guide"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="chart-selection-summary"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="zodiac-element-metadata"]').attributes('data-element-presentation')).toBe('neutral')
    expect(wrapper.get('[data-testid="zodiac-element-metadata"] [data-sign-index="0"]').attributes('data-element')).toBeUndefined()

    await wrapper.setProps({ natal: chart })
    await nextTick()

    const tropicalSector = wrapper.get('[data-testid="zodiac-ring"] [data-wheel-id="sign-0"]')
    expect(tropicalSector.attributes('data-highlight')).toBe('idle')
    expect(wrapper.find('[data-testid="sign-axis-guide"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="chart-selection-summary"]').exists()).toBe(false)
    expect(tropicalSector.attributes('data-element')).toBe('fire')
    expect(tropicalSector.attributes('data-element-label')).toBe('Fire')
    expect(tropicalSector.attributes('data-related-elements')).toBe('air')
    expect(tropicalSector.get('path').attributes('fill')).toBe('var(--chart-element-fire-fill)')
    expect(wrapper.get('[data-testid="house-cusps"] [data-wheel-id="house-1"]').attributes('data-element')).toBeUndefined()
  })
})
