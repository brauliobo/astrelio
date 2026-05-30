import { describe, it, expect } from 'vitest'
import { lunarReturnChartForNatal, findLunarReturnJd, moonLongitude } from '../../../src/lib/astro/lunar_return.js'
import { localToJdUt } from '../../../src/lib/astro/timezones.js'
import { norm180 } from '../../../src/lib/astro/zodiac.js'

const REF = { isoLocal: '1986-02-12T18:10', tz: -120, lat: -23.18, lon: -45.88 }

describe('lunar return', () => {
  it('finds JD where Moon matches natal Moon longitude within 1 arcmin', () => {
    const natalMoonLon = 112.5
    const near         = new Date('2030-02-10T12:00Z').getTime()
    const jd           = findLunarReturnJd(natalMoonLon, near)
    expect(Math.abs(norm180(natalMoonLon - moonLongitude(jd)))).toBeLessThan(1 / 60)
  })

  it('builds a return chart from the natal Moon longitude', () => {
    const natalJd    = localToJdUt(REF.isoLocal, REF.tz)
    const near       = new Date('2030-02-10T12:00Z').getTime()
    const chart      = lunarReturnChartForNatal(natalJd, near, REF.lat, REF.lon, { zodiac: 'tropical', houseSystem: 'placidus' })
    const natalMoon  = moonLongitude(natalJd)
    const returnMoon = moonLongitude(chart.jdUt)

    expect(Math.abs(norm180(natalMoon - returnMoon))).toBeLessThan(1 / 60)
    expect(chart.positions.find(p => p.name === 'Moon')).toBeTruthy()
  })
})
