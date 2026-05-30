import { describe, it, expect } from 'vitest'
import { findSolarReturnJd, solarReturnChartForNatal } from '../../../src/lib/astro/solar_return.js'
import { computeChart, sunLongitude } from '../../../src/lib/astro/ephemeris.js'
import { norm180, toSidereal } from '../../../src/lib/astro/zodiac.js'

describe('solar return', () => {
  it('finds JD where Sun matches natal Sun longitude (within 1 arcmin)', () => {
    const natalSunLon = 323.5  // Aquarius
    const near        = new Date('2030-02-10T12:00Z').getTime()
    const jd          = findSolarReturnJd(natalSunLon, near)
    const cur         = sunLongitude(jd)
    expect(Math.abs(norm180(natalSunLon - cur))).toBeLessThan(1 / 60)
  })

  it('uses the natal tropical Sun when building a sidereal solar return chart', () => {
    const natalJd = 2446486.340277778
    const near = new Date('2030-02-10T12:00Z').getTime()
    const chart = solarReturnChartForNatal(natalJd, near, -23.18, -45.88, { zodiac: 'sidereal', houseSystem: 'placidus' })
    const natalTropical = sunLongitude(natalJd)
    const returnTropical = sunLongitude(chart.jdUt)
    const returnChartSun = computeChart(chart.jdUt, -23.18, -45.88, { zodiac: 'sidereal', houseSystem: 'placidus' })
      .positions.find(p => p.name === 'Sun')

    expect(Math.abs(norm180(natalTropical - returnTropical))).toBeLessThan(1 / 60)
    expect(Math.abs(norm180(toSidereal(returnTropical, chart.jdUt) - returnChartSun.longitude))).toBeLessThan(1e-6)
  })
})
