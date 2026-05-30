import { Body, Ecliptic, GeoVector, MakeTime } from 'astronomy-engine'
import { computeChart } from './ephemeris.js'
import { msToJd } from './timezones.js'
import { norm180, norm360 } from './zodiac.js'

const jdToDate = (jd) => new Date((jd - 2440587.5) * 86_400_000)

export const moonLongitude = (jd) => {
  const t = MakeTime(jdToDate(jd))
  const v = GeoVector(Body.Moon, t, true)
  return norm360(Ecliptic(v).elon)
}

const moonSpeedDegPerDay = (jd) => {
  const dt = 1 / 1440
  return norm180(moonLongitude(jd + dt) - moonLongitude(jd - dt)) / (2 * dt)
}

/** Find the JD where Moon returns to natalMoonLon nearest to nearMs. */
export const findLunarReturnJd = (natalMoonLon, nearMs) => {
  let jd = msToJd(nearMs)
  for (let i = 0; i < 20; i++) {
    const diff = norm180(natalMoonLon - moonLongitude(jd))
    if (Math.abs(diff) < 1e-5) break
    jd += diff / moonSpeedDegPerDay(jd)
  }
  return jd
}

export const lunarReturnChart = (natalMoonLon, nearMs, lat, lon, opts) =>
  computeChart(findLunarReturnJd(natalMoonLon, nearMs), lat, lon, opts)

export const lunarReturnChartForNatal = (natalJdUt, nearMs, lat, lon, opts) =>
  lunarReturnChart(moonLongitude(natalJdUt), nearMs, lat, lon, opts)
