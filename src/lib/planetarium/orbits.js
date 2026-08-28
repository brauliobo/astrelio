import { BODY_BY_NAME } from './constants.js'
import { astroTime, geoEcliptic, helioEcliptic, lengthAu } from './ephemeris3d.js'

const DAY_MS = 86400000

const sampleCount = (periodDays) => Math.min(720, Math.max(180, Math.round(periodDays / 4)))

/** One full revolution sampled from the real ephemeris, so eccentricity and inclination are true. */
export const orbitPath = (name, date = new Date(), { samples, frame = 'helio', center = 'Sun' } = {}) => {
  const body    = BODY_BY_NAME.get(name)
  const period  = body?.periodDays || 365.256
  const count   = samples || sampleCount(period)
  const startMs = astroTime(date).date.getTime()
  const project = frame === 'geo' ? geoEcliptic : helioEcliptic
  const points  = []

  for (let index = 0; index < count; index += 1) {
    const when = new Date(startMs + (index / count) * period * DAY_MS)
    const point = project(name, when)
    if (center === 'Earth' && frame === 'helio') {
      const earth = helioEcliptic('Earth', when)
      points.push({ x: point.x - earth.x, y: point.y - earth.y, z: point.z - earth.z })
      continue
    }
    points.push(point)
  }
  return points
}

export const orbitExtremes = (points) => {
  let perihelion = points[0]
  let aphelion   = points[0]
  for (const point of points) {
    if (lengthAu(point) < lengthAu(perihelion)) perihelion = point
    if (lengthAu(point) > lengthAu(aphelion)) aphelion = point
  }
  return { perihelion, aphelion }
}

/** Geocentric track of a body across the sky, projected onto a unit sphere for star-background trails. */
export const skyTrack = (name, centerDate, { spanDays = 240, stepDays = 2 } = {}) => {
  const centerMs = astroTime(centerDate).date.getTime()
  const steps    = Math.max(2, Math.round(spanDays / stepDays))
  const points   = []

  for (let index = 0; index <= steps; index += 1) {
    const when   = new Date(centerMs + (index - steps / 2) * stepDays * DAY_MS)
    const vector = geoEcliptic(name, when)
    const radius = lengthAu(vector)
    points.push({
      t: when.getTime(),
      x: vector.x / radius,
      y: vector.y / radius,
      z: vector.z / radius,
    })
  }
  return points
}

/** Lunar orbit around Earth, in Earth-centred scene units, showing the 5.1 degree tilt and its nodes. */
export const lunarOrbitPath = (date = new Date(), samples = 240) => {
  const startMs = astroTime(date).date.getTime()
  return Array.from({ length: samples }, (_, index) => {
    const when  = new Date(startMs + (index / samples) * 27.3217 * DAY_MS)
    return geoEcliptic('Moon', when)
  })
}
