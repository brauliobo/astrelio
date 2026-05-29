import { describe, it, expect } from 'vitest'
import { secondaryProgression } from '../../src/lib/astro/progressions.js'
import { computeChart } from '../../src/lib/astro/ephemeris.js'
import { localToJdUt } from '../../src/lib/astro/timezones.js'
import { DateTime } from 'luxon'

const REF = { isoLocal: '1986-02-12T18:10', tz: -120, lat: -23.18, lon: -45.88 }

describe('secondaryProgression', () => {
  it('30y of life ≈ 30 days of ephemeris movement for Sun', () => {
    const natalJd = localToJdUt(REF.isoLocal, REF.tz)
    const birthMs = DateTime.fromISO(REF.isoLocal, { zone: 'utc' }).toMillis() - REF.tz * 60_000
    const for30y  = birthMs + 30 * 365.25 * 86_400_000
    const prog    = secondaryProgression(natalJd, for30y, birthMs, REF.lat, REF.lon, { zodiac: 'tropical', houseSystem: 'placidus' })
    const ref     = computeChart(natalJd + 30, REF.lat, REF.lon, { zodiac: 'tropical', houseSystem: 'placidus' })
    const ps = prog.positions.find(p => p.name === 'Sun').longitude
    const rs = ref.positions.find(p => p.name === 'Sun').longitude
    expect(Math.abs(ps - rs)).toBeLessThan(0.05)
  })
})
