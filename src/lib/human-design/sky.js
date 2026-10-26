import { SWISS_BODY, swissPosition } from '../astro/swisseph.js'
import { norm180, norm360 } from '../astro/zodiac.js'
import { HD_PLANETS } from './constants.js'

export const DAY_MINUTES = 1440

const SKY_BODY = { ...SWISS_BODY, NorthNode: SWISS_BODY.NorthNodeTrue }

/** Gate, line, color, tone and base arcs in degrees (each level subdivides the previous one). */
export const LEVEL_ARCS = {
  gate:  360 / 64,
  line:  360 / 64 / 6,
  color: 360 / 64 / 36,
  tone:  360 / 64 / 216,
  base:  360 / 64 / 1080,
}

export const LEVELS = Object.keys(LEVEL_ARCS)

/** Geocentric tropical longitude (deg) and speed (deg/day) straight from Swiss Ephemeris, without houses or orbits. */
export const bodyState = (name, jdUt) => {
  const [longitude, , , speed] = swissPosition(SKY_BODY[name], jdUt)
  return { longitude: norm360(longitude), speed }
}

export const longitudeAt = (name, jdUt) => bodyState(name, jdUt).longitude

/** The 13 Human Design bodies (Earth and South Node derived) with longitude and speed at a moment. */
export const hdBodyStates = (jdUt) => {
  const sun   = bodyState('Sun', jdUt)
  const north = bodyState('NorthNode', jdUt)
  const opposite = ({ longitude, speed }) => ({ longitude: norm360(longitude + 180), speed })
  const derived  = { Earth: opposite(sun), SouthNode: opposite(north) }

  return Object.fromEntries(HD_PLANETS.map(name => [name, derived[name] || bodyState(name, jdUt)]))
}

/** Root of `fn` in [lo, hi] by bisection; `fn` must change sign over the interval. */
export const bisect = (fn, lo, hi, iterations = 40) => {
  const rising = fn(lo) < 0
  for (let i = 0; i < iterations; i += 1) {
    const mid = (lo + hi) / 2
    if ((fn(mid) < 0) === rising) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

const gapFn = (name, target) => jdUt => norm180(longitudeAt(name, jdUt) - target)

/** Every exact moment in [fromJd, toJd] where `name` crosses `target` longitude (retrograde re-crossings included). */
export const crossings = (name, target, fromJd, toJd, stepDays) => {
  const gap   = gapFn(name, target)
  const found = []
  let previous = gap(fromJd)

  for (let jd = fromJd + stepDays; jd < toJd + stepDays; jd += stepDays) {
    const current = gap(Math.min(jd, toJd))
    const crossed = (previous < 0) !== (current < 0) && Math.abs(previous) < 90 && Math.abs(current) < 90
    if (crossed) found.push(bisect(gap, jd - stepDays, Math.min(jd, toJd)))
    previous = current
  }

  return found
}
