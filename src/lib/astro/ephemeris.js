import { Body, Ecliptic, EclipticGeoMoon, GeoVector, MakeTime } from 'astronomy-engine'
import { norm360, toSidereal } from './zodiac.js'
import { calcHouses } from './houses.js'

const BODIES = [
  { name: 'Sun',     body: Body.Sun },
  { name: 'Moon',    body: Body.Moon },
  { name: 'Mercury', body: Body.Mercury },
  { name: 'Venus',   body: Body.Venus },
  { name: 'Mars',    body: Body.Mars },
  { name: 'Jupiter', body: Body.Jupiter },
  { name: 'Saturn',  body: Body.Saturn },
  { name: 'Uranus',  body: Body.Uranus },
  { name: 'Neptune', body: Body.Neptune },
  { name: 'Pluto',   body: Body.Pluto }
]

const jdToDate = (jd) => new Date((jd - 2440587.5) * 86_400_000)

const eclipticLon = (body, jd) => {
  const t   = MakeTime(jdToDate(jd))
  const v   = GeoVector(body, t, true)
  const ecl = Ecliptic(v)
  return { lon: norm360(ecl.elon), lat: ecl.elat }
}

const speedDegPerDay = (body, jd) => {
  const dt = 1 / 1440
  const a  = eclipticLon(body, jd - dt).lon
  const b  = eclipticLon(body, jd + dt).lon
  let d    = b - a
  if (d > 180)  d -= 360
  if (d < -180) d += 360
  return d / (2 * dt)
}

const meanNode = (jd) => {
  const T = (jd - 2451545) / 36525
  return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T)
}

const moonEclipticVector = (jd) => {
  const { lon, lat, dist } = EclipticGeoMoon(jdToDate(jd))
  const lonRad = lon * Math.PI / 180
  const latRad = lat * Math.PI / 180
  const radius = dist * Math.cos(latRad)
  return [
    radius * Math.cos(lonRad),
    radius * Math.sin(lonRad),
    dist * Math.sin(latRad),
  ]
}

const trueNode = (jd) => {
  const dt = 1 / 1440
  const r = moonEclipticVector(jd)
  const prev = moonEclipticVector(jd - dt)
  const next = moonEclipticVector(jd + dt)
  const v = [
    (next[0] - prev[0]) / (2 * dt),
    (next[1] - prev[1]) / (2 * dt),
    (next[2] - prev[2]) / (2 * dt),
  ]
  const h = [
    r[1] * v[2] - r[2] * v[1],
    r[2] * v[0] - r[0] * v[2],
    r[0] * v[1] - r[1] * v[0],
  ]
  return norm360(Math.atan2(h[0], -h[1]) * 180 / Math.PI)
}

const meanLilith = (jd) => {
  const T = (jd - 2451545) / 36525
  return norm360(83.353 + 4069.013711 * T)
}

const sidereal = (lon, jd, mode) => mode === 'sidereal' ? toSidereal(lon, jd) : lon

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
  const positions = BODIES.map(({ name, body }) => {
    const e = eclipticLon(body, jdUt)
    const s = speedDegPerDay(body, jdUt)
    return {
      name,
      longitude:  sidereal(e.lon, jdUt, opts.zodiac),
      latitude:   e.lat,
      speed:      s,
      retrograde: s < 0
    }
  })
  const node = opts.nodeMode === 'true' ? trueNode(jdUt) : meanNode(jdUt)
  positions.push({ name: 'NorthNode', longitude: sidereal(node, jdUt, opts.zodiac),                latitude: 0, speed: -0.053, retrograde: true })
  positions.push({ name: 'SouthNode', longitude: sidereal(norm360(node + 180), jdUt, opts.zodiac), latitude: 0, speed: -0.053, retrograde: true })
  positions.push({ name: 'Lilith',    longitude: sidereal(meanLilith(jdUt), jdUt, opts.zodiac),    latitude: 0, speed:  0.111, retrograde: false })

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
  const sun  = eclipticLon(Body.Sun,  jdUt).lon
  const moon = eclipticLon(Body.Moon, jdUt).lon
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

export const sunLongitude = (jdUt) => eclipticLon(Body.Sun, jdUt).lon
