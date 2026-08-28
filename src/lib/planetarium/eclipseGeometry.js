import { AU_KM, EARTH_RADIUS_KM, MOON_RADIUS_KM } from './constants.js'
import { geoEcliptic, lengthAu, orientationBasis } from './ephemeris3d.js'
import { shadowRadiiAt } from './shadows.js'

const MINUTE_MS = 60000
const DEG       = 180 / Math.PI

const dot   = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z
const sub   = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })
const scale = (a, k) => ({ x: a.x * k, y: a.y * k, z: a.z * k })
const norm  = (a) => scale(a, 1 / lengthAu(a))

// WGS-84 flattening: map centres are quoted in geodetic latitude, the ray tracing gives geocentric.
const FLATTENING = 1 / 298.257223563

const geodeticLatitude = geocentricRad => Math.atan(Math.tan(geocentricRad) / (1 - FLATTENING) ** 2) * DEG

/** Geographic coordinates of a point given in scene coordinates around Earth. */
export const geographicOf = (point, date) => {
  const basis  = orientationBasis('Earth', date)
  const radius = lengthAu(point)
  return {
    latitude:  geodeticLatitude(Math.asin(dot(point, basis.z) / radius)),
    longitude: Math.atan2(dot(point, basis.y), dot(point, basis.x)) * DEG,
  }
}

/**
 * Where the Moon's shadow axis pierces Earth. The axis runs from the Sun through the Moon, so the
 * near-side intersection is the point that sees the Sun centrally eclipsed.
 */
export const solarShadowPoint = (date) => {
  const sun       = geoEcliptic('Sun', date)
  const moon      = geoEcliptic('Moon', date)
  const direction = norm(sub(moon, sun))
  const radiusAu  = EARTH_RADIUS_KM / AU_KM

  const b            = dot(moon, direction)
  const discriminant = b * b - (dot(moon, moon) - radiusAu * radiusAu)
  if (discriminant < 0) return null

  const along = -b - Math.sqrt(discriminant)
  const point = { x: moon.x + direction.x * along, y: moon.y + direction.y * along, z: moon.z + direction.z * along }
  return { ...geographicOf(point, date), timeMs: new Date(date).getTime() }
}

/** Approximate central track of a solar eclipse, sampled around maximum. */
export const solarShadowTrack = (peakMs, { spanMinutes = 180, stepMinutes = 5 } = {}) => {
  const steps = Math.round(spanMinutes / stepMinutes)
  return Array.from({ length: steps + 1 }, (_, index) =>
    solarShadowPoint(new Date(peakMs + (index - steps / 2) * stepMinutes * MINUTE_MS))
  ).filter(Boolean)
}

/**
 * The Moon's position relative to Earth's shadow at its own distance, in kilometres: this is the
 * classic eclipse diagram, with the Moon's disc crossing the umbra and penumbra circles.
 */
export const lunarShadowFrame = (date) => {
  const sun        = geoEcliptic('Sun', date)
  const moon       = geoEcliptic('Moon', date)
  const axis       = norm(scale(sun, -1))
  const alongAu    = dot(moon, axis)
  const offset     = sub(moon, scale(axis, alongAu))
  const east       = norm({ x: -axis.z, y: 0, z: axis.x })
  const north      = {
    x: axis.y * east.z - axis.z * east.y,
    y: axis.z * east.x - axis.x * east.z,
    z: axis.x * east.y - axis.y * east.x,
  }
  const radii = shadowRadiiAt(EARTH_RADIUS_KM, lengthAu(sun) * AU_KM, alongAu * AU_KM)

  return {
    timeMs:      new Date(date).getTime(),
    umbraKm:     radii.umbraKm,
    penumbraKm:  radii.penumbraKm,
    moonRadiusKm: MOON_RADIUS_KM,
    xKm:         dot(offset, east) * AU_KM,
    yKm:         dot(offset, north) * AU_KM,
  }
}

export const lunarShadowTrack = (peakMs, { spanMinutes = 360, stepMinutes = 10 } = {}) => {
  const steps = Math.round(spanMinutes / stepMinutes)
  return Array.from({ length: steps + 1 }, (_, index) =>
    lunarShadowFrame(new Date(peakMs + (index - steps / 2) * stepMinutes * MINUTE_MS))
  )
}
