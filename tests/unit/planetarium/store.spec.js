import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { HIGHLIGHT_EVENT_TYPES, usePlanetariumStore } from '../../../src/stores/planetarium.js'

const event = (id, type, timeMs, view) => ({ id, type, timeMs, bodies: ['Moon'], details: {}, view })

describe('planetarium store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('repairs invalid persisted state', () => {
    const store = usePlanetariumStore()
    store.$patch({ view: 'nonsense', rate: 'eon', scaleMode: 'huge', direction: 0, eventTypes: ['nope'] })
    store.normalize()

    expect(store.view).toBe('orrery')
    expect(store.rate).toBe('day')
    expect(store.scaleMode).toBe('compressed')
    expect(store.direction).toBe(1)
    expect(store.eventTypes).toEqual(HIGHLIGHT_EVENT_TYPES)
  })

  it('filters events by the active types', () => {
    const store = usePlanetariumStore()
    store.events     = [event('a', 'solar_eclipse', 1), event('b', 'moon_quarter', 2)]
    store.eventTypes = ['solar_eclipse']

    expect(store.visibleEvents.map(entry => entry.id)).toEqual(['a'])
    expect(store.eclipseEvents.map(entry => entry.id)).toEqual(['a'])
  })

  it('seeks to a selected event and adopts its view', () => {
    const store = usePlanetariumStore()
    store.events  = [event('a', 'lunar_eclipse', 1234, 'eclipses')]
    store.playing = true
    store.selectEvent('a')

    expect(store.simTimeMs).toBe(1234)
    expect(store.playing).toBe(false)
    expect(store.view).toBe('eclipses')
    expect(store.selectedEvent.id).toBe('a')
  })

  it('toggles event types on and off', () => {
    const store = usePlanetariumStore()
    store.eventTypes = ['solar_eclipse']
    store.toggleEventType('station')
    expect(store.eventTypes).toContain('station')
    store.toggleEventType('station')
    expect(store.eventTypes).not.toContain('station')
    store.toggleEventType('not-a-type')
    expect(store.eventTypes).toEqual(['solar_eclipse'])
  })

  it('centres the timeline window on the simulated instant', () => {
    const store = usePlanetariumStore()
    store.setTime(1_000_000_000_000)
    const { startMs, endMs } = store.timelineRange

    expect(endMs - startMs).toBe(store.timelineSpanMs)
    expect((startMs + endMs) / 2).toBe(store.simTimeMs)
  })
})
