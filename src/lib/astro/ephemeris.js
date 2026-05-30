import { norm360, toSidereal } from './zodiac.js'
import { calcHouses } from './houses.js'
import { motionStateForSpeed } from './motion.js'
import { SWISS_BODY, SWISS_FLAGS, swiss, swissHouses, swissPosition } from './swisseph.js'

// VegaPlus-style charts use Swiss Ephemeris longitudes; keep displayed bodies
// on this source so Pluto and minor points are not mixed across references.
const BODIES = [
  { name: 'Sun',     body: SWISS_BODY.Sun },
  { name: 'Moon',    body: SWISS_BODY.Moon },
  { name: 'Mercury', body: SWISS_BODY.Mercury },
  { name: 'Venus',   body: SWISS_BODY.Venus },
  { name: 'Mars',    body: SWISS_BODY.Mars },
  { name: 'Jupiter', body: SWISS_BODY.Jupiter },
  { name: 'Saturn',  body: SWISS_BODY.Saturn },
  { name: 'Uranus',  body: SWISS_BODY.Uranus },
  { name: 'Neptune', body: SWISS_BODY.Neptune },
  { name: 'Pluto',   body: SWISS_BODY.Pluto }
]

const sidereal = (lon, jd, mode) => mode === 'sidereal' ? toSidereal(lon, jd) : lon

const swissPoint = (name, body, jd, mode) => {
  const result = swissPosition(body, jd, SWISS_FLAGS)
  const speed = result[3]
  const motion = motionStateForSpeed(speed)
  return {
    name,
    longitude: sidereal(result[0], jd, mode),
    latitude: result[1],
    speed,
    motion,
    stationary: motion === 'stationary',
    retrograde: speed < 0,
  }
}

const siderealCusps = (houses, jd, mode, system) => {
  const ascendant = sidereal(houses.ascendant, jd, mode)
  if (mode === 'sidereal' && system === 'whole_sign') {
    const start = Math.floor(ascendant / 30) * 30
    return Array.from({ length: 12 }, (_, i) => norm360(start + i * 30))
  }
  return houses.cusps.map(c => sidereal(c, jd, mode))
}

const lotLongitude = (ascendant, first, second) =>
  norm360(ascendant + first.longitude - second.longitude)

const chartPointLongitudes = (jd, lat, lon, mode) => {
  const houses = swissHouses(jd, lat, lon, 'P')
  return {
    vertex: sidereal(houses.ascmc[swiss.SE_VERTEX], jd, mode),
    eastPoint: sidereal(houses.ascmc[swiss.SE_EQUASC], jd, mode),
  }
}

export const computeChart = (
  jdUt,
  lat,
  lon,
  opts = { zodiac: 'tropical', houseSystem: 'placidus' }
) => {
  const options = { zodiac: 'tropical', houseSystem: 'placidus', nodeMode: 'mean', ...opts }
  const positions = BODIES.map(({ name, body }) => swissPoint(name, body, jdUt, options.zodiac))
  const northNode = swissPoint(
    'NorthNode',
    options.nodeMode === 'true' ? SWISS_BODY.NorthNodeTrue : SWISS_BODY.NorthNodeMean,
    jdUt,
    options.zodiac
  )
  positions.push(northNode)
  positions.push({
    ...northNode,
    name: 'SouthNode',
    longitude: norm360(northNode.longitude + 180),
  })
  // VegaPlus uses Swiss Ephemeris mean lunar apogee for Lilith; the old local
  // formula tracked the perigee/opposite point, placing Lilith about 180° off.
  positions.push(swissPoint('Lilith', SWISS_BODY.Lilith, jdUt, options.zodiac))
  positions.push(swissPoint('Chiron', SWISS_BODY.Chiron, jdUt, options.zodiac))

  const houses = calcHouses(options.houseSystem, jdUt, lat, lon)
  const ascendant = sidereal(houses.ascendant, jdUt, options.zodiac)
  const sun = positions.find(position => position.name === 'Sun')
  const moon = positions.find(position => position.name === 'Moon')
  const chartPoints = chartPointLongitudes(jdUt, lat, lon, options.zodiac)

  return {
    jdUt,
    lat,
    lon,
    zodiac:      options.zodiac,
    houseSystem: options.houseSystem,
    nodeMode:    options.nodeMode === 'true' ? 'true' : 'mean',
    ascendant,
    mc:          sidereal(houses.mc,        jdUt, options.zodiac),
    cusps:       siderealCusps(houses, jdUt, options.zodiac, options.houseSystem),
    fortune:     sun && moon ? lotLongitude(ascendant, moon, sun) : null,
    spirit:      sun && moon ? lotLongitude(ascendant, sun, moon) : null,
    vertex:      chartPoints.vertex,
    eastPoint:   chartPoints.eastPoint,
    positions
  }
}

export const moonPhaseFraction = (jdUt) => {
  const sun = swissPoint('Sun', SWISS_BODY.Sun, jdUt, 'tropical').longitude
  const moon = swissPoint('Moon', SWISS_BODY.Moon, jdUt, 'tropical').longitude
  return norm360(moon - sun) / 360
}

export const moonPhaseLabel = (jdUt) => {
  const f = moonPhaseFraction(jdUt)
  if (f < 0.0625 || f >= 0.9375) return 'new'
  if (f < 0.1875) return 'waxing_c'
  if (f < 0.3125) return 'first_q'
  if (f < 0.4375) return 'waxing_g'
  if (f < 0.5625) return 'full'
  if (f < 0.6875) return 'waning_g'
  if (f < 0.8125) return 'last_q'
  return 'waning_c'
}

export const sunLongitude = (jdUt) =>
  swissPoint('Sun', SWISS_BODY.Sun, jdUt, 'tropical').longitude
