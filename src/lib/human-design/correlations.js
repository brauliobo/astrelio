import { activationCode, activationFromLongitude, channelKey } from './activations.js'
import {
  activationLibraryEntry,
  channelLibraryEntry,
  gateLibraryEntry,
  lineLibraryEntry,
  PLANET_ACTIVATION_MEANINGS,
  planetLibraryEntry,
  STREAM_BY_CHANNEL,
} from './gate-library.js'
import { humanDesignConnection } from './connections.js'
import { buildHumanDesignTransitChart, humanDesignTransitConnection } from './details.js'
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
} from './constants.js'

const LINE_NOTES = {
  1: 'Line 1 repeats point to foundation, verification, and a need to know what can be relied on.',
  2: 'Line 2 repeats point to natural capacity, privacy, and being called out at the correct time.',
  3: 'Line 3 repeats point to adaptation, experiments, and learning through real contact with limits.',
  4: 'Line 4 repeats point to relationship fields, steady influence, and opportunities moving through networks.',
  5: 'Line 5 repeats point to projection, practical framing, and the pressure to universalize a pattern.',
  6: 'Line 6 repeats point to distance, perspective, and life-phase maturation before clean modeling.',
}

const PLANET_WEIGHTS = {
  Sun:       6,
  Earth:     5.5,
  NorthNode: 4,
  SouthNode: 3.5,
  Moon:      3,
  Mercury:   2.5,
  Venus:     2.25,
  Mars:      2.25,
  Jupiter:   2,
  Saturn:    2,
  Uranus:    1.5,
  Neptune:   1.5,
  Pluto:     1.5,
}

const LAYER_WEIGHTS = {
  personality: 1,
  design:      0.85,
  transit:     0.7,
}

const sortedUnique = values => [...new Set((values || []).filter(value => value !== undefined && value !== null))]
  .sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b
    return String(a).localeCompare(String(b))
  })

const percent = (count, total) => total ? Math.round((count / total) * 100) : 0

const normalizeChannel = channel => String(channel || '')
  .split('-')
  .map(Number)
  .filter(Boolean)
  .sort((a, b) => a - b)
  .join('-')

const channelGates = channel => normalizeChannel(channel).split('-').map(Number).filter(Boolean)

const hasGate = (chart, gate) => (chart?.gates || []).includes(Number(gate))

const gateName = gate => GATE_NAMES[gate] || `Gate ${gate}`

const channelName = channel => CHANNEL_NAMES[channel] || channel

const activationRows = (chart, extraLayer = null) => {
  const layers = extraLayer ? [extraLayer] : ['personality', 'design']
  return layers.flatMap(layer =>
    HD_PLANETS.map(planet => {
      const activation = chart?.[layer]?.[planet]
      return activation ? { layer, planet, ...activation } : null
    }).filter(Boolean)
  )
}

const chartGateSet = chart => new Set((chart?.gates || []).map(Number))

const chartChannelSet = chart => new Set((chart?.channels || []).map(normalizeChannel).filter(Boolean))

const channelsForGateSet = gateSet => sortedUnique([...gateSet].flatMap(gate =>
  (HARMONIC_GATES[gate] || [])
    .filter(harmonic => gateSet.has(harmonic))
    .map(harmonic => channelKey(gate, harmonic))
    .filter(channel => CHANNEL_CENTERS[channel])
))

const lineCountsForRows = rows => [1, 2, 3, 4, 5, 6].map(line => {
  const activations = rows.filter(row => row.line === line)
  return {
    line,
    count:   activations.length,
    percent: percent(activations.length, rows.length),
    gates:   sortedUnique(activations.map(row => row.gate)),
    planets: sortedUnique(activations.map(row => row.planet)),
    note:    LINE_NOTES[line],
    library: lineLibraryEntry(activations[0]?.gate || 1, line),
  }
})

const profileLines = profile => String(profile || '')
  .split('/')
  .map(value => Number(value.trim()))
  .filter(value => value >= 1 && value <= 6)

export const linePatternAnalysis = chart => {
  const rows    = activationRows(chart)
  const counts  = lineCountsForRows(rows)
  const max     = Math.max(0, ...counts.map(item => item.count))
  const profile = profileLines(chart?.profile)

  return {
    activationCount: rows.length,
    lineCounts:      Object.fromEntries(counts.map(item => [item.line, item.count])),
    profileLines:    profile,
    counts,
    byLayer: ['personality', 'design'].map(layer => ({
      layer,
      counts: lineCountsForRows(rows.filter(row => row.layer === layer)),
    })),
    dominantLines: counts.filter(item => item.count && item.count === max).map(item => ({
      line:      item.line,
      count:     item.count,
      role:      item.library.role,
      note:      item.note,
      inProfile: profile.includes(item.line),
      summary:   item.note,
    })),
    profileResonance: {
      profile:      chart?.profile || '',
      profileLines: profile,
      lines:        profile.map(line => ({
        line,
        count: counts.find(item => item.line === line)?.count || 0,
        note:  LINE_NOTES[line],
      })),
    },
    summary: max
      ? `The strongest repeated line pattern is ${counts.filter(item => item.count === max).map(item => `line ${item.line}`).join(', ')}. Use this as a weighting lens, not as a fixed prediction.`
      : 'No line pattern can be calculated without activations.',
  }
}

export const planetGateWeighting = chart => {
  const gateScores = new Map()

  for (const row of activationRows(chart)) {
    const weight  = (PLANET_WEIGHTS[row.planet] || 1) * (LAYER_WEIGHTS[row.layer] || 1)
    const current = gateScores.get(row.gate) || {
      gate:        row.gate,
      name:        gateName(row.gate),
      center:      GATE_CENTERS[row.gate] || '',
      score:       0,
      activations: [],
      planets:     [],
      layers:      [],
      lines:       [],
    }
    current.score = Number((current.score + weight).toFixed(2))
    current.activations.push({
      layer:  row.layer,
      planet: row.planet,
      line:   row.line,
      color:  row.color,
      tone:   row.tone,
      base:   row.base,
      code:   activationCode(row),
      weight,
      meaning: PLANET_ACTIVATION_MEANINGS[row.planet] || '',
      library: activationLibraryEntry(row),
    })
    current.planets = sortedUnique([...current.planets, row.planet])
    current.layers  = sortedUnique([...current.layers, row.layer])
    current.lines   = sortedUnique([...current.lines, row.line])
    gateScores.set(row.gate, current)
  }

  const rankedGates = [...gateScores.values()]
    .sort((a, b) => b.score - a.score || a.gate - b.gate)
    .map((item, index) => ({
      ...item,
      rank:    index + 1,
      summary: `${item.name} is weighted by ${item.planets.join(', ')} through ${item.layers.join(' and ')} activations.`,
      library: gateLibraryEntry(item.gate),
    }))

  const layerTotals = activationRows(chart).reduce((totals, row) => ({
    ...totals,
    [row.layer]: Number(((totals[row.layer] || 0) + ((PLANET_WEIGHTS[row.planet] || 1) * (LAYER_WEIGHTS[row.layer] || 1))).toFixed(2)),
  }), { personality: 0, design: 0 })

  return {
    weights:       PLANET_WEIGHTS,
    planetWeights: PLANET_WEIGHTS,
    layerWeights:  LAYER_WEIGHTS,
    layerTotals,
    rankedGates,
    weightedGates: rankedGates.map(item => ({
      ...item,
      sources: item.activations,
    })),
    topGates: rankedGates.slice(0, 8),
    byPlanet: activationRows(chart).map(row => ({
      layer:        row.layer,
      planet:       row.planet,
      gate:         row.gate,
      name:         gateName(row.gate),
      line:         row.line,
      code:         activationCode(row),
      weight:       (PLANET_WEIGHTS[row.planet] || 1) * (LAYER_WEIGHTS[row.layer] || 1),
      meaning:      PLANET_ACTIVATION_MEANINGS[row.planet] || '',
      planetDetail: planetLibraryEntry(row.planet),
      gateDetail:   gateLibraryEntry(row.gate),
    })),
  }
}

export const harmonicCompletionTiming = (chart, transitChart = null) => {
  const natalGates    = chartGateSet(chart)
  const natalChannels = chartChannelSet(chart)
  const transitGates  = chartGateSet(transitChart)

  const gates = sortedUnique([...natalGates])
  const rows  = gates.flatMap(gate =>
    (HARMONIC_GATES[gate] || [])
      .map(harmonic => {
        const channel = channelKey(gate, harmonic)
        if (!CHANNEL_CENTERS[channel]) return null
        const definedNatal       = natalChannels.has(channel)
        const completedByTransit = transitGates.has(harmonic) && !definedNatal
        return {
          gate,
          name:         gateName(gate),
          harmonicGate: harmonic,
          harmonicName: gateName(harmonic),
          channel,
          channelName: channelName(channel),
          centers:     CHANNEL_CENTERS[channel] || [],
          circuit:     CHANNEL_CIRCUITS[channel] || '',
          stream:      STREAM_BY_CHANNEL[channel] || '',
          definedNatal,
          completedByTransit,
          channelDetail: channelLibraryEntry(channel),
          summary:       definedNatal
            ? `${channelName(channel)} is already defined in the natal graph.`
            : `Gate ${gate} waits for gate ${harmonic} to complete ${channelName(channel)}.`,
        }
      })
      .filter(Boolean)
  )

  return {
    hangingGates:        rows.filter(row => !row.definedNatal),
    definedHarmonics:    rows.filter(row => row.definedNatal),
    transitCompletions:  rows.filter(row => row.completedByTransit),
    completionGateWatch: sortedUnique(rows.filter(row => !row.definedNatal).map(row => row.harmonicGate)).map(gate => ({
      gate,
      name:    gateName(gate),
      center:  GATE_CENTERS[gate] || '',
      library: gateLibraryEntry(gate),
    })),
  }
}

export const circuitStreamBalance = chart => {
  const channelEntries = (chart?.details?.channels || (chart?.channels || []).map(channelLibraryEntry))
    .filter(Boolean)
  const total  = channelEntries.length
  const bucket = keyFn => {
    const groups = new Map()
    for (const channel of channelEntries) {
      const key     = keyFn(channel) || 'Unspecified'
      const current = groups.get(key) || { key, count: 0, channels: [] }
      current.count += 1
      current.channels.push(channel.channel)
      groups.set(key, current)
    }
    return [...groups.values()]
      .map(item => ({
        ...item,
        percent:  percent(item.count, total),
        channels: sortedUnique(item.channels),
      }))
      .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
  }

  const circuits = bucket(channel => channel.circuit || CHANNEL_CIRCUITS[channel.channel])
  const groups   = bucket(channel => channel.circuitGroup || CHANNEL_CIRCUIT_GROUPS[channel.circuit])
  const streams  = bucket(channel => channel.stream || STREAM_BY_CHANNEL[channel.channel])

  const withSummaries = items => items.map(item => ({
    ...item,
    summary: `${item.key} accounts for ${item.count} of ${total} defined channels in this chart.`,
  }))

  return {
    channelCount:    total,
    circuits:        withSummaries(circuits),
    circuitGroups:   withSummaries(groups),
    groups:          withSummaries(groups),
    streams:         withSummaries(streams),
    dominantCircuit: withSummaries(circuits)[0] || null,
    dominantStream:  withSummaries(streams)[0] || null,
    summary:         total
      ? `Defined channels cluster most around ${circuits[0]?.key || 'mixed'} circuitry and ${streams[0]?.key || 'mixed'} stream themes.`
      : 'No defined channels are available for circuit balance.',
  }
}

export const incarnationCrossResonance = (chart, transitChart = null) => {
  const cross         = chart?.incarnationCross || chart?.incarnationCrossDetail
  const crossGates    = sortedUnique(cross?.gates || [])
  const natalChannels = chart?.channels || []
  const transitGates  = chartGateSet(transitChart)
  const weighted      = planetGateWeighting(chart).rankedGates

  const gateResonance = crossGates.map((gate, index) => {
    const activeInTransit = transitGates.has(gate)
    const channels        = natalChannels
      .filter(channel => channelGates(channel).includes(gate))
      .map(channelLibraryEntry)
    return {
      gate,
      role:           cross?.gateDetails?.[index]?.role || cross?.roles?.[index]?.role || ['personalitySun', 'personalityEarth', 'designSun', 'designEarth'][index] || '',
      name:           gateName(gate),
      center:         GATE_CENTERS[gate] || '',
      natalDefined:   hasGate(chart, gate),
      definedInNatal: hasGate(chart, gate),
      transitActive:  activeInTransit,
      activeInTransit,
      weight: weighted.find(item => item.gate === gate)?.score || 0,
      channels,
      library: gateLibraryEntry(gate),
      summary: activeInTransit
        ? `${gateName(gate)} is both a cross gate and active in the transit chart.`
        : `${gateName(gate)} is part of the cross frame and is read through natal definition first.`,
    }
  })
  const scoreParts     = gateResonance.map(item => (item.natalDefined ? 0.5 : 0) + (item.transitActive ? 0.5 : 0))
  const resonanceScore = scoreParts.length
    ? Number((scoreParts.reduce((sum, item) => sum + item, 0) / scoreParts.length).toFixed(3))
    : 0

  return {
    name:     cross?.name || '',
    geometry: cross?.geometry || '',
    quarter:  cross?.quarter || null,
    crossGates,
    gates: gateResonance,
    gateResonance,
    resonanceScore,
    natalChannelResonance: natalChannels
      .filter(channel => channelGates(channel).some(gate => crossGates.includes(gate)))
      .map(channelLibraryEntry),
    transitHits: crossGates.filter(gate => transitGates.has(gate)).map(gate => ({
      gate,
      name:    gateName(gate),
      library: gateLibraryEntry(gate),
    })),
    summary: crossGates.length
      ? `The cross gates are treated as a four-gate life-theme frame and correlated with active channels, planet weighting, and transits.`
      : 'No incarnation cross gates are available for resonance analysis.',
  }
}

const timePrecisionFrom = (chart, opts = {}) =>
  opts.birthTimePrecision ||
  chart?.birthTimePrecision ||
  chart?.timePrecision ||
  chart?.sourceTimePrecision ||
  (chart?.birthTimeKnown === false ? 'unknown' : 'minute')

export const variableConsistencyChecks = (chart, opts = {}) => {
  const variables           = chart?.variables || []
  const precision           = timePrecisionFrom(chart, opts)
  const precisionMinutes    = Number(opts.birthTimePrecisionMinutes ?? chart?.birthTimePrecisionMinutes)
  const weakMinutePrecision = Number.isFinite(precisionMinutes) && precisionMinutes > 5
  const unknownTime         = weakMinutePrecision || ['unknown', 'date', 'day', 'none', 'approximate'].includes(String(precision).toLowerCase())
  const orientationCounts   = {
    left:    variables.filter(variable => variable.orientation === 'left').length,
    right:   variables.filter(variable => variable.orientation === 'right').length,
    unknown: variables.filter(variable => !['left', 'right'].includes(variable.orientation)).length,
  }
  const checks = variables.map(variable => {
    const expected = variable.tone ? (variable.tone <= 3 ? 'left' : 'right') : 'unknown'
    return {
      id:                  variable.id,
      label:               variable.label,
      planet:              variable.planet,
      layer:               variable.layer,
      color:               variable.color,
      tone:                variable.tone,
      base:                variable.base,
      orientation:         variable.orientation,
      expectedOrientation: expected,
      consistent:          variable.orientation === expected,
      note:                expected === 'unknown'
        ? 'Tone is unavailable, so orientation cannot be checked.'
        : `Tone ${variable.tone} maps to ${expected} orientation.`,
    }
  })

  return {
    requiresMinuteAccuracy:    true,
    birthTimePrecision:        precision,
    birthTimePrecisionMinutes: Number.isFinite(precisionMinutes) ? precisionMinutes : null,
    reliable:                  !unknownTime && checks.every(check => check.consistent),
    orientationPattern:        variables.map(variable => {
      if (variable.orientation === 'left') return 'L'
      if (variable.orientation === 'right') return 'R'
      return '?'
    }).join(''),
    orientationCounts,
    checks,
    variables: checks.map(check => ({
      ...check,
      fragile: unknownTime || check.expectedOrientation === 'unknown',
    })),
    warnings: [
      unknownTime ? 'Variable color, tone, and base are time-sensitive; use exact birth time before treating this analysis as stable.' : '',
      checks.some(check => !check.consistent) ? 'One or more variable arrows do not match the tone orientation rule.' : '',
    ].filter(Boolean),
    summary: `Variables currently show ${orientationCounts.left} left and ${orientationCounts.right} right orientations.`,
  }
}

const normalizeEvent = event => ({
  ...event,
  gates:    sortedUnique((event?.gates || event?.humanDesignGates || event?.activations?.map(item => item.gate) || []).map(Number).filter(Boolean)),
  channels: sortedUnique((event?.channels || event?.humanDesignChannels || []).map(normalizeChannel).filter(Boolean)),
  lines:    sortedUnique((event?.lines || event?.activations?.map(item => item.line) || []).map(Number).filter(Boolean)),
  tags:     sortedUnique(event?.tags || event?.categories || (event?.tag ? [event.tag] : [])),
})

export const humanDesignEventCorrelations = (chart, events = []) => {
  const natalGates       = chartGateSet(chart)
  const crossGates       = new Set(chart?.incarnationCross?.gates || [])
  const chartLinesByGate = new Map()
  for (const row of activationRows(chart)) {
    const current = chartLinesByGate.get(row.gate) || []
    current.push(row.line)
    chartLinesByGate.set(row.gate, sortedUnique(current))
  }
  const rows = (events || []).map(normalizeEvent).map(event => {
    const inferredLines = event.lines.length
      ? event.lines
      : sortedUnique(event.gates.flatMap(gate => chartLinesByGate.get(gate) || []))
    const eventGates        = new Set(event.gates)
    const compositeGates    = new Set([...natalGates, ...eventGates])
    const completedChannels = channelsForGateSet(compositeGates)
      .filter(channel => !chartChannelSet(chart).has(channel) && channelGates(channel).some(gate => eventGates.has(gate)))
    return {
      ...event,
      matchedNatalGates:      event.gates.filter(gate => natalGates.has(gate)).map(gate => ({ gate, name: gateName(gate) })),
      crossGateHits:          event.gates.filter(gate => crossGates.has(gate)).map(gate => ({ gate, name: gateName(gate) })),
      completedNatalChannels: completedChannels.map(channelLibraryEntry),
      centerHits:             sortedUnique(event.gates.map(gate => GATE_CENTERS[gate]).filter(Boolean)).map(center => ({
        center,
        theme: CENTER_THEMES[center] || '',
      })),
      lines:    inferredLines,
      lineHits: inferredLines.map(line => ({ line, note: LINE_NOTES[line] || '' })),
    }
  })

  const gateFrequency = new Map()
  const tagFrequency  = new Map()
  const lineFrequency = new Map()
  for (const event of rows) {
    for (const gate of event.gates) gateFrequency.set(gate, (gateFrequency.get(gate) || 0) + 1)
    for (const tag of event.tags) tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1)
    for (const line of event.lines) lineFrequency.set(line, (lineFrequency.get(line) || 0) + 1)
  }

  const gateCorrelations = [...gateFrequency.entries()]
    .map(([gate, count]) => {
      const matchedEvents = rows.filter(event => event.gates.includes(gate))
      return {
        gate,
        name: gateName(gate),
        count,
        eventIds: matchedEvents.map(event => event.id).filter(Boolean),
        tags:     sortedUnique(matchedEvents.flatMap(event => event.tags)),
        natal:    natalGates.has(gate),
        library:  gateLibraryEntry(gate),
        summary:  `${gateName(gate)} appears in ${count} supplied event${count === 1 ? '' : 's'}.`,
      }
    })
    .sort((a, b) => b.count - a.count || a.gate - b.gate)
  const tagCorrelations = [...tagFrequency.entries()]
    .map(([tag, count]) => {
      const taggedEvents = rows.filter(event => event.tags.includes(tag))
      return {
        tag,
        count,
        gates:    sortedUnique(taggedEvents.flatMap(event => event.gates)),
        eventIds: taggedEvents.map(event => event.id).filter(Boolean),
      }
    })
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
  const lineCorrelations = [...lineFrequency.entries()]
    .map(([line, count]) => ({ line, count, note: LINE_NOTES[line] || '', summary: LINE_NOTES[line] || '' }))
    .sort((a, b) => b.count - a.count || a.line - b.line)
  const circuitCorrelations = sortedUnique(rows.flatMap(event =>
    event.gates.flatMap(gate => (HARMONIC_GATES[gate] || [])
      .map(harmonic => channelKey(gate, harmonic))
      .filter(channel => CHANNEL_CIRCUITS[channel])
      .map(channel => CHANNEL_CIRCUITS[channel]))
  )).map(circuit => ({
    circuit,
    group: CHANNEL_CIRCUIT_GROUPS[circuit] || circuit,
    gates: sortedUnique(rows.flatMap(event => event.gates.filter(gate =>
      (HARMONIC_GATES[gate] || []).some(harmonic => CHANNEL_CIRCUITS[channelKey(gate, harmonic)] === circuit)
    ))),
    summary: `${circuit} circuitry appears in the supplied event gate set.`,
  }))

  return {
    eventCount: rows.length,
    events:     rows,
    gateCorrelations,
    tagCorrelations,
    lineCorrelations,
    circuitCorrelations,
    repeatedGates: gateCorrelations,
    repeatedLines: lineCorrelations,
    repeatedTags:  tagCorrelations,
    summary:       rows.length
      ? 'Event correlations compare supplied event gates, channels, lines, and tags against natal gates, cross gates, and harmonic completions.'
      : 'Provide dated events with gates, channels, lines, or tags to build diary correlations.',
  }
}

export const humanDesignTransitCorrelations = (natalChart, transitChart, transitConnection = null) => {
  if (!natalChart || !transitChart) return null
  const connection        = transitConnection || humanDesignTransitConnection(natalChart, transitChart)
  const transitRows       = activationRows(transitChart, 'personality')
  const transitLineCounts = lineCountsForRows(transitRows)
  const transitGateSet    = chartGateSet(transitChart)

  const centerClusters = CENTERS.map(center => {
    const gates = sortedUnique(transitRows.filter(row => GATE_CENTERS[row.gate] === center).map(row => row.gate))
    return {
      center,
      theme: CENTER_THEMES[center] || '',
      gates,
      count:        gates.length,
      natalDefined: (natalChart.centers || []).includes(center),
    }
  }).filter(item => item.count)

  const circuitClusters = sortedUnique(transitRows.flatMap(row =>
    (HARMONIC_GATES[row.gate] || [])
      .map(harmonic => channelKey(row.gate, harmonic))
      .filter(channel => CHANNEL_CIRCUITS[channel])
      .map(channel => CHANNEL_CIRCUITS[channel])
  )).map(circuit => ({
    circuit,
    group: CHANNEL_CIRCUIT_GROUPS[circuit] || circuit,
    gates: sortedUnique(transitRows
      .filter(row => (HARMONIC_GATES[row.gate] || []).some(harmonic => CHANNEL_CIRCUITS[channelKey(row.gate, harmonic)] === circuit))
      .map(row => row.gate)),
  }))

  return {
    activationWatch:     connection?.activationWatch || [],
    activatedNatalGates: (connection?.activatedNatalGates || []).map(gate => ({
      gate,
      name:               gateName(gate),
      natal:              gateLibraryEntry(gate),
      transitActivations: transitRows.filter(row => row.gate === gate).map(activationLibraryEntry),
    })),
    completedChannels:        (connection?.completedChannels || []).map(channelLibraryEntry),
    nextChanges:              connection?.nextChanges || [],
    nextLineChanges:          connection?.nextLineChanges || [],
    nextGateChanges:          connection?.nextGateChanges || [],
    nextColorToneBaseChanges: connection?.nextColorToneBaseChanges || [],
    todayThemes:              {
      gates: sortedUnique([...transitGateSet]).map(gate => ({
        gate,
        name:    gateName(gate),
        center:  GATE_CENTERS[gate] || '',
        summary: gateLibraryEntry(gate).summary,
      })),
      centers:  centerClusters,
      circuits: circuitClusters,
      lines:    transitLineCounts.filter(item => item.count),
    },
    harmonicTiming: harmonicCompletionTiming(natalChart, transitChart),
    crossResonance: incarnationCrossResonance(natalChart, transitChart),
    summary:        'Transit correlations cluster current activations by natal gate contact, harmonic completion, center, circuit, line, and next change timing.',
  }
}

const futureHarmonicCompletions = (chart, { dateMs = Date.now(), lat = chart?.lat || 0, lon = chart?.lon || 0, days = 45 } = {}) => {
  const hanging     = harmonicCompletionTiming(chart).hangingGates
  const wanted      = new Map(hanging.map(item => [item.harmonicGate, item]))
  const completions = []
  const seen        = new Set()
  const stepMs      = 6 * 60 * 60 * 1000
  const endMs       = dateMs + (Math.max(1, days) * 24 * 60 * 60 * 1000)

  for (let cursor = dateMs; cursor <= endMs && seen.size < wanted.size; cursor += stepMs) {
    const transit = buildHumanDesignTransitChart(cursor, lat, lon)
    for (const gate of transit.gates || []) {
      if (!wanted.has(gate) || seen.has(gate)) continue
      const match = wanted.get(gate)
      completions.push({
        natalGate:       match.gate,
        natalGateName:   match.name,
        transitGate:     gate,
        transitGateName: gateName(gate),
        channel:         match.channel,
        channelName:     match.channelName,
        dateMs:          cursor,
        centers:         match.centers,
        circuit:         match.circuit,
        stream:          match.stream,
        summary:         `Transit gate ${gate} completes natal gate ${match.gate} through ${match.channelName}.`,
      })
      seen.add(gate)
    }
  }

  return {
    hangingGates: hanging,
    completions,
    search: { dateMs, lat, lon, days, stepHours: 6 },
  }
}

const chartsFromConnectionArgs = (connectionOrCharts, leftChart, rightChart) => {
  if (Array.isArray(connectionOrCharts)) {
    return {
      connection: null,
      left:       connectionOrCharts[0],
      right:      connectionOrCharts[1],
    }
  }
  if (connectionOrCharts?.leftChart || connectionOrCharts?.rightChart) {
    return {
      connection: connectionOrCharts.connection || null,
      left:       connectionOrCharts.leftChart,
      right:      connectionOrCharts.rightChart,
    }
  }
  if (leftChart || rightChart) {
    return {
      connection: connectionOrCharts?.compositeChannels ? connectionOrCharts : null,
      left:       leftChart,
      right:      rightChart,
    }
  }
  return { connection: connectionOrCharts?.compositeChannels ? connectionOrCharts : null, left: null, right: null }
}

const gateCompletionsBetween = (source, target) => {
  const sourceGates = chartGateSet(source)
  const targetGates = chartGateSet(target)
  return sortedUnique([...sourceGates].flatMap(gate =>
    (HARMONIC_GATES[gate] || [])
      .filter(harmonic => targetGates.has(harmonic))
      .map(harmonic => channelKey(gate, harmonic))
      .filter(channel => CHANNEL_CENTERS[channel])
  )).map(channel => ({
    ...channelLibraryEntry(channel),
    sourceGate: channelGates(channel).find(gate => sourceGates.has(gate)),
    targetGate: channelGates(channel).find(gate => targetGates.has(gate)),
  }))
}

export const humanDesignConnectionCorrelations = (connectionOrCharts, leftChart = null, rightChart = null) => {
  const { connection: providedConnection, left, right } = chartsFromConnectionArgs(connectionOrCharts, leftChart, rightChart)
  const connection = providedConnection || (left && right ? humanDesignConnection(left, right) : null)
  if (!connection && (!left || !right)) return null

  const leftCrossGates    = new Set(left?.incarnationCross?.gates || [])
  const rightCrossGates   = new Set(right?.incarnationCross?.gates || [])
  const leftGates         = chartGateSet(left)
  const rightGates        = chartGateSet(right)
  const compositeChannels = (connection?.compositeChannels || []).map(item =>
    typeof item === 'string' ? channelLibraryEntry(item) : { ...channelLibraryEntry(item.channel), ...item }
  )

  return {
    connectionTheme: connection?.connectionTheme || '',
    compositeChannels,
    leftCompletesRight:      gateCompletionsBetween(left, right),
    rightCompletesLeft:      gateCompletionsBetween(right, left),
    leftActivatesRightCross: sortedUnique([...rightCrossGates].filter(gate => leftGates.has(gate))).map(gate => ({
      gate,
      name:    gateName(gate),
      library: gateLibraryEntry(gate),
    })),
    rightActivatesLeftCross: sortedUnique([...leftCrossGates].filter(gate => rightGates.has(gate))).map(gate => ({
      gate,
      name:    gateName(gate),
      library: gateLibraryEntry(gate),
    })),
    openCenterSensitivity: (connection?.centerDynamics || [])
      .filter(center => !center.definedInComposite)
      .map(center => ({
        center: center.center,
        theme:  center.theme || CENTER_THEMES[center.center] || '',
        note:   `${center.center} remains open in the composite and is more context-sensitive for the pair.`,
      })),
    sharedLinePatterns: [1, 2, 3, 4, 5, 6].map(line => ({
      line,
      leftCount:  activationRows(left).filter(row => row.line === line).length,
      rightCount: activationRows(right).filter(row => row.line === line).length,
      note:       LINE_NOTES[line],
    })).filter(item => item.leftCount || item.rightCount),
    electromagneticDetails: connection?.electromagneticDetails || [],
    companionshipDetails:   connection?.companionshipDetails || [],
    compromiseDetails:      connection?.compromiseDetails || [],
    dominanceDetails:       connection?.dominanceDetails || [],
    summary:                'Relationship correlations show gate completion, cross activation, open-center sensitivity, line overlap, and composite channels.',
  }
}

export const humanDesignRelationshipActivationOverlay = (chartA, chartB) => {
  const overlay = humanDesignConnectionCorrelations([chartA, chartB])
  if (!overlay) return null

  const completedHangingGates = [
    ...overlay.leftCompletesRight.map(item => ({
      ownerId:       chartA?.personId,
      activatorId:   chartB?.personId,
      natalGate:     item.sourceGate,
      activatorGate: item.targetGate,
      channel:       item.channel,
      channelName:   item.name,
      summary:       `${chartB?.personName || 'The other chart'} completes ${item.name} for ${chartA?.personName || 'this chart'}.`,
    })),
    ...overlay.rightCompletesLeft.map(item => ({
      ownerId:       chartB?.personId,
      activatorId:   chartA?.personId,
      natalGate:     item.sourceGate,
      activatorGate: item.targetGate,
      channel:       item.channel,
      channelName:   item.name,
      summary:       `${chartA?.personName || 'The other chart'} completes ${item.name} for ${chartB?.personName || 'this chart'}.`,
    })),
  ]

  return {
    ...overlay,
    completedHangingGates,
    openCenterTouches: overlay.openCenterSensitivity,
    crossGateContacts: [
      ...overlay.leftActivatesRightCross.map(item => ({ ...item, ownerId: chartB?.personId, activatorId: chartA?.personId })),
      ...overlay.rightActivatesLeftCross.map(item => ({ ...item, ownerId: chartA?.personId, activatorId: chartB?.personId })),
    ],
  }
}

export const humanDesignTransitThemeClusters = (natalChart, transitChart, transitConnection = null) => {
  const correlations = humanDesignTransitCorrelations(natalChart, transitChart, transitConnection)
  if (!correlations) return null
  const byCenter = correlations.todayThemes.centers.map(center => ({
    key: center.center,
    ...center,
    summary: `${center.center} transit gates emphasize ${center.theme || 'this center theme'}.`,
  }))
  const byLine = correlations.todayThemes.lines.map(line => ({
    key: `line-${line.line}`,
    ...line,
    summary: line.note,
  }))
  const byCircuit = correlations.todayThemes.circuits.map(circuit => ({
    key: circuit.circuit,
    ...circuit,
    summary: `${circuit.circuit} circuitry is active through transit gates ${circuit.gates.join(', ')}.`,
  }))
  const clusters = [...byCenter, ...byCircuit, ...byLine]

  return {
    todayThemes: correlations.todayThemes.gates,
    byCenter,
    byCircuit,
    byLine,
    completedChannels: correlations.completedChannels,
    clusters,
    nextChanges: correlations.nextChanges,
    summary:     correlations.summary,
  }
}

const aspectPlanetNames = aspect => sortedUnique([
  aspect?.planet,
  aspect?.transitPlanet,
  aspect?.natalPlanet,
  aspect?.planetA,
  aspect?.planetB,
  aspect?.from?.planet,
  aspect?.to?.planet,
  aspect?.body,
  aspect?.target,
].filter(Boolean).map(value => String(value).replace(/\s+/g, '')))

const activationForPlanet = (chart, planet) => {
  const normalized = String(planet || '').replace(/\s+/g, '')
  return chart?.personality?.[normalized] || chart?.design?.[normalized] || null
}

export const bridgeAstrologyHumanDesign = (chart, astrologyAspects = []) => {
  const rows = (astrologyAspects || []).map(aspect => {
    const planets           = aspectPlanetNames(aspect)
    const primaryPlanet     = String(aspect?.planet || aspect?.transitPlanet || planets[0] || '').replace(/\s+/g, '')
    const primaryActivation = typeof aspect?.longitude === 'number'
      ? { planet: primaryPlanet, ...activationFromLongitude(aspect.longitude) }
      : activationForPlanet(chart, primaryPlanet)
    const activations = planets
      .map(planet => {
        const activation = activationForPlanet(chart, planet)
        return activation ? {
          planet,
          activation,
          code:         activationCode(activation),
          gate:         gateLibraryEntry(activation.gate),
          line:         lineLibraryEntry(activation.gate, activation.line),
          planetDetail: planetLibraryEntry(planet),
        } : null
      })
      .filter(Boolean)
    const entryActivation = primaryActivation || activations[0]?.activation || null

    return {
      aspect,
      planet:     primaryPlanet,
      aspectName: aspect?.aspect || aspect?.type || '',
      planets,
      activations,
      gate:             entryActivation?.gate || null,
      line:             entryActivation?.line || null,
      code:             entryActivation ? activationCode(entryActivation) : '',
      gateSummary:      entryActivation ? gateLibraryEntry(entryActivation.gate).summary : '',
      astrologySummary: `${primaryPlanet || 'Aspect'} ${aspect?.aspect || aspect?.type || 'aspect'} links zodiac timing to the same planetary body in the Human Design layer.`,
      combinedSummary:  entryActivation
        ? `${primaryPlanet || 'This planet'} in ${aspect?.aspect || aspect?.type || 'aspect'} context maps to ${gateName(entryActivation.gate)} line ${entryActivation.line}; read the astrology timing and Human Design gate as two lenses on the same planetary event.`
        : 'This astrology context has no matching Human Design activation available, so it remains an astrology-only note.',
      gates:   sortedUnique([entryActivation?.gate, ...activations.map(item => item.activation.gate)]),
      lines:   sortedUnique([entryActivation?.line, ...activations.map(item => item.activation.line)]),
      summary: activations.length
        ? `${planets.join(' / ')} astrology context maps to Human Design gate ${activations.map(item => item.activation.gate).join(', ')}.`
        : `${planets.join(' / ') || 'Aspect'} has no matching Human Design planet activation in this chart.`,
    }
  })

  return {
    aspectCount: rows.length,
    rows,
    entries: rows.map(row => ({
      ...row,
      aspect: row.aspect?.aspect || row.aspect?.type || row.aspectName,
    })),
    gateFrequency: sortedUnique(rows.flatMap(row => row.gates)).map(gate => ({
      gate,
      name:    gateName(gate),
      count:   rows.filter(row => row.gates.includes(gate)).length,
      library: gateLibraryEntry(gate),
    })).sort((a, b) => b.count - a.count || a.gate - b.gate),
    summary: rows.length
      ? 'Astrology bridge rows attach each supplied aspect to the chart planet gates and lines for the same bodies.'
      : 'Supply astrology aspects to bridge zodiac aspect context with Human Design gate and line context.',
  }
}

export const humanDesignEventDiaryCorrelations   = humanDesignEventCorrelations
export const humanDesignLinePatternAnalysis      = linePatternAnalysis
export const humanDesignPlanetGateWeighting      = planetGateWeighting
export const humanDesignHarmonicCompletionTiming = (chart, opts = {}) =>
  opts?.dateMs ? futureHarmonicCompletions(chart, opts) : harmonicCompletionTiming(chart, opts)
export const humanDesignCircuitStreamBalance      = circuitStreamBalance
export const humanDesignIncarnationCrossResonance = incarnationCrossResonance
export const humanDesignVariableConsistencyChecks = variableConsistencyChecks
export const humanDesignAstrologyBridge           = bridgeAstrologyHumanDesign

export const deriveHumanDesignCorrelations = (chart, opts = {}) => {
  if (!chart) return null

  const transitChart      = opts.transitChart || null
  const transitConnection = opts.transitConnection || null
  return {
    linePatterns:              linePatternAnalysis(chart),
    planetGateWeights:         planetGateWeighting(chart),
    harmonicTiming:            harmonicCompletionTiming(chart, transitChart),
    circuitStreamBalance:      circuitStreamBalance(chart),
    incarnationCrossResonance: incarnationCrossResonance(chart, transitChart),
    variableConsistency:       variableConsistencyChecks(chart, opts),
    eventDiary:                humanDesignEventCorrelations(chart, opts.events || []),
    transitThemes:             transitChart ? humanDesignTransitCorrelations(chart, transitChart, transitConnection) : null,
    astrologyBridge:           bridgeAstrologyHumanDesign(chart, opts.astrologyAspects || []),
    summary:                   'Correlation analysis compares gates, lines, planets, harmonics, circuits, variables, events, relationships, transits, and astrology aspects without deterministic claims.',
  }
}
