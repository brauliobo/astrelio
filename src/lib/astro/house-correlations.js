import { houseOf } from './houses.js'
import { signIndex } from './zodiac.js'

export const MODERN_SIGN_RULERS = [
  'Mars',
  'Venus',
  'Mercury',
  'Moon',
  'Sun',
  'Mercury',
  'Venus',
  'Pluto',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
]

export const PSYCHOLOGICAL_PLANET_WEIGHTS = {
  Sun: 5,
  Moon: 5,
  Mercury: 4,
  Venus: 4,
  Mars: 4,
  Jupiter: 3,
  Saturn: 3,
  Uranus: 2.5,
  Neptune: 2.5,
  Pluto: 2.5,
  NorthNode: 1.25,
  SouthNode: 1.25,
  Chiron: 1.25,
  Lilith: 1.25,
}

const modeKeys = ['natal', 'timing', 'relationship']

const planetWeight = name => PSYCHOLOGICAL_PLANET_WEIGHTS[name] || 1

const emptyRows = chart =>
  Array.from({ length: 12 }, (_, index) => {
    const house = index + 1
    const cusp = chart?.cusps?.[index]
    const ruler = Number.isFinite(cusp) ? MODERN_SIGN_RULERS[signIndex(cusp)] : null
    return {
      house,
      score: 0,
      share: 0,
      topicsKey: `house_correlations.topics.${house}`,
      occupants: [],
      ruler,
      rulerHouse: null,
      activators: [],
      aspects: [],
      reasons: [],
    }
  })

const positionMap = chart =>
  new Map((chart?.positions || []).map(position => [position.name, position]))

const safeHouseOf = (longitude, cusps) =>
  Array.isArray(cusps) && cusps.length >= 12 && Number.isFinite(longitude)
    ? houseOf(longitude, cusps)
    : null

const placementMap = chart =>
  new Map((chart?.positions || []).map((position) => {
    const house = safeHouseOf(position.longitude, chart?.cusps)
    return [position.name, house ? { ...position, house } : { ...position, house: null }]
  }))

const addUnique = (list, item, keyFn) => {
  const key = keyFn(item)
  if (!list.some(existing => keyFn(existing) === key)) list.push(item)
}

const addScore = (rows, house, amount, mode, reason = null) => {
  const row = rows[house - 1]
  if (!row || !Number.isFinite(amount) || amount <= 0) return
  row.score += amount
  if (reason) row.reasons.push({ mode, ...reason })
}

const aspectPower = aspect => {
  const exactness = Number.isFinite(aspect?.delta) && Number.isFinite(aspect?.orb) && aspect.orb > 0
    ? Math.max(0, 1 - (aspect.delta / aspect.orb))
    : 0.5
  return Math.max(0.15, aspect?.strength || exactness)
}

const finish = (rows) => {
  const total = rows.reduce((sum, row) => sum + row.score, 0) || 1
  const finishedRows = rows.map(row => ({
    ...row,
    score: Number(row.score.toFixed(3)),
    share: Number((row.score / total).toFixed(4)),
    reasons: row.reasons.slice(0, 8),
  }))
  const ranked = [...finishedRows]
    .filter(row => row.score > 0)
    .sort((a, b) => b.score - a.score || a.house - b.house)
  const modeTotals = Object.fromEntries(modeKeys.map(key => [key, 0]))
  for (const row of finishedRows) {
    for (const reason of row.reasons) {
      if (modeTotals[reason.mode] !== undefined) modeTotals[reason.mode] += row.score / Math.max(row.reasons.length, 1)
    }
  }
  const modeTotal = Object.values(modeTotals).reduce((sum, value) => sum + value, 0) || 1
  const normalizedModeTotals = Object.fromEntries(
    Object.entries(modeTotals).map(([key, value]) => [key, Number((value / modeTotal).toFixed(4))])
  )
  return {
    houses: finishedRows,
    ranked,
    summary: {
      topHouses: ranked.slice(0, 5),
      modeTotals: normalizedModeTotals,
      dominantMode: Object.entries(normalizedModeTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'natal',
    },
  }
}

const addNatalOccupants = (rows, placements) => {
  for (const placement of placements.values()) {
    if (!placement.house) continue
    const item = { planet: placement.name, house: placement.house }
    addUnique(rows[placement.house - 1].occupants, item, value => value.planet)
    addScore(rows, placement.house, planetWeight(placement.name) * 2, 'natal', {
      type: 'occupant',
      planet: placement.name,
      house: placement.house,
    })
  }
}

const addRulers = (rows, placements, mode = 'natal') => {
  for (const row of rows) {
    const rulerPlacement = row.ruler ? placements.get(row.ruler) : null
    if (!rulerPlacement?.house) continue
    row.rulerHouse = rulerPlacement.house
    addScore(rows, row.house, planetWeight(row.ruler) * 0.75, mode, {
      type: 'ruler',
      ruler: row.ruler,
      house: row.house,
      rulerHouse: rulerPlacement.house,
    })
    addScore(rows, rulerPlacement.house, planetWeight(row.ruler) * 0.45, mode, {
      type: 'ruler_placement',
      ruler: row.ruler,
      house: row.house,
      rulerHouse: rulerPlacement.house,
    })
  }
}

const addNatalAspects = (rows, aspects, placements) => {
  for (const aspect of aspects || []) {
    const a = placements.get(aspect.a)
    const b = placements.get(aspect.b)
    if (!a?.house || !b?.house) continue
    const power = aspectPower(aspect)
    for (const [body, partner] of [[a, b], [b, a]]) {
      const amount = power * (planetWeight(body.name) + planetWeight(partner.name)) * 0.28
      const item = { a: aspect.a, b: aspect.b, type: aspect.type, delta: aspect.delta }
      addUnique(rows[body.house - 1].aspects, item, value => `${value.a}-${value.b}-${value.type}`)
      addScore(rows, body.house, amount, 'natal', {
        type: 'aspect',
        planet: body.name,
        partner: partner.name,
        aspect: aspect.type,
        house: body.house,
      })
    }
  }
}

export const natalHouseCorrelations = (chart, aspects = []) => {
  const rows = emptyRows(chart)
  const placements = placementMap(chart)
  addNatalOccupants(rows, placements)
  addRulers(rows, placements)
  addNatalAspects(rows, aspects, placements)
  return finish(rows)
}

const addOverlayActivators = (rows, baseChart, overlayChart, mode, reasonType) => {
  for (const position of overlayChart?.positions || []) {
    const house = safeHouseOf(position.longitude, baseChart?.cusps)
    if (!house) continue
    const activator = { planet: position.name, house, mode }
    addUnique(rows[house - 1].activators, activator, value => `${value.mode}-${value.planet}`)
    addScore(rows, house, planetWeight(position.name) * 1.15, mode, {
      type: reasonType,
      planet: position.name,
      house,
    })
  }
}

const addOverlayAspects = (rows, baseChart, overlayChart, aspects, mode, reasonType) => {
  const basePlacements = placementMap(baseChart)
  const overlayPositions = positionMap(overlayChart)
  for (const aspect of aspects || []) {
    const base = basePlacements.get(aspect.a)
    const overlay = overlayPositions.get(aspect.b)
    const baseHouse = base?.house || null
    const overlayHouse = safeHouseOf(overlay?.longitude, baseChart?.cusps)
    if (!baseHouse && !overlayHouse) continue
    const power = aspectPower(aspect)
    const item = { a: aspect.a, b: aspect.b, type: aspect.type, delta: aspect.delta, mode }
    for (const house of [baseHouse, overlayHouse].filter(Boolean)) {
      addUnique(rows[house - 1].aspects, item, value => `${value.mode}-${value.a}-${value.b}-${value.type}`)
      addScore(rows, house, power * (planetWeight(aspect.a) + planetWeight(aspect.b)) * 0.42, mode, {
        type: reasonType,
        planet: aspect.b,
        partner: aspect.a,
        aspect: aspect.type,
        house,
      })
    }
  }
}

export const timingHouseCorrelations = (natalChart, overlayChart, aspects = [], mode = 'timing') => {
  const rows = emptyRows(natalChart)
  addRulers(rows, placementMap(natalChart), 'timing')
  addOverlayActivators(rows, natalChart, overlayChart, 'timing', 'timing')
  addOverlayAspects(rows, natalChart, overlayChart, aspects, 'timing', 'timing_aspect')
  return {
    ...finish(rows),
    mode,
  }
}

export const relationshipHouseCorrelations = (baseChart, partnerChart, aspects = []) => {
  const rows = emptyRows(baseChart)
  addRulers(rows, placementMap(baseChart), 'relationship')
  addOverlayActivators(rows, baseChart, partnerChart, 'relationship', 'relationship')
  addOverlayAspects(rows, baseChart, partnerChart, aspects, 'relationship', 'relationship_aspect')
  return finish(rows)
}

const mergeRows = (chart, analyses) => {
  const rows = emptyRows(chart)
  for (const analysis of analyses.filter(Boolean)) {
    for (const source of analysis.houses || []) {
      const row = rows[source.house - 1]
      row.score += source.score
      row.ruler ||= source.ruler
      row.rulerHouse ||= source.rulerHouse
      for (const occupant of source.occupants) addUnique(row.occupants, occupant, value => value.planet)
      for (const activator of source.activators) addUnique(row.activators, activator, value => `${value.mode}-${value.planet}`)
      for (const aspect of source.aspects) addUnique(row.aspects, aspect, value => `${value.mode || 'natal'}-${value.a}-${value.b}-${value.type}`)
      row.reasons.push(...source.reasons)
    }
  }
  return finish(rows)
}

export const combinedHouseCorrelations = ({
  natalChart = null,
  natalAspects = [],
  timingChart = null,
  timingAspects = [],
  timingMode = 'transit',
  relationshipChart = null,
  relationshipAspects = [],
} = {}) => {
  const analyses = []
  if (natalChart) analyses.push(natalHouseCorrelations(natalChart, natalAspects))
  if (natalChart && timingChart) analyses.push(timingHouseCorrelations(natalChart, timingChart, timingAspects, timingMode))
  if (natalChart && relationshipChart) analyses.push(relationshipHouseCorrelations(natalChart, relationshipChart, relationshipAspects))
  return mergeRows(natalChart, analyses)
}
