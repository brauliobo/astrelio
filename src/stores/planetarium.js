import { defineStore } from 'pinia'
import { EVENT_TYPES } from '../lib/planetarium/events.js'
import { RATE_KEYS, YEAR_MS } from '../lib/planetarium/time.js'
import { VIEW_MODES } from '../lib/planetarium/constants.js'

export const SCALE_MODES = ['compressed', 'true']

// Shown by default; the denser recurring events stay one click away in the timeline filters.
export const HIGHLIGHT_EVENT_TYPES = [
  'solar_eclipse',
  'lunar_eclipse',
  'supermoon',
  'season',
  'opposition',
  'station',
  'elongation',
  'transit',
  'occultation',
]

const DEFAULT_SPAN_MS = YEAR_MS

export const usePlanetariumStore = defineStore('planetarium', {
  state: () => ({
    view:           'orrery',
    simTimeMs:      Date.now(),
    playing:        false,
    rate:           'day',
    direction:      1,
    scaleMode:      'compressed',
    sizeExaggeration: 4000,
    showOrbits:     true,
    showLabels:     true,
    showShadows:    true,
    showStarMap:    true,
    showMoons:      true,
    focusBody:      'Earth',
    trailBody:      'Mars',
    trailSpanDays:  150,
    timelineSpanMs: DEFAULT_SPAN_MS,
    eventTypes:     [...HIGHLIGHT_EVENT_TYPES],
    selectedEventId: '',
    events:         [],
    eventsStatus:   'idle',
    eventsRange:    { startMs: 0, endMs: 0 },
  }),
  getters: {
    timelineRange: state => ({
      startMs: state.simTimeMs - state.timelineSpanMs / 2,
      endMs:   state.simTimeMs + state.timelineSpanMs / 2,
    }),
    visibleEvents: state => state.events.filter(event => state.eventTypes.includes(event.type)),
    selectedEvent: state => state.events.find(event => event.id === state.selectedEventId) || null,
    eclipseEvents: state => state.events.filter(event => event.type === 'solar_eclipse' || event.type === 'lunar_eclipse'),
  },
  actions: {
    normalize() {
      if (!VIEW_MODES.includes(this.view)) this.view = 'orrery'
      if (!RATE_KEYS.includes(this.rate)) this.rate = 'day'
      if (!SCALE_MODES.includes(this.scaleMode)) this.scaleMode = 'compressed'
      this.direction = this.direction < 0 ? -1 : 1
      if (!Number.isFinite(this.simTimeMs)) this.simTimeMs = Date.now()
      this.eventTypes = (this.eventTypes || []).filter(type => EVENT_TYPES.includes(type))
      if (!this.eventTypes.length) this.eventTypes = [...HIGHLIGHT_EVENT_TYPES]
      this.events = []
      this.eventsStatus = 'idle'
      this.eventsRange = { startMs: 0, endMs: 0 }
    },
    setView(view) {
      if (VIEW_MODES.includes(view)) this.view = view
    },
    setTime(timeMs) {
      if (Number.isFinite(timeMs)) this.simTimeMs = timeMs
    },
    now() {
      this.simTimeMs = Date.now()
    },
    togglePlay() {
      this.playing = !this.playing
    },
    setRate(rate) {
      if (RATE_KEYS.includes(rate)) this.rate = rate
    },
    reverse() {
      this.direction = this.direction < 0 ? 1 : -1
    },
    setScaleMode(mode) {
      if (SCALE_MODES.includes(mode)) this.scaleMode = mode
    },
    toggleEventType(type) {
      if (!EVENT_TYPES.includes(type)) return
      this.eventTypes = this.eventTypes.includes(type)
        ? this.eventTypes.filter(entry => entry !== type)
        : [...this.eventTypes, type]
    },
    selectEvent(id) {
      this.selectedEventId = id
      const event = this.events.find(entry => entry.id === id)
      if (!event) return
      this.simTimeMs = event.timeMs
      this.playing   = false
      if (event.view) this.view = event.view
    },
    setEvents(events, range) {
      this.events       = events
      this.eventsRange  = range
      this.eventsStatus = 'ready'
    },
  },
  persist: {
    key:   'astrelio_planetarium',
    pick:  ['view', 'rate', 'scaleMode', 'sizeExaggeration', 'showOrbits', 'showLabels', 'showShadows', 'showStarMap', 'showMoons', 'focusBody', 'trailBody', 'trailSpanDays', 'timelineSpanMs', 'eventTypes'],
  },
})
