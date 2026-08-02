import { PLANET_WEIGHTS, SIGN_TRAITS, TROPICAL_SIGN_RULERS, isTropicalChart } from '../analysis.js'
import { houseOf } from '../houses.js'
import { norm360, signIndex } from '../zodiac.js'

export const TROPICAL_READING_SCHEMA_VERSION = 1

export const TROPICAL_READING_CHAPTERS = [
  'core_identity',
  'emotional_world',
  'mind_communication',
  'relationships_desire',
  'growth_direction',
  'depth_transformation',
  'integration',
]

const CORE_BODIES = [
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

const OPTIONAL_BODIES = ['NorthNode', 'SouthNode', 'Chiron', 'Lilith']
const READING_BODIES  = [...CORE_BODIES, ...OPTIONAL_BODIES]
const BODY_ORDER      = new Map(READING_BODIES.map((name, index) => [name, index]))
const EASY_ASPECTS    = new Set(['trine', 'sextile'])
const HARD_ASPECTS    = new Set(['square', 'opposition', 'quincunx'])
const SUPPORTED_ASPECTS = new Set(['conjunction', 'opposition', 'trine', 'square', 'sextile', 'quincunx'])
const ANGLES          = [
  { name: 'Ascendant', field: 'ascendant', chapter: 'core_identity' },
  { name: 'Midheaven', field: 'mc',        chapter: 'core_identity' },
]

const CHAPTER_BY_BODY = {
  Sun:       'core_identity',
  Moon:      'emotional_world',
  Mercury:   'mind_communication',
  Venus:     'relationships_desire',
  Mars:      'relationships_desire',
  Jupiter:   'growth_direction',
  Saturn:    'growth_direction',
  NorthNode: 'growth_direction',
  SouthNode: 'growth_direction',
  Uranus:    'depth_transformation',
  Neptune:   'depth_transformation',
  Pluto:     'depth_transformation',
  Chiron:    'depth_transformation',
  Lilith:    'depth_transformation',
}

const DEFAULT_LIMITS = {
  aspects:        8,
  prominence:     3,
  themes:         4,
  resources:      3,
  configurations: 4,
}

const token = (key, params = {}) => ({ key, params })

const slug = value => String(value)
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .toLowerCase()

const finiteLimit = (value, fallback) => {
  if (value === undefined) return fallback
  if (!Number.isFinite(value)) return fallback
  return Math.max(0, Math.floor(value))
}

const validCusps = chart => Array.isArray(chart?.cusps) && chart.cusps.length === 12

const bodySort = (a, b) =>
  (BODY_ORDER.get(a.name) ?? READING_BODIES.length) -
  (BODY_ORDER.get(b.name) ?? READING_BODIES.length) ||
  a.name.localeCompare(b.name)

const orderedBodies = chart => [...(chart?.positions || [])]
  .filter(position => BODY_ORDER.has(position.name) && Number.isFinite(position.longitude))
  .sort(bodySort)

const placementFacts = (position, chart) => ({
  body:       position.name,
  bodyRole:   position.name,
  longitude: norm360(position.longitude),
  signIndex: signIndex(position.longitude),
  signStyle: signIndex(position.longitude),
  house:     validCusps(chart) ? houseOf(position.longitude, chart.cusps) : null,
  houseArea: validCusps(chart) ? houseOf(position.longitude, chart.cusps) : null,
  motionNote: position.stationary || position.motion === 'stationary'
    ? 'stationary'
    : position.retrograde ? 'retrograde' : position.motion === undefined && position.retrograde === undefined ? 'unknown' : 'direct',
})

const aspectIdBase = aspect => {
  const bodies = [aspect.a, aspect.b].sort((a, b) => a.localeCompare(b))
  return `aspect:${slug(bodies[0])}:${slug(aspect.type)}:${slug(bodies[1])}`
}

const sortedAspects = (aspects, availableNames) => [...aspects]
  .filter(aspect =>
    aspect &&
    availableNames.has(aspect.a) &&
    availableNames.has(aspect.b) &&
    SUPPORTED_ASPECTS.has(aspect.type)
  )
  .sort((a, b) =>
    (b.strength || 0) - (a.strength || 0) ||
    (a.delta || 0) - (b.delta || 0) ||
    aspectIdBase(a).localeCompare(aspectIdBase(b))
  )

const phaseFor = (sun, moon) => {
  if (!sun || !moon) return null

  const elongation = norm360(moon.longitude - sun.longitude)
  const index      = Math.floor(norm360(elongation + 22.5) / 45) % 8
  const phases     = [
    'new_moon',
    'waxing_crescent',
    'first_quarter',
    'waxing_gibbous',
    'full_moon',
    'waning_gibbous',
    'last_quarter',
    'waning_crescent',
  ]

  return { phase: phases[index], elongation }
}

const distributionRows = (bodies, chart) => {
  if (!bodies.length) return []

  const scores = {
    element:  Object.fromEntries(['fire', 'earth', 'air', 'water'].map(key => [key, 0])),
    modality: Object.fromEntries(['cardinal', 'fixed', 'mutable'].map(key => [key, 0])),
  }

  for (const body of bodies) {
    const traits = SIGN_TRAITS[signIndex(body.longitude)]
    const weight = PLANET_WEIGHTS[body.name] || 1
    scores.element[traits.element]     += weight
    scores.modality[traits.modality]   += weight
  }

  if (validCusps(chart)) {
    scores.house_mode = Object.fromEntries(['angular', 'succedent', 'cadent'].map(key => [key, 0]))
    for (const body of bodies) {
      const house  = houseOf(body.longitude, chart.cusps)
      const weight = PLANET_WEIGHTS[body.name] || 1
      const mode   = [1, 4, 7, 10].includes(house)
        ? 'angular'
        : [2, 5, 8, 11].includes(house) ? 'succedent' : 'cadent'
      scores.house_mode[mode] += weight
    }
  }

  return Object.entries(scores).map(([category, values]) => {
    const total    = Object.values(values).reduce((sum, value) => sum + value, 0)
    const ordered  = Object.entries(values).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    const dominant = ordered[0]
    const minimum  = [...ordered].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))[0]

    return {
      category,
      dominant: dominant[0],
      dominantShare: total ? dominant[1] / total : 0,
      minimum: minimum[0],
      minimumShare: total ? minimum[1] / total : 0,
      values: Object.fromEntries(ordered),
    }
  })
}

const hasAspect = (lookup, a, b, type) => lookup.has(`${[a, b].sort().join('|')}|${type}`)

const combinations = (values, size) => {
  const output = []
  const visit  = (start, selected) => {
    if (selected.length === size) {
      output.push(selected)
      return
    }
    for (let index = start; index <= values.length - (size - selected.length); index++)
      visit(index + 1, [...selected, values[index]])
  }
  visit(0, [])
  return output
}

const detectAspectConfigurations = (aspects) => {
  const lookup = new Set(aspects.map(aspect => `${[aspect.a, aspect.b].sort().join('|')}|${aspect.type}`))
  const names  = [...new Set(aspects.flatMap(aspect => [aspect.a, aspect.b]))].sort()
  const found  = []

  for (const trio of combinations(names, 3)) {
    const [a, b, c] = trio
    if (hasAspect(lookup, a, b, 'trine') && hasAspect(lookup, a, c, 'trine') && hasAspect(lookup, b, c, 'trine'))
      found.push({ type: 'grand_trine', bodies: trio })

    const oppositionPairs = [[a, b, c], [a, c, b], [b, c, a]]
    for (const [left, right, apex] of oppositionPairs) {
      if (hasAspect(lookup, left, right, 'opposition') &&
          hasAspect(lookup, left, apex, 'square') &&
          hasAspect(lookup, right, apex, 'square'))
        found.push({ type: 't_square', bodies: trio, apex })
    }

    const sextilePairs = [[a, b, c], [a, c, b], [b, c, a]]
    for (const [left, right, apex] of sextilePairs) {
      if (hasAspect(lookup, left, right, 'sextile') &&
          hasAspect(lookup, left, apex, 'quincunx') &&
          hasAspect(lookup, right, apex, 'quincunx'))
        found.push({ type: 'yod', bodies: trio, apex })
    }
  }

  for (const quartet of combinations(names, 4)) {
    const pairs = combinations(quartet, 2)
    const oppositionCount = pairs.filter(([a, b]) => hasAspect(lookup, a, b, 'opposition')).length
    const squareCount     = pairs.filter(([a, b]) => hasAspect(lookup, a, b, 'square')).length
    if (oppositionCount === 2 && squareCount === 4)
      found.push({ type: 'grand_cross', bodies: quartet })
  }

  return found
}

const detectStelliums = (bodies, chart) => {
  const groups = new Map()
  for (const body of bodies) {
    const sign = signIndex(body.longitude)
    groups.set(sign, [...(groups.get(sign) || []), body.name])
  }

  const signStelliums = [...groups.entries()]
    .filter(([, names]) => names.length >= 3)
    .map(([sign, names]) => ({ type: 'sign_stellium', bodies: names.sort(), signIndex: sign }))

  if (!validCusps(chart)) return signStelliums

  const houses = new Map()
  for (const body of bodies) {
    const house = houseOf(body.longitude, chart.cusps)
    houses.set(house, [...(houses.get(house) || []), body.name])
  }
  const rows = [
    ...signStelliums,
    ...[...houses.entries()]
      .filter(([, names]) => names.length >= 3)
      .map(([house, names]) => ({ type: 'house_stellium', bodies: names.sort(), house })),
  ]

  const byBodies = new Map()
  for (const row of rows) {
    const key      = row.bodies.join('|')
    const existing = byBodies.get(key)
    if (!existing) {
      byBodies.set(key, row)
      continue
    }
    byBodies.set(key, {
      type:      'stellium',
      bodies:    row.bodies,
      signIndex: existing.signIndex ?? row.signIndex,
      house:     existing.house ?? row.house,
      houseArea: existing.house ?? row.house,
    })
  }
  return [...byBodies.values()]
}

const configurationEvidenceIds = (configuration, aspectEvidence) => aspectEvidence
  .filter(evidence =>
    configuration.bodies.includes(evidence.facts.a) &&
    configuration.bodies.includes(evidence.facts.b)
  )
  .map(evidence => evidence.id)

const buildProminence = ({ bodies, placements, aspectEvidence, chartRuler, angularBodies }) => {
  const aspectScores = new Map()
  const aspectIds    = new Map()
  for (const evidence of aspectEvidence) {
    for (const body of [evidence.facts.a, evidence.facts.b]) {
      aspectScores.set(body, (aspectScores.get(body) || 0) + evidence.facts.strength)
      aspectIds.set(body, [...(aspectIds.get(body) || []), evidence.id])
    }
  }

  return bodies.map(body => {
    const placementId = placements.get(body.name)
    const reasons     = []
    let score         = (PLANET_WEIGHTS[body.name] || 1) * 10 + (aspectScores.get(body.name) || 0) * 10

    if (body.name === 'Sun' || body.name === 'Moon') {
      score += 10
      reasons.push(token('readings.tropical.prominence.reasons.luminary', { body: body.name }))
    }
    if (chartRuler?.planet === body.name) {
      score += 18
      reasons.push(token('readings.tropical.prominence.reasons.chart_ruler', { body: body.name }))
    }
    if (angularBodies.has(body.name)) {
      score += 15
      reasons.push(token('readings.tropical.prominence.reasons.angular', { body: body.name }))
    }
    if (aspectScores.has(body.name))
      reasons.push(token('readings.tropical.prominence.reasons.aspected', {
        body: body.name,
        count: aspectIds.get(body.name).length,
      }))

    return {
      factorId: body.name,
      score:    Number(score.toFixed(4)),
      token:    token('readings.tropical.prominence.factor', { factor: body.name }),
      reasons,
      evidenceIds: [placementId, ...(aspectIds.get(body.name) || [])].filter(Boolean),
    }
  })
    .sort((a, b) => b.score - a.score || bodySort({ name: a.factorId }, { name: b.factorId }))
    .map((row, index) => ({
      ...row,
      rank:  index + 1,
      token: token('readings.tropical.prominence.factor', { factor: row.factorId, rank: index + 1 }),
    }))
}

const item = (id, key, params, evidenceIds) => ({
  id,
  token: token(key, params),
  evidenceIds,
})

const resource = (id, key, params, evidenceIds) => ({
  id,
  token: token(key, params),
  evidenceIds,
})

export const tropicalReadingDocument = (chart, aspects = [], options = {}) => {
  if (!chart || !isTropicalChart(chart)) return null

  const limits = {
    aspects:        finiteLimit(options.aspectLimit, DEFAULT_LIMITS.aspects),
    prominence:     finiteLimit(options.prominenceLimit, DEFAULT_LIMITS.prominence),
    themes:         finiteLimit(options.themeLimit, DEFAULT_LIMITS.themes),
    resources:      finiteLimit(options.resourceLimit, DEFAULT_LIMITS.resources),
    configurations: finiteLimit(options.configurationLimit, DEFAULT_LIMITS.configurations),
  }
  const bodies         = orderedBodies(chart)
  const bodyNames      = new Set(bodies.map(body => body.name))
  const availableNames = new Set(bodyNames)
  const evidence       = []
  const placements     = new Map()
  const chapterItems   = Object.fromEntries(TROPICAL_READING_CHAPTERS.map(chapter => [chapter, []]))

  for (const body of bodies) {
    const id    = `placement:${slug(body.name)}`
    const facts = placementFacts(body, chart)
    placements.set(body.name, id)
    evidence.push({ id, kind: 'placement', facts })
    chapterItems[CHAPTER_BY_BODY[body.name]].push(item(
      `item:${id}`,
      facts.house ? 'readings.tropical.items.placement' : 'readings.tropical.items.placement_without_house',
      facts,
      [id]
    ))
  }

  const angleEvidence = []
  for (const angle of ANGLES) {
    const longitude = chart[angle.field]
    if (!Number.isFinite(longitude)) continue
    availableNames.add(angle.name)
    const id    = `angle:${slug(angle.name)}`
    const facts = { angle: angle.name, longitude: norm360(longitude), signIndex: signIndex(longitude) }
    const row   = { id, kind: 'angle', facts }
    evidence.push(row)
    angleEvidence.push(row)
    chapterItems[angle.chapter].push(item(
      `item:${id}`,
      `readings.tropical.items.angle.${slug(angle.name)}`,
      { ...facts, signStyle: facts.signIndex },
      [id]
    ))
  }

  const ascendant = angleEvidence.find(row => row.facts.angle === 'Ascendant')
  const rulerName = ascendant ? TROPICAL_SIGN_RULERS[ascendant.facts.signIndex] : null
  const rulerBody = bodies.find(body => body.name === rulerName)
  const chartRuler = rulerBody ? {
    planet:       rulerBody.name,
    ascSignIndex: ascendant.facts.signIndex,
    signIndex:    signIndex(rulerBody.longitude),
    house:        validCusps(chart) ? houseOf(rulerBody.longitude, chart.cusps) : null,
    bodyRole:     rulerBody.name,
    houseArea:    validCusps(chart) ? houseOf(rulerBody.longitude, chart.cusps) : null,
    motionNote:   rulerBody.stationary || rulerBody.motion === 'stationary'
      ? 'stationary'
      : rulerBody.retrograde ? 'retrograde' : 'direct',
  } : null
  if (chartRuler) {
    const id = 'chart-ruler'
    evidence.push({ id, kind: 'chart_ruler', facts: chartRuler })
    chapterItems.core_identity.push(item(
      `item:${id}`,
      'readings.tropical.items.chart_ruler',
      chartRuler,
      [id, placements.get(chartRuler.planet), ascendant.id]
    ))
  }

  const phase = phaseFor(
    bodies.find(body => body.name === 'Sun'),
    bodies.find(body => body.name === 'Moon')
  )
  if (phase) {
    const id = 'lunar-phase'
    evidence.push({ id, kind: 'lunar_phase', facts: phase })
    chapterItems.emotional_world.push(item(
      `item:${id}`,
      `readings.tropical.items.lunar_phase.${phase.phase}`,
      phase,
      [id, placements.get('Sun'), placements.get('Moon')]
    ))
  }

  const allAspects      = sortedAspects(aspects, availableNames)
  const includedAspects = allAspects.slice(0, limits.aspects)
  const idCounts        = new Map()
  const aspectEvidence  = includedAspects.map(aspect => {
    const base       = aspectIdBase(aspect)
    const occurrence = (idCounts.get(base) || 0) + 1
    idCounts.set(base, occurrence)
    const id = occurrence === 1 ? base : `${base}:${occurrence}`
    const facts = {
      a:         aspect.a,
      b:         aspect.b,
      type:      aspect.type,
      delta:     Number.isFinite(aspect.delta) ? aspect.delta : null,
      strength:  Number.isFinite(aspect.strength) ? aspect.strength : 0,
      applying:  typeof aspect.applying === 'boolean' ? aspect.applying : null,
    }
    return { id, kind: 'aspect', facts }
  })
  evidence.push(...aspectEvidence)
  for (const row of aspectEvidence)
    chapterItems.integration.push(item(
      `item:${row.id}`,
      `readings.tropical.items.aspect.${row.facts.type}`,
      row.facts,
      [row.id, placements.get(row.facts.a), placements.get(row.facts.b)].filter(Boolean)
    ))

  const distributions = distributionRows(bodies, chart)
  for (const facts of distributions) {
    const id = `distribution:${slug(facts.category)}`
    evidence.push({ id, kind: 'distribution', facts })
    chapterItems.integration.push(item(
      `item:${id}`,
      `readings.tropical.items.distribution.${facts.category}`,
      facts,
      [id]
    ))
  }

  const detectedConfigurations = [
    ...detectStelliums(bodies, chart),
    ...detectAspectConfigurations(allAspects),
  ].sort((a, b) =>
    a.type.localeCompare(b.type) || a.bodies.join('|').localeCompare(b.bodies.join('|'))
  )
  const configurations = detectedConfigurations.slice(0, limits.configurations)
  for (const facts of configurations) {
    const id = `configuration:${slug(facts.type)}:${facts.bodies.map(slug).join('-')}`
    const relatedEvidence = configurationEvidenceIds(facts, aspectEvidence)
    evidence.push({ id, kind: 'configuration', facts })
    chapterItems.integration.push(item(
      `item:${id}`,
      `readings.tropical.items.configuration.${facts.type}`,
      facts,
      [id, ...facts.bodies.map(body => placements.get(body)).filter(Boolean), ...relatedEvidence]
    ))
  }

  const angularBodies = new Set()
  const angleLongitudes = [
    ...(Number.isFinite(chart.ascendant) ? [chart.ascendant, norm360(chart.ascendant + 180)] : []),
    ...(Number.isFinite(chart.mc) ? [chart.mc, norm360(chart.mc + 180)] : []),
  ]
  if (angleLongitudes.length) {
    for (const body of bodies) {
      if (angleLongitudes.some(angle => Math.abs((((body.longitude - angle + 540) % 360) - 180)) <= 8))
        angularBodies.add(body.name)
    }
  }

  const allProminence = buildProminence({
    bodies,
    placements,
    aspectEvidence,
    chartRuler,
    angularBodies,
  })
  const prominence = allProminence.slice(0, limits.prominence)

  const configurationThemes = configurations.map(facts => {
    const evidenceId = `configuration:${slug(facts.type)}:${facts.bodies.map(slug).join('-')}`
    return item(
      `theme:${evidenceId}`,
      `readings.tropical.summary.configuration.${facts.type}`,
      facts,
      [evidenceId]
    )
  })
  const prominenceThemes = allProminence.map(row => item(
    `theme:factor:${slug(row.factorId)}`,
    'readings.tropical.summary.factor',
    { factor: row.factorId, rank: row.rank },
    row.evidenceIds
  ))
  const distributionThemes = distributions
    .filter(row => row.dominantShare >= 0.4)
    .map(row => item(
      `theme:distribution:${slug(row.category)}`,
      `readings.tropical.summary.distribution.${row.category}`,
      row,
      [`distribution:${slug(row.category)}`]
    ))
  const allThemes = [
    ...prominenceThemes.slice(0, 2),
    ...configurationThemes.slice(0, 1),
    ...distributionThemes.slice(0, 1),
    ...configurationThemes.slice(1),
    ...distributionThemes.slice(1),
    ...prominenceThemes.slice(2),
  ]
  const themes    = allThemes.slice(0, limits.themes)

  const distributionStrengths = distributions.map(row => resource(
    `strength:distribution:${slug(row.category)}`,
    `readings.tropical.strengths.distribution.${row.category}`,
    row,
    [`distribution:${slug(row.category)}`]
  ))
  const configurationStrengths = configurations
    .filter(row => row.type === 'grand_trine')
    .map(row => {
      const evidenceId = `configuration:${slug(row.type)}:${row.bodies.map(slug).join('-')}`
      return resource(
        `strength:${evidenceId}`,
        `readings.tropical.strengths.configuration.${row.type}`,
        row,
        [evidenceId]
      )
    })
  const aspectStrengths = aspectEvidence
    .filter(row => EASY_ASPECTS.has(row.facts.type))
    .map(row => resource(
      `strength:${row.id}`,
      `readings.tropical.strengths.aspect.${row.facts.type}`,
      row.facts,
      [row.id]
    ))
  const allStrengths = [...configurationStrengths, ...aspectStrengths, ...distributionStrengths]
  const strengths    = allStrengths.slice(0, limits.resources)

  const distributionChallenges = distributions.map(row => resource(
    `challenge:distribution:${slug(row.category)}`,
    `readings.tropical.challenges.distribution.${row.category}`,
    row,
    [`distribution:${slug(row.category)}`]
  ))
  const configurationChallenges = configurations
    .filter(row => ['grand_cross', 't_square', 'yod'].includes(row.type))
    .map(row => {
      const evidenceId = `configuration:${slug(row.type)}:${row.bodies.map(slug).join('-')}`
      return resource(
        `challenge:${evidenceId}`,
        `readings.tropical.challenges.configuration.${row.type}`,
        row,
        [evidenceId]
      )
    })
  const aspectChallenges = aspectEvidence
    .filter(row => HARD_ASPECTS.has(row.facts.type))
    .map(row => resource(
      `challenge:${row.id}`,
      `readings.tropical.challenges.aspect.${row.facts.type}`,
      row.facts,
      [row.id]
    ))
  const allChallenges = [...configurationChallenges, ...aspectChallenges, ...distributionChallenges]
  const challenges    = allChallenges.slice(0, limits.resources)
  const practices = challenges.map(row => resource(
    `practice:${row.id.replace('challenge:', '')}`,
    row.token.key.replace('readings.tropical.challenges.', 'readings.tropical.practices.'),
    row.token.params,
    row.evidenceIds
  ))

  const missingBodies = READING_BODIES.filter(name => !bodyNames.has(name))
  const chapters = TROPICAL_READING_CHAPTERS.map(id => ({
    id,
    title: token(`readings.tropical.chapters.${id}.title`),
    items: chapterItems[id],
  }))

  return {
    schemaVersion: TROPICAL_READING_SCHEMA_VERSION,
    id:            'tropical-psychological',
    modality:      'astrology',
    tradition:     'tropical',
    kind:          'psychological',
    title:         token('readings.tropical.document.title'),
    summary:       { themes },
    chapters,
    prominence,
    strengths,
    challenges,
    practices,
    evidence,
    completeness: {
      available: {
        placements:    bodies.length,
        aspects:       allAspects.length,
        angles:        angleEvidence.length,
        configurations: detectedConfigurations.length,
        prominence:    allProminence.length,
        themes:        allThemes.length,
        strengths:     allStrengths.length,
        challenges:    allChallenges.length,
      },
      included: {
        placements:    bodies.length,
        aspects:       includedAspects.length,
        angles:        angleEvidence.length,
        configurations: configurations.length,
        prominence:    prominence.length,
        themes:        themes.length,
        strengths:     strengths.length,
        challenges:    challenges.length,
      },
      truncated: {
        aspects:       includedAspects.length < allAspects.length,
        prominence:    prominence.length < allProminence.length,
        configurations: configurations.length < detectedConfigurations.length,
        themes:        themes.length < allThemes.length,
        strengths:     strengths.length < allStrengths.length,
        challenges:    challenges.length < allChallenges.length,
      },
      missingBodies,
      unavailable: [
        ...(!validCusps(chart) ? ['houses'] : []),
        ...(!ascendant ? ['ascendant'] : []),
        ...(!chartRuler ? ['chart_ruler'] : []),
        ...(!angleEvidence.some(row => row.facts.angle === 'Midheaven') ? ['midheaven'] : []),
        ...(!phase ? ['lunar_phase'] : []),
      ],
      limits,
    },
  }
}
