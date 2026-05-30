import { norm360, signIndex } from '../astro/zodiac.js'
import { localToJdUt, offsetMinutesForPerson } from '../astro/timezones.js'
import {
  SWISS_BODY,
  setSwissAyanamsha,
  swiss,
  swissFlags,
  swissHouses,
  swissJulday,
  swissPosition,
} from '../astro/swisseph.js'
import { VEDIC_BODY_LABELS } from './constants.js'
import { nakshatraOf, navamsaPlacements, vimshottariDashas } from './derivations.js'

const BODY_KEYS = [
  ['Sun', SWISS_BODY.Sun],
  ['Moon', SWISS_BODY.Moon],
  ['Mercury', SWISS_BODY.Mercury],
  ['Venus', SWISS_BODY.Venus],
  ['Mars', SWISS_BODY.Mars],
  ['Jupiter', SWISS_BODY.Jupiter],
  ['Saturn', SWISS_BODY.Saturn],
]

const MODERN_BODY_KEYS = [
  ['Uranus', SWISS_BODY.Uranus],
  ['Neptune', SWISS_BODY.Neptune],
  ['Pluto', SWISS_BODY.Pluto],
]

const HOUSES = {
  whole_sign: 'W',
  equal:      'A',
  bhava:      'P',
}

const jdToDate = (jd) => new Date((jd - 2440587.5) * 86_400_000)

const positionFor = (jd, name, body, flags) => {
  const position = swissPosition(body, jd, flags)
  return {
    name,
    displayName: VEDIC_BODY_LABELS[name] || name,
    longitude:   norm360(position[0]),
    latitude:    position[1],
    speed:       position[3],
    retrograde:  position[3] < 0,
    nakshatra:   nakshatraOf(position[0]),
    signIndex:   signIndex(position[0]),
  }
}

const siderealHouses = (jd, lat, lon, houseMode) => {
  const hsys      = HOUSES[houseMode] || HOUSES.whole_sign
  const houses    = swissHouses(jd, lat, lon, hsys, swiss.SEFLG_SIDEREAL)
  const ascendant = norm360(houses.ascmc[0])
  const mc        = norm360(houses.ascmc[1])
  const cusps     = Array.from(houses.cusps).slice(1, 13).map(norm360)

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

  const ayanamsha            = settings.ayanamsha || 'lahiri'
  const houseMode            = settings.houseMode || 'whole_sign'
  const nodeMode             = settings.nodeMode === 'true' ? 'true' : 'mean'
  const includeModernPlanets = !!settings.includeModernPlanets
  const jdUt                 = localToJdUt(person.isoLocal, offsetMinutesForPerson(person))

  setSwissAyanamsha(ayanamsha)
  const flags     = swissFlags({ sidereal: true })
  const positions = BODY_KEYS
    .concat(includeModernPlanets ? MODERN_BODY_KEYS : [])
    .map(([name, body]) => positionFor(jdUt, name, body, flags))

  const nodeBody = nodeMode === 'true' ? SWISS_BODY.NorthNodeTrue : SWISS_BODY.NorthNodeMean
  const rahu     = positionFor(jdUt, 'NorthNode', nodeBody, flags)
  const ketu     = {
    ...rahu,
    name:        'SouthNode',
    displayName: VEDIC_BODY_LABELS.SouthNode,
    longitude:   norm360(rahu.longitude + 180),
    latitude:    -rahu.latitude,
    nakshatra:   nakshatraOf(rahu.longitude + 180),
    signIndex:   signIndex(rahu.longitude + 180),
  }
  positions.push(rahu, ketu)

  const houses   = siderealHouses(jdUt, person.lat, person.lon, houseMode)
  const moon     = positions.find(position => position.name === 'Moon')
  const targetJd = swissJulday()
  const dashas   = moon ? vimshottariDashas(moon.longitude, jdUt, targetJd) : null

  return {
    id:       `vedic-${person.id || jdUt}`,
    modality: 'vedic',
    jdUt,
    lat:    person.lat,
    lon:    person.lon,
    zodiac: 'sidereal',
    ayanamsha,
    ayanamshaValue: swiss.get_ayanamsa_ut(jdUt),
    houseSystem:    houseMode,
    nodeMode,
    ascendant: houses.ascendant,
    mc:        houses.mc,
    cusps:     houses.cusps,
    positions,
    navamsa: navamsaPlacements(positions),
    dashas,
    calculatedAt: jdToDate(jdUt).toISOString(),
  }
}
