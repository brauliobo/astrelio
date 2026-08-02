import { h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, it, vi } from 'vitest'
import AspectTable from '../../../src/components/chart/AspectTable.vue'
import Wheel from '../../../src/components/chart/Wheel.vue'
import PlanetList from '../../../src/components/chart/PlanetList.vue'
import { WHEEL_RADII, polarPoint } from '../../../src/components/chart/wheel/geometry.js'
import en from '../../../src/i18n/en.json'
import ptBR from '../../../src/i18n/pt-BR.json'

vi.mock('../../../src/components/chart/DisplayMode.vue', () => ({
  default: {
    name: 'DisplayMode',
    render() {
      return h('div', { 'data-testid': 'chart-display-mode' }, this.$slots.default?.())
    },
  },
}))

const messages = {
  en: {
    ...en,
    analysis: {
      house_n: 'House {house}',
      elements: {
        air:  'Air',
        fire: 'Fire',
      },
      modalities: {
        cardinal: 'Cardinal',
        fixed:    'Fixed',
      },
    },
    common: { all: 'All' },
    chart:  {
      ...en.chart,
      asc:          'ASC',
      mc:           'MC',
      house_system: 'House',
      summary:      'Summary',
      wheel_accessibility: {
        ...en.chart.wheel_accessibility,
        chart_shadow:             'Chart shadow',
        house_inner_boundary:     'House ring inner boundary',
        house_outer_boundary:     'House ring outer boundary',
        nakshatra_outer_boundary: 'Nakshatra outer boundary',
        orbit_controls:           'Chart orbit controls',
        wheel:                    'Chart wheel',
        zodiac_inner_boundary:    'Zodiac inner boundary',
        zodiac_outer_boundary:    'Zodiac outer boundary',
      },
    },
    zodiac: {
      signs: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
    },
    planets: {
      Sun:     'Sun',
      Moon:    'Moon',
      Mars:    'Mars',
      Fortune: 'Fortune',
    },
    aspects: {
      applying:        'Applying',
      aspect:          'Aspect',
      body_a:          'Body A',
      body_b:          'Body B',
      motion:          'Motion',
      none_for_filter: 'No aspects',
      orb:             'Orb',
      separating:      'Separating',
      sextile:         'Sextile',
      tight:           'Tight',
    },
    houses: {
      numbered_name: 'House {house} · {name}',
      names:         [
        'Identity',
        'Resources',
        'Communication',
        'Home',
        'Creativity',
        'Work and health',
        'Partnerships',
        'Shared resources',
        'Beliefs and travel',
        'Career',
        'Community',
        'Retreat',
      ],
    },
  },
  'pt-BR': {
    ...ptBR,
    analysis: {
      house_n: 'Casa {house}',
      elements: {
        air:  'Ar',
        fire: 'Fogo',
      },
      modalities: {
        cardinal: 'Cardinal',
        fixed:    'Fixo',
      },
    },
    chart: {
      ...ptBR.chart,
      asc:           'ASC',
      mc:            'MC',
      transit_orbit: 'Trânsitos',
      wheel_accessibility: {
        ...ptBR.chart.wheel_accessibility,
        chart_shadow:             'Sombra do mapa',
        house_inner_boundary:     'Limite interno do anel de casas',
        house_outer_boundary:     'Limite externo do anel de casas',
        nakshatra_outer_boundary: 'Limite externo dos nakshatras',
        orbit_controls:           'Controles das órbitas do mapa',
        wheel:                    'Roda do mapa',
        zodiac_inner_boundary:    'Limite interno do zodíaco',
        zodiac_outer_boundary:    'Limite externo do zodíaco',
      },
    },
    zodiac: {
      signs: ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'],
    },
    planets: {
      Sun:     'Sol',
      Moon:    'Lua',
      Mars:    'Marte',
      Fortune: 'Fortuna',
    },
    aspects: {
      sextile: 'Sextil',
    },
    houses: {
      numbered_name: 'Casa {house} · {name}',
      names:         [
        'Identidade',
        'Recursos',
        'Comunicação',
        'Lar',
        'Criatividade',
        'Trabalho e saúde',
        'Parcerias',
        'Recursos compartilhados',
        'Crenças e viagens',
        'Carreira',
        'Comunidade',
        'Recolhimento',
      ],
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

const aquariusSun = 300 + 23 + (49 / 60)

const chart = {
  ascendant: 120,
  mc:        210,
  cusps:     [120, 150, 180, 210, 240, 270, 300, 330, 0, 30, 60, 90],
  positions: [
    position('Sun', aquariusSun),
    position('Mars', 23 + (49 / 60)),
    position('Moon', 140),
  ],
}

const aspects = [
  {
    a:        'Sun',
    b:        'Mars',
    type:     'sextile',
    exact:    60,
    delta:    0.2,
    orb:      5,
    strength: 0.8,
    applying: true,
  },
]

const mountChartTools = () => mount({
  render: () => h('div', [
    h(Wheel, { natal: chart }),
    h(PlanetList, { chart }),
    h(AspectTable, { aspects }),
  ]),
}, {
  global: {
    plugins: [createI18n({ legacy: false, locale: 'en', messages })],
  },
})

describe('chart interactions', () => {
  it('shares planet hover state with glyphs and related aspect rows and lines', async () => {
    const wrapper = mountChartTools()

    await wrapper.get('[data-testid="planet-Sun"]').trigger('mouseenter')
    await nextTick()

    expect(wrapper.get('[data-testid="planet-Sun"]').attributes('data-highlight')).toBe('active')
    expect(wrapper.get('[data-testid="planet-glyph-Sun"]').attributes('data-highlight')).toBe('active')
    expect(wrapper.get('[data-aspect-row="Sun-Mars-sextile"]').attributes('data-highlight')).toBe('active')
    expect(wrapper.get('[data-aspect="Sun-Mars-sextile"]').attributes('data-highlight')).toBe('active')
    expect(wrapper.get('[data-testid="planet-glyph-Moon"]').attributes('data-highlight')).toBe('dimmed')
    const summary = wrapper.get('[data-testid="chart-selection-summary"]')
    expect(summary.text()).toContain('Sun 23°49′ Aquarius · House 7 · Partnerships')
    expect(summary.attributes('data-responsive-placement')).toBe('desktop-side-mobile-bottom')
    expect(summary.classes()).toEqual(expect.arrayContaining(['pointer-events-none', 'chart-selection-summary--responsive']))
  })

  it('localizes selected house labels with house names', async () => {
    const wrapper = mount(Wheel, {
      props:  { natal: chart },
      global: {
        plugins: [createI18n({ legacy: false, locale: 'pt-BR', messages })],
      },
    })

    await wrapper.get('[data-testid="planet-glyph-Sun"]').trigger('mouseenter')
    await nextTick()

    const summary = wrapper.get('[data-testid="chart-selection-summary"]').text()
    expect(summary).toContain('Sol 23°49′ Aquário · Casa 7 · Parcerias')
    expect(summary).not.toContain('House 7')
  })

  it('highlights non-planet wheel elements with enriched summaries', async () => {
    const wrapper = mount(Wheel, {
      props:  { natal: chart },
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages })],
      },
    })

    await wrapper.get('[data-wheel-id="sign-0"]').trigger('mouseenter')
    await nextTick()

    expect(wrapper.get('[data-wheel-id="sign-0"]').attributes('data-highlight')).toBe('active')
    expect(wrapper.get('[data-testid="chart-selection-summary"]').attributes('data-selection-kind')).toBe('sign')
    expect(wrapper.get('[data-testid="chart-selection-summary"]').text()).toContain('Aries ↔ Libra')
    expect(wrapper.get('[data-testid="chart-selection-summary"]').text()).toContain('Axis Initiative and reciprocity')
    expect(wrapper.get('[data-testid="chart-selection-summary"]').text()).toContain('Opposite sign Libra')

    await wrapper.get('[data-wheel-id="house-1"]').trigger('mouseenter')
    await nextTick()

    expect(wrapper.get('[data-wheel-id="house-1"]').attributes('data-highlight')).toBe('active')
    expect(wrapper.get('[data-testid="chart-selection-summary"]').attributes('data-selection-kind')).toBe('house')
    expect(wrapper.get('[data-testid="chart-selection-summary"]').text()).toContain('House 1 · Identity')

    await wrapper.get('[data-wheel-id="asc"]').trigger('mouseenter')
    await nextTick()

    expect(wrapper.get('[data-wheel-id="asc"]').attributes('data-highlight')).toBe('active')
    expect(wrapper.get('[data-testid="chart-selection-summary"]').attributes('data-selection-kind')).toBe('angle')
    expect(wrapper.get('[data-testid="chart-selection-summary"]').text()).toContain('Ascendant')
  })

  it('highlights the selected sign axis without activating aspects', async () => {
    const wrapper = mount(Wheel, {
      props:  { natal: chart },
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages })],
      },
    })
    const aquarius = wrapper.get('[data-wheel-id="sign-10"]')

    await aquarius.trigger('mouseenter')
    await nextTick()

    expect(aquarius.attributes('data-highlight')).toBe('active')
    expect(aquarius.attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-wheel-id="sign-4"]').attributes('data-highlight')).toBe('related')
    expect(wrapper.get('[data-wheel-id="sign-4"]').attributes('aria-pressed')).toBe('false')
    expect(wrapper.get('[data-wheel-id="sign-0"]').attributes('data-highlight')).toBe('dimmed')
    expect(wrapper.get('[data-testid="planet-glyph-Sun"]').attributes('data-highlight')).toBe('active')
    expect(wrapper.get('[data-testid="planet-glyph-Moon"]').attributes('data-highlight')).toBe('related')
    expect(wrapper.get('[data-testid="planet-glyph-Mars"]').attributes('data-highlight')).toBe('dimmed')
    expect(wrapper.get('[data-aspect="Sun-Mars-sextile"]').attributes('data-highlight')).toBe('idle')

    const emittedWheel = wrapper.emitted('highlight')[0][0].wheel
    expect(emittedWheel).toMatchObject({
      id:                    'sign-10',
      signIndex:             10,
      oppositeSignIndex:     4,
      axisId:                'leo_aquarius',
      axis:                  {
        id:          'leo_aquarius',
        modality:    'fixed',
        polarity:    'yang',
        elements:    ['fire', 'air'],
        signIndices: [4, 10],
      },
      relatedSectorId:       'sign-4',
      relatedIds:            ['sign-4'],
      startLongitude:        300,
      endLongitude:          330,
      centerLongitude:       315,
      oppositeLongitude:     135,
      signName:              'Aquarius',
      oppositeSignName:      'Leo',
    })

    const guide  = wrapper.get('[data-testid="sign-axis-guide"]')
    const line   = guide.get('.sign-axis-guide__line')
    const radius = (WHEEL_RADII.zodiacInner + WHEEL_RADII.zodiacOuter) / 2
    const start  = polarPoint(radius, 315 - 120)
    const end    = polarPoint(radius, 135 - 120)
    expect(guide.attributes('data-axis-id')).toBe('leo_aquarius')
    expect(guide.attributes('aria-hidden')).toBe('true')
    expect(guide.attributes('pointer-events')).toBe('none')
    expect(Number(line.attributes('x1'))).toBeCloseTo(start.x, 6)
    expect(Number(line.attributes('y1'))).toBeCloseTo(start.y, 6)
    expect(Number(line.attributes('x2'))).toBeCloseTo(end.x, 6)
    expect(Number(line.attributes('y2'))).toBeCloseTo(end.y, 6)

    await aquarius.trigger('click')
    await aquarius.trigger('mouseleave')
    await nextTick()

    expect(aquarius.attributes('data-highlight')).toBe('active')
    expect(wrapper.get('[data-wheel-id="sign-4"]').attributes('data-highlight')).toBe('related')
    expect(wrapper.get('[data-testid="sign-axis-guide"]').exists()).toBe(true)
    expect(wrapper.get('[data-aspect="Sun-Mars-sextile"]').attributes('data-highlight')).toBe('idle')
  })

  it('keeps sidereal sign selection isolated from Tropical sign axes', async () => {
    const wrapper = mount(Wheel, {
      props:  { natal: { ...chart, zodiac: 'sidereal' } },
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages })],
      },
    })
    const aquarius = wrapper.get('[data-wheel-id="sign-10"]')

    await aquarius.trigger('mouseenter')
    await nextTick()

    expect(aquarius.attributes('data-highlight')).toBe('active')
    expect(wrapper.findAll('[data-wheel-kind="sign"][data-highlight="active"]')).toHaveLength(1)
    expect(wrapper.findAll('[data-wheel-kind="sign"][data-highlight="related"]')).toHaveLength(0)
    expect(wrapper.get('[data-wheel-id="sign-4"]').attributes('data-highlight')).toBe('dimmed')
    expect(wrapper.find('[data-testid="sign-axis-guide"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="planet-glyph-Sun"]').attributes('data-highlight')).toBe('idle')
    expect(wrapper.get('[data-testid="planet-glyph-Moon"]').attributes('data-highlight')).toBe('idle')
    expect(wrapper.get('[data-testid="planet-glyph-Mars"]').attributes('data-highlight')).toBe('idle')

    const emittedWheel = wrapper.emitted('highlight')[0][0].wheel
    expect(emittedWheel).toMatchObject({
      kind:      'sign',
      id:        'sign-10',
      signIndex: 10,
      symbol:    '♒︎',
      title:     'Aquarius ♒︎',
    })
    expect(emittedWheel.details).toHaveLength(2)
    expect(emittedWheel).not.toHaveProperty('oppositeSignIndex')
    expect(emittedWheel).not.toHaveProperty('axisId')
    expect(emittedWheel).not.toHaveProperty('axis')
    expect(emittedWheel).not.toHaveProperty('relatedSectorId')
    expect(emittedWheel).not.toHaveProperty('relatedIds')
    expect(emittedWheel).not.toHaveProperty('oppositeSymbol')
    expect(emittedWheel).not.toHaveProperty('oppositeSignName')
  })

  it('pins and clears sign-axis highlighting from the keyboard', async () => {
    const wrapper = mount(Wheel, {
      props:  { natal: chart },
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages })],
      },
    })
    const aries = wrapper.get('[data-wheel-id="sign-0"]')

    await aries.trigger('keydown', { key: 'Enter' })
    await aries.trigger('mouseleave')
    await nextTick()

    expect(aries.attributes('data-highlight')).toBe('active')
    expect(aries.attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-wheel-id="sign-6"]').attributes('data-highlight')).toBe('related')

    await aries.trigger('keydown', { key: ' ' })
    await nextTick()

    expect(aries.attributes('data-highlight')).toBe('idle')
    expect(aries.attributes('aria-pressed')).toBe('false')
    expect(wrapper.find('[data-testid="sign-axis-guide"]').exists()).toBe(false)
  })

  it('pins and clears aspect highlight state from click', async () => {
    const wrapper   = mountChartTools()
    const aspectRow = wrapper.get('[data-aspect-row="Sun-Mars-sextile"]')

    await aspectRow.trigger('click')
    await aspectRow.trigger('mouseleave')
    await nextTick()

    expect(aspectRow.attributes('data-highlight')).toBe('active')
    expect(wrapper.get('[data-testid="planet-glyph-Sun"]').attributes('data-highlight')).toBe('active')
    expect(wrapper.get('[data-testid="planet-glyph-Mars"]').attributes('data-highlight')).toBe('active')
    expect(wrapper.get('[data-testid="chart-selection-summary"]').attributes('data-selection-kind')).toBe('aspect')
    expect(wrapper.get('[data-testid="chart-selection-summary"]').text()).toContain('Sun Sextile Mars')

    await aspectRow.trigger('click')
    await nextTick()

    expect(aspectRow.attributes('data-highlight')).toBe('idle')
    expect(wrapper.get('[data-testid="planet-glyph-Sun"]').attributes('data-highlight')).toBe('idle')
    expect(wrapper.find('[data-testid="chart-selection-summary"]').exists()).toBe(false)
  })

  it('uses a predictable fixed wheel fit without zoom controls', async () => {
    const wrapper = mount(Wheel, {
      props:  { natal: chart },
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages })],
      },
    })
    const stage          = wrapper.get('[data-testid="chart-wheel"]').get('.chart-wheel-stage')
    const svg            = wrapper.get('[data-testid="chart-wheel-svg"]')
    const initialViewBox = svg.attributes('viewBox')

    expect(stage.attributes('data-zoom')).toBeUndefined()
    expect(initialViewBox).toBe('40 40 440 440')
    expect(wrapper.find('[data-testid="chart-zoom-reset"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="chart-zoom-in"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="chart-zoom-out"]').exists()).toBe(false)

    await stage.trigger('keydown', { key: '+' })
    await nextTick()

    expect(svg.attributes('viewBox')).toBe(initialViewBox)
  })
})
