import { houseOf } from './houses.js'
import { signIndex } from './zodiac.js'
import { topAspects } from './analysis.js'

export const INTERPRETED_PLANETS = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
]

const comparisonModes = new Set(['transit', 'progression', 'synastry'])
const slowPlanets = new Set(['Uranus', 'Neptune', 'Pluto'])

const planetOrder = new Map(INTERPRETED_PLANETS.map((planet, index) => [planet, index]))

const orderedPositions = (chart) => [...(chart?.positions || [])]
  .filter(position => planetOrder.has(position.name))
  .sort((a, b) => planetOrder.get(a.name) - planetOrder.get(b.name))

export const natalPlacementInterpretations = (chart, { limit = 5 } = {}) =>
  orderedPositions(chart).slice(0, limit).map(position => {
    const house = houseOf(position.longitude, chart.cusps)
    const sign = signIndex(position.longitude)

    return {
      key: `placement-${position.name}`,
      kind: 'placement',
      planet: position.name,
      signIndex: sign,
      house,
      titleKey: 'interpretations.titles.placement',
      signTextKey: 'interpretations.sentences.planet_sign',
      houseTextKey: 'interpretations.sentences.planet_house',
      roleKey: `interpretations.planet_roles.${position.name}`,
      signToneKey: `interpretations.sign_tones.${sign}`,
      houseAreaKey: `interpretations.house_areas.${house}`,
    }
  })

export const natalAspectInterpretations = (aspects = [], { limit = 3 } = {}) =>
  topAspects(aspects, limit).map((aspect, index) => ({
    key: `aspect-${aspect.a}-${aspect.b}-${aspect.type}-${index}`,
    kind: 'aspect',
    aspect,
    titleKey: 'interpretations.titles.aspect',
    textKey: 'interpretations.sentences.natal_aspect',
    toneKey: `interpretations.aspect_tones.${aspect.type}`,
  }))

export const natalInterpretationSections = (chart, aspects = [], options = {}) => {
  const placements = natalPlacementInterpretations(chart, { limit: options.placementLimit })
  const aspectRows = natalAspectInterpretations(aspects, { limit: options.aspectLimit })

  return [
    {
      key: 'placements',
      titleKey: 'interpretations.sections.placements',
      items: placements,
    },
    {
      key: 'aspects',
      titleKey: 'interpretations.sections.aspects',
      items: aspectRows,
    },
  ].filter(section => section.items.length)
}

const comparisonAspectRow = (aspect, mode, index) => ({
  key: `${mode}-${aspect.a}-${aspect.b}-${aspect.type}-${index}`,
  kind: mode,
  aspect,
  primaryPlanet: mode === 'synastry' ? aspect.a : aspect.b,
  secondaryPlanet: mode === 'synastry' ? aspect.b : aspect.a,
  textKey: `interpretations.sentences.${mode}_aspect`,
  toneKey: `interpretations.variant_tones.${mode}.${aspect.type}`,
})

const isProgressedSlowSelfAspect = aspect =>
  aspect.a === aspect.b && slowPlanets.has(aspect.a)

const progressionBackgroundGroup = (aspects) => ({
  key: 'progression-slow-self-background',
  kind: 'group',
  groupKey: 'progression_slow_self',
  aspect: aspects[0],
  aspects,
  planets: [...new Set(aspects.map(aspect => aspect.a))],
  count: aspects.length,
  titleKey: 'comparison_insights.groups.progression_slow_self.title',
  textKey: 'comparison_insights.groups.progression_slow_self.detail',
  metaKey: 'comparison_insights.groups.progression_slow_self.meta',
})

export const comparisonAspectInterpretations = (aspects = [], mode, { limit = 3 } = {}) => {
  if (!comparisonModes.has(mode)) return []
  if (limit <= 0) return []

  if (mode === 'progression') {
    const rankedAspects = topAspects(aspects, aspects.length)
    const slowSelfAspects = rankedAspects.filter(isProgressedSlowSelfAspect)
    const hasBackgroundGroup = slowSelfAspects.length > 1

    if (hasBackgroundGroup) {
      const foregroundLimit = Math.max(limit - 1, 0)
      const foregroundRows = rankedAspects
        .filter(aspect => !isProgressedSlowSelfAspect(aspect))
        .slice(0, foregroundLimit)
        .map((aspect, index) => comparisonAspectRow(aspect, mode, index))

      return [...foregroundRows, progressionBackgroundGroup(slowSelfAspects)].slice(0, limit)
    }
  }

  return topAspects(aspects, limit).map((aspect, index) => comparisonAspectRow(aspect, mode, index))
}
