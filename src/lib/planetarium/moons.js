import { JupiterMoons } from 'astronomy-engine'
import { AU_KM } from './constants.js'
import { astroTime, eclipticVectorOf, orientationBasis } from './ephemeris3d.js'

const DAY_MS = 86400000

/**
 * Moon catalogue.
 *
 * The Galilean moons come from the ephemeris (`JupiterMoons`) and are exact. Every other moon is a
 * circular model in its planet's equatorial plane, built from published mean elements: the size,
 * distance, period and direction of travel are real, the phase along the orbit is only approximate.
 * `approximate: true` marks those so the UI can say so.
 *
 * radiusKm: mean radius. semiMajorKm: mean orbital radius. periodDays: sidereal period.
 * inclinationDeg: orbital inclination to the parent's equator, so anything past 90 degrees orbits
 * backwards, as Triton does. epochAngleDeg: mean longitude at J2000, measured in the orbit plane
 * from the parent equator's ascending node.
 */
export const MOONS = [
  { name: 'Phobos',    parent: 'Mars',    radiusKm: 11.27,  semiMajorKm: 9376,    periodDays: 0.31891,  inclinationDeg: 1.08,  epochAngleDeg: 105, color: '#9a8b7d', map: 'phobos' },
  { name: 'Deimos',    parent: 'Mars',    radiusKm: 6.2,    semiMajorKm: 23463,   periodDays: 1.26244,  inclinationDeg: 1.79,  epochAngleDeg: 260, color: '#a89b8c' },

  { name: 'Io',        parent: 'Jupiter', radiusKm: 1821.6, semiMajorKm: 421800,  periodDays: 1.769138, inclinationDeg: 0.05,  epochAngleDeg: 0,   color: '#ffffff', map: 'io',       colorMap: true, ephemeris: 'io' },
  { name: 'Europa',    parent: 'Jupiter', radiusKm: 1560.8, semiMajorKm: 671100,  periodDays: 3.551181, inclinationDeg: 0.47,  epochAngleDeg: 0,   color: '#d9c9ac', map: 'europa',   ephemeris: 'europa' },
  { name: 'Ganymede',  parent: 'Jupiter', radiusKm: 2634.1, semiMajorKm: 1070400, periodDays: 7.154553, inclinationDeg: 0.20,  epochAngleDeg: 0,   color: '#b9a893', map: 'ganymede', ephemeris: 'ganymede' },
  { name: 'Callisto',  parent: 'Jupiter', radiusKm: 2410.3, semiMajorKm: 1882700, periodDays: 16.68902, inclinationDeg: 0.19,  epochAngleDeg: 0,   color: '#9a8674', map: 'callisto', ephemeris: 'callisto' },

  { name: 'Mimas',     parent: 'Saturn',  radiusKm: 198.2,  semiMajorKm: 185540,  periodDays: 0.942422, inclinationDeg: 1.57,  epochAngleDeg: 20,  color: '#cfc9c2' },
  { name: 'Enceladus', parent: 'Saturn',  radiusKm: 252.1,  semiMajorKm: 238040,  periodDays: 1.370218, inclinationDeg: 0.009, epochAngleDeg: 150, color: '#f2f4f6', map: 'enceladus' },
  { name: 'Tethys',    parent: 'Saturn',  radiusKm: 531.1,  semiMajorKm: 294670,  periodDays: 1.887802, inclinationDeg: 1.09,  epochAngleDeg: 300, color: '#dcdcd8', map: 'tethys' },
  { name: 'Dione',     parent: 'Saturn',  radiusKm: 561.4,  semiMajorKm: 377420,  periodDays: 2.736915, inclinationDeg: 0.02,  epochAngleDeg: 80,  color: '#d5d2cb', map: 'dione' },
  { name: 'Rhea',      parent: 'Saturn',  radiusKm: 763.8,  semiMajorKm: 527070,  periodDays: 4.518212, inclinationDeg: 0.35,  epochAngleDeg: 210, color: '#cec9c0', map: 'rhea' },
  { name: 'Titan',     parent: 'Saturn',  radiusKm: 2574.7, semiMajorKm: 1221870, periodDays: 15.945,   inclinationDeg: 0.33,  epochAngleDeg: 130, color: '#e0a44e', map: 'titan' },
  { name: 'Iapetus',   parent: 'Saturn',  radiusKm: 734.5,  semiMajorKm: 3560840, periodDays: 79.3215,  inclinationDeg: 15.47, epochAngleDeg: 40,  color: '#b9ac95', map: 'iapetus' },

  { name: 'Miranda',   parent: 'Uranus',  radiusKm: 235.8,  semiMajorKm: 129390,  periodDays: 1.413479, inclinationDeg: 4.34,  epochAngleDeg: 60,  color: '#b8bcc0' },
  { name: 'Ariel',     parent: 'Uranus',  radiusKm: 578.9,  semiMajorKm: 191020,  periodDays: 2.520379, inclinationDeg: 0.04,  epochAngleDeg: 170, color: '#c3c6c8' },
  { name: 'Umbriel',   parent: 'Uranus',  radiusKm: 584.7,  semiMajorKm: 266300,  periodDays: 4.144177, inclinationDeg: 0.13,  epochAngleDeg: 280, color: '#8d9094' },
  { name: 'Titania',   parent: 'Uranus',  radiusKm: 788.9,  semiMajorKm: 435910,  periodDays: 8.705872, inclinationDeg: 0.08,  epochAngleDeg: 25,  color: '#b0a89e' },
  { name: 'Oberon',    parent: 'Uranus',  radiusKm: 761.4,  semiMajorKm: 583520,  periodDays: 13.4632,  inclinationDeg: 0.07,  epochAngleDeg: 200, color: '#a49a8e' },

  { name: 'Triton',    parent: 'Neptune', radiusKm: 1353.4, semiMajorKm: 354759,  periodDays: 5.876854, inclinationDeg: 156.9, epochAngleDeg: 90, color: '#d6cfc4', map: 'triton', colorMap: true },

  { name: 'Charon',    parent: 'Pluto',   radiusKm: 606,    semiMajorKm: 19591,   periodDays: 6.3872,   inclinationDeg: 0.08,  epochAngleDeg: 310, color: '#a49b91', map: 'charon' },
]

export const MOON_BY_NAME = new Map(MOONS.map(moon => [moon.name, moon]))

export const moonsOf = parent => MOONS.filter(moon => moon.parent === parent)

export const isMoon = name => MOON_BY_NAME.has(name)

export const isApproximate = name => Boolean(MOON_BY_NAME.get(name) && !MOON_BY_NAME.get(name).ephemeris)

const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x })

const combine = (a, ka, b, kb) => ({ x: a.x * ka + b.x * kb, y: a.y * ka + b.y * kb, z: a.z * ka + b.z * kb })

const normalize = (v) => {
  const length = Math.hypot(v.x, v.y, v.z)
  return { x: v.x / length, y: v.y / length, z: v.z / length }
}

const ECLIPTIC_POLE = { x: 0, y: 1, z: 0 }

/**
 * Orbit plane basis, built only from the parent's pole so it stays inertial: taking the node from
 * the parent's prime meridian instead would drag every moon along with the planet's rotation.
 * The normal is the pole rotated about the node line by the inclination, so its component along the
 * pole is cos(i) — past 90 degrees the moon travels backwards, which is what makes Triton retrograde.
 */
const orbitBasis = (moon, date) => {
  const pole   = orientationBasis(moon.parent, date).z
  const tilt   = (moon.inclinationDeg * Math.PI) / 180
  const node   = normalize(cross(ECLIPTIC_POLE, pole))
  const normal = combine(pole, Math.cos(tilt), cross(node, pole), Math.sin(tilt))
  return { node, normal, inPlane: cross(normal, node) }
}

const meanAngle = (moon, date) => {
  const days = astroTime(date).tt
  return ((moon.epochAngleDeg * Math.PI) / 180) + (2 * Math.PI * days) / moon.periodDays
}

/** Position relative to the parent planet, in au, in scene coordinates. */
export const moonPosition = (moon, date) => {
  if (moon.ephemeris) {
    const state = JupiterMoons(astroTime(date))[moon.ephemeris]
    return eclipticVectorOf(state)
  }

  const basis  = orbitBasis(moon, date)
  const angle  = meanAngle(moon, date)
  const radius = moon.semiMajorKm / AU_KM
  return combine(basis.node, Math.cos(angle) * radius, basis.inPlane, Math.sin(angle) * radius)
}

/**
 * Every major moon here is tidally locked, so its prime meridian points at its planet and its north
 * pole sits along the orbit normal. That is what keeps Io's sub-Jupiter hemisphere facing Jupiter.
 */
export const moonOrientation = (moon, date) => {
  const position = moonPosition(moon, date)
  const toParent = normalize({ x: -position.x, y: -position.y, z: -position.z })
  const north    = orbitBasis(moon, date).normal
  const east     = normalize(cross(north, toParent))
  return { x: toParent, y: east, z: cross(toParent, east) }
}

/** One full revolution, for drawing the orbit ring. */
export const moonOrbitPath = (moon, date, samples = 96) => {
  const startMs = astroTime(date).date.getTime()
  return Array.from({ length: samples }, (_, index) =>
    moonPosition(moon, new Date(startMs + (index / samples) * moon.periodDays * DAY_MS))
  )
}
