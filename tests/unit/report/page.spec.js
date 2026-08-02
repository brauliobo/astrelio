import { shallowMount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import en from '../../../src/i18n/en.json'
import ReportPage from '../../../src/pages/ReportPage.vue'
import Wheel from '../../../src/components/chart/Wheel.vue'
import HumanDesignWheel from '../../../src/components/human-design/Wheel.vue'
import ReadingDocumentView from '../../../src/components/readings/ReadingDocumentView.vue'
import { usePeopleStore } from '../../../src/stores/people.js'
import { useSessionStore } from '../../../src/stores/session.js'
import { useSettingsStore } from '../../../src/stores/settings.js'

const mocks = vi.hoisted(() => {
  const tropicalChart       = { id: 'tropical-chart', jdUt: 2451545, zodiac: 'tropical' }
  const vedicChart          = { id: 'vedic-chart', positions: [{ name: 'Sun' }] }
  const humanDesignChart    = { id: 'human-design-chart' }
  const tropicalDocument    = { schemaVersion: 'tropical-reading-document.v1' }
  const vedicDocument       = { schemaVersion: 'vedic-reading-document.v1' }
  const humanDesignDocument = { schema: 'human-design.reading-document' }

  return {
    tropicalChart,
    vedicChart,
    humanDesignChart,
    tropicalDocument,
    vedicDocument,
    humanDesignDocument,
    aspects:                         [{ key: 'Sun-Moon' }],
    buildVedicChart:                 vi.fn(),
    buildVedicReadingDocument:       vi.fn(),
    buildHumanDesignReadingDocument: vi.fn(),
    modalityChart:                   vi.fn(),
    tropicalReadingDocument:         vi.fn(),
  }
})

vi.mock('../../../src/composables/useChart.js', async () => {
  const { shallowRef } = await import('vue')
  return { useNatalChart: () => shallowRef(mocks.tropicalChart) }
})

vi.mock('../../../src/lib/astro/aspects.js', () => ({
  naturalAspects: vi.fn(() => mocks.aspects),
}))

vi.mock('../../../src/lib/astro/transits.js', () => ({
  transitsFor: vi.fn(() => ({ id: 'transit-chart' })),
}))

vi.mock('../../../src/lib/astro/ephemeris.js', () => ({
  moonPhaseLabel: vi.fn(() => 'full'),
}))

vi.mock('../../../src/lib/astro/interpretations.js', () => ({
  tropicalReadingDocument: mocks.tropicalReadingDocument,
}))

vi.mock('../../../src/lib/modalities/index.js', () => ({
  modalityChart: mocks.modalityChart,
}))

vi.mock('../../../src/lib/vedic/chart.js', () => ({
  buildVedicChart: mocks.buildVedicChart,
}))

vi.mock('../../../src/lib/vedic/reading.js', () => ({
  buildVedicReadingDocument: mocks.buildVedicReadingDocument,
}))

vi.mock('../../../src/lib/human-design/readings/index.js', () => ({
  buildHumanDesignReadingDocument: mocks.buildHumanDesignReadingDocument,
}))

vi.mock('../../../src/lib/export/chartImage.js', () => ({
  downloadPng: vi.fn(),
  downloadSvg: vi.fn(),
}))

const messages = {
  ...en,
  report: {
    ...en.report,
    calculation_error: 'The report could not be calculated.',
    modality_titles: {
      vedic:          'Vedic report for {name}',
      'human-design': 'Human Design report for {name}',
    },
    modality_kickers: {
      vedic:          'Vedic print report',
      'human-design': 'Human Design print report',
    },
  },
}

const person = {
  id:              'fixture-person',
  name:            'Fixture Person',
  isoLocal:        '2000-01-01T12:00',
  tzOffsetMinutes: 0,
  lat:             12.34,
  lon:             56.78,
  placeLabel:      'Fixture Place',
  createdAt:       1,
}

const mountPage = async (modality) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  usePeopleStore().list = [person]
  useSessionStore().activePersonId = person.id

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/report', name: 'report', component: ReportPage },
      { path: '/natal', name: 'natal', component: { template: '<div />' } },
      { path: '/vedic', name: 'vedic', component: { template: '<div />' } },
      { path: '/human-design', name: 'human-design', component: { template: '<div />' } },
    ],
  })
  await router.push({ name: 'report', query: modality ? { modality } : {} })

  const wrapper = shallowMount(ReportPage, {
    global: {
      plugins: [pinia, router, createI18n({ legacy: false, locale: 'en', messages: { en: messages } })],
      stubs: {
        ModalityRouteSwitch: true,
      },
    },
  })
  return { wrapper, router }
}

describe('Report page modalities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.buildVedicChart.mockResolvedValue(mocks.vedicChart)
    mocks.modalityChart.mockReturnValue(mocks.humanDesignChart)
    mocks.tropicalReadingDocument.mockReturnValue(mocks.tropicalDocument)
    mocks.buildVedicReadingDocument.mockImplementation(chart => chart ? mocks.vedicDocument : null)
    mocks.buildHumanDesignReadingDocument.mockImplementation(chart => chart ? mocks.humanDesignDocument : null)
  })

  it('keeps the Tropical builder and passes its chart into the shared reading source', async () => {
    const { wrapper } = await mountPage('tropical')

    expect(wrapper.get('[data-modality="tropical"]')).toBeTruthy()
    expect(wrapper.find('[data-testid="report-builder"]').exists()).toBe(true)
    expect(wrapper.getComponent(Wheel).props('natal')).toBe(mocks.tropicalChart)
    expect(mocks.tropicalReadingDocument).toHaveBeenCalledWith(mocks.tropicalChart, mocks.aspects)
    const printReading = wrapper.get('[data-testid="tropical-print-report"]').getComponent(ReadingDocumentView)
    expect(printReading.props('document')).toBe(mocks.tropicalDocument)

    useSettingsStore().setReportSection('wheel', false)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="report-svg"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="report-png"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="report-print"]')).toBeTruthy()
  })

  it('calculates Vedic asynchronously and uses the resolved chart for its visual and reading', async () => {
    const { wrapper } = await mountPage('sidereal')
    await flushPromises()

    const wheel = wrapper.getComponent(Wheel)
    const readingChart = mocks.buildVedicReadingDocument.mock.calls.at(-1)[0]
    expect(mocks.buildVedicChart).toHaveBeenCalledWith(person, expect.any(Object))
    expect(wheel.props('charts')[0].chart).toBe(readingChart)
    expect(mocks.buildVedicReadingDocument).toHaveBeenLastCalledWith(mocks.vedicChart)
    const printReading = wrapper.get('[data-testid="vedic-print-report"]').getComponent(ReadingDocumentView)
    expect(printReading.props('document')).toBe(mocks.vedicDocument)
    expect(wrapper.find('[data-testid="report-builder"]').exists()).toBe(false)
  })

  it('uses the modality chart as the shared Human Design visual and reading source', async () => {
    const { wrapper } = await mountPage('human-design')

    expect(mocks.modalityChart).toHaveBeenCalledWith('humanDesign', person)
    expect(wrapper.getComponent(HumanDesignWheel).props('chart')).toBe(mocks.humanDesignChart)
    expect(mocks.buildHumanDesignReadingDocument).toHaveBeenCalledWith(mocks.humanDesignChart)
    const printReading = wrapper.get('[data-testid="human-design-print-report"]').getComponent(ReadingDocumentView)
    expect(printReading.props('document')).toBe(mocks.humanDesignDocument)
    expect(wrapper.get('[data-testid="report-print"]')).toBeTruthy()
  })

  it('shows a translated loading state while Vedic calculation is pending', async () => {
    let resolveChart
    mocks.buildVedicChart.mockReturnValueOnce(new Promise(resolve => { resolveChart = resolve }))
    const { wrapper } = await mountPage('vedic')

    expect(wrapper.get('[data-testid="report-loading"]').text()).toBe(en.vedic.loading)
    expect(wrapper.find('[data-testid="report-svg"]').exists()).toBe(false)

    resolveChart(mocks.vedicChart)
    await flushPromises()
    expect(wrapper.find('[data-testid="report-loading"]').exists()).toBe(false)
  })

  it('shows a translated error without exposing Vedic diagnostics', async () => {
    mocks.buildVedicChart.mockRejectedValueOnce(new Error('Swiss Ephemeris internals'))
    const { wrapper } = await mountPage('vedic')
    await flushPromises()

    expect(wrapper.get('[data-testid="report-error"]').text()).toBe('The report could not be calculated.')
    expect(wrapper.text()).not.toContain('Swiss Ephemeris internals')
    expect(wrapper.get('[data-testid="report-print"]')).toBeTruthy()
  })
})
