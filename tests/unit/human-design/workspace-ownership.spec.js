import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { describe, expect, it, vi } from 'vitest'
import en from '../../../src/i18n/en.json'
import TimingPage from '../../../src/pages/TimingPage.vue'
import HumanDesignTeamDisclosure from '../../../src/components/relationships/HumanDesignTeamDisclosure.vue'
import { usePeopleStore } from '../../../src/stores/people.js'
import { useSessionStore } from '../../../src/stores/session.js'

const { teamAnalysis, transitContext } = vi.hoisted(() => ({
  teamAnalysis:   vi.fn(() => ({ compositeChannels: [], pentaCoverage: [], pentaPercent: 0 })),
  transitContext: vi.fn(() => ({
    status: { value: 'idle' },
    data:   { value: null },
  })),
}))

vi.mock('vue-router', () => ({
  useRoute:  () => ({ name: 'transits', params: {}, path: '/transits' }),
  useRouter: () => ({ hasRoute: () => true, push: vi.fn() }),
}))

vi.mock('../../../src/composables/useChart.js', async () => {
  const { ref } = await import('vue')
  return { useNatalChart: () => ref({ id: 'natal', planets: {} }) }
})

vi.mock('../../../src/lib/astro/transits.js', () => ({ transitsFor: vi.fn(() => ({ id: 'transit', planets: {} })) }))
vi.mock('../../../src/lib/astro/progressions.js', () => ({ secondaryProgression: vi.fn(() => null) }))
vi.mock('../../../src/lib/astro/solar_return.js', () => ({ solarReturnChartForNatal: vi.fn(() => null) }))
vi.mock('../../../src/lib/astro/profections.js', () => ({ annualProfection: vi.fn(() => null) }))
vi.mock('../../../src/lib/astro/solar_arc.js', () => ({ solarArcDirections: vi.fn(() => null) }))
vi.mock('../../../src/lib/astro/lunar_return.js', () => ({ lunarReturnChartForNatal: vi.fn(() => null) }))
vi.mock('../../../src/lib/astro/aspects.js', () => ({
  crossAspects:   vi.fn(() => []),
  naturalAspects: vi.fn(() => []),
}))
vi.mock('../../../src/lib/astro/timezones.js', () => ({
  localToJdUt:           vi.fn(() => 0),
  localToUtcMs:          vi.fn(() => 0),
  offsetMinutesForPerson: vi.fn(() => 0),
}))
vi.mock('../../../src/composables/useHumanDesignTransitContext.js', () => ({
  useHumanDesignTransitContext: transitContext,
}))
vi.mock('../../../src/lib/human-design/bodygraph.js', () => ({
  humanDesignTeamAnalysis: teamAnalysis,
}))
vi.mock('../../../src/lib/modalities/index.js', () => ({
  modalityChart: vi.fn((modality, person) => person ? { id: `${modality}-${person.id}` } : null),
}))

const people = [
  { id: 'one', name: 'One', isoLocal: '2000-01-01T12:00', lat: 1, lon: 2 },
  { id: 'two', name: 'Two', isoLocal: '2001-01-01T12:00', lat: 3, lon: 4 },
]

const mountOptions = pinia => ({
  global: {
    plugins: [pinia, createI18n({ legacy: false, locale: 'en', messages: { en } })],
    stubs: {
      AspectMatrix:           true,
      AspectTable:            true,
      Biwheel:                true,
      Comparison:             true,
      ComparisonInsightPanel: true,
      CorrelationPanel:       true,
      Insight:                true,
      TeamPanel:              true,
      TimingContextChips:     true,
      TransitPanel:           true,
    },
  },
})

describe('Human Design workspace ownership', () => {
  it('keeps six astrology techniques and starts transit computation only after selecting Human Design', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    usePeopleStore().list = people
    useSessionStore().activePersonId = people[0].id
    transitContext.mockClear()

    const wrapper = mount(TimingPage, mountOptions(pinia))

    expect(wrapper.findAll('[data-testid^="timing-technique-"]')).toHaveLength(6)
    expect(wrapper.find('[data-testid="human-design-timing-tools"]').exists()).toBe(false)
    expect(transitContext).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="timing-modality-human-design"]').trigger('click')

    expect(wrapper.findAll('[data-testid^="timing-technique-"]')).toHaveLength(0)
    expect(wrapper.get('[data-testid="human-design-timing-tools"]').exists()).toBe(true)
    expect(transitContext).toHaveBeenCalledTimes(1)
  })

  it('computes team analysis only when the Human Design team disclosure opens', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    teamAnalysis.mockClear()

    const wrapper = mount(HumanDesignTeamDisclosure, {
      ...mountOptions(pinia),
      props: { people },
    })
    const disclosure = wrapper.get('[data-testid="human-design-team-disclosure"]')

    expect(teamAnalysis).not.toHaveBeenCalled()
    disclosure.element.open = true
    await disclosure.trigger('toggle')

    expect(teamAnalysis).toHaveBeenCalledTimes(1)
    expect(wrapper.findComponent({ name: 'TeamPanel' }).exists()).toBe(true)
  })
})
