import { describe, expect, it } from 'vitest'
import { findStations, isRetrograde, longitudeRate, retrogradeIntervals } from '../../../src/lib/planetarium/retrograde.js'

const day = date => date.toISOString().slice(0, 10)

describe('retrograde motion', () => {
  it('finds the Mars stations of the 2024/2025 retrograde', () => {
    const stations = findStations('Mars', '2024-10-01', '2025-04-01')
    expect(stations.map(station => [station.direction, day(station.time)])).toEqual([
      ['retrograde', '2024-12-06'],
      ['direct', '2025-02-24'],
    ])
  })

  it('pairs the three Mercury retrogrades of 2025', () => {
    expect(retrogradeIntervals('Mercury', '2025-01-01', '2025-12-31').map(interval => [day(interval.start), day(interval.end)]))
      .toEqual([
        ['2025-03-15', '2025-04-07'],
        ['2025-07-18', '2025-08-11'],
        ['2025-11-09', '2025-11-29'],
      ])
  })

  it('reports negative apparent motion while retrograde', () => {
    expect(isRetrograde('Mars', new Date('2025-01-15T00:00:00Z'))).toBe(true)
    expect(longitudeRate('Mars', new Date('2025-01-15T00:00:00Z'))).toBeLessThan(0)
    expect(isRetrograde('Mars', new Date('2025-06-15T00:00:00Z'))).toBe(false)
  })
})
