import SwissEph from 'swisseph-wasm'
import { norm360, toSidereal } from './zodiac.js'
import { calcHouses } from './houses.js'

const swiss = new SwissEph()
await swiss.initSwissEph()
const SWISS_FLAGS = swiss.SEFLG_SWIEPH | swiss.SEFLG_SPEED

// VegaPlus-style charts use Swiss Ephemeris longitudes; keep displayed bodies
// on this source so Pluto and minor points are not mixed across references.
const BODIES = [
  { name: 'Sun',     body: swiss.SE_SUN },
  { name: 'Moon',    body: swiss.SE_MOON },
  { name: 'Mercury', body: swiss.SE_MERCURY },
  { name: 'Venus',   body: swiss.SE_VENUS },
  { name: 'Mars',    body: swiss.SE_MARS },
  { name: 'Jupiter', body: swiss.SE_JUPITER },
  { name: 'Saturn',  body: swiss.SE_SATURN },
  { name: 'Uranus',  body: swiss.SE_URANUS },
  { name: 'Neptune', body: swiss.SE_NEPTUNE },
  { name: 'Pluto',   body: swiss.SE_PLUTO }
]

const sidereal = (lon, jd, mode) => mode === 'sidereal' ? toSidereal(lon, jd) : lon

const swissPoint = (name, body, jd, mode) => {
  const result = swiss.calc_ut(jd, body, SWISS_FLAGS)
  const speed = result[3]
  return {
    name,
    longitude: sidereal(result[0], jd, mode),
    latitude: result[1],
    speed,
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

export const computeChart = (
  jdUt,
  lat,
  lon,
  opts = { zodiac: 'tropical', houseSystem: 'placidus' }
) => {
  const positions = BODIES.map(({ name, body }) => swissPoint(name, body, jdUt, opts.zodiac))
  const northNode = swissPoint(
    'NorthNode',
    opts.nodeMode === 'true' ? swiss.SE_TRUE_NODE : swiss.SE_MEAN_NODE,
    jdUt,
    opts.zodiac
  )
  positions.push(northNode)
  positions.push({
    ...northNode,
    name: 'SouthNode',
    longitude: norm360(northNode.longitude + 180),
  })
  // VegaPlus uses Swiss Ephemeris mean lunar apogee for Lilith; the old local
  // formula tracked the perigee/opposite point, placing Lilith about 180° off.
  positions.push(swissPoint('Lilith', swiss.SE_MEAN_APOG, jdUt, opts.zodiac))
  positions.push(swissPoint('Chiron', swiss.SE_CHIRON, jdUt, opts.zodiac))

  const houses = calcHouses(opts.houseSystem, jdUt, lat, lon)
  return {
    jdUt,
    lat,
    lon,
    zodiac:      opts.zodiac,
    houseSystem: opts.houseSystem,
    ascendant:   sidereal(houses.ascendant, jdUt, opts.zodiac),
    mc:          sidereal(houses.mc,        jdUt, opts.zodiac),
    cusps:       siderealCusps(houses, jdUt, opts.zodiac, opts.houseSystem),
    positions
  }
}

export const moonPhaseFraction = (jdUt) => {
  const sun = swissPoint('Sun', swiss.SE_SUN, jdUt, 'tropical').longitude
  const moon = swissPoint('Moon', swiss.SE_MOON, jdUt, 'tropical').longitude
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
  swissPoint('Sun', swiss.SE_SUN, jdUt, 'tropical').longitude
