import { norm360, toSidereal } from './zodiac.js'
import { calcHouses } from './houses.js'
import { SWISS_BODY, SWISS_FLAGS, swissPosition } from './swisseph.js'

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
    opts.nodeMode === 'true' ? SWISS_BODY.NorthNodeTrue : SWISS_BODY.NorthNodeMean,
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
  positions.push(swissPoint('Lilith', SWISS_BODY.Lilith, jdUt, opts.zodiac))
  positions.push(swissPoint('Chiron', SWISS_BODY.Chiron, jdUt, opts.zodiac))

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
