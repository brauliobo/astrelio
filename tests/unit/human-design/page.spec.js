import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import en from '../../../src/i18n/en.json'
import HumanDesignPage from '../../../src/pages/HumanDesignPage.vue'
import ReadingDocumentView from '../../../src/components/readings/ReadingDocumentView.vue'
import ModalityRouteSwitch from '../../../src/components/modalities/ModalityRouteSwitch.vue'
import { usePeopleStore } from '../../../src/stores/people.js'
import { useSessionStore } from '../../../src/stores/session.js'

const { chart, readingDocument } = vi.hoisted(() => ({
  chart: {
    type:             'Generator',
    authority:        'Sacral',
    profile:          '1/3',
    definition:       'Single Definition',
    strategy:         'Wait to respond',
    incarnationCross: { geometry: 'Right Angle', name: 'Right Angle Cross of Revolution' },
    variables:        [],
    channels:         [],
  },
  readingDocument: { schema: 'human-design.reading-document' },
}))

vi.mock('../../../src/lib/modalities/index.js', () => ({
  modalityChart: vi.fn(() => chart),
}))

vi.mock('../../../src/lib/human-design/readings/index.js', () => ({
  buildHumanDesignReadingDocument: vi.fn(() => readingDocument),
}))

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

const mountPage = (props = {}) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  usePeopleStore().list = [person]
  useSessionStore().activePersonId = person.id

  return shallowMount(HumanDesignPage, {
    props,
    global: {
      plugins: [pinia, createI18n({ legacy: false, locale: 'en', messages: { en } })],
      renderStubDefaultSlot: true,
    },
  })
}

describe('Human Design workspace page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('defaults to the chart view and retains the standalone modality switch', () => {
    const wrapper = mountPage()

    expect(wrapper.props()).toMatchObject({ workspace: false, workspaceView: 'chart' })
    expect(wrapper.get('[data-testid="human-design-summary"]').element.children).toHaveLength(6)
    expect(wrapper.findComponent(ModalityRouteSwitch).exists()).toBe(true)
    expect(wrapper.find('[data-testid="human-design-data"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="workspace-reference-chart"]').exists()).toBe(false)
  })

  it('renders the reading document and hides the switch owned by Map', () => {
    const wrapper = mountPage({ workspace: true, workspaceView: 'reading' })
    const reading = wrapper.getComponent(ReadingDocumentView)

    expect(reading.props('document')).toBe(readingDocument)
    expect(reading.vm.$slots.reference).toBeTypeOf('function')
    expect(wrapper.findComponent(ModalityRouteSwitch).exists()).toBe(false)
  })

  it('keeps natal data disclosures and excludes tools owned by other workspaces', () => {
    const wrapper = mountPage({ workspace: true, workspaceView: 'data' })

    expect(wrapper.findAll('[data-testid="human-design-data"] > details')).toHaveLength(7)
    expect(wrapper.get('[data-testid="hd-data-toggle-bodygraph"]').text()).toBe('Bodygraph and mandala precision')
    expect(wrapper.find('[data-testid="hd-data-section-correlations"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="hd-data-section-transits"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="hd-data-section-team"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="workspace-reference-chart"]').exists()).toBe(false)
  })
})
