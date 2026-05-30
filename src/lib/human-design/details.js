import { computeChart } from '../astro/ephemeris.js'
import { jdToMs, msToJd } from '../astro/timezones.js'
import { activationCode, activationsForChart, channelKey } from './activations.js'
import {
  activationLibraryEntry,
  channelLibraryEntry,
  circuitLibrarySummary,
  gateLibraryEntry,
  harmonicGateDetails,
  lineLibraryEntry,
  mandalaDegreeDetailForActivation,
  PLANET_ACTIVATION_MEANINGS,
  planetLibraryEntry,
  STREAM_BY_CHANNEL,
} from './gate-library.js'
import {
  CENTER_THEMES,
  CENTERS,
  CHANNEL_CENTERS,
  CHANNEL_CIRCUITS,
  CHANNEL_CIRCUIT_GROUPS,
  CHANNEL_NAMES,
  GATE_CENTERS,
  GATE_NAMES,
  HARMONIC_GATES,
  HD_PLANETS,
  INCARNATION_CROSS_GEOMETRY_BY_PROFILE,
  INCARNATION_CROSS_NAMES_BY_GATE,
  INCARNATION_QUARTERS,
  LOVE_GATES,
  MATERIAL_CHANNELS,
  PENTA_GATES,
  TYPE_MECHANICS,
  VARIABLE_COLOR_LABELS,
  VARIABLE_KEYS,
} from './constants.js'

const sortedUnique = values => [...new Set(values)].sort((a, b) => {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
})

const profileKey = (profile = '') => profile.replace(/\s+/g, '')

const activationRows = (chart) =>
  ['personality', 'design'].flatMap(layer =>
    HD_PLANETS.map(planet => {
      const activation = chart?.[layer]?.[planet]
      return activation ? { layer, planet, ...activation } : null
    }).filter(Boolean)
  )

const gateSources = (chart) => {
  const sources = new Map()
  for (const row of activationRows(chart)) {
    const current = sources.get(row.gate) || {
      gate:        row.gate,
      name:        GATE_NAMES[row.gate] || `Gate ${row.gate}`,
      center:      GATE_CENTERS[row.gate] || '',
      activations: [],
      layers:      [],
      planets:     [],
    }
    current.activations.push({
      layer:         row.layer,
      planet:        row.planet,
      line:          row.line,
      color:         row.color,
      tone:          row.tone,
      base:          row.base,
      mandala:       mandalaDegreeDetailForActivation(row),
      code:          activationCode(row),
      planetDetail:  planetLibraryEntry(row.planet),
      planetMeaning: PLANET_ACTIVATION_MEANINGS[row.planet] || '',
      lineDetail:    lineLibraryEntry(row.gate, row.line),
    })
    current.layers  = sortedUnique([...current.layers, row.layer])
    current.planets = sortedUnique([...current.planets, row.planet])
    sources.set(row.gate, current)
  }
  return sources
}

const activeGateLayers = (sources, gate) => sources.get(gate)?.layers || []

const channelSource = (sources, channel) => {
  const gates  = channel.split('-').map(Number)
  const layers = sortedUnique(gates.flatMap(gate => activeGateLayers(sources, gate)))
  return layers.length === 2 ? 'both' : layers[0] || 'unknown'
}

const channelDetails = (chart, sources = gateSources(chart)) =>
  (chart?.channels || []).map(channel => {
    const gates   = channel.split('-').map(Number)
    const circuit = CHANNEL_CIRCUITS[channel] || ''
    return {
      channel,
      name: CHANNEL_NAMES[channel] || channel,
      gates,
      centers: CHANNEL_CENTERS[channel] || [],
      circuit,
      circuitGroup: CHANNEL_CIRCUIT_GROUPS[circuit] || circuit,
      stream:       STREAM_BY_CHANNEL[channel] || '',
      streamTheme:  channelLibraryEntry(channel).streamTheme,
      source:       channelSource(sources, channel),
      gateSources:  Object.fromEntries(gates.map(gate => [gate, activeGateLayers(sources, gate)])),
      isLove:       gates.some(gate => LOVE_GATES.includes(gate)),
      isMaterial:   MATERIAL_CHANNELS.includes(channel),
      library:      channelLibraryEntry(channel),
    }
  })

const gateDetails = (chart, sources = gateSources(chart)) => {
  const channels = new Set(chart?.channels || [])
  return sortedUnique(chart?.gates || []).map(gate => {
    const harmonics       = HARMONIC_GATES[gate] || []
    const definedChannels = harmonics
      .map(harmonic => channelKey(gate, harmonic))
      .filter(channel => channels.has(channel))
    const hangingHarmonics = harmonics.filter(harmonic => !channels.has(channelKey(gate, harmonic)))
    return {
      ...sources.get(gate),
      library:         gateLibraryEntry(gate),
      harmonicGates:   harmonics,
      harmonicDetails: harmonicGateDetails(gate, chart?.channels || []),
      definedChannels,
      hangingHarmonics,
      harmonicSuggestions: hangingHarmonics.map(harmonic => ({
        gate:    harmonic,
        name:    GATE_NAMES[harmonic] || `Gate ${harmonic}`,
        channel: channelKey(gate, harmonic),
        library: gateLibraryEntry(harmonic),
      })),
      isHanging: definedChannels.length === 0,
      isLove:    LOVE_GATES.includes(gate),
      lines:     sortedUnique((sources.get(gate)?.activations || []).map(activation => activation.line))
        .map(line => lineLibraryEntry(gate, line)),
      allLines: gateLibraryEntry(gate).lines,
      mandala:  gateLibraryEntry(gate).mandala,
      summary:  gateLibraryEntry(gate).summary,
    }
  })
}

const centerDetails = (chart, gates = gateDetails(chart)) =>
  CENTERS.map(center => {
    const activeGates = gates.filter(gate => gate.center === center).map(gate => gate.gate)
    return {
      center,
      defined: chart?.centers?.includes(center) || false,
      theme:   CENTER_THEMES[center],
      activeGates,
      openGates: Object.entries(GATE_CENTERS)
        .filter(([, gateCenter]) => gateCenter === center)
        .map(([gate]) => Number(gate))
        .filter(gate => !activeGates.includes(gate))
        .sort((a, b) => a - b),
      conditioning: chart?.centers?.includes(center)
        ? `${center} themes are consistent through defined channels.`
        : `${center} themes are variable and more sensitive to context.`,
    }
  })

const quarterForGate = gate =>
  INCARNATION_QUARTERS.find(quarter => quarter.gates.includes(gate)) || null

const crossGateDetails = chart => [
  ['personalitySun', chart.personality.Sun],
  ['personalityEarth', chart.personality.Earth],
  ['designSun', chart.design.Sun],
  ['designEarth', chart.design.Earth],
].map(([key, activation]) => ({
  key,
  role: key,
  activation,
  gate: activation.gate,
  line: activation.line,
  ...gateLibraryEntry(activation.gate),
  lineDetail: lineLibraryEntry(activation.gate, activation.line),
  code:       activationCode(activation),
}))

export const deriveIncarnationCross = (chart) => {
  if (!chart?.personality?.Sun || !chart?.personality?.Earth || !chart?.design?.Sun || !chart?.design?.Earth) {
    return null
  }

  const geometry           = INCARNATION_CROSS_GEOMETRY_BY_PROFILE[profileKey(chart.profile)] || 'Unknown'
  const personalitySunGate = chart.personality.Sun.gate
  const name               = INCARNATION_CROSS_NAMES_BY_GATE[personalitySunGate]?.[geometry] || `${geometry} Cross`
  const quarter            = quarterForGate(personalitySunGate)

  return {
    name: geometry === 'Unknown' ? name : `${geometry} Cross of ${name}`,
    geometry,
    quarter,
    gates: [
      chart.personality.Sun.gate,
      chart.personality.Earth.gate,
      chart.design.Sun.gate,
      chart.design.Earth.gate,
    ],
    activations: {
      personalitySun:   chart.personality.Sun,
      personalityEarth: chart.personality.Earth,
      designSun:        chart.design.Sun,
      designEarth:      chart.design.Earth,
    },
    gateDetails:     crossGateDetails(chart),
    roles:           crossGateDetails(chart),
    gateRoles:       crossGateDetails(chart),
    activationRoles: crossGateDetails(chart),
    summary:         `${geometry} geometry links the conscious Sun/Earth and design Sun/Earth gates into a life-theme frame. Read it after type, authority, and profile.`,
  }
}

const orientationForTone = tone => tone <= 3 ? 'left' : 'right'

export const deriveHumanDesignVariables = (chart) => {
  if (!chart) return []

  return VARIABLE_KEYS.map(variable => {
    const activation  = chart[variable.layer]?.[variable.planet]
    const orientation = activation ? orientationForTone(activation.tone) : 'unknown'
    const labels      = VARIABLE_COLOR_LABELS[variable.id] || []
    return {
      ...variable,
      activation,
      orientation,
      color:        activation?.color || null,
      tone:         activation?.tone || null,
      base:         activation?.base || null,
      colorLabel:   activation ? labels[activation.color - 1] || `Color ${activation.color}` : '',
      transference: activation ? labels[(activation.color + 2) % 6] || '' : '',
      code:         activation ? activationCode(activation) : '',
    }
  })
}

export const deriveHumanDesignDetails = (chart) => {
  if (!chart) return null

  const sources  = gateSources(chart)
  const gates    = gateDetails(chart, sources)
  const channels = channelDetails(chart, sources)
  return {
    gates,
    channels,
    centers:  centerDetails(chart, gates),
    circuits: sortedUnique(channels.map(channel => channel.circuit).filter(Boolean)).map(circuit => ({
      key: circuit,
      circuit,
      group:    CHANNEL_CIRCUIT_GROUPS[circuit] || circuit,
      channels: channels.filter(channel => channel.circuit === circuit).map(channel => channel.channel),
      streams:  sortedUnique(channels.filter(channel => channel.circuit === circuit).map(channel => channel.stream).filter(Boolean)),
    })),
    circuitStreams: circuitLibrarySummary(channels),
    streamSummary:  circuitLibrarySummary(channels).map(stream => ({
      key:   stream.stream,
      gates: sortedUnique(channels
        .filter(channel => channel.stream === stream.stream)
        .flatMap(channel => channel.gates || [])),
      channels: stream.channels,
      theme:    stream.theme,
    })),
    library:      sortedUnique(chart?.gates || []).map(gate => gateLibraryEntry(gate)),
    gateExplorer: sortedUnique(chart?.gates || []).map(gate => gateLibraryEntry(gate)),
    activations:  activationRows(chart).map(row => ({
      ...row,
      name:          GATE_NAMES[row.gate] || `Gate ${row.gate}`,
      center:        GATE_CENTERS[row.gate] || '',
      harmonicGates: HARMONIC_GATES[row.gate] || [],
      library:       activationLibraryEntry(row),
      planetDetail:  planetLibraryEntry(row.planet),
      planetMeaning: PLANET_ACTIVATION_MEANINGS[row.planet] || '',
      lineDetail:    lineLibraryEntry(row.gate, row.line),
      mandala:       mandalaDegreeDetailForActivation(row),
      code:          activationCode(row),
    })),
  }
}

const transitChartForJd = (jdUt, lat, lon) => ({
  personId:    'transit',
  personName:  'Transit',
  birthJd:     jdUt,
  designJd:    null,
  personality: activationsForChart(computeChart(jdUt, lat, lon, {
    zodiac:      'tropical',
    houseSystem: 'whole_sign',
    nodeMode:    'true',
  })),
  design: {},
})

export const buildHumanDesignTransitChart = (dateMs = Date.now(), lat = 0, lon = 0) => {
  const jdUt  = msToJd(dateMs)
  const base  = transitChartForJd(jdUt, lat, lon)
  const gates = sortedUnique(Object.values(base.personality).map(activation => activation.gate))
  return {
    ...base,
    dateMs,
    gates,
    personalityGates: gates,
    designGates:      [],
    channels:         [],
    centers:          [],
    variables:        deriveHumanDesignVariables(base),
    details:          deriveHumanDesignDetails(base),
  }
}

const activationChanged = (left, right, level = 'line') => {
  if (!left || !right) return false
  if (left.gate !== right.gate) return true
  if (level === 'gate') return false
  if (level === 'base') return left.base !== right.base
  if (level === 'tone') return left.tone !== right.tone || left.base !== right.base
  if (level === 'color') return left.color !== right.color || left.tone !== right.tone || left.base !== right.base
  return left.line !== right.line
}

const findNextActivationChange = ({ startJd, lat, lon, planet, level = 'line' }) => {
  const start = transitChartForJd(startJd, lat, lon).personality[planet]
  if (!start) return null

  let step = {
    gate:  1,
    line:  1 / 12,
    color: 1 / 72,
    tone:  1 / 288,
    base:  1 / 720,
  }[level] || 1 / 12
  let cursor  = startJd + step
  let current = transitChartForJd(cursor, lat, lon).personality[planet]
  let guard   = 0

  const maxGuards = level === 'gate' ? 480 : 720
  while (!activationChanged(start, current, level) && guard < maxGuards) {
    cursor += step
    current = transitChartForJd(cursor, lat, lon).personality[planet]
    guard += 1
  }

  if (!activationChanged(start, current, level)) return null

  let low  = cursor - step
  let high = cursor
  for (let i = 0; i < 24; i += 1) {
    const mid           = (low + high) / 2
    const midActivation = transitChartForJd(mid, lat, lon).personality[planet]
    if (activationChanged(start, midActivation, level)) high = mid
    else low = mid
  }

  const next = transitChartForJd(high, lat, lon).personality[planet]
  return {
    planet,
    level,
    from:   start,
    to:     next,
    jdUt:   high,
    dateMs: jdToMs(high),
  }
}

export const humanDesignTransitConnection = (natalChart, transitChart, { lat = natalChart?.lat || 0, lon = natalChart?.lon || 0 } = {}) => {
  if (!natalChart || !transitChart) return null

  const natalGates          = new Set(natalChart.gates || [])
  const transitGates        = new Set(transitChart.gates || [])
  const completedChannels   = []
  const activatedNatalGates = []

  for (const gate of transitGates) {
    if (natalGates.has(gate)) activatedNatalGates.push(gate)
    for (const harmonic of HARMONIC_GATES[gate] || []) {
      if (natalGates.has(harmonic) && CHANNEL_CENTERS[channelKey(gate, harmonic)]) {
        completedChannels.push(channelKey(gate, harmonic))
      }
    }
  }

  const startJd = transitChart.birthJd || msToJd(transitChart.dateMs || Date.now())
  return {
    activatedNatalGates: sortedUnique(activatedNatalGates),
    completedChannels:   sortedUnique(completedChannels),
    activationWatch:     HD_PLANETS.map(planet => transitChart.personality?.[planet])
      .filter(Boolean)
      .map(activation => ({
        ...activation,
        code:          activationCode(activation),
        name:          GATE_NAMES[activation.gate] || `Gate ${activation.gate}`,
        center:        GATE_CENTERS[activation.gate] || '',
        library:       activationLibraryEntry(activation),
        planetMeaning: PLANET_ACTIVATION_MEANINGS[activation.planet] || '',
        planetDetail:  planetLibraryEntry(activation.planet),
        lineDetail:    lineLibraryEntry(activation.gate, activation.line),
        mandala:       mandalaDegreeDetailForActivation(activation),
      })),
    nextChanges: ['line', 'gate'].flatMap(level =>
      HD_PLANETS.map(planet => findNextActivationChange({ startJd, lat, lon, planet, level }))
    )
      .filter(Boolean)
      .map(change => ({
        ...change,
        fromCode: activationCode(change.from),
        toCode:   activationCode(change.to),
        fromLine: lineLibraryEntry(change.from.gate, change.from.line),
        toLine:   lineLibraryEntry(change.to.gate, change.to.line),
      })),
    nextLineChanges: HD_PLANETS.map(planet => findNextActivationChange({ startJd, lat, lon, planet, level: 'line' }))
      .filter(Boolean)
      .map(change => ({
        ...change,
        fromCode: activationCode(change.from),
        toCode:   activationCode(change.to),
        fromLine: lineLibraryEntry(change.from.gate, change.from.line),
        toLine:   lineLibraryEntry(change.to.gate, change.to.line),
      })),
    nextGateChanges: HD_PLANETS.map(planet => findNextActivationChange({ startJd, lat, lon, planet, level: 'gate' }))
      .filter(Boolean)
      .map(change => ({
        ...change,
        fromCode: activationCode(change.from),
        toCode:   activationCode(change.to),
        fromGate: gateLibraryEntry(change.from.gate),
        toGate:   gateLibraryEntry(change.to.gate),
      })),
    nextColorToneBaseChanges: ['color', 'tone', 'base'].flatMap(level =>
      HD_PLANETS.map(planet => findNextActivationChange({ startJd, lat, lon, planet, level }))
    )
      .filter(Boolean)
      .map(change => ({
        ...change,
        fromCode: activationCode(change.from),
        toCode:   activationCode(change.to),
      })),
    todayThemes: sortedUnique([...transitGates]).map(gate => gateLibraryEntry(gate).summary),
  }
}

export const humanDesignTeamAnalysis = (charts = []) => {
  const members    = charts.filter(Boolean)
  const gateOwners = Object.fromEntries(PENTA_GATES.map(gate => [gate, []]))
  const allGates   = new Set()

  for (const chart of members) {
    for (const gate of chart.gates || []) {
      allGates.add(gate)
      if (gateOwners[gate]) gateOwners[gate].push(chart.personId)
    }
  }

  const pentaCoverage = PENTA_GATES.map(gate => ({
    gate,
    name:    GATE_NAMES[gate] || `Gate ${gate}`,
    owners:  gateOwners[gate],
    covered: gateOwners[gate].length > 0,
  }))
  const compositeGates    = sortedUnique([...allGates])
  const compositeChannels = sortedUnique(compositeGates.flatMap(gate =>
    (HARMONIC_GATES[gate] || [])
      .filter(harmonic => allGates.has(harmonic))
      .map(harmonic => channelKey(gate, harmonic))
      .filter(channel => CHANNEL_CENTERS[channel])
  ))

  return {
    memberCount: members.length,
    pentaCoverage,
    pentaPercent: Math.round((pentaCoverage.filter(item => item.covered).length / PENTA_GATES.length) * 100),
    compositeGates,
    compositeChannels: compositeChannels.map(channel => ({
      channel,
      name:       CHANNEL_NAMES[channel] || channel,
      centers:    CHANNEL_CENTERS[channel],
      stream:     STREAM_BY_CHANNEL[channel] || '',
      library:    channelLibraryEntry(channel),
      isMaterial: MATERIAL_CHANNELS.includes(channel),
    })),
    compositeCenters: sortedUnique(compositeChannels.flatMap(channel => CHANNEL_CENTERS[channel] || [])),
  }
}

export const enrichHumanDesignChart = chart => {
  if (!chart) return null
  const mechanics = TYPE_MECHANICS[chart.type] || {}
  const enriched  = {
    ...chart,
    strategy:  mechanics.strategy || '',
    signature: mechanics.signature || '',
    notSelf:   mechanics.notSelf || '',
    aura:      mechanics.aura || '',
  }
  enriched.variables              = deriveHumanDesignVariables(enriched)
  enriched.incarnationCross       = deriveIncarnationCross(enriched)
  enriched.incarnationCrossDetail = enriched.incarnationCross
  enriched.details                = deriveHumanDesignDetails(enriched)
  return enriched
}

export {
  activationLibraryEntry,
  channelLibraryEntry,
  circuitLibrarySummary,
  gateExplorerEntry as humanDesignGateExplorer,
  gateLibraryEntry,
  lineLibraryEntry,
  mandalaDegreeDetailForActivation,
  mandalaDegreeSpanForGate,
  planetLibraryEntry,
} from './gate-library.js'
