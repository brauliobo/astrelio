import { eclipticLongitudeOf } from './ephemeris3d.js'

const DAY_MS = 86400000

const wrapDelta = (delta) => ((delta + 540) % 360) - 180

/** Apparent geocentric longitude rate in degrees per day: negative means retrograde. */
export const longitudeRate = (name, date, stepDays = 0.5) => {
  const ms   = date instanceof Date ? date.getTime() : Number(date)
  const back = eclipticLongitudeOf(name, new Date(ms - stepDays * DAY_MS))
  const fore = eclipticLongitudeOf(name, new Date(ms + stepDays * DAY_MS))
  return wrapDelta(fore - back) / (2 * stepDays)
}

export const isRetrograde = (name, date) => longitudeRate(name, date) < 0

const refineStation = (name, lowMs, highMs) => {
  let low  = lowMs
  let high = highMs
  const lowRate = longitudeRate(name, new Date(low))
  for (let step = 0; step < 40 && high - low > 60000; step += 1) {
    const mid     = (low + high) / 2
    const midRate = longitudeRate(name, new Date(mid))
    if (Math.sign(midRate) === Math.sign(lowRate)) low = mid
    else high = mid
  }
  return new Date((low + high) / 2)
}

/**
 * Stationary points found by sign change of the apparent longitude rate, then bisected to the minute.
 * `direction` is 'retrograde' when the planet turns backwards, 'direct' when it resumes.
 */
export const findStations = (name, startDate, endDate, { stepDays = 2 } = {}) => {
  const startMs = new Date(startDate).getTime()
  const endMs   = new Date(endDate).getTime()
  const stations = []
  let previousMs   = startMs
  let previousRate = longitudeRate(name, new Date(startMs))

  for (let ms = startMs + stepDays * DAY_MS; ms <= endMs; ms += stepDays * DAY_MS) {
    const rate = longitudeRate(name, new Date(ms))
    if (rate !== 0 && Math.sign(rate) !== Math.sign(previousRate)) {
      const time = refineStation(name, previousMs, ms)
      stations.push({
        body:      name,
        time,
        direction: rate < 0 ? 'retrograde' : 'direct',
        longitude: eclipticLongitudeOf(name, time),
      })
    }
    previousMs   = ms
    previousRate = rate
  }
  return stations
}

/** Retrograde intervals paired from consecutive stations, for timeline shading. */
export const retrogradeIntervals = (name, startDate, endDate, options) => {
  const stations = findStations(name, startDate, endDate, options)
  const intervals = []
  for (let index = 0; index < stations.length - 1; index += 1) {
    if (stations[index].direction !== 'retrograde') continue
    if (stations[index + 1].direction !== 'direct') continue
    intervals.push({ body: name, start: stations[index].time, end: stations[index + 1].time })
  }
  return intervals
}
