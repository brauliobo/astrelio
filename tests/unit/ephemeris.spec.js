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
  it('computes a complete chart with 14 bodies', () => {
    const jd = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const c  = computeChart(jd, REF.lat, REF.lon)
    expect(c.positions.length).toBe(14)
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

  it('pins tropical longitudes for the reference chart', () => {
    const jd       = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const c        = computeChart(jd, REF.lat, REF.lon, { zodiac: 'tropical', houseSystem: 'placidus' })
    const expected = {
      Sun:       323.823130,
      Moon:      9.878768,
      Mercury:   332.945117,
      Venus:     329.633951,
      Mars:      246.198763,
      Jupiter:   328.119011,
      Saturn:    248.713407,
      Uranus:    261.584523,
      Neptune:   275.034745,
      Pluto:     217.357843,
      NorthNode: 33.552883,
      SouthNode: 213.552883,
      Lilith:    58.373303,
      Chiron:    69.243221,
    }

    for (const [name, longitude] of Object.entries(expected)) {
      expect(c.positions.find(p => p.name === name).longitude).toBeCloseTo(longitude, 5)
    }
  })

  it('computes tropical point longitudes in zodiac range', () => {
    const jd       = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const c        = computeChart(jd, REF.lat, REF.lon, { zodiac: 'tropical', houseSystem: 'placidus' })
    const expected = {
      fortune:   163.908712,
      spirit:    71.797435,
      vertex:    332.815122,
      eastPoint: 126.802239,
    }

    for (const [point, longitude] of Object.entries(expected)) {
      expect(c[point]).toBeGreaterThanOrEqual(0)
      expect(c[point]).toBeLessThan(360)
      expect(c[point]).toBeCloseTo(longitude, 5)
    }
  })

  it('selects mean or true lunar node mode for tropical charts', () => {
    const jd   = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const mean = computeChart(jd, REF.lat, REF.lon, {
      zodiac:      'tropical',
      houseSystem: 'placidus',
      nodeMode:    'mean',
    })
    const trueNode = computeChart(jd, REF.lat, REF.lon, {
      zodiac:      'tropical',
      houseSystem: 'placidus',
      nodeMode:    'true',
    })

    expect(mean.nodeMode).toBe('mean')
    expect(trueNode.nodeMode).toBe('true')
    expect(mean.positions.find(p => p.name === 'NorthNode').longitude).toBeCloseTo(33.552883, 5)
    expect(trueNode.positions.find(p => p.name === 'NorthNode').longitude).toBeCloseTo(32.305137, 5)
    expect(trueNode.positions.find(p => p.name === 'SouthNode').longitude).toBeCloseTo(212.305137, 5)
  })

  it('pins retrograde state and sidereal ayanamsa shift', () => {
    const jd       = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const tropical = computeChart(jd, REF.lat, REF.lon, { zodiac: 'tropical', houseSystem: 'placidus' })
    const sidereal = computeChart(jd, REF.lat, REF.lon, { zodiac: 'sidereal', houseSystem: 'placidus' })
    const tSun     = tropical.positions.find(p => p.name === 'Sun')
    const sSun     = sidereal.positions.find(p => p.name === 'Sun')

    const pluto     = tropical.positions.find(p => p.name === 'Pluto')
    const chiron    = tropical.positions.find(p => p.name === 'Chiron')
    const northNode = tropical.positions.find(p => p.name === 'NorthNode')

    expect(pluto.retrograde).toBe(true)
    expect(pluto.motion).toBe('stationary')
    expect(chiron.motion).toBe('stationary')
    expect(northNode.motion).toBe('retrograde')
    expect(tropical.positions.find(p => p.name === 'Mercury').retrograde).toBe(false)
    expect(tSun.longitude - sSun.longitude).toBeCloseTo(23.656068, 5)
  })

  it('moonPhaseFraction in 0..1', () => {
    const jd = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const f  = moonPhaseFraction(jd)
    expect(f).toBeGreaterThanOrEqual(0)
    expect(f).toBeLessThan(1)
  })

  it('moonPhaseLabel returns one of 8 labels', () => {
    const jd     = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const labels = ['new', 'waxing_c', 'first_q', 'waxing_g', 'full', 'waning_g', 'last_q', 'waning_c']
    expect(labels).toContain(moonPhaseLabel(jd))
  })

  it('sidereal mode shifts longitudes', () => {
    const jd       = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const tropical = computeChart(jd, REF.lat, REF.lon, { zodiac: 'tropical', houseSystem: 'placidus' })
    const sidereal = computeChart(jd, REF.lat, REF.lon, { zodiac: 'sidereal', houseSystem: 'placidus' })
    const tSun     = tropical.positions.find(p => p.name === 'Sun').longitude
    const sSun     = sidereal.positions.find(p => p.name === 'Sun').longitude
    expect(Math.abs(tSun - sSun)).toBeGreaterThan(20)  // ayanamsa ~24°
  })

  it('infers historical Brazilian DST for legacy saved city labels', () => {
    const offset = offsetMinutesForPerson({
      isoLocal:        REF.isoLocal,
      placeLabel:      'São José dos Campos, SP — Brasil',
      tzOffsetMinutes: -180
    })

    expect(offset).toBe(-120)
  })
})
