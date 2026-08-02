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

const BODY_LIST_PARAMS = new Set(['bodies', 'participants', 'planets'])

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
      const itemLocalizer = BODY_LIST_PARAMS.has(name)
        ? item => t(`planets.${planetId(item)}`)
        : localize
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
    rahu: `${params.rahuSignIndex} (${params.rahuHouse})`,
    ketu: `${params.ketuSignIndex} (${params.ketuHouse})`,
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

const presentationRow = (row, index, evidenceById, t, evidenceIds) => {
  const text = translateReadingToken(sourceToken(row), t)
  if (text === null) return null
  return {
    id:       row?.id || `row-${index}`,
    text,
    evidence: evidenceReferences(evidenceIds || row?.evidenceIds, evidenceById, t),
  }
}

const normalizeThemes = (document, modality, evidenceById, t) => {
  const themes = (document.summary?.themes || []).map((row, index) =>
    presentationRow(row, index, evidenceById, t)
  ).filter(Boolean)
  const prominence = (document.summary?.prominence || document.prominence || []).map((row, index) => {
    if (isToken(sourceToken(row))) return presentationRow(row, index, evidenceById, t)
    if (modality !== 'vedic') return null
    return presentationRow({
      id:          row.id || `prominence-${row.body}`,
      token:       { key: 'readings.presentation.prominence.vedic', params: { body: row.body, rank: index + 1, score: row.score } },
      evidenceIds: row.evidenceIds,
    }, index, evidenceById, t)
  }).filter(Boolean)
  return { themes, prominence }
}

const chapterRows = (chapter, evidenceById, t) => {
  const rows = chapter.items || chapter.insights
  if (Array.isArray(rows)) return rows.map((row, index) =>
    presentationRow(row, index, evidenceById, t)
  ).filter(Boolean)
  if (!isToken(chapter.overview)) return []
  return [presentationRow({
    id:          `${chapter.id}-overview`,
    token:       chapter.overview,
    evidenceIds: chapter.evidenceIds,
  }, 0, evidenceById, t)].filter(Boolean)
}

const normalizeChapters = (document, evidenceById, t) => (document.chapters || []).map(chapter => ({
  id:    chapter.id,
  title: translateReadingToken(chapter.title, t),
  items: chapterRows(chapter, evidenceById, t),
})).filter(chapter => chapter.title && chapter.items.length)

const normalizeGuidance = (document, evidenceById, t) => {
  const output = { strengths: [], challenges: [], practices: [] }
  for (const kind of Object.keys(output)) {
    const chapterRows = (document.chapters || []).flatMap(chapter => (chapter[kind] || []).map((token, index) => ({
      id:          `${kind}:${chapter.id}:${index}`,
      token,
      evidenceIds: chapter.evidenceIds,
    })))
    const rows = chapterRows.length ? chapterRows : document[kind] || []
    output[kind] = rows.map((row, index) => presentationRow(row, index, evidenceById, t)).filter(Boolean)
  }
  return output
}

export const normalizeReadingDocument = (document, t) => {
  if (!document) return null
  const modality     = modalityFor(document)
  const evidenceById = new Map((document.evidence || []).map(evidence => [evidence.id, evidence]))
  const titleToken  = document.title || { key: `readings.presentation.titles.${modality}`, params: {} }
  const summary     = normalizeThemes(document, modality, evidenceById, t)
  const guidance    = normalizeGuidance(document, evidenceById, t)

  return {
    title:      translateReadingToken(titleToken, t),
    themes:     summary.themes,
    prominence: summary.prominence,
    chapters:   normalizeChapters(document, evidenceById, t),
    guidance,
    caveats:    (document.caveats || []).map(token => translateReadingToken(token, t)).filter(Boolean),
  }
}
