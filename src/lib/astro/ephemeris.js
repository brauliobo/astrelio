import { Body, Ecliptic, GeoVector, MakeTime } from 'astronomy-engine'
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

const meanLilith = (jd) => {
  const T = (jd - 2451545) / 36525
  return norm360(83.353 + 4069.013711 * T)
}

const sidereal = (lon, jd, mode) => mode === 'sidereal' ? toSidereal(lon, jd) : lon

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
  const node = meanNode(jdUt)
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
    cusps:       houses.cusps.map(c => sidereal(c, jdUt, opts.zodiac)),
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
