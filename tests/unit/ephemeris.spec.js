import { describe, it, expect } from 'vitest'
import { computeChart, moonPhaseFraction, moonPhaseLabel } from '../../src/lib/astro/ephemeris.js'
import { localToJdUt, offsetMinutesForPerson } from '../../src/lib/astro/timezones.js'
import { signIndex } from '../../src/lib/astro/zodiac.js'

const REF = {
  isoLocal:        '1986-02-12T18:10',
  tzOffsetMinutes: -120,
  lat:             -23.18,
  lon:             -45.88
}

describe('ephemeris', () => {
  it('computes a complete chart with 13 bodies', () => {
    const jd = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const c  = computeChart(jd, REF.lat, REF.lon)
    expect(c.positions.length).toBe(13)
    expect(c.cusps.length).toBe(12)
    expect(c.ascendant).toBeGreaterThanOrEqual(0)
    expect(c.ascendant).toBeLessThan(360)
  })

  it('Sun in Aquarius for 1986-02-12 (Vega Plus reference)', () => {
    const jd  = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const c   = computeChart(jd, REF.lat, REF.lon)
    const sun = c.positions.find(p => p.name === 'Sun')
    // Aquarius = sign index 10
    expect(signIndex(sun.longitude)).toBe(10)
  })

  it('Moon in Aries for the same chart', () => {
    const jd   = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const c    = computeChart(jd, REF.lat, REF.lon)
    const moon = c.positions.find(p => p.name === 'Moon')
    expect(signIndex(moon.longitude)).toBe(0)  // Aries
  })

  it('moonPhaseFraction in 0..1', () => {
    const jd = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const f  = moonPhaseFraction(jd)
    expect(f).toBeGreaterThanOrEqual(0)
    expect(f).toBeLessThan(1)
  })

  it('moonPhaseLabel returns one of 8 labels', () => {
    const jd = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const labels = ['new', 'waxing_c', 'first_q', 'waxing_g', 'full', 'waning_g', 'last_q', 'waning_c']
    expect(labels).toContain(moonPhaseLabel(jd))
  })

  it('sidereal mode shifts longitudes', () => {
    const jd = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const tropical = computeChart(jd, REF.lat, REF.lon, { zodiac: 'tropical', houseSystem: 'placidus' })
    const sidereal = computeChart(jd, REF.lat, REF.lon, { zodiac: 'sidereal', houseSystem: 'placidus' })
    const tSun = tropical.positions.find(p => p.name === 'Sun').longitude
    const sSun = sidereal.positions.find(p => p.name === 'Sun').longitude
    expect(Math.abs(tSun - sSun)).toBeGreaterThan(20)  // ayanamsa ~24°
  })

  it('infers historical Brazilian DST for legacy saved city labels', () => {
    const offset = offsetMinutesForPerson({
      isoLocal: REF.isoLocal,
      placeLabel: 'São José dos Campos, SP — Brasil',
      tzOffsetMinutes: -180
    })

    expect(offset).toBe(-120)
  })
})
