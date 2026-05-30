import { houseOf } from './houses.js'
import { norm180, norm360, signIndex } from './zodiac.js'

export const SIGN_TRAITS = [
  { element: 'fire',  modality: 'cardinal', polarity: 'yang' },
  { element: 'earth', modality: 'fixed',    polarity: 'yin' },
  { element: 'air',   modality: 'mutable',  polarity: 'yang' },
  { element: 'water', modality: 'cardinal', polarity: 'yin' },
  { element: 'fire',  modality: 'fixed',    polarity: 'yang' },
  { element: 'earth', modality: 'mutable',  polarity: 'yin' },
  { element: 'air',   modality: 'cardinal', polarity: 'yang' },
  { element: 'water', modality: 'fixed',    polarity: 'yin' },
  { element: 'fire',  modality: 'mutable',  polarity: 'yang' },
  { element: 'earth', modality: 'cardinal', polarity: 'yin' },
  { element: 'air',   modality: 'fixed',    polarity: 'yang' },
  { element: 'water', modality: 'mutable',  polarity: 'yin' },
]

export const PLANET_WEIGHTS = {
  Sun: 5,
  Moon: 5,
  Mercury: 3,
  Venus: 3,
  Mars: 3,
  Jupiter: 2,
  Saturn: 2,
  Uranus: 1,
  Neptune: 1,
  Pluto: 1,
  NorthNode: 1,
  SouthNode: 1,
  Lilith: 1,
  Chiron: 1,
}

const countKeys = (keys) => Object.fromEntries(keys.map(key => [key, 0]))

const shareRows = (scores) => {
  const total = Object.values(scores).reduce((sum, value) => sum + value, 0) || 1
  return Object.entries(scores)
    .map(([key, value]) => ({ key, value, share: value / total }))
    .sort((a, b) => b.value - a.value || a.key.localeCompare(b.key))
}

export const planetByName = (chart, name) =>
  chart?.positions?.find(planet => planet.name === name) || null

export const placementFor = (chart, name) => {
  const planet = planetByName(chart, name)
  if (!planet) return null
  return {
    ...planet,
    signIndex: signIndex(planet.longitude),
    house: houseOf(planet.longitude, chart.cusps),
  }
}

export const anglePlacements = (chart) => ({
  ascendant: { longitude: chart.ascendant, signIndex: signIndex(chart.ascendant) },
  mc: { longitude: chart.mc, signIndex: signIndex(chart.mc) },
})

const nearestAngle = (chart, longitude) => {
  const angles = [
    { key: 'asc', longitude: chart.ascendant },
    { key: 'mc', longitude: chart.mc },
    { key: 'desc', longitude: norm360(chart.ascendant + 180) },
    { key: 'ic', longitude: norm360(chart.mc + 180) },
  ]
  return angles
    .map(angle => ({ ...angle, orb: Math.abs(norm180(longitude - angle.longitude)) }))
    .sort((a, b) => a.orb - b.orb)[0]
}

export const chartSignature = (chart) => {
  const elements = countKeys(['fire', 'earth', 'air', 'water'])
  const modalities = countKeys(['cardinal', 'fixed', 'mutable'])
  const polarities = countKeys(['yang', 'yin'])
  const hemispheres = countKeys(['east', 'west', 'north', 'south'])
  const houseModes = countKeys(['angular', 'succedent', 'cadent'])
  const houses = Array.from({ length: 12 }, (_, index) => ({ house: index + 1, value: 0 }))

  for (const planet of chart.positions || []) {
    const weight = PLANET_WEIGHTS[planet.name] || 1
    const traits = SIGN_TRAITS[signIndex(planet.longitude)]
    const house = houseOf(planet.longitude, chart.cusps)

    elements[traits.element] += weight
    modalities[traits.modality] += weight
    polarities[traits.polarity] += weight
    houses[house - 1].value += weight

    if ([1, 4, 7, 10].includes(house)) houseModes.angular += weight
    else if ([2, 5, 8, 11].includes(house)) houseModes.succedent += weight
    else houseModes.cadent += weight

    if ([10, 11, 12, 1, 2, 3].includes(house)) hemispheres.east += weight
    else hemispheres.west += weight

    if ([7, 8, 9, 10, 11, 12].includes(house)) hemispheres.south += weight
    else hemispheres.north += weight
  }

  const angularPlanets = (chart.positions || [])
    .map(planet => ({ planet, angle: nearestAngle(chart, planet.longitude) }))
    .filter(item => item.angle.orb <= 8)
    .sort((a, b) => a.angle.orb - b.angle.orb)
    .map(item => ({
      name: item.planet.name,
      angle: item.angle.key,
      orb: item.angle.orb,
    }))

  return {
    elements: shareRows(elements),
    modalities: shareRows(modalities),
    polarities: shareRows(polarities),
    houseModes: shareRows(houseModes),
    hemispheres: shareRows(hemispheres),
    houses: houses.sort((a, b) => b.value - a.value || a.house - b.house),
    angularPlanets,
    retrogrades: (chart.positions || [])
      .filter(planet => planet.retrograde)
      .map(planet => planet.name),
  }
}

export const topAspects = (aspects, limit = 5) =>
  [...aspects]
    .sort((a, b) => (b.strength || 0) - (a.strength || 0) || a.delta - b.delta)
    .slice(0, limit)
