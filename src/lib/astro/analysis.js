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
  Sun:       5,
  Moon:      5,
  Mercury:   3,
  Venus:     3,
  Mars:      3,
  Jupiter:   2,
  Saturn:    2,
  Uranus:    1,
  Neptune:   1,
  Pluto:     1,
  NorthNode: 1,
  SouthNode: 1,
  Lilith:    1,
  Chiron:    1,
}

export const TROPICAL_SIGN_RULERS = [
  'Mars',
  'Venus',
  'Mercury',
  'Moon',
  'Sun',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Saturn',
  'Jupiter',
]

const TRADITIONAL_PLANETS = new Set(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'])

const EXALTATION_SIGNS = {
  Sun:     0,
  Moon:    1,
  Mercury: 5,
  Venus:   11,
  Mars:    9,
  Jupiter: 3,
  Saturn:  6,
}

const TRANSIT_CYCLE_WEIGHTS = {
  Sun:       0.35,
  Moon:      0.18,
  Mercury:   0.38,
  Venus:     0.4,
  Mars:      0.55,
  Jupiter:   0.75,
  Saturn:    0.85,
  Uranus:    0.9,
  Neptune:   0.95,
  Pluto:     1,
  NorthNode: 0.48,
  SouthNode: 0.48,
  Chiron:    0.58,
  Lilith:    0.32,
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
    house:     houseOf(planet.longitude, chart.cusps),
  }
}

export const anglePlacements = (chart) => ({
  ascendant: { longitude: chart.ascendant, signIndex: signIndex(chart.ascendant) },
  mc:        { longitude: chart.mc, signIndex: signIndex(chart.mc) },
})

export const isTropicalChart = (chart) =>
  !chart?.zodiac || chart.zodiac === 'tropical'

export const tropicalRulerForSign = (sign) =>
  TROPICAL_SIGN_RULERS[sign]

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

const angularityForPlanet = (chart, longitude) => {
  const angle = nearestAngle(chart, longitude)
  return angle?.orb <= 8 ? { angle: angle.key, orb: angle.orb } : null
}

const dignityFor = (planet) => {
  if (!TRADITIONAL_PLANETS.has(planet.name)) return null

  const sign          = signIndex(planet.longitude)
  const domicileSigns = TROPICAL_SIGN_RULERS
    .map((ruler, index) => ruler === planet.name ? index : null)
    .filter(index => index !== null)
  const detrimentSigns = domicileSigns.map(index => (index + 6) % 12)
  const exaltationSign = EXALTATION_SIGNS[planet.name]
  const fallSign       = exaltationSign === undefined ? null : (exaltationSign + 6) % 12
  const dignities      = []

  if (domicileSigns.includes(sign)) dignities.push('domicile')
  if (sign === exaltationSign) dignities.push('exaltation')
  if (detrimentSigns.includes(sign)) dignities.push('detriment')
  if (sign === fallSign) dignities.push('fall')

  return {
    planet:    planet.name,
    signIndex: sign,
    house:     planet.house,
    dignities,
    tone: dignities.some(item => item === 'domicile' || item === 'exaltation')
      ? 'supported'
      : dignities.some(item => item === 'detriment' || item === 'fall')
        ? 'challenged'
        : 'neutral',
  }
}

const sectFor = (chart) => {
  const sun = placementFor(chart, 'Sun')
  if (!sun) return null

  const type = [7, 8, 9, 10, 11, 12].includes(sun.house) ? 'day' : 'night'
  return {
    type,
    sunHouse:        sun.house,
    light:           type === 'day' ? 'Sun' : 'Moon',
    benefic:         type === 'day' ? 'Jupiter' : 'Venus',
    maleficInSect:   type === 'day' ? 'Saturn' : 'Mars',
    maleficContrary: type === 'day' ? 'Mars' : 'Saturn',
  }
}

export const tropicalDiagnostics = (chart) => {
  if (!isTropicalChart(chart)) return null

  const ascSign        = signIndex(chart.ascendant)
  const chartRulerName = tropicalRulerForSign(ascSign)
  const chartRuler     = placementFor(chart, chartRulerName)

  const houseRulers = (chart.cusps || []).map((cusp, index) => {
    const cuspSign  = signIndex(cusp)
    const ruler     = tropicalRulerForSign(cuspSign)
    const placement = placementFor(chart, ruler)
    return {
      house:     index + 1,
      signIndex: cuspSign,
      ruler,
      rulerSignIndex: placement?.signIndex ?? null,
      rulerHouse:     placement?.house ?? null,
      angularity:     placement ? angularityForPlanet(chart, placement.longitude) : null,
    }
  })

  const dignityBasics = (chart.positions || [])
    .map(planet => dignityFor({
      ...planet,
      house: houseOf(planet.longitude, chart.cusps),
    }))
    .filter(row => row && row.dignities.length)
    .sort((a, b) => {
      const priority = { domicile: 0, exaltation: 1, detriment: 2, fall: 3 }
      const aRank    = Math.min(...a.dignities.map(dignity => priority[dignity]))
      const bRank    = Math.min(...b.dignities.map(dignity => priority[dignity]))
      return aRank - bRank || (PLANET_WEIGHTS[b.planet] || 0) - (PLANET_WEIGHTS[a.planet] || 0)
    })

  return {
    chartRuler: chartRuler && {
      planet:       chartRuler.name,
      ascSignIndex: ascSign,
      signIndex:    chartRuler.signIndex,
      house:        chartRuler.house,
      retrograde:   chartRuler.retrograde,
      angularity:   angularityForPlanet(chart, chartRuler.longitude),
    },
    houseRulers,
    sect: sectFor(chart),
    dignityBasics,
  }
}

const hemisphereEmphasis = (hemispheres) => {
  const byKey = Object.fromEntries(hemispheres.map(row => [row.key, row]))
  return {
    horizontal: (byKey.east?.value || 0) >= (byKey.west?.value || 0) ? byKey.east : byKey.west,
    vertical:   (byKey.south?.value || 0) >= (byKey.north?.value || 0) ? byKey.south : byKey.north,
  }
}

export const chartSignature = (chart) => {
  const elements    = countKeys(['fire', 'earth', 'air', 'water'])
  const modalities  = countKeys(['cardinal', 'fixed', 'mutable'])
  const polarities  = countKeys(['yang', 'yin'])
  const hemispheres = countKeys(['east', 'west', 'north', 'south'])
  const houseModes  = countKeys(['angular', 'succedent', 'cadent'])
  const houses      = Array.from({ length: 12 }, (_, index) => ({ house: index + 1, value: 0 }))

  for (const planet of chart.positions || []) {
    const weight = PLANET_WEIGHTS[planet.name] || 1
    const traits = SIGN_TRAITS[signIndex(planet.longitude)]
    const house  = houseOf(planet.longitude, chart.cusps)

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
      name:  item.planet.name,
      angle: item.angle.key,
      orb:   item.angle.orb,
    }))

  return {
    elements:           shareRows(elements),
    modalities:         shareRows(modalities),
    polarities:         shareRows(polarities),
    houseModes:         shareRows(houseModes),
    hemispheres:        shareRows(hemispheres),
    hemisphereEmphasis: hemisphereEmphasis(shareRows(hemispheres)),
    houses:             houses.sort((a, b) => b.value - a.value || a.house - b.house),
    angularPlanets,
    retrogrades: (chart.positions || [])
      .filter(planet => planet.retrograde)
      .map(planet => planet.name),
    tropical: tropicalDiagnostics(chart),
  }
}

export const topAspects = (aspects, limit = 5) =>
  [...aspects]
    .sort((a, b) => (b.strength || 0) - (a.strength || 0) || a.delta - b.delta)
    .slice(0, limit)

const houseActivationScore = (house) => {
  if ([1, 4, 7, 10].includes(house)) return 1
  if ([2, 5, 8, 11].includes(house)) return 0.65
  return 0.45
}

const natalImportanceScore = (chart, planetName) => {
  const planet = planetByName(chart, planetName)
  if (!planet) return (PLANET_WEIGHTS[planetName] || 1) / 5

  const base            = (PLANET_WEIGHTS[planetName] || 1) / 5
  const chartRulerBoost = tropicalDiagnostics(chart)?.chartRuler?.planet === planetName ? 0.28 : 0
  const angle           = angularityForPlanet(chart, planet.longitude)
  const angularBoost    = angle ? Math.max(0.08, (8 - angle.orb) / 8 * 0.25) : 0
  const luminaryBoost   = planetName === 'Sun' || planetName === 'Moon' ? 0.12 : 0

  return Math.min(1, base + chartRulerBoost + angularBoost + luminaryBoost)
}

const transitSpeedScore = (planet) => {
  if (!planet) return 0.35

  const cycleWeight  = TRANSIT_CYCLE_WEIGHTS[planet.name] ?? 0.35
  const speed        = Math.abs(planet.speed || 0)
  const stationBoost = speed < 0.04 ? 0.16 : speed < 0.12 ? 0.08 : 0
  return Math.min(1, cycleWeight + stationBoost)
}

export const transitAspectRank = (aspect, natalChart, transitChart) => {
  const natalPlanet   = planetByName(natalChart, aspect.a)
  const transitPlanet = planetByName(transitChart, aspect.b)
  const exactness     = Math.max(0, 1 - (aspect.delta || 0) / (aspect.orb || 8))
  const transitHouse  = transitPlanet && natalChart?.cusps
    ? houseOf(transitPlanet.longitude, natalChart.cusps)
    : null
  const natalHouse = natalPlanet && natalChart?.cusps
    ? houseOf(natalPlanet.longitude, natalChart.cusps)
    : null
  const houseScore     = transitHouse ? houseActivationScore(transitHouse) : 0.5
  const natalScore     = natalImportanceScore(natalChart, aspect.a)
  const speedScore     = transitSpeedScore(transitPlanet)
  const applyingScore  = aspect.applying ? 1 : 0
  const sameHouseBoost = transitHouse && natalHouse && transitHouse === natalHouse ? 0.06 : 0
  const score =
    exactness * 0.38 +
    applyingScore * 0.14 +
    speedScore * 0.18 +
    houseScore * 0.14 +
    natalScore * 0.16 +
    sameHouseBoost

  return {
    score,
    exactness,
    applying:        !!aspect.applying,
    speed:           speedScore,
    houseActivation: houseScore,
    natalImportance: natalScore,
    transitHouse,
    natalHouse,
  }
}

export const rankTransitAspects = (aspects = [], natalChart, transitChart, limit = aspects.length) =>
  [...aspects]
    .map(aspect => ({
      ...aspect,
      rank: transitAspectRank(aspect, natalChart, transitChart),
    }))
    .sort((a, b) =>
      b.rank.score - a.rank.score ||
      b.rank.exactness - a.rank.exactness ||
      (Number(b.applying) - Number(a.applying)) ||
      a.delta - b.delta
    )
    .slice(0, limit)
