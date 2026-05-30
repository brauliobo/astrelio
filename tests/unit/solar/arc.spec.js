import { describe, it, expect } from 'vitest'
import { computeChart } from '../../../src/lib/astro/ephemeris.js'
import { secondaryProgression } from '../../../src/lib/astro/progressions.js'
import { solarArcChart, solarArcDegrees, solarArcDirections } from '../../../src/lib/astro/solar_arc.js'
import { localToJdUt, localToUtcMs } from '../../../src/lib/astro/timezones.js'
import { norm180, norm360 } from '../../../src/lib/astro/zodiac.js'

const REF = { isoLocal: '1986-02-12T18:10', tz: -120, lat: -23.18, lon: -45.88 }

describe('solar arc directions', () => {
  it('uses progressed Sun minus natal Sun as the arc', () => {
    const natalJd       = localToJdUt(REF.isoLocal, REF.tz)
    const birthMs       = localToUtcMs(REF.isoLocal, REF.tz)
    const forDateMs     = new Date('2016-02-12T20:10Z').getTime()
    const natal         = computeChart(natalJd, REF.lat, REF.lon, { zodiac: 'tropical', houseSystem: 'placidus' })
    const progressed    = secondaryProgression(natalJd, forDateMs, birthMs, REF.lat, REF.lon, { zodiac: 'tropical', houseSystem: 'placidus' })
    const arc           = solarArcDegrees(natal, progressed)
    const natalSun      = natal.positions.find(p => p.name === 'Sun').longitude
    const progressedSun = progressed.positions.find(p => p.name === 'Sun').longitude

    expect(arc).toBeCloseTo(norm180(progressedSun - natalSun), 8)
    expect(arc).toBeGreaterThan(29)
    expect(arc).toBeLessThan(31)
  })

  it('advances all natal longitudes and angles by the same arc', () => {
    const natalJd      = localToJdUt(REF.isoLocal, REF.tz)
    const natal        = computeChart(natalJd, REF.lat, REF.lon, { zodiac: 'tropical', houseSystem: 'placidus' })
    const directed     = solarArcChart(natal, 42)
    const natalMoon    = natal.positions.find(p => p.name === 'Moon')
    const directedMoon = directed.positions.find(p => p.name === 'Moon')

    expect(directed.ascendant).toBeCloseTo(norm360(natal.ascendant + 42), 8)
    expect(directed.mc).toBeCloseTo(norm360(natal.mc + 42), 8)
    expect(directed.cusps[0]).toBeCloseTo(norm360(natal.cusps[0] + 42), 8)
    expect(directedMoon.longitude).toBeCloseTo(norm360(natalMoon.longitude + 42), 8)
  })

  it('builds a directed chart from natal and target dates', () => {
    const natalJd  = localToJdUt(REF.isoLocal, REF.tz)
    const birthMs  = localToUtcMs(REF.isoLocal, REF.tz)
    const natal    = computeChart(natalJd, REF.lat, REF.lon, { zodiac: 'tropical', houseSystem: 'placidus' })
    const directed = solarArcDirections(natal, natalJd, birthMs + 20 * 365.25 * 86_400_000, birthMs, REF.lat, REF.lon, {
      zodiac:      'tropical',
      houseSystem: 'placidus',
    })

    expect(directed.technique).toBe('solar_arc')
    expect(directed.solarArc).toBeGreaterThan(19)
    expect(directed.solarArc).toBeLessThan(21)
  })
})
