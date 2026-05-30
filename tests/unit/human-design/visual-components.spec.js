import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it } from 'vitest'
import ModalityRouteSwitch from '../../../src/components/modalities/ModalityRouteSwitch.vue'
import BodygraphGates from '../../../src/components/human-design/BodygraphGates.vue'
import InsightPanel from '../../../src/components/human-design/InsightPanel.vue'
import IChingRing from '../../../src/components/human-design/IChingRing.vue'
import WheelPlanets from '../../../src/components/human-design/WheelPlanets.vue'
import WheelRings from '../../../src/components/human-design/WheelRings.vue'
import { MANDALA_GATE_ORDER } from '../../../src/lib/human-design/constants.js'
import { wheelRingRadii } from '../../../src/components/human-design/wheelCore.js'
import { humanDesignWheelPalette } from '../../../src/components/human-design/visualTheme.js'
import en from '../../../src/i18n/en.json'
import ptBR from '../../../src/i18n/pt-BR.json'

const i18n = locale => createI18n({
  legacy: false,
  locale,
  messages: { en, 'pt-BR': ptBR },
})

const mountInSvg = (component, props = {}) => mount({
  components: { Target: component },
  template: '<svg><Target v-bind="props" /></svg>',
  setup: () => ({ props }),
})

describe('Human Design visual components', () => {
  it('uses one locale-backed modality switcher contract on modality pages', () => {
    const wrapper = mount(ModalityRouteSwitch, {
      props: { active: 'humanDesign' },
      global: {
        plugins: [i18n('pt-BR')],
        stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } },
      },
    })

    expect(wrapper.get('[data-testid="modality-switch"]').attributes('aria-label')).toBe('Alternar modalidade')
    expect(wrapper.get('[data-testid="modality-astrology"]').text()).toBe('Tropical')
    expect(wrapper.get('[data-testid="modality-vedic"]').text()).toBe('Védica')
    expect(wrapper.get('[data-testid="modality-human-design"]').text()).toBe('Human Design')
    expect(ptBR.planets.Earth).toBe('Terra')
  })

  it('renders active backgrounds only for gate sectors that have planets', () => {
    const wrapper = mountInSvg(WheelRings, {
      chart: {
        gates: [49, 14, 28],
        personalityGates: [49, 28],
        designGates: [14, 28],
      },
    })
    const sectors = wrapper.findAll('[data-testid="mandala-gate-sector"]')
    const active = sectors.filter(sector => sector.attributes('data-active') === 'true')
    const inactive = sectors.filter(sector => sector.attributes('data-active') === 'false')

    expect(sectors).toHaveLength(64)
    expect(active.map(sector => Number(sector.attributes('data-gate'))).sort((a, b) => a - b)).toEqual([14, 28, 49])
    expect(inactive.every(sector => sector.attributes('fill') === 'transparent')).toBe(true)
  })

  it('applies the Human Design wheel palette for dark and light themes', () => {
    const dark = mountInSvg(WheelRings, {
      chart: {
        gates: [49, 14, 28],
        personalityGates: [49, 28],
        designGates: [14, 28],
      },
    })
    const light = mountInSvg(WheelRings, {
      chart: {
        gates: [49, 14, 28],
        personalityGates: [49, 28],
        designGates: [14, 28],
      },
      visualTheme: 'light',
    })

    const darkPalette = humanDesignWheelPalette('dark')
    const lightPalette = humanDesignWheelPalette('light')
    const darkPersonality = dark.find('[data-testid="mandala-gate-sector"][data-gate="49"]')
    const lightPersonality = light.find('[data-testid="mandala-gate-sector"][data-gate="49"]')
    const lightZodiac = light.find('[data-testid="hd-zodiac-sector"]')

    expect(darkPersonality.attributes('fill')).toBe(darkPalette.gatePersonality)
    expect(lightPersonality.attributes('fill')).toBe(lightPalette.gatePersonality)
    expect(lightPersonality.attributes('stroke')).toBe(lightPalette.sectorStroke)
    expect(lightZodiac.attributes('stroke')).toBe(lightPalette.zodiacStroke)
    expect(light.find('[data-testid="iching-line"]').attributes('stroke')).toBe(lightPalette.iching)
  })

  it('keeps zodiac, gate, and I Ching rings compact with shared borders instead of margins', () => {
    expect(wheelRingRadii.zodiacOuter).toBe(wheelRingRadii.gateInner)
    expect(wheelRingRadii.ichingRadius - wheelRingRadii.gateOuter).toBeLessThanOrEqual(22)
    expect(wheelRingRadii.outerBorder - wheelRingRadii.ichingRadius).toBeLessThanOrEqual(18)
  })

  it('builds the I Ching ring from SVG lines, not duplicated Unicode glyphs', () => {
    const wrapper = mountInSvg(IChingRing, {
      gates: MANDALA_GATE_ORDER,
      activeGates: [49, 14],
      radius: 489,
    })

    expect(wrapper.findAll('[data-testid="iching-symbol"]')).toHaveLength(64)
    expect(wrapper.findAll('[data-testid="iching-line"]').length).toBeGreaterThan(64 * 6)
    expect(wrapper.findAll('text')).toHaveLength(0)
  })

  it('renders planet glyphs with a shared normalized visual scale on the Human Design wheel', () => {
    const wrapper = mountInSvg(WheelPlanets, {
      chart: {
        personality: {
          Sun: { planet: 'Sun', gate: 49, line: 6 },
          Mercury: { planet: 'Mercury', gate: 55, line: 4 },
          Venus: { planet: 'Venus', gate: 44, line: 6 },
          Mars: { planet: 'Mars', gate: 44, line: 2 },
          Pluto: { planet: 'Pluto', gate: 28, line: 6 },
        },
        design: {},
      },
    })

    expect(wrapper.findAll('.celestial-glyph-svg').every(glyph => glyph.attributes('font-size') === '28')).toBe(true)
    expect(wrapper.get('[data-planet="Sun"]').attributes('transform')).toBeUndefined()
    expect(wrapper.get('[data-planet="Mercury"]').attributes('transform')).toContain('scale(1.42 1.08)')
    expect(wrapper.get('[data-planet="Venus"]').attributes('transform')).toContain('scale(1.35 1.18)')
    expect(wrapper.get('[data-planet="Mars"]').attributes('transform')).toContain('scale(1.35 1.18)')
    expect(wrapper.get('[data-planet="Pluto"]').attributes('transform')).toContain('scale(0.96 1)')
  })

  it('splits a design and personality gate into true half fills', () => {
    const wrapper = mountInSvg(BodygraphGates, {
      chart: {
        gates: [28],
        personalityGates: [28],
        designGates: [28],
      },
    })
    const parts = wrapper.findAll('[data-testid="bodygraph-gate-part"][data-gate="28"]')

    expect(parts).toHaveLength(2)
    expect(parts.map(part => part.attributes('fill'))).toEqual(['#dd4f52', '#f8fafc'])
    expect(wrapper.find('[data-testid="bodygraph-gate-part"][data-gate="28"]').exists()).toBe(true)
  })

  it('localizes Human Design enum labels and insight copy', () => {
    const wrapper = mount(InsightPanel, {
      props: {
        chart: {
          type: 'Generator',
          authority: 'Emotional',
          profile: '6 / 2',
          definition: 'Triple Split Definition',
          circuits: ['Collective Logic'],
          centers: ['Solar Plexus', 'Sacral', 'Root'],
          channels: ['19-49', '30-41', '3-60'],
          gates: [49],
          personalityGates: [49],
          designGates: [],
        },
      },
      global: { plugins: [i18n('pt-BR')] },
    })

    expect(wrapper.text()).toContain('Gerador')
    expect(wrapper.text()).toContain('Emocional')
    expect(wrapper.text()).toContain('Definição Tripla Dividida')
    expect(wrapper.text()).toContain('Coletivo Lógico')
    expect(wrapper.text()).not.toContain('Triple Split Definition')
    expect(wrapper.text()).not.toContain('Collective Logic')
  })
})
