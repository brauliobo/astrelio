import { VEDIC_GRAHAS } from './constants.js'
import { buildVedicChart } from './chart.js'
import { buildVedicPrerequisites } from './prerequisites.js'

const BODY_CHAPTERS = {
  Sun:       'identity',
  Moon:      'emotional_life',
  Mars:      'agency',
  Mercury:   'cognition',
  Jupiter:   'meaning',
  Venus:     'relationships',
  Saturn:    'growth',
  NorthNode: 'growth',
  SouthNode: 'growth',
}

const token = (key, params = {}) => ({ key, params })

const dashaLordFor = body => ({ NorthNode: 'rahu', SouthNode: 'ketu' })[body] || body.toLowerCase()

const placementEvidence = placement => ({
  id:   `placement:${placement.body}`,
  type: 'placement',
  label: token('vedic.reading.evidence.placement', {
    body:       placement.body,
    signIndex:  placement.d1.signIndex,
    house:      placement.d1.house,
    dignity:    placement.dignity,
    nakshatra:  placement.nakshatra.key,
    pada:       placement.nakshatra.pada,
    d9SignIndex: placement.d9?.signIndex ?? null,
  }),
})

const prominenceFor = (facts, placement) => {
  const evidenceIds = [`placement:${placement.body}`]
  let score = 1
  if (facts.ascendant.lord === placement.body) score += 4
  if ([1, 4, 7, 10].includes(placement.d1.house)) score += 2
  if (placement.dignity === 'exalted' || placement.dignity === 'own_sign') score += 2
  if (facts.vimshottari?.active.mahadasha === dashaLordFor(placement.body)) score += 3
  if (facts.vimshottari?.active.antardasha === dashaLordFor(placement.body)) score += 2

  const related = [
    ...facts.conjunctions.filter(item => item.bodies.includes(placement.body)),
    ...facts.aspects.filter(item => item.source === placement.body || item.target === placement.body),
  ]
  score += Math.min(related.length, 3)
  evidenceIds.push(...related.map(item => item.id))
  return { body: placement.body, score, evidenceIds: [...new Set(evidenceIds)] }
}

const insightFor = placement => ({
  id:          `insight:placement:${placement.body}`,
  chapter:     BODY_CHAPTERS[placement.body],
  text:        token('vedic.reading.insights.placement', {
    body:       placement.body,
    bodyRole:   placement.body,
    signIndex:  placement.d1.signIndex,
    signStyle:  placement.d1.signIndex,
    house:      placement.d1.house,
    houseArea:  placement.d1.house,
    dignity:    placement.dignity,
    dignityMeaning: placement.dignity,
    nakshatra:  placement.nakshatra.key,
    pada:       placement.nakshatra.pada,
    d9SignIndex: placement.d9?.signIndex ?? null,
  }),
  evidenceIds: [`placement:${placement.body}`],
})

const resourceFor = (kind, placement) => ({
  id:          `${kind}:${placement.body}`,
  text:        token(`vedic.reading.${kind}.placement`, {
    body:      placement.body,
    bodyRole:  placement.body,
    dignity:   placement.dignity,
    dignityMeaning: placement.dignity,
    house:     placement.d1.house,
    houseArea: placement.d1.house,
    signIndex: placement.d1.signIndex,
  }),
  evidenceIds: [`placement:${placement.body}`],
})

const nodeAxisParams = nodeAxis => ({
  rahuSignIndex: nodeAxis.rahu.signIndex,
  rahuHouse:     nodeAxis.rahu.house,
  ketuSignIndex: nodeAxis.ketu.signIndex,
  ketuHouse:     nodeAxis.ketu.house,
})

export const buildVedicReadingDocument = (chart) => {
  const facts = buildVedicPrerequisites(chart)
  if (!facts) return null

  const evidence = [
    ...facts.placements.map(placementEvidence),
    ...facts.conjunctions.map(item => ({
      id: item.id,
      type: 'conjunction',
      label: token('vedic.reading.evidence.conjunction', {
        bodies: item.bodies,
        signIndex: item.signIndex,
      }),
    })),
    ...facts.aspects.map(item => ({
      id: item.id,
      type: 'graha_aspect',
      label: token('vedic.reading.evidence.graha_aspect', {
        source: item.source,
        target: item.target,
        aspectHouse: item.aspectHouse,
      }),
    })),
  ]
  if (facts.nodeAxis) evidence.push({
    id:   'node-axis',
    type: 'node_axis',
    label: token('vedic.reading.evidence.node_axis', nodeAxisParams(facts.nodeAxis)),
  })
  if (facts.vimshottari) evidence.push({
    id:   'vimshottari:current',
    type: 'vimshottari',
    label: token('vedic.reading.evidence.vimshottari', {
      mahadasha:  facts.vimshottari.active.mahadasha,
      antardasha: facts.vimshottari.active.antardasha,
    }),
  })
  evidence.push(...facts.patterns.map(pattern => ({
    id: pattern.id,
    type: 'supported_pattern',
    label: token(`vedic.reading.evidence.pattern.${pattern.pattern}`, {
      participants: pattern.participants,
    }),
  })))

  const insights = facts.placements.map(insightFor)
  if (facts.nodeAxis) insights.push({
    id:      'insight:node-axis',
    chapter: 'growth',
    text:    token('vedic.reading.insights.node_axis', nodeAxisParams(facts.nodeAxis)),
    evidenceIds: ['node-axis'],
  })
  if (facts.vimshottari) insights.push({
    id:      'insight:vimshottari',
    chapter: 'current_context',
    text: token('vedic.reading.insights.vimshottari', {
      mahadasha:  facts.vimshottari.active.mahadasha,
      antardasha: facts.vimshottari.active.antardasha,
    }),
    evidenceIds: ['vimshottari:current'],
  })

  const chapterKeys = ['identity', 'emotional_life', 'cognition', 'relationships', 'agency', 'meaning', 'growth', 'current_context']
  const chapters = chapterKeys.map(key => ({
    id:       key,
    title:    token(`vedic.reading.chapters.${key}`),
    insights: insights.filter(insight => insight.chapter === key),
  }))
  const prominence = facts.placements
    .map(placement => prominenceFor(facts, placement))
    .sort((a, b) => b.score - a.score || VEDIC_GRAHAS.indexOf(a.body) - VEDIC_GRAHAS.indexOf(b.body))
    .slice(0, 3)
  const strengths = facts.placements
    .filter(placement => ['exalted', 'own_sign'].includes(placement.dignity))
    .map(placement => resourceFor('strengths', placement))
  const challenges = facts.placements
    .filter(placement => placement.dignity === 'debilitated')
    .map(placement => resourceFor('challenges', placement))
  const practices = prominence.slice(0, 3).map(item => {
    const placement = facts.placements.find(candidate => candidate.body === item.body)
    return resourceFor('practices', placement)
  })

  return {
    schemaVersion:   'vedic-reading-document.v1',
    languageNeutral: true,
    chartId:         facts.chartId,
    coverage:        facts.coverage,
    chapters,
    prominence,
    strengths,
    challenges,
    practices,
    evidence,
  }
}

export const buildVedicReading = async (person, settings = {}) =>
  buildVedicReadingDocument(await buildVedicChart(person, settings))
