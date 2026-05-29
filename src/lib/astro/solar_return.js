import { computeChart, sunLongitude } from './ephemeris.js'
import { msToJd } from './timezones.js'
import { norm180 } from './zodiac.js'

/** Find the JD where Sun returns to natalSunLon nearest to nearMs. */
export const findSolarReturnJd = (natalSunLon, nearMs) => {
  let jd = msToJd(nearMs)
  for (let i = 0; i < 30; i++) {
    const cur  = sunLongitude(jd)
    const diff = norm180(natalSunLon - cur)
    if (Math.abs(diff) < 1e-5) break
    jd += diff / 0.9856
  }
  return jd
}

export const solarReturnChart = (natalSunLon, nearMs, lat, lon, opts) =>
  computeChart(findSolarReturnJd(natalSunLon, nearMs), lat, lon, opts)

export const solarReturnChartForNatal = (natalJdUt, nearMs, lat, lon, opts) =>
  solarReturnChart(sunLongitude(natalJdUt), nearMs, lat, lon, opts)
