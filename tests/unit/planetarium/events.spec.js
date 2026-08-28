import { describe, expect, it } from 'vitest'
import {
  lunarEclipses,
  pairConjunctions,
  searchEvents,
  solarEclipses,
  superMoons,
  transits,
} from '../../../src/lib/planetarium/events.js'

const day = event => new Date(event.timeMs).toISOString().slice(0, 10)

describe('planetarium events', () => {
  it('finds the 2024 and 2026 total solar eclipses with the right kind', () => {
    const events = solarEclipses(Date.UTC(2024, 0, 1), Date.UTC(2027, 0, 1))
    const total  = events.filter(event => event.details.kind === 'total')
    expect(total.map(day)).toContain('2024-04-08')
    expect(total.map(day)).toContain('2026-08-12')
    expect(events.find(event => day(event) === '2024-10-02').details.kind).toBe('annular')
  })

  it('finds the March 2025 total lunar eclipse', () => {
    const eclipse = lunarEclipses(Date.UTC(2025, 0, 1), Date.UTC(2025, 5, 1))[0]
    expect(day(eclipse)).toBe('2025-03-14')
    expect(eclipse.details.kind).toBe('total')
    expect(eclipse.details.obscuration).toBeGreaterThan(0.99)
  })

  it('detects the 2020 great conjunction under a tenth of a degree', () => {
    const events = pairConjunctions(Date.UTC(2020, 10, 1), Date.UTC(2021, 0, 1))
    const great  = events.find(event => event.bodies.includes('Jupiter') && event.bodies.includes('Saturn'))
    expect(day(great)).toBe('2020-12-21')
    expect(great.details.separation).toBeLessThan(0.11)
  })

  it('classifies the November 2024 supermoon and a micromoon', () => {
    const events = superMoons(Date.UTC(2024, 0, 1), Date.UTC(2025, 0, 1))
    expect(events.find(event => day(event) === '2024-11-15').details.size).toBe('super')
    expect(events.find(event => day(event) === '2024-02-24').details.size).toBe('micro')
  })

  it('finds the Mercury and Venus solar transits of this century', () => {
    expect(transits(Date.UTC(2000, 0, 1), Date.UTC(2030, 0, 1)).map(day)).toEqual([
      '2003-05-07',
      '2006-11-08',
      '2016-05-09',
      '2019-11-11',
      '2004-06-08',
      '2012-06-06',
    ])
  })

  it('returns a sorted, de-duplicated catalog across every event type', () => {
    const events = searchEvents({ startMs: Date.UTC(2025, 0, 1), endMs: Date.UTC(2025, 6, 1) })
    const times  = events.map(event => event.timeMs)

    expect(events.length).toBeGreaterThan(50)
    expect([...times].sort((a, b) => a - b)).toEqual(times)
    expect(new Set(events.map(event => event.id)).size).toBe(events.length)
    expect(new Set(events.map(event => event.type))).toContain('station')
  })
})
