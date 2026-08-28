export const AU_KM = 149597870.7

export const SUN_RADIUS_KM   = 695700
export const EARTH_RADIUS_KM = 6371.0
export const MOON_RADIUS_KM  = 1737.4

export const publicAssetUrl = path => `${import.meta.env.BASE_URL}${String(path).replace(/^\//, '')}`

export const planetMapUrl = (body, size = '2k') => publicAssetUrl(`planets/maps/${body.toLowerCase()}-${size}.jpg`)

// radiusKm: mean equatorial radius. periodDays: sidereal orbital period, used to sample one full orbit.
// tilt/day rotation come from RotationAxis at render time, not from these tables.
export const BODIES = [
  { name: 'Sun',     radiusKm: SUN_RADIUS_KM, periodDays: 0,        color: '#ffd166', kind: 'star' },
  { name: 'Mercury', radiusKm: 2439.7,        periodDays: 87.969,   color: '#b8b1a8', kind: 'planet' },
  { name: 'Venus',   radiusKm: 6051.8,        periodDays: 224.701,  color: '#e8cda2', kind: 'planet' },
  { name: 'Earth',   radiusKm: EARTH_RADIUS_KM, periodDays: 365.256, color: '#6bb1e8', kind: 'planet' },
  { name: 'Moon',    radiusKm: MOON_RADIUS_KM, periodDays: 27.3217, color: '#dbeafe', kind: 'moon', parent: 'Earth' },
  { name: 'Mars',    radiusKm: 3389.5,        periodDays: 686.980,  color: '#e2725b', kind: 'planet' },
  { name: 'Jupiter', radiusKm: 69911,         periodDays: 4332.589, color: '#e0b98c', kind: 'planet' },
  { name: 'Saturn',  radiusKm: 58232,         periodDays: 10759.22, color: '#e6ce9c', kind: 'planet', rings: { innerKm: 74500, outerKm: 140220 } },
  { name: 'Uranus',  radiusKm: 25362,         periodDays: 30685.4,  color: '#a8dce8', kind: 'planet' },
  { name: 'Neptune', radiusKm: 24622,         periodDays: 60189,    color: '#5b7ce6', kind: 'planet' },
  { name: 'Pluto',   radiusKm: 1188.3,        periodDays: 90560,    color: '#c9b8a8', kind: 'dwarf' },
]

export const BODY_BY_NAME = new Map(BODIES.map(body => [body.name, body]))

export const INNER_PLANETS   = ['Mercury', 'Venus']
export const OUTER_PLANETS   = ['Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
export const RETROGRADE_BODIES = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']

export const VIEW_MODES = ['orrery', 'moon', 'eclipses', 'retrograde']
