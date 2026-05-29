import { describe, it, expect } from 'vitest'
import { findSolarReturnJd } from '../../src/lib/astro/solar_return.js'
import { sunLongitude } from '../../src/lib/astro/ephemeris.js'
import { norm180 } from '../../src/lib/astro/zodiac.js'

describe('solar return', () => {
  it('finds JD where Sun matches natal Sun longitude (within 1 arcmin)', () => {
    const natalSunLon = 323.5  // Aquarius
    const near        = new Date('2030-02-10T12:00Z').getTime()
    const jd          = findSolarReturnJd(natalSunLon, near)
    const cur         = sunLongitude(jd)
    expect(Math.abs(norm180(natalSunLon - cur))).toBeLessThan(1 / 60)
  })
})
