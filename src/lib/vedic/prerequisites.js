import { norm360, signIndex } from '../astro/zodiac.js'
import {
  VEDIC_CLASSICAL_GRAHAS,
  VEDIC_EXALTATION_SIGNS,
  VEDIC_GRAHA_ASPECT_HOUSES,
  VEDIC_GRAHAS,
  VEDIC_OWN_SIGNS,
  VEDIC_SIGN_LORDS,
} from './constants.js'

const supportedBody = body => VEDIC_GRAHAS.includes(body)

const houseOf = (longitude, cusps) => {
  const normalized = norm360(longitude)
  for (let index = 0; index < cusps.length; index += 1) {
    const start = norm360(cusps[index])
    const end   = norm360(cusps[(index + 1) % cusps.length])
    const span  = norm360(end - start) || 360
    if (norm360(normalized - start) < span) return index + 1
  }
  return null
}

export const dignityOf = (body, sign) => {
  if (!VEDIC_CLASSICAL_GRAHAS.includes(body)) return 'unassessed'
  if (VEDIC_EXALTATION_SIGNS[body] === sign) return 'exalted'
  if ((VEDIC_EXALTATION_SIGNS[body] + 6) % 12 === sign) return 'debilitated'
  if (VEDIC_OWN_SIGNS[body].includes(sign)) return 'own_sign'
  return 'neutral'
}

export const deriveHouses = (chart) => {
  const occupants = Array.from({ length: 12 }, () => [])
  const placements = chart.positions
    .filter(position => supportedBody(position.name))
    .map(position => {
      const house = houseOf(position.longitude, chart.cusps)
      if (house) occupants[house - 1].push(position.name)
      return {
        body:      position.name,
        house,
        signIndex: position.signIndex ?? signIndex(position.longitude),
      }
    })

  const houses = chart.cusps.map((cusp, index) => {
    const sign = signIndex(cusp)
    return {
      number:    index + 1,
      cusp:      norm360(cusp),
      signIndex: sign,
      lord:      VEDIC_SIGN_LORDS[sign],
      occupants: occupants[index],
    }
  })

  const lordships = VEDIC_CLASSICAL_GRAHAS.map(body => ({
    body,
    houses: houses.filter(house => house.lord === body).map(house => house.number),
  }))

  return { houses, placements, lordships }
}

export const deriveConjunctions = (positions = []) => {
  const grahas = positions.filter(position => supportedBody(position.name))
  const conjunctions = []
  for (let left = 0; left < grahas.length; left += 1) {
    for (let right = left + 1; right < grahas.length; right += 1) {
      const a = grahas[left]
      const b = grahas[right]
      const aSign = a.signIndex ?? signIndex(a.longitude)
      const bSign = b.signIndex ?? signIndex(b.longitude)
      if (aSign === bSign) conjunctions.push({
        id:        `conjunction:${a.name}:${b.name}`,
        bodies:    [a.name, b.name],
        signIndex: aSign,
      })
    }
  }
  return conjunctions
}

export const deriveGrahaAspects = (positions = []) => {
  const grahas = positions.filter(position => supportedBody(position.name))
  return grahas.flatMap(source => {
    const sourceSign = source.signIndex ?? signIndex(source.longitude)
    const houses     = VEDIC_GRAHA_ASPECT_HOUSES[source.name] || []
    return grahas
      .filter(target => target.name !== source.name)
      .map(target => ({ target, targetSign: target.signIndex ?? signIndex(target.longitude) }))
      .filter(({ targetSign }) => houses.includes(((targetSign - sourceSign + 12) % 12) + 1))
      .map(({ target, targetSign }) => ({
        id:          `aspect:${source.name}:${target.name}`,
        source:      source.name,
        target:      target.name,
        sourceSign,
        targetSign,
        aspectHouse: ((targetSign - sourceSign + 12) % 12) + 1,
      }))
  })
}

const derivePatterns = placements => {
  const byBody = new Map(placements.map(placement => [placement.body, placement]))
  const patterns = placements
    .filter(placement => placement.d1.signIndex === placement.d9.signIndex)
    .map(placement => ({
      id:          `pattern:vargottama:${placement.body}`,
      pattern:     'vargottama',
      participants: [placement.body],
      evidenceIds: [`placement:${placement.body}`],
    }))

  for (let left = 0; left < VEDIC_CLASSICAL_GRAHAS.length; left += 1) {
    const a = byBody.get(VEDIC_CLASSICAL_GRAHAS[left])
    if (!a) continue
    const aLord = VEDIC_SIGN_LORDS[a.d1.signIndex]
    for (let right = left + 1; right < VEDIC_CLASSICAL_GRAHAS.length; right += 1) {
      const b = byBody.get(VEDIC_CLASSICAL_GRAHAS[right])
      if (!b) continue
      if (aLord === b.body && VEDIC_SIGN_LORDS[b.d1.signIndex] === a.body) patterns.push({
        id:           `pattern:mutual_reception:${a.body}:${b.body}`,
        pattern:      'mutual_reception',
        participants: [a.body, b.body],
        evidenceIds:  [`placement:${a.body}`, `placement:${b.body}`],
      })
    }
  }
  return patterns
}

export const buildVedicPrerequisites = (chart) => {
  if (!chart) return null
  const houseData = deriveHouses(chart)
  const navamsaByBody = new Map(chart.navamsa.map(position => [position.name, position]))
  const placements = houseData.placements.map(placement => {
    const position = chart.positions.find(item => item.name === placement.body)
    const navamsa   = navamsaByBody.get(placement.body)
    return {
      body: placement.body,
      d1: {
        longitude: position.longitude,
        signIndex: placement.signIndex,
        house:     placement.house,
      },
      d9: navamsa ? {
        longitude: navamsa.longitude,
        signIndex: navamsa.navamsaSignIndex,
      } : null,
      dignity:   dignityOf(placement.body, placement.signIndex),
      nakshatra: position.nakshatra,
      retrograde: position.retrograde,
    }
  })
  const conjunctions = deriveConjunctions(chart.positions)
  const aspects      = deriveGrahaAspects(chart.positions)
  const rahu         = placements.find(placement => placement.body === 'NorthNode')
  const ketu         = placements.find(placement => placement.body === 'SouthNode')

  return {
    schemaVersion: 'vedic-prerequisites.v1',
    chartId:       chart.id,
    ascendant: {
      longitude: chart.ascendant,
      signIndex: signIndex(chart.ascendant),
      lord:      VEDIC_SIGN_LORDS[signIndex(chart.ascendant)],
    },
    houses:     houseData.houses,
    lordships:  houseData.lordships,
    placements,
    conjunctions,
    aspects,
    nodeAxis: rahu && ketu ? {
      rahu: { signIndex: rahu.d1.signIndex, house: rahu.d1.house },
      ketu: { signIndex: ketu.d1.signIndex, house: ketu.d1.house },
    } : null,
    vimshottari: chart.dashas?.active ? {
      moonNakshatra: chart.dashas.moonNakshatra,
      active:        chart.dashas.active,
    } : null,
    patterns: derivePatterns(placements),
    coverage: {
      completeYogaCatalog: false,
      conjunctionModel:    'same_sign',
      aspectModel:         'parashari_whole_sign_seven_grahas',
      dignityModel:        'own_exaltation_debilitation',
      supportedPatterns: [
        { key: 'vargottama', status: 'supported' },
        { key: 'mutual_reception', status: 'supported' },
      ],
      unsupported: ['yoga_catalog', 'combustion', 'planetary_war', 'shadbala', 'ashtakavarga'],
    },
  }
}
