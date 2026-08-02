import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import en from '../../../src/i18n/en.json'
import VedicPage from '../../../src/pages/VedicPage.vue'
import ReadingDocumentView from '../../../src/components/readings/ReadingDocumentView.vue'
import Wheel from '../../../src/components/chart/Wheel.vue'
import { CHART_HIGHLIGHT_EVENT } from '../../../src/lib/chart/highlight.js'
import { usePeopleStore } from '../../../src/stores/people.js'
import { useSessionStore } from '../../../src/stores/session.js'
import { vedicChartFixture } from './fixtures.js'

const { buildVedicChartMock } = vi.hoisted(() => ({
  buildVedicChartMock: vi.fn(),
}))

vi.mock('../../../src/lib/vedic/chart.js', () => ({
  buildVedicChart: buildVedicChartMock,
}))

const messages = {
  ...en,
  map: {
    ...en.map,
    reference_chart: 'Reference chart',
  },
  vedic: {
    ...en.vedic,
    error: 'The Vedic chart could not be calculated.',
    data:  {
      system_controls:   'System controls',
      body:              'Body',
      sign:              'Sign',
      degree:            'Degree',
      nakshatra:         'Nakshatra',
      pada:              'Pada',
      motion:            'Motion',
      retrograde:        'Retrograde',
      direct:            'Direct',
      rasi:              'Rasi',
      technical_details: 'Technical details',
      julian_day:        'Julian day',
      ayanamsha_value:   'Ayanamsha value',
      ascendant:         'Ascendant',
      midheaven:         'Midheaven',
      latitude:          'Latitude',
      longitude:         'Longitude',
      calculated_at:     'Calculated at',
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

const pageChart = () => {
  const chart = vedicChartFixture()
  return {
    ...chart,
    modality:        'vedic',
    jdUt:            2451545,
    lat:             person.lat,
    lon:             person.lon,
    zodiac:          'sidereal',
    ayanamsha:       'lahiri',
    ayanamshaValue:  23.85,
    houseSystem:     'whole_sign',
    nodeMode:        'mean',
    mc:              270,
    calculatedAt:    '2000-01-01T12:00:00.000Z',
    navamsa:         chart.navamsa.map(position => ({
      ...position,
      rasiSignIndex: Math.floor(position.longitude / 30),
    })),
    dashas: {
      ...chart.dashas,
      mahadashas: Array.from({ length: 9 }, (_, index) => ({
        lord:    ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury'][index],
        startJd: 2450000 + index * 100,
        endJd:   2450100 + index * 100,
      })),
    },
  }
}

const mountPage = async (props = {}) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  usePeopleStore().list = [person]
  useSessionStore().activePersonId = person.id

  const wrapper = mount(VedicPage, {
    props,
    global: {
      plugins: [pinia, createI18n({ legacy: false, locale: 'en', messages: { en: messages } })],
      stubs: {
        Wheel:               true,
        ReadingDocumentView: true,
        ModalityRouteSwitch: { template: '<nav data-testid="modality-switch" />' },
      },
    },
  })
  await flushPromises()
  return wrapper
}

describe('Vedic workspace page', () => {
  beforeEach(() => {
    buildVedicChartMock.mockReset()
    buildVedicChartMock.mockResolvedValue(pageChart())
  })

  it('defaults to a compact chart view and retains the standalone modality switch', async () => {
    const wrapper = await mountPage()

    expect(wrapper.props()).toMatchObject({ workspace: false, workspaceView: 'chart' })
    expect(wrapper.findAll('[data-testid^="vedic-summary-"]')).toHaveLength(4)
    expect(wrapper.get('[data-testid="vedic-chart-panel"]').classes()).toContain('justify-center')
    expect(wrapper.find('[data-testid="vedic-position-table"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="modality-switch"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="workspace-reference-chart"]').exists()).toBe(false)
  })

  it('builds and renders the complete reading from the resolved chart', async () => {
    const wrapper = await mountPage({ workspace: true, workspaceView: 'reading' })
    const reading = wrapper.getComponent(ReadingDocumentView)

    expect(buildVedicChartMock).toHaveBeenCalledTimes(1)
    expect(reading.props('document')).toMatchObject({
      schemaVersion: 'vedic-reading-document.v1',
      chartId:       'vedic-fixture',
    })
    expect(reading.props('document').chapters).toHaveLength(8)
    expect(reading.vm.$slots.reference).toBeTypeOf('function')
    expect(wrapper.find('[data-testid="modality-switch"]').exists()).toBe(false)
  })

  it('keeps controls and all technical datasets in the data view disclosures', async () => {
    const wrapper = await mountPage({ workspace: true, workspaceView: 'data' })

    expect(wrapper.findAll('[data-testid="vedic-data"] details')).toHaveLength(5)
    expect(wrapper.find('[data-testid="vedic-ayanamsha"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="vedic-position-table"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="vedic-navamsa-table"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="vedic-dasha-table"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Sun')
    expect(wrapper.text()).not.toContain('Surya')
    expect(wrapper.get('[data-testid="vedic-rasi-panel"] [data-testid="workspace-reference-chart"]').exists()).toBe(true)
    expect(wrapper.getComponent(Wheel).props()).toMatchObject({
      displayMode:               'clean',
      selectionSummaryPlacement: 'floating',
      showModeControls:          false,
      showNakshatraRing:         false,
      showSelectionSummary:      true,
    })
  })

  it('broadcasts Vedic row highlights for pointer and keyboard interaction', async () => {
    const wrapper = await mountPage({ workspace: true, workspaceView: 'data' })
    const events  = []
    const receive = event => events.push(event.detail)
    window.addEventListener(CHART_HIGHLIGHT_EVENT, receive)

    const sun = wrapper.get('[data-testid="vedic-position-Sun"]')
    expect(sun.attributes()).toMatchObject({ role: 'button', tabindex: '0', 'aria-pressed': 'false' })

    await sun.trigger('mouseenter')
    expect(events.at(-1)).toMatchObject({
      highlight: { bodies: ['Sun'], aspectKey: '' },
      pinned:    false,
    })

    await sun.trigger('keydown', { key: 'Enter' })
    expect(events.at(-1)).toMatchObject({
      highlight: { bodies: ['Sun'], aspectKey: '' },
      pinned:    true,
    })
    expect(sun.attributes('aria-pressed')).toBe('true')
    window.removeEventListener(CHART_HIGHLIGHT_EVENT, receive)
  })

  it('keeps calculation diagnostics out of the visible error message', async () => {
    buildVedicChartMock.mockRejectedValueOnce(new Error('Swiss Ephemeris internals'))
    const wrapper = await mountPage()

    expect(wrapper.get('[data-testid="vedic-error"]').text()).toBe('The Vedic chart could not be calculated.')
    expect(wrapper.text()).not.toContain('Swiss Ephemeris internals')
  })
})
