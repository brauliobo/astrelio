import { oppositeSignIndex, signAxisFor } from '../astro/sign-axes.js'
import { elementForSign, relatedElementsFor } from '../astro/elements.js'
import {
  aspectKey,
  humanDesignHighlight,
  normalizeHighlight,
  wheelHighlight,
} from '../chart/highlight.js'

const BODY_PARAMS = new Set([
  'a',
  'angle',
  'apex',
  'b',
  'body',
  'factor',
  'planet',
  'source',
  'target',
])

const BODY_LIST_PARAMS = new Set(['bodies', 'oppositeBodies', 'participants', 'planets', 'primaryBodies'])
const CENTER_LIST_PARAMS = new Set(['definedCenterNames', 'openCenterNames'])

const HUMAN_DESIGN_PARAMS = {
  authority:    'authorities',
  center:       'centers',
  circuit:      'circuits',
  circuitGroup: 'circuit_groups',
  definition:   'definitions',
  geometry:     'cross_geometries',
  group:        'circuit_groups',
  layer:        'layers',
  orientation:  'orientations',
  stream:       'stream_names',
  type:         'types',
}

const FACT_EVIDENCE_KINDS = new Set([
  'placement',
  'angle',
  'chart_ruler',
  'aspect',
  'distribution',
  'configuration',
  'sign_axis',
])

const PLANET_IDS = {
  ascendant:  'Ascendant',
  chiron:     'Chiron',
  earth:      'Earth',
  jupiter:    'Jupiter',
  lilith:     'Lilith',
  mars:       'Mars',
  mercury:    'Mercury',
  midheaven:  'Midheaven',
  moon:       'Moon',
  neptune:    'Neptune',
  northnode:  'NorthNode',
  pluto:      'Pluto',
  saturn:     'Saturn',
  southnode:  'SouthNode',
  sun:        'Sun',
  uranus:     'Uranus',
  venus:      'Venus',
}

const ZODIAC_SYMBOLS = [
  '\u2648', '\u2649', '\u264A', '\u264B', '\u264C', '\u264D',
  '\u264E', '\u264F', '\u2650', '\u2651', '\u2652', '\u2653',
]

const isToken = value => Boolean(value && typeof value.key === 'string')

const modalityFor = document => {
  if (document?.schema === 'human-design.reading-document') return 'human_design'
  if (String(document?.schemaVersion || '').startsWith('vedic-reading-document')) return 'vedic'
  return 'tropical'
}

const planetId = value => PLANET_IDS[String(value || '').replace(/[^a-z]/gi, '').toLowerCase()] || value

const translatedList = (values, localize, t) =>
  values.map(localize).join(t('readings.presentation.list_separator'))

const distributionValue = (params, value, t) => {
  const groups = {
    element:    'analysis.elements',
    house_mode: 'readings.presentation.house_modes',
    modality:   'analysis.modalities',
  }
  const group = groups[params.category]
  return group ? t(`${group}.${value}`) : value
}

export const localizeReadingParams = (params = {}, t, tokenKey = '') => Object.fromEntries(
  Object.entries(params).map(([name, value]) => {
    const localize = item => {
      if (item === null || item === undefined) return t('readings.presentation.values.unavailable')
      if (name === 'retrograde' && typeof item === 'boolean')
        return t(`readings.presentation.values.${item ? 'retrograde' : 'direct'}`)
      if (typeof item === 'boolean') return t(`readings.presentation.values.${item}`)
      if (name === 'bodyRole') return t(`readings.vocabulary.body_roles.${planetId(item)}`)
      if (name === 'signStyle') return t(`readings.vocabulary.sign_styles.${item}`)
      if (name === 'houseArea') return t(`readings.vocabulary.house_areas.${item}`)
      if (name === 'motionNote') return t(`readings.vocabulary.motion_notes.${item}`)
      if (name === 'dignityMeaning') return t(`vedic.reading.dignity_meanings.${item}`)
      if (name === 'strategy') return t(`human_design.reading.strategies.${item}`)
      if (name === 'signature') return t(`human_design.reading.signatures.${item}`)
      if (name === 'notSelf') return t(`human_design.reading.not_self.${item}`)
      if (BODY_PARAMS.has(name)) return t(`planets.${planetId(item)}`)
      if (/signIndex$/i.test(name)) return t(`zodiac.signs.${item}`)
      if (name === 'dignity') return t(`vedic.dignities.${item}`)
      if (name === 'nakshatra') return t(`vedic.nakshatras.${item}`)
      if (name === 'mahadasha' || name === 'antardasha' || name === 'dasha')
        return t(`vedic.dasha_lords.${item}`)
      const nonHumanDesignType = name === 'type'
        && /^(?:readings\.tropical|vedic\.|readings\.presentation\.evidence_descriptions)/.test(tokenKey)
      if (HUMAN_DESIGN_PARAMS[name] && !nonHumanDesignType)
        return t(`human_design.${HUMAN_DESIGN_PARAMS[name]}.${item}`)
      if (name === 'quarter') return t(`human_design.quarters.${item}`)
      if (name === 'dominant' || name === 'minimum') return distributionValue(params, item, t)
      if (name === 'category') return t(`readings.presentation.distribution_categories.${item}`)
      return item
    }

    if (Array.isArray(value)) {
      let itemLocalizer = localize
      if (BODY_LIST_PARAMS.has(name)) itemLocalizer = item => t(`planets.${planetId(item)}`)
      if (CENTER_LIST_PARAMS.has(name)) itemLocalizer = item => t(`human_design.centers.${item}`)
      if (name === 'channelNames') itemLocalizer = item => t(`human_design.channel_names.${String(item).replace('-', '_')}`)
      if (name === 'gateNames') itemLocalizer = item => `${item} — ${t(`human_design.gate_names.${item}`)}`
      if (name === 'variableNames') itemLocalizer = item => t(`human_design.reading.variables.${item}.label`)
      return [name, translatedList(value, itemLocalizer, t)]
    }
    return [name, localize(value)]
  })
)

const interpolationParams = (token, t) => {
  const params = localizeReadingParams(token.params, t, token.key)
  if (!token.key.endsWith('.node_axis')) return params
  return {
    ...params,
    rahu: `${params.rahuSignIndex}, ${t('readings.presentation.house_label', { house: params.rahuHouse })}`,
    ketu: `${params.ketuSignIndex}, ${t('readings.presentation.house_label', { house: params.ketuHouse })}`,
  }
}

export const translateReadingToken = (token, t) =>
  isToken(token) ? t(token.key, interpolationParams(token, t)) : null

const sourceToken = row => row?.token || row?.text || row?.content || row?.overview || row

const evidenceDescription = (evidence, t) => {
  if (evidence && isToken(evidence.label)) return translateReadingToken(evidence.label, t)

  const kind = evidence?.kind || evidence?.type || 'missing'
  if (evidence?.facts && FACT_EVIDENCE_KINDS.has(kind)) {
    return translateReadingToken({
      key:    `readings.presentation.evidence_descriptions.${kind}`,
      params: evidence.facts,
    }, t)
  }
  return t(`readings.presentation.evidence_kinds.${kind}`)
}

const evidenceReferences = (ids, evidenceById, t) => [...new Set(ids || [])].map(id => {
  const evidence = evidenceById.get(id)
  return {
    id,
    text: t('readings.presentation.evidence_reference', {
      description: evidenceDescription(evidence, t),
    }),
  }
})

const keyword = (id, label, kind, highlight) => ({
  id,
  label,
  kind,
  highlight: normalizeHighlight(highlight),
})

const bodyKeyword = (body, t) => {
  if (!body) return null
  const id = planetId(body)
  return keyword(`body:${id}`, t(`planets.${id}`), 'body', { bodies: [id] })
}

const tropicalSignHighlight = (index, t) => {
  const name           = t(`zodiac.signs.${index}`)
  const symbol         = ZODIAC_SYMBOLS[index]
  const oppositeIndex  = oppositeSignIndex(index)
  const oppositeName   = t(`zodiac.signs.${oppositeIndex}`)
  const oppositeSymbol = ZODIAC_SYMBOLS[oppositeIndex]
  const axis           = signAxisFor(index)
  const element        = elementForSign(index)
  return wheelHighlight('sign', `sign-${index}`, {
    signIndex: index,
    element,
    relatedElements: relatedElementsFor(element),
    symbol,
    title:     `${name} ${symbol}`,
    details:   [
      {
        label: t('chart.wheel_details.labels.span'),
        value: t('chart.wheel_details.span_value', { start: `${index * 30}\u00B0`, end: `${(index + 1) * 30}\u00B0` }),
      },
      {
        label: t('chart.wheel_details.labels.mode'),
        value: t('chart.wheel_details.values.zodiac_sign_sector'),
      },
    ],
    oppositeSignIndex: oppositeIndex,
    axisId:            axis.id,
    axis:              {
      id:          axis.id,
      modality:    axis.modality,
      polarity:    axis.polarity,
      elements:    [...axis.elements],
      signIndices: [...axis.signIndices],
    },
    relatedSectorId:   `sign-${oppositeIndex}`,
    relatedIds:        [`sign-${oppositeIndex}`],
    oppositeSymbol,
    signName:          name,
    oppositeSignName:  oppositeName,
    startLongitude:    index * 30,
    endLongitude:      (index + 1) * 30,
    centerLongitude:   index * 30 + 15,
    oppositeLongitude: oppositeIndex * 30 + 15,
  })
}

const signKeyword = (value, modality, t) => {
  const index = Number(value)
  if (!Number.isInteger(index) || index < 0 || index > 11) return null
  const highlight = modality === 'tropical'
    ? tropicalSignHighlight(index, t)
    : wheelHighlight('sign', `sign-${index}`, { signIndex: index })
  return keyword(`sign:${index}`, t(`zodiac.signs.${index}`), 'sign', highlight)
}

const houseKeyword = (value, t) => {
  const house = Number(value)
  if (!Number.isInteger(house) || house < 1 || house > 12) return null
  return keyword(
    `house:${house}`,
    t('readings.presentation.house_label', { house }),
    'house',
    wheelHighlight('house', `house-${house}`, {
      house,
      title: t('chart.wheel_details.titles.house', { house }),
    })
  )
}

const aspectKeyword = (facts, t) => {
  if (!facts?.a || !facts?.b || !facts?.type) return null
  const aspect = { a: planetId(facts.a), b: planetId(facts.b), type: facts.type }
  const key    = aspectKey(aspect)
  return keyword(key, t(`aspects.${facts.type}`), 'aspect', {
    bodies:    [aspect.a, aspect.b],
    aspectKey: key,
    aspect,
  })
}

const evidenceFacts = evidence => evidence?.facts || evidence?.label?.params || {}
const evidenceIdentity = evidence => String(evidence?.path || evidence?.id || '').split('.').at(-1)

const humanDesignKeyword = (evidence, t) => {
  const facts = evidenceFacts(evidence)
  const kind  = evidence.kind || evidence.type
  if (kind === 'center') {
    const center = evidenceIdentity(evidence)
    return keyword(`center:${center}`, t(`human_design.centers.${center}`), 'center', humanDesignHighlight('center', center))
  }
  if (kind === 'channel') {
    const channel = evidenceIdentity(evidence)
    return keyword(`channel:${channel}`, t(`human_design.channel_names.${channel.replace('-', '_')}`), 'channel', humanDesignHighlight('channel', channel))
  }
  if (kind === 'gate') {
    const gate = Number(facts.gate)
    return keyword(`gate:${gate}`, `${gate}: ${t(`human_design.gate_names.${gate}`)}`, 'gate', humanDesignHighlight('gate', gate))
  }
  if (kind === 'activation') {
    const gate          = Number(facts.gate)
    const [layer, body] = String(evidence.path || '').split('.')
    const detail = {
      activationId: evidence.id,
      layer,
      body:         planetId(body),
      line:         facts.line,
      color:        facts.color,
      tone:         facts.tone,
      base:         facts.base,
    }
    return keyword(evidence.id, translateReadingToken({
      key:    'human_design.reading.activations.label',
      params: { layer, planet: body, gate, line: facts.line },
    }, t), 'activation', humanDesignHighlight('gate', gate, detail))
  }
  return null
}

const bodyKeywords = (values, t) => (values || []).map(value => bodyKeyword(value, t))

const keywordsForEvidence = (evidence, modality, t) => {
  if (!evidence) return []
  if (modality === 'human_design') return [humanDesignKeyword(evidence, t)].filter(Boolean)

  const facts = evidenceFacts(evidence)
  const kind  = evidence.kind || evidence.type
  if (kind === 'placement') return [
    bodyKeyword(facts.body || facts.planet, t),
    signKeyword(facts.signIndex, modality, t),
    houseKeyword(facts.house, t),
  ].filter(Boolean)
  if (kind === 'angle') return [
    bodyKeyword(facts.angle, t),
    signKeyword(facts.signIndex, modality, t),
  ].filter(Boolean)
  if (kind === 'chart_ruler') return [
    bodyKeyword(facts.planet, t),
    signKeyword(facts.signIndex, modality, t),
    houseKeyword(facts.house, t),
  ].filter(Boolean)
  if (kind === 'aspect' && modality === 'tropical') return [
    bodyKeyword(facts.a, t),
    aspectKeyword(facts, t),
    bodyKeyword(facts.b, t),
  ].filter(Boolean)
  if (kind === 'configuration') return [
    ...bodyKeywords(facts.bodies || facts.planets || facts.participants, t),
    signKeyword(facts.signIndex, modality, t),
    houseKeyword(facts.house, t),
  ].filter(Boolean)
  if (kind === 'sign_axis') {
    const sides = facts.sides || [
      { signIndex: facts.primarySignIndex, bodies: facts.primaryBodies },
      { signIndex: facts.oppositeSignIndex, bodies: facts.oppositeBodies },
    ]
    return sides.flatMap(side => [
      signKeyword(side.signIndex, modality, t),
      ...bodyKeywords(side.bodies, t),
    ]).filter(Boolean)
  }
  if (kind === 'conjunction') return [
    ...bodyKeywords(facts.bodies, t),
    signKeyword(facts.signIndex, modality, t),
  ].filter(Boolean)
  if (kind === 'graha_aspect') return [
    bodyKeyword(facts.source, t),
    bodyKeyword(facts.target, t),
  ].filter(Boolean)
  if (kind === 'supported_pattern') return bodyKeywords(facts.participants, t).filter(Boolean)
  return []
}

const evidenceKeywords = (ids, evidenceById, modality, t) => {
  const seen = new Set()
  return [...new Set(ids || [])].flatMap(id => keywordsForEvidence(evidenceById.get(id), modality, t))
    .filter(item => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
}

const WORD_CHARACTER = /[\p{L}\p{N}_]/u
const codePointBefore = (text, index) => [...text.slice(0, index)].at(-1) || ''
const codePointAfter = (text, index) => [...text.slice(index)][0] || ''
const keywordBoundaryMatches = (text, start, label) => {
  const labelPoints = [...label]
  const before      = codePointBefore(text, start)
  const after       = codePointAfter(text, start + label.length)
  return (!WORD_CHARACTER.test(labelPoints[0]) || !WORD_CHARACTER.test(before))
    && (!WORD_CHARACTER.test(labelPoints.at(-1)) || !WORD_CHARACTER.test(after))
}

const readingSegments = (text, keywords) => {
  const groups = []
  const byLabel = new Map()
  keywords.forEach((item, evidenceOrder) => {
    if (!item.label) return
    const folded = item.label.toLocaleLowerCase()
    if (!byLabel.has(folded)) {
      const group = { folded, label: item.label, evidenceOrder, keywords: [], occurrences: 0 }
      byLabel.set(folded, group)
      groups.push(group)
    }
    byLabel.get(folded).keywords.push(item)
  })
  groups.sort((left, right) =>
    [...right.label].length - [...left.label].length || left.evidenceOrder - right.evidenceOrder
  )

  const segments   = []
  const foldedText = text.toLocaleLowerCase()
  let plainStart   = 0
  let offset       = 0
  while (offset < text.length) {
    const match = groups.find(group =>
      foldedText.startsWith(group.folded, offset) && keywordBoundaryMatches(text, offset, group.label)
    )
    if (!match) {
      offset += codePointAfter(text, offset).length
      continue
    }
    if (plainStart < offset) segments.push({ text: text.slice(plainStart, offset), keyword: null })
    const keywordIndex = Math.min(match.occurrences, match.keywords.length - 1)
    segments.push({
      text:    text.slice(offset, offset + match.label.length),
      keyword: match.keywords[keywordIndex],
    })
    match.occurrences += 1
    offset            += match.label.length
    plainStart         = offset
  }
  if (plainStart < text.length) segments.push({ text: text.slice(plainStart), keyword: null })
  return segments.length ? segments : [{ text, keyword: null }]
}

const presentationRow = (row, index, evidenceById, modality, t, evidenceIds) => {
  const text = translateReadingToken(sourceToken(row), t)
  if (text === null) return null
  const referencedEvidence = evidenceIds || row?.evidenceIds
  const keywords           = evidenceKeywords(referencedEvidence, evidenceById, modality, t)
  return {
    id:       row?.id || `row-${index}`,
    text,
    evidence: evidenceReferences(referencedEvidence, evidenceById, t),
    keywords,
    segments: readingSegments(text, keywords),
  }
}

const normalizeThemes = (document, modality, evidenceById, t) => {
  const themes = (document.summary?.themes || []).map((row, index) =>
    presentationRow(row, index, evidenceById, modality, t)
  ).filter(Boolean)
  const prominence = (document.summary?.prominence || document.prominence || []).map((row, index) => {
    if (isToken(sourceToken(row))) return presentationRow(row, index, evidenceById, modality, t)
    if (modality !== 'vedic') return null
    return presentationRow({
      id:          row.id || `prominence-${row.body}`,
      token:       { key: 'readings.presentation.prominence.vedic', params: { body: row.body, rank: index + 1 } },
      evidenceIds: row.evidenceIds,
    }, index, evidenceById, modality, t)
  }).filter(Boolean)
  return { themes, prominence }
}

const chapterRows = (chapter, evidenceById, modality, t) => {
  const rows = chapter.items || chapter.insights
  if (Array.isArray(rows)) return rows.map((row, index) =>
    presentationRow(row, index, evidenceById, modality, t)
  ).filter(Boolean)
  if (!isToken(chapter.overview)) return []
  return [presentationRow({
    id:          `${chapter.id}-overview`,
    token:       chapter.overview,
    evidenceIds: chapter.evidenceIds,
  }, 0, evidenceById, modality, t)].filter(Boolean)
}

const normalizeChapters = (document, evidenceById, modality, t) => (document.chapters || []).map(chapter => ({
  id:    chapter.id,
  title: translateReadingToken(chapter.title, t),
  items: chapterRows(chapter, evidenceById, modality, t),
})).filter(chapter => chapter.title && chapter.items.length)

const normalizeGuidance = (document, evidenceById, modality, t) => {
  const output = { strengths: [], challenges: [], practices: [] }
  for (const kind of Object.keys(output)) {
    const chapterRows = (document.chapters || []).flatMap(chapter => (chapter[kind] || []).map((token, index) => ({
      id:          `${kind}:${chapter.id}:${index}`,
      token,
      evidenceIds: chapter.evidenceIds,
    })))
    const rows = chapterRows.length ? chapterRows : document[kind] || []
    output[kind] = rows.map((row, index) => presentationRow(row, index, evidenceById, modality, t)).filter(Boolean)
  }
  return output
}

export const normalizeReadingDocument = (document, t) => {
  if (!document) return null
  const modality     = modalityFor(document)
  const evidenceById = new Map((document.evidence || []).map(evidence => [evidence.id, evidence]))
  const titleToken  = document.title || { key: `readings.presentation.titles.${modality}`, params: {} }
  const summary     = normalizeThemes(document, modality, evidenceById, t)
  const guidance    = normalizeGuidance(document, evidenceById, modality, t)

  return {
    title:      translateReadingToken(titleToken, t),
    themes:     summary.themes,
    prominence: summary.prominence,
    chapters:   normalizeChapters(document, evidenceById, modality, t),
    guidance,
    caveats:    (document.caveats || []).map(token => translateReadingToken(token, t)).filter(Boolean),
  }
}
