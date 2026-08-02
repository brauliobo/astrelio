import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import Insight from '../../../src/components/chart/Insight.vue'
import SelectionSummary from '../../../src/components/chart/SelectionSummary.vue'
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
    position('Venus', 215),
    position('Mars', 95),
    position('Jupiter', 275),
    position('Saturn', 125),
  ],
}

const signWheel = {
  kind:              'sign',
  id:                'sign-0',
  signIndex:         0,
  oppositeSignIndex: 6,
  axisId:            'aries_libra',
  title:             'raw title',
  details:           [{ label: 'raw.key', value: 'raw.value' }],
}

describe('sign-axis presentation', () => {
  it.each([
    ['en', 'Aries ↔ Libra', 'Axis Initiative and reciprocity', 'Opposite sign Libra'],
    ['pt-BR', 'Áries ↔ Libra', 'Eixo Iniciativa e reciprocidade', 'Signo oposto Libra'],
  ])('localizes the compact wheel summary in %s', (locale, title, axis, opposite) => {
    const wrapper = mount(SelectionSummary, {
      props:  { chart, wheel: signWheel },
      global: { plugins: [i18n(locale)] },
    })

    expect(wrapper.text()).toContain(title)
    expect(wrapper.text()).toContain(axis)
    expect(wrapper.text()).toContain(opposite)
    expect(wrapper.text()).not.toContain('raw.key')
    expect(wrapper.text()).not.toMatch(/chart\.sign_axis|analysis\.(?:elements|modalities)/)
    expect(wrapper.get('[data-testid="chart-selection-summary"]').attributes('data-responsive-placement')).toBe('desktop-side-mobile-bottom')
    expect(wrapper.get('[data-testid="chart-selection-summary"]').classes()).toContain('pointer-events-none')
    expect(wrapper.get('[data-testid="chart-selection-summary"]').classes()).toContain('chart-selection-summary--responsive')
  })

  it.each([
    ['en', 'Aries ♈'],
    ['pt-BR', 'Áries ♈'],
  ])('keeps a generic sign payload as an ordinary sign summary in %s', (locale, title) => {
    const wrapper = mount(SelectionSummary, {
      props: {
        chart,
        wheel: {
          kind:      'sign',
          id:        'sign-0',
          signIndex: 0,
          symbol:    '♈',
          title:     'Unlocalized title',
          details:   [{ label: locale === 'en' ? 'Span' : 'Intervalo', value: '0°–30°' }],
        },
      },
      global: { plugins: [i18n(locale)] },
    })

    expect(wrapper.text()).toContain(title)
    expect(wrapper.text()).toContain('0°–30°')
    expect(wrapper.text()).not.toContain('↔')
    expect(wrapper.text()).not.toContain(locale === 'en' ? 'Opposite sign' : 'Signo oposto')
  })

  it('shows up to three materially represented Tropical axes with factual side weights', () => {
    const wrapper = mount(Insight, {
      props:  { chart, panel: 'right' },
      global: { plugins: [i18n('en')] },
    })
    const axes = wrapper.findAll('[data-axis-id]')

    expect(wrapper.get('[data-testid="insight-sign-axes"]').text()).toContain('Complementary sign axes')
    expect(axes).toHaveLength(3)
    expect(axes[0].text()).toContain('Aries ↔ Libra')
    expect(axes[0].text()).toContain('Initiative and reciprocity')
    expect(axes[0].text()).toContain('Sun')
    expect(axes[0].text()).toContain('Moon')
    expect(axes[0].text()).toContain('Weight 10')
    expect(axes[0].text()).not.toMatch(/\d+\.\d+/)
  })

  it('omits sign axes when none are represented or the chart is sidereal', () => {
    const empty = mount(Insight, {
      props:  { chart: { ...chart, positions: [] }, panel: 'right' },
      global: { plugins: [i18n('en')] },
    })
    const sidereal = mount(Insight, {
      props:  { chart: { ...chart, zodiac: 'sidereal' }, panel: 'right' },
      global: { plugins: [i18n('en')] },
    })

    expect(empty.find('[data-testid="insight-sign-axes"]').exists()).toBe(false)
    expect(sidereal.find('[data-testid="insight-sign-axes"]').exists()).toBe(false)
  })
})
