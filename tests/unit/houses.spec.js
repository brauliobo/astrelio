import { describe, it, expect } from 'vitest'
import { calcHouses, houseOf, ascMc } from '../../src/lib/astro/houses.js'
import { computeChart } from '../../src/lib/astro/ephemeris.js'
import { localToJdUt } from '../../src/lib/astro/timezones.js'
import { norm360 } from '../../src/lib/astro/zodiac.js'

// Brazil 1986-02-12 was on DST (Horário de Verão) → UTC-2, not UTC-3
const REF = {
  isoLocal:        '1986-02-12T18:10',
  tzOffsetMinutes: -120,
  lat:             -23.18,
  lon:             -45.88
}

const angularDelta = (actual, expected) => {
  const delta = Math.abs(norm360(actual - expected))
  return Math.min(delta, 360 - delta)
}

describe('houses', () => {
  it('cusp 1 equals ascendant, cusp 10 equals MC', () => {
    const jd = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const h  = calcHouses('placidus', jd, REF.lat, REF.lon)
    expect(h.cusps[0]).toBeCloseTo(h.ascendant, 6)
    expect(h.cusps[9]).toBeCloseTo(h.mc, 6)
  })

  it('opposite cusps differ by 180°', () => {
    const jd = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const h  = calcHouses('placidus', jd, REF.lat, REF.lon)
    expect(norm360(h.cusps[3] - h.cusps[9])).toBeCloseTo(180, 4)
    expect(norm360(h.cusps[6] - h.cusps[0])).toBeCloseTo(180, 4)
  })

  it('whole-sign cusps land at sign boundaries', () => {
    const jd = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const h  = calcHouses('whole_sign', jd, REF.lat, REF.lon)
    for (const c of h.cusps) expect(c % 30).toBeCloseTo(0, 6)
  })

  it('sidereal whole-sign chart cusps land at sidereal sign boundaries', () => {
    const jd = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const chart = computeChart(jd, REF.lat, REF.lon, { zodiac: 'sidereal', houseSystem: 'whole_sign' })
    for (const c of chart.cusps) expect(c % 30).toBeCloseTo(0, 6)
    expect(chart.cusps[0]).toBe(Math.floor(chart.ascendant / 30) * 30)
  })

  it('equal cusps spaced 30°', () => {
    const jd = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const h  = calcHouses('equal', jd, REF.lat, REF.lon)
    for (let i = 1; i < 12; i++) {
      const span = norm360(h.cusps[i] - h.cusps[i - 1])
      expect(span).toBeCloseTo(30, 4)
    }
  })

  it('houseOf returns 1..12', () => {
    const cusps = Array.from({ length: 12 }, (_, i) => i * 30)
    expect(houseOf(15,  cusps)).toBe(1)
    expect(houseOf(45,  cusps)).toBe(2)
    expect(houseOf(355, cusps)).toBe(12)
  })

  it('ascendant within reasonable range for São José dos Campos', () => {
    const jd = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const { ascendant, mc } = ascMc(jd, REF.lat, REF.lon)
    // Vega Plus reference: ASC ~ Cancer 27°49' ≈ 117.8°, MC ~ Taurus 11°36' ≈ 41.6°
    expect(Math.abs(norm360(ascendant - 117.8))).toBeLessThan(2)
    expect(Math.abs(norm360(mc - 41.6))).toBeLessThan(2)
  })

  it('placidus cusps match Vega Plus reference quadrants', () => {
    const jd = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const h  = calcHouses('placidus', jd, REF.lat, REF.lon)
    const expected = [117.8, 154.4, 190.6, 221.6, 247.7, 271.9, 297.8, 334.4, 10.6, 41.6, 67.7, 91.9]

    h.cusps.forEach((cusp, i) => {
      expect(angularDelta(cusp, expected[i])).toBeLessThan(1)
    })
  })

  it('koch cusps match Swiss Ephemeris reference values', () => {
    const jd = localToJdUt(REF.isoLocal, REF.tzOffsetMinutes)
    const h = calcHouses('koch', jd, REF.lat, REF.lon)
    const expected = [
      117.849528605,
      149.841857192,
      186.289507513,
      221.631974221,
      245.964458929,
      270.681467184,
      297.849528605,
      329.841857192,
      6.289507513,
      41.631974221,
      65.964458929,
      90.681467184,
    ]

    h.cusps.forEach((cusp, i) => {
      expect(angularDelta(cusp, expected[i])).toBeLessThan(0.005)
    })
  })
})
