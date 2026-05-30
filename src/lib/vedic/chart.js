import { norm360, signIndex } from '../astro/zodiac.js'
import { localToJdUt, offsetMinutesForPerson } from '../astro/timezones.js'
import { VEDIC_BODY_LABELS } from './constants.js'
import { nakshatraOf, navamsaPlacements, vimshottariDashas } from './derivations.js'
import { getSwissEph, setAyanamsha, siderealFlags } from './swisseph.js'

const BODY_KEYS = [
  ['Sun', 'SE_SUN'],
  ['Moon', 'SE_MOON'],
  ['Mercury', 'SE_MERCURY'],
  ['Venus', 'SE_VENUS'],
  ['Mars', 'SE_MARS'],
  ['Jupiter', 'SE_JUPITER'],
  ['Saturn', 'SE_SATURN'],
]

const MODERN_BODY_KEYS = [
  ['Uranus', 'SE_URANUS'],
  ['Neptune', 'SE_NEPTUNE'],
  ['Pluto', 'SE_PLUTO'],
]

const HOUSES = {
  whole_sign: 'W',
  equal: 'A',
  bhava: 'P',
}

const jdToDate = (jd) => new Date((jd - 2440587.5) * 86_400_000)

const positionFor = (swe, jd, name, body, flags) => {
  const position = swe.calc_ut(jd, body, flags)
  return {
    name,
    displayName: VEDIC_BODY_LABELS[name] || name,
    longitude: norm360(position[0]),
    latitude: position[1],
    speed: position[3],
    retrograde: position[3] < 0,
    nakshatra: nakshatraOf(position[0]),
    signIndex: signIndex(position[0]),
  }
}

const siderealHouses = (swe, jd, lat, lon, houseMode) => {
  const hsys = HOUSES[houseMode] || HOUSES.whole_sign
  const houses = swe.houses_ex(jd, swe.SEFLG_SIDEREAL, lat, lon, hsys)
  const ascendant = norm360(houses.ascmc[0])
  const mc = norm360(houses.ascmc[1])
  const cusps = Array.from(houses.cusps).slice(1, 13).map(norm360)

  if (houseMode === 'whole_sign') {
    const start = Math.floor(ascendant / 30) * 30
    return {
      ascendant,
      mc,
      cusps: Array.from({ length: 12 }, (_, index) => norm360(start + index * 30)),
    }
  }

  return { ascendant, mc, cusps }
}

export const buildVedicChart = async (person, settings = {}) => {
  if (!person) return null

  const swe = await getSwissEph()
  const ayanamsha = settings.ayanamsha || 'lahiri'
  const houseMode = settings.houseMode || 'whole_sign'
  const nodeMode = settings.nodeMode === 'true' ? 'true' : 'mean'
  const includeModernPlanets = !!settings.includeModernPlanets
  const jdUt = localToJdUt(person.isoLocal, offsetMinutesForPerson(person))

  setAyanamsha(swe, ayanamsha)
  const flags = siderealFlags(swe)
  const positions = BODY_KEYS
    .concat(includeModernPlanets ? MODERN_BODY_KEYS : [])
    .map(([name, constant]) => positionFor(swe, jdUt, name, swe[constant], flags))

  const nodeBody = nodeMode === 'true' ? swe.SE_TRUE_NODE : swe.SE_MEAN_NODE
  const rahu = positionFor(swe, jdUt, 'NorthNode', nodeBody, flags)
  const ketu = {
    ...rahu,
    name: 'SouthNode',
    displayName: VEDIC_BODY_LABELS.SouthNode,
    longitude: norm360(rahu.longitude + 180),
    latitude: -rahu.latitude,
    nakshatra: nakshatraOf(rahu.longitude + 180),
    signIndex: signIndex(rahu.longitude + 180),
  }
  positions.push(rahu, ketu)

  const houses = siderealHouses(swe, jdUt, person.lat, person.lon, houseMode)
  const moon = positions.find(position => position.name === 'Moon')
  const targetJd = swe.julday(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth() + 1,
    new Date().getUTCDate(),
    new Date().getUTCHours() + new Date().getUTCMinutes() / 60
  )
  const dashas = moon ? vimshottariDashas(moon.longitude, jdUt, targetJd) : null

  return {
    id: `vedic-${person.id || jdUt}`,
    modality: 'vedic',
    jdUt,
    lat: person.lat,
    lon: person.lon,
    zodiac: 'sidereal',
    ayanamsha,
    ayanamshaValue: swe.get_ayanamsa_ut(jdUt),
    houseSystem: houseMode,
    nodeMode,
    ascendant: houses.ascendant,
    mc: houses.mc,
    cusps: houses.cusps,
    positions,
    navamsa: navamsaPlacements(positions),
    dashas,
    calculatedAt: jdToDate(jdUt).toISOString(),
  }
}
